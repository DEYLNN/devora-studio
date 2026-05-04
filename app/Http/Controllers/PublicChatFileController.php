<?php

namespace App\Http\Controllers;

use App\Services\PublicChatFileParser;
use Illuminate\Http\Request;
use Throwable;

class PublicChatFileController extends Controller
{
    public function store(Request $request, PublicChatFileParser $parser)
    {
        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
                'mimes:txt,md,markdown,json,csv,tsv,xml,js,jsx,ts,tsx,py,php,css,html,yml,yaml,toml,env,log,xlsx,xlsm,xls,pdf',
            ],
        ]);

        try {
            return response()->json($parser->parse($data['file']));
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'File could not be parsed. Try a simpler file or convert it to CSV/text.',
            ], 422);
        }
    }
}
