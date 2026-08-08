<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds Government ID Verification columns to job_applications.
 * ADDITIVE ONLY — no existing columns are removed or altered.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->string('id_type')->nullable()->after('cover_letter');
            $table->string('verification_status')->default('pending')->after('id_type');
            $table->string('ocr_name')->nullable()->after('verification_status');
            $table->string('ocr_id_number')->nullable()->after('ocr_name');
            $table->text('ocr_raw_text')->nullable()->after('ocr_id_number');
            $table->json('ocr_extracted_data')->nullable()->after('ocr_raw_text');
            $table->string('government_id_front')->nullable()->after('ocr_extracted_data');
            $table->string('government_id_back')->nullable()->after('government_id_front');
            $table->boolean('ocr_success')->default(false)->after('government_id_back');
            $table->boolean('id_type_match')->default(false)->after('ocr_success');
            $table->decimal('ocr_confidence', 5, 2)->nullable()->after('id_type_match');
            $table->timestamp('verified_at')->nullable()->after('ocr_confidence');
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropColumn([
                'id_type',
                'verification_status',
                'ocr_name',
                'ocr_id_number',
                'ocr_raw_text',
                'ocr_extracted_data',
                'government_id_front',
                'government_id_back',
                'ocr_success',
                'id_type_match',
                'ocr_confidence',
                'verified_at',
            ]);
        });
    }
};
