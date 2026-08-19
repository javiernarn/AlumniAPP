<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit log — records account activity (currently login / logout) for
 * alumni and department heads so admins have a dedicated, searchable
 * history instead of these events flooding the admin notification bell.
 *
 * user_id points at the `users` row for whoever performed the action
 * (works for both alumni and department-head accounts, since both log
 * in through the same `users` table). alumni_id is filled in only for
 * alumni accounts so the audit log page can show/link the alumni
 * profile directly without an extra join through users->alumni.
 */
class CreateAuditLogsTable extends Migration
{
    public function up()
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('alumni_id')->nullable()->constrained('alumni')->nullOnDelete();

            // Denormalized snapshot fields — kept even if the user or
            // alumni record is later edited/deleted, so historical audit
            // entries never go blank.
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('role', 30); // admin | alumni | department_head
            $table->string('course_code', 20)->nullable();

            $table->string('action', 20); // login | logout
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index(['role', 'action']);
            $table->index('occurred_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
    }
}
