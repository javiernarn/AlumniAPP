<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fixes a bug introduced in 2026_08_17_000001_widen_ocr_columns_for_encryption:
 * ocr_extracted_data is still a native MySQL `json` column, but
 * JobApplication now casts it `encrypted:array`, which stores an opaque
 * encrypted ciphertext string — NOT valid JSON. MySQL 8 auto-generates a
 * JSON_VALID() CHECK constraint on `json` columns, so every insert/update
 * fails with "CONSTRAINT job_applications.ocr_extracted_data failed"
 * (error 4025).
 *
 * The column no longer holds structured, queryable JSON (that stopped
 * being true the moment it needed encrypting), so it should just be text.
 */
class FixOcrExtractedDataColumnType extends Migration
{
    public function up()
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE job_applications MODIFY ocr_extracted_data LONGTEXT NULL');
    }

    public function down()
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE job_applications MODIFY ocr_extracted_data JSON NULL');
    }
}