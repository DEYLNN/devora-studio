<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('ai_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained()->cascadeOnDelete();
            $table->string('model_id');
            $table->string('display_name');
            $table->unsignedInteger('context_window')->nullable();
            $table->boolean('supports_streaming')->default(true);
            $table->boolean('supports_vision')->default(false);
            $table->decimal('input_price', 12, 8)->nullable();
            $table->decimal('output_price', 12, 8)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['provider_id', 'model_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('ai_models'); }
};
