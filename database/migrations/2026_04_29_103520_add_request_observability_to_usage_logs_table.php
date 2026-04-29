<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('usage_logs', function (Blueprint $table) {
            $table->string('path')->nullable()->after('status');
            $table->unsignedSmallInteger('status_code')->nullable()->after('path');
        });
    }

    public function down(): void
    {
        Schema::table('usage_logs', function (Blueprint $table) {
            $table->dropColumn(['path', 'status_code']);
        });
    }
};
