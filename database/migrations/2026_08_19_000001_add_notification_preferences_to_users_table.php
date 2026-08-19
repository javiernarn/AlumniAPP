<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The three toggles on the Notification Settings modal
     * (email_notifications, sound_enabled, push_notifications) were only
     * ever saved to the browser's localStorage — they looked functional
     * but didn't persist across devices/browsers, didn't survive a
     * cleared cache, and nothing on the backend ever read them (email
     * notifications kept sending regardless of the toggle). Storing them
     * server-side on the user record makes them real, per-account
     * preferences instead of a per-browser illusion.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('notification_preferences')->nullable()->after('is_online');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notification_preferences');
        });
    }
};
