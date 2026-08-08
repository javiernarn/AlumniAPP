<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            // Add columns for ID documents and other documents
            // id_documents stores JSON array of {type: string, file_path: string}
            $table->json('id_documents')->nullable()->after('cover_letter');
            
            // other_documents stores JSON array of {file_path: string}
            $table->json('other_documents')->nullable()->after('id_documents');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropColumn('id_documents');
            $table->dropColumn('other_documents');
        });
    }
};
    