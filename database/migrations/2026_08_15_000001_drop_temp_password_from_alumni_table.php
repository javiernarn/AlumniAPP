<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 5 — data minimization.
 *
 * `alumni.temp_password` stored the alumnus's plaintext password from
 * registration until account approval, purely so it could be echoed
 * back in the approval email as a convenience reminder
 * (AlumniRegistrationController — see the account-approval flow). That
 * is a plaintext credential at rest, sometimes for days while an
 * application sits pending. The application no longer writes to this
 * column (Phase 5); this migration removes it from the schema entirely
 * so the design can't silently come back.
 *
 * Uses a raw `ALTER TABLE ... DROP COLUMN` instead of the Schema
 * Builder's dropColumn() helper: that helper requires doctrine/dbal on
 * Laravel 8, which isn't installed in this project. A plain ALTER TABLE
 * DROP COLUMN works natively without it on both MySQL (this app's
 * production driver) and SQLite 3.35.0+ (used in this project's test
 * suite), so this migration runs cleanly in both environments without
 * adding a new Composer dependency.
 */
class DropTempPasswordFromAlumniTable extends Migration
{
    public function up()
    {
        if (Schema::hasColumn('alumni', 'temp_password')) {
            DB::statement('ALTER TABLE alumni DROP COLUMN temp_password');
        }
    }

    public function down()
    {
        if (!Schema::hasColumn('alumni', 'temp_password')) {
            DB::statement('ALTER TABLE alumni ADD COLUMN temp_password VARCHAR(255) NULL');
        }
    }
}
