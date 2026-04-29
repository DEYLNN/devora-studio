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
            'image' => ['required','image','mimes:jpg,jpeg,png,webp,gif','max:4096'],
        ]);

        $file = $data['image'];
        $date = now()->format('Y-m-d');
        $name = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs("public-chat-images/{$date}", $name, 'public');

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
}
