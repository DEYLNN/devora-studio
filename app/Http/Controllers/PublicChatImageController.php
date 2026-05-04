<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PublicChatImageController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'image' => ['required','image','mimes:jpg,jpeg,png,webp','extensions:jpg,jpeg,png,webp','max:4096'],
        ]);

        $file = $data['image'];
        $date = now()->format('Y-m-d');
        $name = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs("public-chat-images/{$date}", $name, 'public');

        $this->pruneOldImages(10);

        return response()->json([
            'id' => (string) Str::uuid(),
            'name' => $file->getClientOriginalName(),
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => asset('storage/'.$path),
            'created_at' => now()->toISOString(),
        ]);
    }
    private function pruneOldImages(int $keep = 10): void
    {
        $disk = Storage::disk('public');
        $files = collect($disk->allFiles('public-chat-images'))
            ->filter(fn (string $path) => preg_match('/^public-chat-images\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i', $path))
            ->map(fn (string $path) => [
                'path' => $path,
                'modified' => $disk->lastModified($path),
            ])
            ->sortByDesc('modified')
            ->values();

        $files->slice($keep)
            ->pluck('path')
            ->each(fn (string $path) => $disk->delete($path));

        $this->pruneEmptyImageDirectories();
    }

    private function pruneEmptyImageDirectories(): void
    {
        $disk = Storage::disk('public');

        collect($disk->directories('public-chat-images'))
            ->filter(fn (string $directory) => count($disk->files($directory)) === 0 && count($disk->directories($directory)) === 0)
            ->each(fn (string $directory) => $disk->deleteDirectory($directory));
    }
}
