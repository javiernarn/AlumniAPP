<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ATMS Feedback Reports
 * ---------------------
 * Backs the "Give Feedback to ATMS" widget in resources/js/components/layout/index.js.
 *
 * Flow the table supports:
 *   1. Alumni clicks "Give Feedback" -> picks one of two options:
 *        - "improve" ("Help us improve ATMS")
 *        - "wrong"   ("Something went wrong")
 *   2. Alumni picks an area of the app, writes details, and MUST attach at
 *      least one screenshot (enforced both client-side and server-side).
 *   3. Admin reviews the report in the "Feedback Reports" admin page,
 *      changes its status, and can leave a note back to the alumni.
 *
 * Screenshots are stored on the PRIVATE disk (same pattern as
 * JobApplication resumes / government IDs) since a screenshot can easily
 * contain sensitive on-screen information belonging to the alumni who
 * captured it. They are only ever served back out through the
 * authenticated, ownership-checked `atms-feedback.screenshot` route.
 */
return new class extends Migration
{
    public function up()
    {
        Schema::create('atms_feedback_reports', function (Blueprint $table) {
            $table->id();

            // Who submitted it. Kept nullable + set-null-on-delete so a
            // historical report isn't destroyed just because the alumni
            // account submitting it is later removed.
            $table->unsignedBigInteger('user_id')->nullable();

            // "improve" | "wrong" — mirrors the two option buttons on the
            // first feedback modal step.
            $table->string('type', 20);

            // One of the FEEDBACK_AREAS values from the frontend, e.g.
            // "dashboard", "gallery", "job-posts", "other" ...
            $table->string('area', 60);

            $table->text('details');

            // Required screenshot attachments — array of private-disk
            // paths, e.g. ["feedback-screenshots/12/AbC123....jpg"].
            // Never empty: validated as `required|array|min:1` in
            // AtmsFeedbackReportController@store.
            $table->json('screenshots');

            // Lightweight, automatically-collected diagnostics (device /
            // browser / page / theme / app info) shown to admins the same
            // way STEP 2 of the modal describes ("information about your
            // device, account and this app ... will be automatically
            // included").
            $table->json('device_info')->nullable();

            $table->string('status', 20)->default('pending');
            // pending | in_review | resolved | dismissed

            $table->text('admin_notes')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('resolved_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['status']);
            $table->index(['type']);
            $table->index(['area']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('atms_feedback_reports');
    }
};
