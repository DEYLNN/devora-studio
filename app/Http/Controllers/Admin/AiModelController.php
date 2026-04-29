<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiModel;
use App\Models\Provider;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AiModelController extends Controller
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

        $models = AiModel::with('provider:id,name')
            ->get()
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

        return Inertia::render('Admin/Models/Index', [
            'models' => $models,
            'providers' => Provider::where('is_active', true)->get(['id','name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'provider_id' => ['required','exists:providers,id'],
            'model_id' => ['required','string','max:160'],
            'display_name' => ['required','string','max:160'],
            'context_window' => ['nullable','integer','min:1'],
            'category' => ['nullable','in:openai,claude,gemini,qwen,kimi,deepseek,grok,llama,mistral,zai,generic'],
            'supports_vision' => ['nullable','boolean'],
            'supports_files' => ['nullable','boolean'],
            'supports_streaming' => ['nullable','boolean'],
            'is_default' => ['nullable','boolean'],
            'is_latest' => ['nullable','boolean'],
            'is_active' => ['nullable','boolean'],
        ]);
        $data['category'] ??= 'generic';
        $data['supports_vision'] = (bool) ($data['supports_vision'] ?? false);
        $data['supports_files'] = (bool) ($data['supports_files'] ?? false);
        $data['supports_streaming'] = (bool) ($data['supports_streaming'] ?? true);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);
        $data['is_latest'] = (bool) ($data['is_latest'] ?? false);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);
        if ($data['is_default']) {
            AiModel::query()->update(['is_default' => false]);
        }
        if ($data['is_latest']) {
            AiModel::query()->where('category', $data['category'] ?? 'generic')->update(['is_latest' => false]);
        }
        AiModel::create($data);
        return back();
    }

    public function update(Request $request, AiModel $model)
    {
        $data = $request->validate([
            'provider_id' => ['required','exists:providers,id'],
            'model_id' => ['required','string','max:160'],
            'display_name' => ['required','string','max:160'],
            'context_window' => ['nullable','integer','min:1'],
            'category' => ['required','in:openai,claude,gemini,qwen,kimi,deepseek,grok,llama,mistral,zai,generic'],
            'supports_vision' => ['boolean'],
            'supports_files' => ['boolean'],
            'supports_streaming' => ['boolean'],
            'is_default' => ['boolean'],
            'is_latest' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        if ($data['is_default'] ?? false) {
            AiModel::whereKeyNot($model->id)->update(['is_default' => false]);
        }
        if ($data['is_latest'] ?? false) {
            AiModel::whereKeyNot($model->id)->where('category', $data['category'] ?? $model->category ?? 'generic')->update(['is_latest' => false]);
        }

        $model->update($data);
        return back();
    }
}

