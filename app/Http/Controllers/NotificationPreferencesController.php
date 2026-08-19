<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class NotificationPreferencesController extends Controller
{
    /**
     * Return this user's saved notification preferences, merged over the
     * defaults so the frontend always gets all three keys even if the
     * user has never saved a preference before.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $merged = array_merge(
            User::DEFAULT_NOTIFICATION_PREFERENCES,
            $user->notification_preferences ?? []
        );

        return response()->json([
            'success' => true,
            'data' => $merged,
        ]);
    }

    /**
     * Partial update — only the keys the client sends are changed, the
     * rest of the saved preferences are left alone. This lets the
     * Notification Settings modal keep firing one request per toggle
     * flip (as it already does today) without clobbering the other two
     * settings each time.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'email_notifications' => 'sometimes|boolean',
            'sound_enabled' => 'sometimes|boolean',
            'push_notifications' => 'sometimes|boolean',
        ]);

        if (empty($validated)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid preference fields provided',
            ], 422);
        }

        $current = array_merge(
            User::DEFAULT_NOTIFICATION_PREFERENCES,
            $user->notification_preferences ?? []
        );

        $updated = array_merge($current, $validated);

        $user->update(['notification_preferences' => $updated]);

        return response()->json([
            'success' => true,
            'data' => $updated,
        ]);
    }
}
