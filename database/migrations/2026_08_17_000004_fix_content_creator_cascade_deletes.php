<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 9 — database hardening: review cascade-delete behavior.
 *
 * Four foreign keys point from admin-authored CONTENT back to the
 * admin `users` row that created it, all with ON DELETE CASCADE:
 *
 *   events.user_id           -> deleting the organizing admin deletes
 *                                the entire event, which cascades again
 *                                into event_registrations — every
 *                                attendee's registration vanishes too.
 *   questions.user_id        -> deleting the admin deletes every quiz
 *                                question they authored.
 *   quizzes.user_id          -> deleting the admin deletes every quiz
 *                                they created, which cascades into
 *                                quiz_question, and from there
 *                                effectively orphans/removes alumni
 *                                attempt data tied to those questions.
 *   job_posts.created_by_user_id -> deleting the admin deletes every
 *                                job post they created, which cascades
 *                                into job_applications — every OTHER
 *                                alumni's application to that posting
 *                                is deleted too, not just the poster's
 *                                own data.
 *
 * In every one of these, deleting ONE admin account can silently wipe
 * out other people's historical records (attendee registrations, quiz
 * attempt history, other alumni's job applications) as a side effect —
 * far more destructive than "this admin's own account is gone." This
 * migration changes all four to ON DELETE SET NULL instead: the content
 * itself survives, only the "who created this" reference is cleared.
 *
 * Left unchanged (CASCADE remains correct): alumni.user_id ->
 * users.id, alumni_documents.alumni_id -> alumni.id,
 * alumni_quizzes.user_id -> users.id, messages.alumni_id -> alumni.id.
 * These all cascade from a person's OWN account to their OWN data
 * (their profile, their documents, their own quiz attempts, their own
 * conversation) — "delete my account removes my own records" is the
 * expected, correct behavior there, not a data-loss risk to others.
 *
 * MySQL only (this app's production driver) — SQLite's foreign key
 * constraints are fixed at table-creation time and changing ON DELETE
 * behavior requires recreating the table entirely, which needs
 * doctrine/dbal-style tooling this project doesn't have (see the
 * Phase 5 temp_password migration for the same constraint). No-ops on
 * SQLite; the columns/behavior are unaffected there.
 */
class FixContentCreatorCascadeDeletes extends Migration
{
    private array $targets = [
        ['table' => 'events', 'column' => 'user_id', 'foreign_key' => 'events_user_id_foreign', 'references_table' => 'users'],
        ['table' => 'questions', 'column' => 'user_id', 'foreign_key' => 'questions_user_id_foreign', 'references_table' => 'users'],
        ['table' => 'quizzes', 'column' => 'user_id', 'foreign_key' => 'quizzes_user_id_foreign', 'references_table' => 'users'],
        ['table' => 'job_posts', 'column' => 'created_by_user_id', 'foreign_key' => 'job_posts_created_by_user_id_foreign', 'references_table' => 'users'],
    ];

    public function up()
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->targets as $t) {
            // SET NULL requires the column to accept NULL.
            DB::statement("ALTER TABLE {$t['table']} MODIFY {$t['column']} BIGINT UNSIGNED NULL");

            Schema::table($t['table'], function ($table) use ($t) {
                $table->dropForeign($t['foreign_key']);
                $table->foreign($t['column'])
                    ->references('id')->on($t['references_table'])
                    ->onDelete('set null');
            });
        }
    }

    public function down()
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->targets as $t) {
            Schema::table($t['table'], function ($table) use ($t) {
                $table->dropForeign($t['foreign_key']);
                $table->foreign($t['column'])
                    ->references('id')->on($t['references_table'])
                    ->onDelete('cascade');
            });
        }
    }
}
