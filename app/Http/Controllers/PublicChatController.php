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
            ->get(['id','provider_id','display_name','model_id','category','supports_vision','supports_files','is_default','is_latest','is_active'])
            ->map(function (AiModel $model) use ($versionOf) {
                $model->version_rank = $versionOf($model);
                return $model;
            });

        $models = $models
            ->sortBy(function (AiModel $model) {
                if ($model->is_default) {
                    return '0-000000-'.$model->display_name;
                }

                if ($model->is_active && $model->is_latest) {
                    return sprintf('1-%08.2f-%s', 99999 - (float) $model->version_rank, $model->display_name);
                }

                if ($model->is_active) {
                    return sprintf('2-%08.2f-%s', 99999 - (float) $model->version_rank, $model->display_name);
                }

                return sprintf('3-%s', $model->display_name);
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
            'messages.*.images' => ['nullable','array','max:4'],
            'messages.*.images.*.path' => ['required_with:messages.*.images','string'],
            'messages.*.images.*.mime' => ['nullable','string'],
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
                $images = collect($message['images'] ?? [])->take(4)->map(function ($image) {
                    $path = $image['path'] ?? '';
                    abort_unless(str_starts_with($path, 'public-chat-images/'), 422, 'Invalid image path.');
                    abort_if(str_contains($path, '..') || str_contains($path, '\\'), 422, 'Invalid image path.');
                    abort_unless(preg_match('/^public-chat-images\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i', $path), 422, 'Invalid image path.');
                    abort_unless(Storage::disk('public')->exists($path), 422, 'Image not found.');
                    $mime = $image['mime'] ?? Storage::disk('public')->mimeType($path) ?? 'image/jpeg';
                    $base64 = base64_encode(Storage::disk('public')->get($path));
                    return [
                        'type' => 'image_url',
                        'image_url' => ['url' => "data:{$mime};base64,{$base64}"],
                    ];
                })->all();

                if ($message['role'] === 'user' && count($images) > 0) {
                    return [
                        'role' => 'user',
                        'content' => array_merge([
                            ['type' => 'text', 'text' => $message['content']],
                        ], $images),
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
                $content = 'The provider returned an empty response.';
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

            return response()->json(['message' => 'Maaf, AI sedang gagal merespons. Coba lagi sebentar atau ganti model.'], 502);
        }
    }
}
