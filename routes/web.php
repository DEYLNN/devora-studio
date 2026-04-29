<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\PublicChatController;
use App\Http\Controllers\PublicChatImageController;
use App\Http\Controllers\Admin\ProviderController;
use App\Http\Controllers\Admin\AiModelController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/chat', [PublicChatController::class, 'index'])->name('public.chat');
Route::post('/chat/message', [PublicChatController::class, 'message'])->middleware('throttle:public-chat-message')->name('public.chat.message');
Route::post('/chat/images', [PublicChatImageController::class, 'store'])->middleware('throttle:public-chat-upload')->name('public.chat.images');
Route::post('/chat/summarize', [PublicChatController::class, 'summarize'])->middleware('throttle:public-chat-summarize')->name('public.chat.summarize');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/admin/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/admin/chat', [ChatController::class, 'store'])->name('chat.store');
    Route::get('/admin/chat/{chat}', [ChatController::class, 'show'])->name('chat.show');
    Route::patch('/admin/chat/{chat}/model', [ChatController::class, 'updateModel'])->name('chat.model');
    Route::post('/admin/chat/{chat}/messages', [ChatController::class, 'message'])->name('chat.message');
    Route::get('/admin/providers', [ProviderController::class, 'index'])->name('admin.providers.index');
    Route::post('/admin/providers', [ProviderController::class, 'store'])->name('admin.providers.store');
    Route::patch('/admin/providers/{provider}', [ProviderController::class, 'update'])->name('admin.providers.update');
    Route::get('/admin/models', [AiModelController::class, 'index'])->name('admin.models.index');
    Route::post('/admin/models', [AiModelController::class, 'store'])->name('admin.models.store');
    Route::patch('/admin/models/{model}', [AiModelController::class, 'update'])->name('admin.models.update');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
