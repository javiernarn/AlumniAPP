<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 9 — database hardening: add foreign keys where missing.
 *
 * Surveyed every unsignedBigInteger/foreignId-shaped column across all
 * migrations for a matching FK constraint. Found exactly one genuine
 * gap: `password_change_logs.user_id` had an index but no foreign key
 * at all — it's a plain, single-table reference to `users.id` (not a
 * polymorphic type+id pair, unlike `messages.sender_id`/`sender_type`
 * and `message_reactions.user_id`/`user_type`, both of which are
 * correctly left unconstrained since they point at different tables —
 * `users` or `alumni` — depending on the sibling type column, which a
 * single FK constraint can't express).
 *
 * Uses SET NULL rather than CASCADE, deliberately: this table is a
 * security audit log (records every password-change attempt, success
 * or failure, with IP/user-agent). Cascading its rows away when the
 * referenced user is deleted would erase exactly the audit trail most
 * relevant if that account was ever compromised — e.g. an attacker
 * deleting a compromised account to destroy evidence of suspicious
 * password-change activity. The table already stores `email`
 * separately from the FK, meaning whoever designed it already intended
 * log rows to remain readable/attributable after the user reference is
 * gone. SET NULL preserves that; CASCADE would silently defeat it.
 */
return new class extends Migration
{
    public function up()
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            // SQLite FK constraints are fixed at table-creation time;
            // adding one after the fact needs table-recreation tooling
            // this project doesn't have (doctrine/dbal) — same
            // constraint noted in every other Phase 9 migration. No-op
            // here; the column and its index are unaffected.
            return;
        }

        DB::statement('ALTER TABLE password_change_logs MODIFY user_id BIGINT UNSIGNED NULL');

        Schema::table('password_change_logs', function ($table) {
            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onDelete('set null');
        });
    }

    public function down()
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('password_change_logs', function ($table) {
            $table->dropForeign(['user_id']);
        });
    }
};
