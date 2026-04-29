<?php

namespace App\Services;

use App\Models\AiModel;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class OpenAICompatibleClient
{
    public function chat(AiModel $model, array $messages, bool $stream = false): array
    {
        $provider = $model->provider;
        $baseUrl = rtrim($provider->base_url, '/');
        $url = str_ends_with($baseUrl, '/chat/completions') ? $baseUrl : $baseUrl.'/chat/completions';
        $payload = [
            'model' => $model->model_id,
            'messages' => $messages,
            'stream' => $stream,
            'max_tokens' => 1600,
        ];

        $request = Http::timeout(45)
            ->connectTimeout(10)
            ->acceptJson()
            ->asJson();

        if ($provider->api_key) {
            $request = $request->withToken($provider->api_key);
        }

        return $request->post($url, $payload)->throw()->json();
    }

    public function extractContent(array $response): string
    {
        return (string) Arr::get($response, 'choices.0.message.content', '');
    }

    public function usage(array $response): array
    {
        return [
            'prompt_tokens' => Arr::get($response, 'usage.prompt_tokens'),
            'completion_tokens' => Arr::get($response, 'usage.completion_tokens'),
            'total_tokens' => Arr::get($response, 'usage.total_tokens'),
        ];
    }
}
