<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 9 — database hardening: add unique constraints where only
 * application-level validation existed before.
 *
 * `alumni.phone` and `alumni.student_id` are both validated with
 * `unique:alumni,...` rules in StoreAlumniRequest/UpdateAlumniRequest
 * (Phase 3), but that's a check-then-write race: two near-simultaneous
 * requests can both pass validation before either has committed,
 * letting a duplicate through. A database-level unique index is the
 * only thing that's actually authoritative under concurrency.
 *
 * Guards against pre-existing duplicate data (which would make adding
 * a unique index fail outright) by checking first and logging a
 * warning rather than crashing the migration — if this project's real
 * database already has duplicate phone numbers or student IDs, that's
 * a data-cleanup task for the team, not something this migration
 * should silently paper over or fail hard on in the middle of a
 * deploy.
 */
class AddUniqueConstraintsToAlumniTable extends Migration
{
    public function up()
    {
        $this->addUniqueIfSafe('phone');
        $this->addUniqueIfSafe('student_id');
    }

    private function addUniqueIfSafe(string $column): void
    {
        $duplicates = DB::table('alumni')
            ->select($column)
            ->whereNotNull($column)
            ->groupBy($column)
            ->havingRaw('COUNT(*) > 1')
            ->count();

        if ($duplicates > 0) {
            Log::warning("Skipping unique constraint on alumni.{$column}: {$duplicates} duplicate value(s) already exist. Resolve the duplicates, then add the constraint manually.");
            return;
        }

        Schema::table('alumni', function ($table) use ($column) {
            $table->unique($column);
        });
    }

    public function down()
    {
        $this->dropUniqueIfExists('alumni_phone_unique');
        $this->dropUniqueIfExists('alumni_student_id_unique');
    }

    private function dropUniqueIfExists(string $indexName): void
    {
        // Guards against the up() migration having skipped adding the
        // constraint in the first place (pre-existing duplicates) —
        // dropping an index that was never created would throw.
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            $exists = DB::selectOne(
                'SELECT COUNT(*) as cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
                ['alumni', $indexName]
            );
        } else {
            // sqlite
            $exists = DB::selectOne(
                "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type = 'index' AND name = ?",
                [$indexName]
            );
        }

        if (($exists->cnt ?? 0) > 0) {
            Schema::table('alumni', function ($table) use ($indexName) {
                $table->dropUnique($indexName);
            });
        }
    }
}
