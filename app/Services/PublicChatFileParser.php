<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use League\Csv\Reader;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Smalot\PdfParser\Parser as PdfParser;

class PublicChatFileParser
{
    private const MAX_TEXT_CHARS = 24000;
    private const MAX_SHEETS = 5;
    private const MAX_ROWS = 80;

    public function parse(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $name = $file->getClientOriginalName();
        $path = $file->getRealPath();

        return match ($extension) {
            'xlsx', 'xlsm', 'xls' => $this->spreadsheet($path, $name, $extension),
            'csv', 'tsv' => $this->csv($path, $name, $extension),
            'pdf' => $this->pdf($path, $name),
            default => $this->text($path, $name, $extension),
        };
    }

    private function spreadsheet(string $path, string $name, string $extension): array
    {
        if ($extension === 'xlsx') {
            try {
                return $this->xlsxViaUnzip($path, $name, $extension);
            } catch (\Throwable $e) {
                // Fall back to PhpSpreadsheet below when ZipArchive and related extensions are available.
            }
        }

        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $workbook = $reader->load($path);
        $sections = [];
        $sheetNames = $workbook->getSheetNames();

        foreach (array_slice($sheetNames, 0, self::MAX_SHEETS) as $sheetName) {
            $sheet = $workbook->getSheetByName($sheetName);
            if (! $sheet) continue;

            $rows = [];
            $highestRow = min($sheet->getHighestDataRow(), self::MAX_ROWS);
            $highestColumn = $sheet->getHighestDataColumn();

            for ($row = 1; $row <= $highestRow; $row++) {
                $values = $sheet->rangeToArray("A{$row}:{$highestColumn}{$row}", null, true, false)[0] ?? [];
                if (collect($values)->filter(fn ($value) => $value !== null && $value !== '')->isEmpty()) continue;
                $rows[] = $this->csvLine($values);
            }

            if ($rows) {
                $sections[] = "Sheet: {$sheetName}\n".implode("\n", $rows);
            }
        }

        $workbook->disconnectWorksheets();

        return $this->payload($name, 'spreadsheet', $extension, implode("\n\n", $sections), [
            'sheets' => array_slice($sheetNames, 0, self::MAX_SHEETS),
            'sheet_count' => count($sheetNames),
            'row_limit_per_sheet' => self::MAX_ROWS,
        ]);
    }


    private function xlsxViaUnzip(string $path, string $name, string $extension): array
    {
        $tmp = sys_get_temp_dir().'/devora-xlsx-'.str()->uuid();
        mkdir($tmp, 0700, true);

        try {
            $zip = new \ZipArchive();
            if (class_exists(\ZipArchive::class) && $zip->open($path) === true) {
                $zip->extractTo($tmp);
                $zip->close();
            } else {
                $command = 'unzip -qq '.escapeshellarg($path).' -d '.escapeshellarg($tmp);
                exec($command, $output, $code);
                if ($code !== 0) {
                    throw new \RuntimeException('Unable to unzip xlsx file.');
                }
            }

            $sharedStrings = $this->xlsxSharedStrings($tmp.'/xl/sharedStrings.xml');
            $sheets = $this->xlsxSheets($tmp);
            $sections = [];

            foreach (array_slice($sheets, 0, self::MAX_SHEETS) as $sheet) {
                $rows = $this->xlsxRows($sheet['path'], $sharedStrings);
                if ($rows) {
                    $sections[] = "Sheet: {$sheet['name']}\n".implode("\n", $rows);
                }
            }

            $content = implode("\n\n", $sections);
            if (trim($content) === '') {
                throw new \RuntimeException('XLSX fallback produced empty content.');
            }

            return $this->payload($name, 'spreadsheet', $extension, $content, [
                'sheets' => array_column($sheets, 'name'),
                'sheet_count' => count($sheets),
                'row_limit_per_sheet' => self::MAX_ROWS,
                'parser' => class_exists(\ZipArchive::class) ? 'xlsx-ziparchive-xml' : 'xlsx-unzip-xml',
            ]);
        } finally {
            $this->removeDirectory($tmp);
        }
    }

    private function xlsxSharedStrings(string $path): array
    {
        if (! file_exists($path)) return [];
        $xml = $this->loadXml($path);
        if (! $xml) return [];

        $strings = [];
        foreach ($xml->si as $si) {
            $parts = [];
            if (isset($si->t)) $parts[] = (string) $si->t;
            foreach ($si->r ?? [] as $run) {
                $parts[] = (string) ($run->t ?? '');
            }
            $strings[] = implode('', $parts);
        }
        return $strings;
    }

    private function xlsxSheets(string $tmp): array
    {
        $workbook = $this->loadXml($tmp.'/xl/workbook.xml');
        $rels = $this->loadXml($tmp.'/xl/_rels/workbook.xml.rels');
        if (! $workbook) return [];

        $relationshipTargets = [];
        if ($rels) {
            foreach ($rels->Relationship as $relationship) {
                $relationshipTargets[(string) $relationship['Id']] = (string) $relationship['Target'];
            }
        }

        $sheets = [];
        $namespaces = $workbook->getNamespaces(true);
        $relNamespace = $namespaces['r'] ?? 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

        foreach ($workbook->sheets->sheet ?? [] as $index => $sheet) {
            $attributes = $sheet->attributes($relNamespace);
            $rid = (string) ($attributes['id'] ?? '');
            $target = $relationshipTargets[$rid] ?? 'worksheets/sheet'.($index + 1).'.xml';
            $target = ltrim(str_replace('..', '', $target), '/');
            $sheetPath = str_starts_with($target, 'xl/') ? $tmp.'/'.$target : $tmp.'/xl/'.$target;
            if (! file_exists($sheetPath)) {
                $sheetPath = $tmp.'/xl/worksheets/sheet'.($index + 1).'.xml';
            }
            if (file_exists($sheetPath)) {
                $sheets[] = [
                    'name' => (string) ($sheet['name'] ?? 'Sheet '.($index + 1)),
                    'path' => $sheetPath,
                ];
            }
        }

        if ($sheets) return $sheets;

        $sheetFiles = glob($tmp.'/xl/worksheets/sheet*.xml') ?: [];
        sort($sheetFiles, SORT_NATURAL);
        return array_map(fn ($path, $index) => ['name' => 'Sheet '.($index + 1), 'path' => $path], $sheetFiles, array_keys($sheetFiles));
    }

    private function xlsxRows(string $path, array $sharedStrings): array
    {
        $xml = $this->loadXml($path);
        if (! $xml || ! isset($xml->sheetData)) return [];

        $rows = [];
        foreach ($xml->sheetData->row as $rowIndex => $row) {
            if ($rowIndex >= self::MAX_ROWS) break;
            $valuesByColumn = [];
            foreach ($row->c as $cell) {
                $reference = (string) ($cell['r'] ?? '');
                $columnIndex = $this->xlsxColumnIndex($reference) ?? count($valuesByColumn);
                $valuesByColumn[$columnIndex] = $this->xlsxCellValue($cell, $sharedStrings);
            }
            if (! $valuesByColumn) continue;
            ksort($valuesByColumn);
            $max = min(max(array_keys($valuesByColumn)), 40);
            $values = [];
            for ($i = 0; $i <= $max; $i++) {
                $values[] = $valuesByColumn[$i] ?? '';
            }
            if (collect($values)->filter(fn ($value) => $value !== '')->isNotEmpty()) {
                $rows[] = $this->csvLine($values);
            }
        }
        return $rows;
    }

    private function xlsxCellValue(\SimpleXMLElement $cell, array $sharedStrings): string
    {
        $type = (string) ($cell['t'] ?? '');
        if ($type === 'inlineStr') return trim((string) ($cell->is->t ?? ''));

        $value = (string) ($cell->v ?? '');
        if ($type === 's') return $sharedStrings[(int) $value] ?? $value;
        if ($type === 'b') return $value === '1' ? 'TRUE' : 'FALSE';
        return $value;
    }

    private function xlsxColumnIndex(string $reference): ?int
    {
        if (! preg_match('/^([A-Z]+)/i', $reference, $matches)) return null;
        $letters = strtoupper($matches[1]);
        $index = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $index = $index * 26 + (ord($letters[$i]) - 64);
        }
        return $index - 1;
    }

    private function loadXml(string $path): ?\SimpleXMLElement
    {
        if (! file_exists($path)) return null;
        $previous = libxml_use_internal_errors(true);
        $xml = simplexml_load_file($path);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        return $xml ?: null;
    }

    private function removeDirectory(string $directory): void
    {
        if (! is_dir($directory)) return;
        $items = scandir($directory) ?: [];
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $directory.DIRECTORY_SEPARATOR.$item;
            is_dir($path) ? $this->removeDirectory($path) : @unlink($path);
        }
        @rmdir($directory);
    }

    private function csv(string $path, string $name, string $extension): array
    {
        $delimiter = $extension === 'tsv' ? "\t" : $this->detectDelimiter($path);
        $csv = Reader::createFromPath($path, 'r');
        $csv->setDelimiter($delimiter);

        $rows = [];
        foreach ($csv->getRecords() as $index => $record) {
            if ($index >= self::MAX_ROWS) break;
            $rows[] = $this->csvLine($record);
        }

        return $this->payload($name, 'csv', $extension, implode("\n", $rows), [
            'delimiter' => $delimiter,
            'row_limit' => self::MAX_ROWS,
        ]);
    }

    private function pdf(string $path, string $name): array
    {
        $parser = new PdfParser();
        $pdf = $parser->parseFile($path);
        $pages = [];

        foreach (array_slice($pdf->getPages(), 0, 10) as $index => $page) {
            $text = trim($page->getText());
            if ($text !== '') {
                $pages[] = 'Page '.($index + 1).":\n".$text;
            }
        }

        return $this->payload($name, 'pdf', 'pdf', implode("\n\n", $pages), [
            'page_limit' => 10,
            'warning' => empty($pages) ? 'No text extracted. This may be a scanned PDF and needs OCR.' : null,
        ]);
    }

    private function text(string $path, string $name, string $extension): array
    {
        return $this->payload($name, 'text', $extension ?: 'txt', file_get_contents($path) ?: '', []);
    }

    private function payload(string $name, string $type, string $extension, string $content, array $metadata): array
    {
        $content = mb_substr($content, 0, self::MAX_TEXT_CHARS);

        return [
            'id' => (string) str()->uuid(),
            'kind' => 'file',
            'name' => $name,
            'type' => $type,
            'extension' => $extension,
            'content' => $content,
            'metadata' => array_filter($metadata, fn ($value) => $value !== null),
            'truncated' => mb_strlen($content) >= self::MAX_TEXT_CHARS,
        ];
    }

    private function detectDelimiter(string $path): string
    {
        $line = fgets(fopen($path, 'r')) ?: '';
        $candidates = [',' => substr_count($line, ','), ';' => substr_count($line, ';'), "\t" => substr_count($line, "\t")];
        arsort($candidates);
        return array_key_first($candidates) ?: ',';
    }

    private function csvLine(array $values): string
    {
        return collect($values)->map(function ($value) {
            $value = $value === null ? '' : (string) $value;
            return str_contains($value, ',') || str_contains($value, '"') || str_contains($value, "\n")
                ? '"'.str_replace('"', '""', $value).'"'
                : $value;
        })->join(',');
    }
}
