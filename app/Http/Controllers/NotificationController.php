<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api'); // keep Bearer token middleware
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        $formatted = collect($notifications->items())->map(function ($n) {
            $data = $n->data ?? [];
            return [
                'id' => $n->id,
                'user_id' => $n->user_id,
                'notifiable_type' => $n->notifiable_type,
                'title' => $n->title ?? $data['title'] ?? 'Notification',
                'message' => $n->message ?? $data['message'] ?? '',
                'data' => $data,
                'read' => $n->read,
                'read_at' => $n->read_at,
                'created_at' => $n->created_at,
                'updated_at' => $n->updated_at,
            ];
        });

        return response()->json([
            'data' => $formatted,
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function count(Request $request)
    {
        $user = $request->user();
        $count = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();

        $notification = Notification::where('user_id', $user->id)
            ->findOrFail($id);

        $notification->update([
            'read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();
        $count = Notification::where('user_id', $user->id)
            ->where('read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $notification = Notification::where('user_id', $user->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully',
        ]);
    }

    public function registerDevice(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'device_token' => 'required|string',
            'device_uuid' => 'required|string',
            'platform' => 'required|in:ios,android',
        ]);

        DeviceToken::updateOrCreate(
            ['token' => $validated['device_token']],
            [
                'user_id' => $validated['user_id'],
                'device_id' => $validated['device_uuid'],
                'platform' => $validated['platform'],
            ]
        );

        return response()->json(['success' => true]);
    }
}
