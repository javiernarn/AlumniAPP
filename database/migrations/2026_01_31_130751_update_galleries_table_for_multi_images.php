<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('galleries', function (Blueprint $table) {
            // Add column for multiple image paths (JSON array)
            $table->json('image_paths')->nullable()->after('image_path');
            // Add organization name column
            $table->string('organization_name')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('galleries', function (Blueprint $table) {
            $table->dropColumn(['image_paths', 'organization_name']);
        });
    }
};
