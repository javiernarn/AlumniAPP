<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The `device_tokens` table referenced by App\Models\DeviceToken and
 * NotificationController@registerDevice did not exist anywhere in the
 * supplied migrations — the push-notification device registration
 * endpoint could not have worked in production (it would throw a SQL
 * "table not found" error on every call). Adding it here as part of
 * Phase 1 so the endpoint (and its IDOR fix) is actually functional and
 * testable.
 */
class CreateDeviceTokensTable extends Migration
{
    public function up()
    {
        Schema::create('device_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('token')->unique();
            $table->string('device_id')->nullable();
            $table->string('platform', 20)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('device_tokens');
    }
}
