<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('public-chat:prune-images {--hours=24}', function () {
    $hours = (int) $this->option('hours');
    $cutoff = now()->subHours($hours)->timestamp;
    $deleted = 0;

    foreach (Storage::disk('public')->allFiles('public-chat-images') as $file) {
        if (Storage::disk('public')->lastModified($file) < $cutoff) {
            Storage::disk('public')->delete($file);
            $deleted++;
        }
    }

    $this->info("Deleted {$deleted} public chat image(s) older than {$hours}h.");
})->purpose('Prune temporary public chat images.');
