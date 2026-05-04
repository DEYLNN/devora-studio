<?php

namespace App\Http\Controllers;

use App\Models\AiModel;
use App\Models\UsageLog;
use App\Services\OpenAICompatibleClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Throwable;

class PublicChatController extends Controller
{
    public function index()
    {
        $versionOf = function (AiModel $model): float {
            $text = strtolower($model->display_name.' '.$model->model_id);
            preg_match_all('/\d+(?:\.\d+)?/', $text, $matches);

            return collect($matches[0] ?? [])
                ->map(fn ($value) => (float) $value)
                ->max() ?? 0;
        };

        $models = AiModel::query()
            ->with('provider:id,name')
            ->get(['id','provider_id','display_name','model_id','category','supports_vision','supports_files','is_default','is_latest','launched_at','is_active'])
            ->map(function (AiModel $model) use ($versionOf) {
                $model->version_rank = $versionOf($model);
                return $model;
            });

        $models = $models
            ->sortBy(function (AiModel $model) {
                $activeRank = $model->is_active ? 0 : 1;
                $launchRank = $model->launched_at ? 9999999999 - $model->launched_at->timestamp : 9999999999;
                $defaultRank = $model->is_default ? 0 : 1;

                return sprintf('%d-%010d-%d-%s', $activeRank, $launchRank, $defaultRank, $model->display_name);
            })
            ->values();

        return Inertia::render('PublicChat', ['models' => $models]);
    }


    public function summarize(Request $request, OpenAICompatibleClient $client)
    {
        $data = $request->validate([
            'model_id' => ['nullable','exists:ai_models,id'],
            'website' => ['nullable','string','max:0'],
            'existing_summary' => ['nullable','string','max:8000'],
            'messages' => ['required','array','max:20'],
            'messages.*.role' => ['required','in:user,assistant'],
            'messages.*.content' => ['required','string','max:8000'],
        ]);

        $model = AiModel::query()
            ->where('is_active', true)
            ->when($data['model_id'] ?? null, fn ($query, $id) => $query->where('id', $id))
            ->first()
            ?: AiModel::query()->where('is_active', true)->where('is_default', true)->first()
            ?: AiModel::query()->where('is_active', true)->first();

        if (! $model) {
            return response()->json(['message' => 'Belum ada model AI yang aktif. Aktifkan model dulu di admin.'], 422);
        }

        $transcript = collect($data['messages'])
            ->map(fn ($message) => strtoupper($message['role']).': '.$message['content'])
            ->join("\n\n");

        $messages = [
            [
                'role' => 'system',
                'content' => 'Summarize chat history for future context. Keep durable user preferences, decisions, constraints, named entities, goals, and unresolved tasks. Be concise but specific. Use bullet points. Do not add new facts.',
            ],
            [
                'role' => 'user',
                'content' => "Existing summary:\n".($data['existing_summary'] ?? 'None')."\n\nNew transcript:\n{$transcript}\n\nReturn an updated compact memory summary for the next AI response context.",
            ],
        ];

        try {
            $response = $client->chat($model->load('provider'), $messages);
            $summary = trim($client->extractContent($response));
            return response()->json(['summary' => $summary]);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Summary is temporarily unavailable.'], 502);
        }
    }

    public function message(Request $request, OpenAICompatibleClient $client)
    {
        $data = $request->validate([
            'model_id' => ['nullable','exists:ai_models,id'],
            'website' => ['nullable','string','max:0'],
            'messages' => ['required','array','max:24'],
            'messages.*.role' => ['required','in:user,assistant'],
            'messages.*.content' => ['required','string','max:8000'],
            'messages.*.images' => ['nullable','array','max:2'],
            'messages.*.images.*.path' => ['required_with:messages.*.images','string'],
            'messages.*.images.*.mime' => ['nullable','string'],
            'messages.*.files' => ['nullable','array','max:2'],
            'messages.*.files.*.name' => ['required_with:messages.*.files','string','max:180'],
            'messages.*.files.*.mime' => ['nullable','string','max:120'],
            'messages.*.files.*.size' => ['nullable','integer','max:1048576'],
            'messages.*.files.*.content' => ['nullable','string','max:24000'],
        ]);

        $model = AiModel::query()
            ->where('is_active', true)
            ->when($data['model_id'] ?? null, fn ($query, $id) => $query->where('id', $id))
            ->first()
            ?: AiModel::query()->where('is_active', true)->where('is_default', true)->first()
            ?: AiModel::query()->where('is_active', true)->first();

        if (! $model) {
            return response()->json(['message' => 'Belum ada model AI yang aktif. Aktifkan model dulu di admin.'], 422);
        }

        $messages = collect($data['messages'])
            ->take(-20)
            ->map(function ($message) {
                $files = collect($message['files'] ?? [])->take(2)->map(function ($file, $index) {
                    $name = str($file['name'] ?? 'attachment.txt')->limit(180, '')->toString();
                    $content = str($file['content'] ?? '')->limit(24000, "
...[truncated]")->toString();
                    if (trim($content) === '') {
                        $content = "[No extractable text was found for {$name}. The file uploaded successfully, but the parser returned empty content. Ask the user to convert it to CSV/text or install the full parser/OCR runtime if detailed analysis is required.]";
                    }
                    $fileNumber = $index + 1;

                    return "File {$fileNumber}: {$name}
```text
{$content}
```";
                })->filter()->values()->all();

                $images = collect($message['images'] ?? [])->take(2)->map(function ($image) {
                    $path = $image['path'] ?? '';
                    abort_unless(str_starts_with($path, 'public-chat-images/'), 422, 'Invalid image path.');
                    abort_if(str_contains($path, '..') || str_contains($path, '\\'), 422, 'Invalid image path.');
                    abort_unless(preg_match('/^public-chat-images\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i', $path), 422, 'Invalid image path.');
                    abort_unless(Storage::disk('public')->exists($path), 422, 'Image not found.');
                    $mime = $image['mime'] ?? Storage::disk('public')->mimeType($path) ?? 'image/jpeg';
                    $base64 = base64_encode(Storage::disk('public')->get($path));
                    return [
                        'type' => 'image_url',
                        'image_url' => ['url' => "data:{$mime};base64,{$base64}"],
                    ];
                })->all();

                if ($message['role'] === 'user' && count($images) > 0) {
                    $imageParts = [];
                    foreach ($images as $index => $image) {
                        $imageNumber = $index + 1;
                        $imageParts[] = ['type' => 'text', 'text' => "Image {$imageNumber}:"];
                        $imageParts[] = $image;
                    }

                    $prompt = trim($message['content']);
                    $imageCount = count($images);
                    $intro = "The user attached {$imageCount} image".($imageCount > 1 ? 's' : '').". Consider every attached image. If comparing them, refer to them as Image 1, Image 2, etc.";

                    return [
                        'role' => 'user',
                        'content' => array_merge([
                            ['type' => 'text', 'text' => $intro."

".($prompt !== '' ? $prompt : 'Please analyze the attached image(s).')],
                        ], $imageParts),
                    ];
                }

                if ($message['role'] === 'user' && count($files) > 0) {
                    $fileCount = count($files);
                    $prompt = trim($message['content']);
                    $intro = "The user attached {$fileCount} file".($fileCount > 1 ? 's' : '').". Use the attached file content as context. If comparing them, refer to them as File 1, File 2, etc.";

                    return [
                        'role' => 'user',
                        'content' => $intro."

".implode("

", $files)."

User request:
".($prompt !== '' ? $prompt : 'Please analyze the attached file(s).'),
                    ];
                }

                return ['role' => $message['role'], 'content' => $message['content']];
            })
            ->values()
            ->all();

        array_unshift($messages, [
            'role' => 'system',
            'content' => implode("\n", [
                'You are an AI assistant inside a polished public chatbot UI.',
                'Always format responses in clean GitHub-Flavored Markdown that renders well in a chat UI.',
                'Use ## for main section headings and ### for sub-sections. Never use plain unmarked section titles.',
                'Use **bold labels** for short labels like Goal, Stack, Outcome, Tasks, Decisions.',
                'Every list item must start with - or a numbered marker. Do not output bare newline-separated items.',
                'Use blank lines between sections so the UI has breathing room.',
                'When showing commands or code, always use fenced code blocks with the correct language label, e.g. ```bash, ```php, ```jsx.',
                'Do not output large unformatted walls of text.',
                'If giving a roadmap, format it as: ## Goal, ## Phase 0 — Planning, then bullet lists inside each phase.',
            ]),
        ]);

        try {
            $response = $client->chat($model->load('provider'), $messages);
            $content = trim($client->extractContent($response));
            if ($content === '') {
                $content = 'The selected AI model returned an empty response. Please try again, or switch to another model if this keeps happening.';
            }

            UsageLog::create(array_merge([
                'provider_id' => $model->provider_id,
                'ai_model_id' => $model->id,
                'status' => 'ok',
                'path' => $request->path(),
                'status_code' => 200,
                'metadata' => ['surface' => 'public-localstorage-chat'],
            ], $client->usage($response)));

            return response()->json([
                'message' => [
                    'id' => (string) str()->uuid(),
                    'role' => 'assistant',
                    'content' => $content,
                    'created_at' => now()->toISOString(),
                    'model_id' => $model->id,
                    'model_name' => $model->display_name,
                ],
            ]);
        } catch (Throwable $e) {
            UsageLog::create([
                'provider_id' => $model->provider_id,
                'ai_model_id' => $model->id,
                'status' => 'error',
                'path' => $request->path(),
                'status_code' => 502,
                'error' => str($e->getMessage())->limit(2000),
                'metadata' => ['surface' => 'public-localstorage-chat'],
            ]);

            return response()->json(['message' => $this->publicErrorMessage($e)], 502);
        }
    }
    private function publicErrorMessage(Throwable $e): string
    {
        $message = strtolower($e->getMessage());
        $status = method_exists($e, 'response') && $e->response() ? $e->response()->status() : null;

        if (str_contains($message, 'curl error 28') || str_contains($message, 'timed out') || str_contains($message, 'timeout')) {
            return 'The selected AI model took too long to respond. Please try again, or switch to another model if this keeps happening.';
        }

        if ($status === 429 || str_contains($message, 'too many requests') || str_contains($message, 'rate limit')) {
            return 'Too many requests. Please wait a moment before sending another message.';
        }

        if (in_array($status, [401, 403], true)) {
            return 'The selected AI model is temporarily unavailable. Please choose another model or try again later.';
        }

        if ($status && $status >= 500) {
            return 'The AI provider is temporarily unavailable. Please try again in a moment or switch to another model.';
        }

        return 'The selected AI model could not respond right now. Please try again or switch to another model.';
    }

}
