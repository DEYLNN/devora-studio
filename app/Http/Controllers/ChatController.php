<?php

namespace App\Http\Controllers;

use App\Models\AiModel;
use App\Models\ChatSession;
use App\Models\UsageLog;
use App\Services\OpenAICompatibleClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Throwable;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $sessions = ChatSession::query()->where('user_id', $request->user()->id)->latest('updated_at')->get(['id','uuid','title','updated_at']);
        $models = AiModel::query()->with('provider:id,name')->where('is_active', true)->get();
        return Inertia::render('Chat/Index', compact('sessions','models'));
    }

    public function store(Request $request)
    {
        $data = $request->validate(['title' => ['nullable','string','max:120'], 'ai_model_id' => ['nullable','exists:ai_models,id']]);
        $modelId = $data['ai_model_id'] ?? AiModel::where('is_active', true)->value('id');
        $session = ChatSession::create(['user_id'=>$request->user()->id, 'title'=>$data['title'] ?? 'New Chat', 'ai_model_id'=>$modelId]);
        return redirect()->route('chat.show', $session);
    }

    public function show(Request $request, ChatSession $chat)
    {
        abort_unless($chat->user_id === $request->user()->id, 403);
        $chat->load(['messages','aiModel.provider']);
        if (! $chat->ai_model_id) {
            $chat->ai_model_id = AiModel::where('is_active', true)->value('id');
            $chat->save();
            $chat->load('aiModel.provider');
        }
        $sessions = ChatSession::query()->where('user_id', $request->user()->id)->latest('updated_at')->get(['id','uuid','title','updated_at']);
        $models = AiModel::query()->with('provider:id,name')->where('is_active', true)->get();
        return Inertia::render('Chat/Index', ['chat'=>$chat, 'sessions'=>$sessions, 'models'=>$models]);
    }


    public function updateModel(Request $request, ChatSession $chat)
    {
        abort_unless($chat->user_id === $request->user()->id, 403);
        $data = $request->validate(['ai_model_id' => ['required','exists:ai_models,id']]);
        $chat->update(['ai_model_id' => $data['ai_model_id']]);
        return back();
    }

    public function message(Request $request, ChatSession $chat, OpenAICompatibleClient $client)
    {
        abort_unless($chat->user_id === $request->user()->id, 403);
        $data = $request->validate(['content' => ['required','string','max:8000']]);

        $model = $chat->aiModel ?: AiModel::where('is_active', true)->first();
        if (! $model) {
            return back()->withErrors(['content' => 'No active AI model configured. Add one in Admin → Models.']);
        }
        if (! $chat->ai_model_id) {
            $chat->update(['ai_model_id' => $model->id]);
        }

        $chat->messages()->create(['role' => 'user', 'content' => $data['content']]);
        if ($chat->title === 'New Chat') {
            $chat->update(['title' => str($data['content'])->limit(60)]);
        }

        $messages = $chat->messages()
            ->latest('id')
            ->take(24)
            ->get(['role','content'])
            ->reverse()
            ->values()
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->all();

        if ($chat->system_prompt) {
            array_unshift($messages, ['role' => 'system', 'content' => $chat->system_prompt]);
        }

        try {
            $response = $client->chat($model->load('provider'), $messages);
            $content = trim($client->extractContent($response));
            if ($content === '') {
                $content = 'The provider returned an empty response.';
            }
            $chat->messages()->create([
                'role' => 'assistant',
                'content' => $content,
                'metadata' => ['provider_response_id' => $response['id'] ?? null],
                'token_input' => data_get($response, 'usage.prompt_tokens'),
                'token_output' => data_get($response, 'usage.completion_tokens'),
            ]);
            UsageLog::create(array_merge([
                'user_id' => $request->user()->id,
                'provider_id' => $model->provider_id,
                'ai_model_id' => $model->id,
                'chat_session_id' => $chat->id,
                'status' => 'ok',
            ], $client->usage($response)));
        } catch (Throwable $e) {
            $chat->messages()->create([
                'role' => 'assistant',
                'content' => "Provider error: ".$e->getMessage(),
                'metadata' => ['error' => true],
            ]);
            UsageLog::create([
                'user_id' => $request->user()->id,
                'provider_id' => $model->provider_id,
                'ai_model_id' => $model->id,
                'chat_session_id' => $chat->id,
                'status' => 'error',
                'error' => $e->getMessage(),
            ]);
        }

        $chat->touch();
        return redirect()->route('chat.show', $chat);
    }
}
