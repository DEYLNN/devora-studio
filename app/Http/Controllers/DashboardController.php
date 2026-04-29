<?php

namespace App\Http\Controllers;

use App\Models\AiModel;
use App\Models\ChatSession;
use App\Models\Message;
use App\Models\Provider;
use App\Models\UsageLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Dashboard', [
            'stats' => [
                'chats' => ChatSession::where('user_id', $user->id)->count(),
                'messages' => Message::whereHas('chatSession', fn ($q) => $q->where('user_id', $user->id))->count(),
                'providers' => Provider::where('is_active', true)->count(),
                'models' => AiModel::where('is_active', true)->count(),
            ],
            'recentChats' => ChatSession::where('user_id', $user->id)->latest('updated_at')->take(5)->get(['id','uuid','title','updated_at']),
            'providers' => Provider::withCount('models')->latest()->take(5)->get(['id','name','slug','base_url','is_active']),
            'usage' => [
                'total_tokens' => UsageLog::where('status', 'ok')->sum('total_tokens'),
                'requests' => UsageLog::where('status', 'ok')->count(),
                'public_chat_hits' => UsageLog::where('status', 'ok')->where('path', 'chat/message')->count(),
                'errors' => UsageLog::where('status', 'error')->count(),
            ],
            'traffic' => [
                'public_chat_hits' => UsageLog::where('status', 'ok')->where('path', 'chat/message')->count(),
                'ok_by_path' => UsageLog::query()
                    ->selectRaw('COALESCE(path, "unknown") as path, count(*) as hits')
                    ->where('status', 'ok')
                    ->groupBy('path')
                    ->orderByDesc('hits')
                    ->take(8)
                    ->get(),
            ],
            'errorLogs' => UsageLog::query()
                ->with(['provider:id,name', 'aiModel:id,display_name'])
                ->where('status', 'error')
                ->latest()
                ->take(12)
                ->get(['id','provider_id','ai_model_id','path','status_code','error','created_at']),
        ]);
    }
}
