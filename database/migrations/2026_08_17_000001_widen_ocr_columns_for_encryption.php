<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 9 — database hardening: encrypt highly sensitive data at rest.
 *
 * app/Models/JobApplication.php now casts ocr_name, ocr_id_number,
 * ocr_raw_text, and ocr_extracted_data as `encrypted`/`encrypted:array`.
 * Laravel's encrypted cast output (AES-256-CBC ciphertext, MAC, and IV,
 * JSON-wrapped and base64-encoded) is meaningfully longer than the
 * plaintext it replaces — easily 300+ characters even for a short input
 * like a person's name. `ocr_name` and `ocr_id_number` were both plain
 * `string()` columns (VARCHAR(255) by Laravel's default) — comfortably
 * large enough for plaintext, but a genuine truncation/silent-data-loss
 * risk once encrypted. Widened to TEXT before the encrypted casts are
 * relied on. `ocr_raw_text` (already TEXT) and `ocr_extracted_data`
 * (JSON — a JSON column can hold an encrypted string fine, since a
 * quoted string is valid JSON; it just stops being a structured,
 * queryable JSON payload, which it already effectively did the moment
 * it needed encrypting) do not need a column-type change.
 *
 * Uses raw ALTER TABLE (not Schema::table()->string()->change()) for
 * the same reason as the Phase 5 temp_password migration: the Schema
 * Builder's change() method requires doctrine/dbal on Laravel 8, which
 * isn't installed in this project and isn't reachable from this
 * environment's network allowlist.
 */
class WidenOcrColumnsForEncryption extends Migration
{
    public function up()
    {
        // SQLite has no MODIFY COLUMN syntax, and doesn't enforce
        // VARCHAR length limits in the first place (type affinity, not
        // strict typing) — this widening is a real, necessary fix on
        // MySQL specifically. No-op on SQLite; nothing to widen there.
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE job_applications MODIFY ocr_name TEXT NULL');
        DB::statement('ALTER TABLE job_applications MODIFY ocr_id_number TEXT NULL');
    }

    public function down()
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE job_applications MODIFY ocr_name VARCHAR(255) NULL');
        DB::statement('ALTER TABLE job_applications MODIFY ocr_id_number VARCHAR(255) NULL');
    }
}
