<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->string('reference_source_type', 100)->nullable()->after('approved_at');
            $table->text('reference_url')->nullable()->after('reference_source_type');
            $table->text('verification_notes')->nullable()->after('reference_url');
        });
    }

    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn([
                'reference_source_type',
                'reference_url',
                'verification_notes'
            ]);
        });
    }
};