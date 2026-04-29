<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        RateLimiter::for('public-chat-message', function (Request $request) {
            $key = sha1($request->ip().'|'.substr((string) $request->userAgent(), 0, 120));

            return [
                Limit::perMinute(10)->by($key)->response(fn () => response()->json(['message' => 'Too many requests. Please wait a moment and try again.'], 429)),
                Limit::perHour(100)->by($key)->response(fn () => response()->json(['message' => 'Hourly chat limit reached. Please try again later.'], 429)),
            ];
        });

        RateLimiter::for('public-chat-upload', fn (Request $request) =>
            Limit::perMinute(8)->by($request->ip())->response(fn () => response()->json(['message' => 'Too many uploads. Please wait a moment.'], 429))
        );

        RateLimiter::for('public-chat-summarize', fn (Request $request) =>
            Limit::perMinute(3)->by($request->ip())->response(fn () => response()->json(['message' => 'Summary is temporarily rate limited.'], 429))
        );
    }
}
