<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ai_models', function (Blueprint $table) {
            $table->string('category')->nullable()->after('display_name');
            $table->boolean('supports_files')->default(false)->after('supports_vision');
        });

        DB::table('ai_models')->orderBy('id')->get(['id', 'display_name', 'model_id'])->each(function ($model) {
            $name = strtolower($model->display_name.' '.$model->model_id);
            $category = str_contains($name, 'claude') ? 'claude' : (str_contains($name, 'gpt') || str_contains($name, 'openai') ? 'openai' : 'generic');
            DB::table('ai_models')->where('id', $model->id)->update(['category' => $category]);
        });
    }

    public function down(): void
    {
        Schema::table('ai_models', function (Blueprint $table) {
            $table->dropColumn(['category', 'supports_files']);
        });
    }
};
