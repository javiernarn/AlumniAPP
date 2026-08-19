<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 9 — database hardening: indexes for authorization/frequently-
 * filtered queries.
 *
 * Foreign-key columns (alumni.course_id, alumni.user_id, etc.) already
 * get an index automatically from their FOREIGN KEY constraint — InnoDB
 * requires one. These are the columns that don't have a foreign key
 * (so no automatic index) but ARE filtered on directly by policy checks
 * or admin listing queries added across this engagement:
 *
 *  - alumni.status: filtered by AlumniRegistrationController@index,
 *    DepartmentHeadController@alumni, and the registration-approval
 *    flow — every one of these is a "list all X of a given status"
 *    query.
 *  - job_applications.status: JobApplicationController's listing/
 *    review endpoints filter by this.
 *  - job_posts.status: the public/admin job-post listing filters
 *    approved postings.
 *  - users.role: CheckRole middleware doesn't query by role (it checks
 *    the already-loaded authenticated user's own role in memory), but
 *    DepartmentHeadController and admin user-management listings do
 *    filter users by role directly.
 */
class AddAuthorizationQueryIndexes extends Migration
{
    public function up()
    {
        Schema::table('alumni', function ($table) {
            $table->index('status');
        });

        Schema::table('job_applications', function ($table) {
            $table->index('status');
        });

        Schema::table('job_posts', function ($table) {
            $table->index('status');
        });

        Schema::table('users', function ($table) {
            $table->index('role');
        });
    }

    public function down()
    {
        Schema::table('alumni', function ($table) {
            $table->dropIndex(['status']);
        });

        Schema::table('job_applications', function ($table) {
            $table->dropIndex(['status']);
        });

        Schema::table('job_posts', function ($table) {
            $table->dropIndex(['status']);
        });

        Schema::table('users', function ($table) {
            $table->dropIndex(['role']);
        });
    }
}
