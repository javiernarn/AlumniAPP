<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Alumni;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\AdminAlumniMessageMail;
use Illuminate\Support\Facades\Storage;


class MessagingController extends Controller
{
    /**
     * Phase 3 — re-encode message images before storing (see
     * AlumniRegistrationController::storeSanitizedImage for rationale).
     */
    private function storeSanitizedImage($file, string $directory): string
    {
        $mime = $file->getMimeType();
        $reencoded = \App\Support\ImageSanitizer::reencode(file_get_contents($file->getRealPath()), $mime);

        if ($reencoded === null) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'image' => ['The uploaded image is not valid.'],
            ]);
        }

        $filename = \Illuminate\Support\Str::random(40) . '.jpg';
        Storage::disk('private')->put($directory . '/' . $filename, $reencoded);
        return $directory . '/' . $filename;
    }

    /**
     * Keep a single "unread messages" notification row per user/type
     * instead of inserting one row per message. Sending several messages
     * in a row (or several alumni messaging in) would otherwise flood the
     * bell with near-duplicate "New message" rows — this upserts the one
     * unread row for ($userId, $notifiableType) so it just refreshes the
     * count/text and jumps back to the top of the list. Called for both
     * directions: an alumni's inbox of admin messages (one row, per
     * alumni user) and every admin's aggregate inbox of alumni messages
     * (one row per admin, count summed across ALL alumni — deliberately
     * NOT split per alumni, so it can't crowd out other admin
     * notifications the way one row per alumni conversation would).
     */
    private function upsertUnreadMessageNotification(
        int $userId,
        string $notifiableType,
        string $title,
        int $count,
        array $extraData = []
    ): void {
        if ($count <= 0) {
            // Nothing unread anymore (e.g. the recipient just opened the
            // conversation) — clear any existing unread row for this type
            // rather than leaving a stale "0 unread" badge behind.
            Notification::where('user_id', $userId)
                ->where('notifiable_type', $notifiableType)
                ->where('read', false)
                ->update(['read' => true, 'read_at' => now()]);
            return;
        }

        $message = $count === 1
            ? 'You have 1 unread message.'
            : "You have {$count} unread messages.";

        $payload = array_merge($extraData, [
            'type' => $notifiableType,
            'unread_count' => $count,
        ]);

        $existing = Notification::where('user_id', $userId)
            ->where('notifiable_type', $notifiableType)
            ->where('read', false)
            ->latest('id')
            ->first();

        if ($existing) {
            $existing->update([
                'title' => $title,
                'message' => $message,
                'data' => $payload,
                'read' => false,
                'read_at' => null,
                // Bump created_at too so the refreshed notification jumps
                // back to the top of the bell (which orders by
                // created_at desc) instead of sitting wherever the first
                // unread message left it.
                'created_at' => now(),
            ]);
        } else {
            Notification::create([
                'user_id' => $userId,
                'notifiable_type' => $notifiableType,
                'title' => $title,
                'message' => $message,
                'data' => $payload,
                'read' => false,
                'read_at' => null,
            ]);
        }
    }

    /**
     * Recomputes and pushes the admin-facing "Alumni Messages" aggregate
     * notification to every admin. Deliberately one combined count across
     * all alumni conversations (not one notification per alumni) so a
     * handful of chatty alumni can't bury other admin notifications.
     */
    private function notifyAdminsOfAlumniMessages(): void
    {
        $totalUnread = Message::where('sender_type', 'alumni')
            ->where('is_read', false)
            ->count();

        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $this->upsertUnreadMessageNotification(
                $admin->id,
                'alumni_message',
                'Alumni Messages',
                $totalUnread
            );
        }
    }

    /**
     * Pushes/refreshes the alumni-facing "New message from Admin"
     * notification for one alumni's own inbox.
     */
    private function notifyAlumniOfAdminMessages(Alumni $alumni): void
    {
        if (!$alumni->user_id) {
            // Alumni record has no linked user account (e.g. imported
            // record never logged in) — nothing to notify.
            return;
        }

        $unreadCount = Message::where('alumni_id', $alumni->id)
            ->where('sender_type', 'admin')
            ->where('is_read', false)
            ->count();

        $this->upsertUnreadMessageNotification(
            $alumni->user_id,
            'admin_message',
            'New message from Admin',
            $unreadCount,
            ['alumni_id' => $alumni->id]
        );
    }

    /**
     * Authorized download for a message's attached image. Message images
     * now live on the private disk (Phase 2), so the raw image_path can
     * no longer be turned into a working /storage/... URL by the
     * frontend — this is the only way to fetch the bytes.
     *
     * Access: admin, or the alumni participant that owns this
     * conversation thread (department heads are intentionally excluded
     * — a private conversation with staff is not course-scoped content).
     */
    public function downloadImage($messageId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $message = Message::with('alumni')->findOrFail($messageId);

        if (!$message->image_path) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $isAdmin = $user->role === 'admin';
        $isParticipant = $message->alumni && (
            ((int) $message->alumni->user_id === (int) $user->id) ||
            (strcasecmp((string) $message->alumni->email, (string) $user->email) === 0)
        );

        if (!$isAdmin && !$isParticipant) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!Storage::disk('private')->exists($message->image_path)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return Storage::disk('private')->response($message->image_path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Get all alumni for admin to search and start conversations
     */
    public function getAllAlumni(Request $request)
    {
        try {
            $search = $request->query('search', '');

            $query = Alumni::with('course') // add course relationship
                ->where('status', '!=', 'rejected') // rejected accounts should not appear in the All Alumni list
                ->select(
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'profile_image',
                    'employment_status_id',
                    'course_id',
                    'is_messaging_restricted',
                    'status',
                    'created_at'
                );

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $alumni = $query->orderBy('first_name', 'asc')->get();

            $alumniData = $alumni->map(function ($alum) {
                $lastMessage = Message::where('alumni_id', $alum->id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                $unreadCount = Message::where('alumni_id', $alum->id)
                    ->where('sender_type', 'alumni')
                    ->where('is_read', false)
                    ->count();

                return [
                    'alumni_id' => $alum->id,
                    'alumni_name' => $alum->first_name . ' ' . $alum->last_name,
                    'alumni_email' => $alum->email,
                    'alumni_avatar' => $alum->profile_image_url,
                    'is_restricted' => $alum->is_messaging_restricted ?? false,
                    'has_conversation' => $lastMessage !== null,
                    'last_message' => $lastMessage?->message,
                    'last_message_at' => $lastMessage?->created_at ?? $alum->created_at,
                    'employment_status_id' => $alum->employment_status_id,
                    'course_id' => $alum->course_id, 
                    'status' => $alum->status,
                    'unread_count' => $unreadCount,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $alumniData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch alumni',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all conversations for admin
     */
   public function getAdminConversations(Request $request)
{
    try {
        $search = trim($request->query('search', ''));

        $conversations = DB::table('messages')
            ->join('alumni', 'messages.alumni_id', '=', 'alumni.id')
            ->select(
                'messages.alumni_id',
                DB::raw('MAX(messages.id) as latest_message_id')
            )
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->where('alumni.first_name', 'LIKE', "%{$search}%")
                      ->orWhere('alumni.last_name', 'LIKE', "%{$search}%")
                      ->orWhere('alumni.email', 'LIKE', "%{$search}%")
                      ->orWhereRaw(
                          "CONCAT(alumni.first_name, ' ', alumni.last_name) LIKE ?",
                          ["%{$search}%"]
                      )
                      ->orWhereRaw(
                          "CONCAT(alumni.last_name, ' ', alumni.first_name) LIKE ?",
                          ["%{$search}%"]
                      );
                });
            })
            ->groupBy('messages.alumni_id')
            ->get();

        $data = [];

        foreach ($conversations as $conv) {
            $latestMessage = Message::find($conv->latest_message_id);
            $alumni = Alumni::find($conv->alumni_id);

            if (!$alumni || !$latestMessage) continue;

            $unreadCount = Message::where('alumni_id', $alumni->id)
                ->where('sender_type', 'alumni')
                ->where('is_read', false)
                ->count();

            $data[] = [
                'alumni_id' => $alumni->id,
                'alumni_name' => $alumni->first_name . ' ' . $alumni->last_name,
                'alumni_email' => $alumni->email,
                'alumni_avatar' => $alumni->profile_image_url,
                'last_message' => $latestMessage->message,
                'last_message_at' => $latestMessage->created_at,
                'unread_count' => $unreadCount,
                'is_restricted' => $alumni->is_messaging_restricted ?? false,
            ];
        }

        usort($data, fn ($a, $b) =>
            strtotime($b['last_message_at']) - strtotime($a['last_message_at'])
        );

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch conversations',
            'error' => $e->getMessage(),
        ], 500);
    }
}


    /**
     * Get messages between admin and alumni
     */
    public function getAdminMessages($alumniId)
    {
        try {
            $alumni = Alumni::findOrFail($alumniId);

            $messages = Message::where('alumni_id', $alumniId)
                ->orderBy('created_at', 'asc')
                ->get();

            // Load reactions for each message
            $messagesWithReactions = $messages->map(function ($message) {
                $reactions = DB::table('message_reactions')
                    ->where('message_id', $message->id)
                    ->select('emoji', DB::raw('count(*) as count'))
                    ->groupBy('emoji')
                    ->get();
                
                $message->reactions = $reactions;

                // Message images live on the private disk (Phase 2) and
                // can only be fetched through the authorized
                // messages.image route — the raw image_path is not a
                // usable URL for the frontend, so replace it with one.
                $message->image_url = $message->image_path
                    ? route('messages.image', $message->id)
                    : null;

                return $message;
            });

            return response()->json([
                'success' => true,
                'data' => $messagesWithReactions,
                'alumni_info' => [
                    'id' => $alumni->id,
                    'name' => $alumni->first_name . ' ' . $alumni->last_name,
                    'email' => $alumni->email,
                    'avatar' => $alumni->profile_image_url,
                    'is_restricted' => $alumni->is_messaging_restricted ?? false,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

 /**
 * Send message from admin
 */
public function sendAdminMessage(Request $request)
{
    try {
        $request->validate([
            'alumni_id'     => 'required|exists:alumni,id',
            'message'       => 'nullable|string|max:1000',
            // Phase 3: was 'nullable|image|max:5120' — Laravel's `image`
            // rule alone permits SVG (stored-XSS risk once viewed
            // through the message-image download endpoint).
            'image'         => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'send_to_email' => 'nullable'
        ]);

        if (!$request->message && !$request->hasFile('image')) {
            return response()->json([
                'error' => 'Message or image is required'
            ], 400);
        }

        $admin     = Auth::user();
        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->hasFile('image') ? $this->storeSanitizedImage($request->file('image'), 'messages') : null;
        }

        $messageId = DB::table('messages')->insertGetId([
            'alumni_id'   => $request->alumni_id,
            'sender_type' => 'admin',
            'sender_id'   => $admin->id,
            'message'     => $request->message ?? '',
            'image_path'  => $imagePath,
            'is_read'     => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $message = Message::find($messageId);

        // Same as getAdminMessages/getAlumniMessages below: image_path is a
        // private-disk path, not a usable URL. The frontend appends this
        // response straight into the message list (see sendAdminMessage in
        // AdminAlumniMessages.js), so without image_url here an attachment
        // shows as "Image unavailable" until the next poll overwrites it.
        $message->image_url = $message->image_path
            ? route('messages.image', $message->id)
            : null;

        // Refresh the alumni's "New message from Admin" notification so
        // it shows up in their bell even if they never open the Messages
        // feature — this is independent of the send-to-email checkbox
        // below, so load the alumni record regardless of that option.
        $alumni = Alumni::find($request->alumni_id);
        if ($alumni) {
            $this->notifyAlumniOfAdminMessages($alumni);
        }

        // ✅ Robust checkbox handling (React sends "1")
        $shouldSendEmail = in_array(
            $request->send_to_email,
            [1, '1', true, 'true'],
            true
        );

        if ($shouldSendEmail) {
            // ✅ Validate & sanitize email to avoid bounce errors
            if (
                $alumni &&
                filter_var(trim($alumni->email), FILTER_VALIDATE_EMAIL)
            ) {
                // The admin checked "send to email" for this message, but
                // the alumni's own Notification Settings toggle for email
                // notifications takes precedence — if they've turned it
                // off, respect that instead of emailing them anyway. The
                // in-app message + bell notification above still happen
                // either way; this only skips the extra email.
                $alumniUser = $alumni->user;
                $wantsEmail = !$alumniUser || $alumniUser->wantsEmailNotifications();

                if (!$wantsEmail) {
                    Log::info('Skipped admin message email — alumni has email notifications disabled', [
                        'alumni_id' => $alumni->id,
                    ]);
                } else {
                // Sending over SMTP (especially with an image attachment,
                // which the mailable base64-encodes and can push the
                // message to several MB) can easily take longer than the
                // frontend's 15s axios timeout. The message row above is
                // already saved, so the chat itself must not wait on
                // mail delivery — dispatch it to run right after this
                // HTTP response has been flushed to the browser instead
                // of blocking the request. This needs no queue worker;
                // Laravel runs it in the same PHP process on
                // app-terminate, it just no longer holds up the response.
                $recipientEmail = trim($alumni->email);
                dispatch(function () use ($message, $admin, $alumni, $recipientEmail) {
                    try {
                        Mail::to($recipientEmail)
                            ->send(new AdminAlumniMessageMail(
                                $message,
                                $admin,
                                $alumni
                            ));
                    } catch (\Exception $mailEx) {
                        Log::error(
                            'Failed to send alumni email notification: ' .
                            $mailEx->getMessage()
                        );
                    }
                })->afterResponse();
                }
            } else {
                Log::warning('Invalid alumni email', [
                    'alumni_id' => $request->alumni_id,
                    'email'     => $alumni->email ?? null,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data'    => $message
        ]);
    } catch (\Exception $e) {
        Log::error('Failed to send admin message: ' . $e->getMessage());

        return response()->json([
            'error' => 'Failed to send message'
        ], 500);
    }
}


    /**
     * Get messages for alumni
     */
    public function getAlumniMessages()
    {
        try {
            // Get the authenticated user from the API guard
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Check if user is alumni by looking up in alumni table
            $alumni = Alumni::where('email', $user->email)->first();
            
            if (!$alumni) {
                // If no alumni found by email, try to find by user_id if it exists
                $alumni = Alumni::where('user_id', $user->id)->first();
            }

            if (!$alumni) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alumni profile not found',
                ], 404);
            }

            $alumniId = $alumni->id;

            $messages = Message::where('alumni_id', $alumniId)
                ->orderBy('created_at', 'asc')
                ->get();

            // Load reactions for each message
            $messagesWithReactions = $messages->map(function ($message) {
                $reactions = DB::table('message_reactions')
                    ->where('message_id', $message->id)
                    ->select('emoji', DB::raw('count(*) as count'))
                    ->groupBy('emoji')
                    ->get();
                
                $message->reactions = $reactions;

                // Message images live on the private disk (Phase 2) and
                // can only be fetched through the authorized
                // messages.image route — the raw image_path is not a
                // usable URL for the frontend, so replace it with one.
                $message->image_url = $message->image_path
                    ? route('messages.image', $message->id)
                    : null;

                return $message;
            });

            return response()->json([
                'success' => true,
                'messages' => $messagesWithReactions,
                'is_restricted' => $alumni->is_messaging_restricted ?? false,
                'alumni_info' => [
                    'id' => $alumni->id,
                    'name' => $alumni->first_name . ' ' . $alumni->last_name,
                    'email' => $alumni->email,
                    'avatar' => $alumni->profile_image_url,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get Alumni Messages Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send message from alumni
     */
    public function sendAlumniMessage(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $alumni = Alumni::where('email', $user->email)->first();
            if (!$alumni) {
                $alumni = Alumni::where('user_id', $user->id)->first();
            }

            if (!$alumni) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alumni profile not found',
                ], 404);
            }

            if ($alumni->is_messaging_restricted) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are restricted from sending messages.',
                ], 403);
            }

            $request->validate([
                'message' => 'nullable|string|max:1000',
                // Phase 3: same SVG exclusion as sendAdminMessage above.
                'image' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            if (!$request->message && !$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message or image is required',
                ], 400);
            }

            $imagePath = null;

            if ($request->hasFile('image')) {
               $imagePath = $request->hasFile('image') ? $this->storeSanitizedImage($request->file('image'), 'AdminAlumni') : null;
            }

            $alumniId = $alumni->id;

            $messageId = DB::table('messages')->insertGetId([
                'alumni_id' => $alumniId,
                'sender_type' => 'alumni',
                'sender_id' => $alumniId,
                'message' => $request->message ?? '',
                'image_path' => $imagePath,
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $message = Message::find($messageId);

            // Same fix as sendAdminMessage above — the frontend appends
            // this response straight into the message list, so it needs a
            // usable image_url, not the raw private-disk image_path.
            $message->image_url = $message->image_path
                ? route('messages.image', $message->id)
                : null;

            // Refresh the combined "Alumni Messages" notification for
            // every admin — one aggregate row, not one per alumni (see
            // notifyAdminsOfAlumniMessages docblock).
            $this->notifyAdminsOfAlumniMessages();

            return response()->json([
                'success' => true,
                'data' => $message,
                'message' => 'Message sent successfully',
            ]);
        } catch (\Exception $e) {
        Log::error('Send Alumni Message Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark alumni messages as read
     */
    public function markAlumniMessagesAsRead()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $alumni = Alumni::where('email', $user->email)->first();
            if (!$alumni) {
                $alumni = Alumni::where('user_id', $user->id)->first();
            }

            if (!$alumni) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alumni profile not found',
                ], 404);
            }

            Message::where('alumni_id', $alumni->id)
                ->where('sender_type', 'admin')
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);

            // They're looking at the conversation now — clear the bell
            // notification too, not just the in-page unread count.
            $this->notifyAlumniOfAdminMessages($alumni);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark messages as read',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get alumni unread count
     */
    public function getAlumniUnreadCount()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $alumni = Alumni::where('email', $user->email)->first();
            if (!$alumni) {
                $alumni = Alumni::where('user_id', $user->id)->first();
            }

            if (!$alumni) {
                return response()->json([
                    'success' => true,
                    'unread_count' => 0,
                ]);
            }

            $count = Message::where('alumni_id', $alumni->id)
                ->where('sender_type', 'admin')
                ->where('is_read', false)
                ->count();

            return response()->json([
                'success' => true,
                'unread_count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get unread count',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark admin-side unread messages as read
     */
    public function markAdminMessagesAsRead($alumniId)
    {
        try {
            Message::where('alumni_id', $alumniId)
                ->where('sender_type', 'alumni')
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            // Recompute the combined admin notification — other alumni
            // may still have unread messages, so this refreshes the
            // count (or clears it if this was the last one) rather than
            // assuming everything is now read.
            $this->notifyAdminsOfAlumniMessages();

            return response()->json([
                'success' => true,
                'message' => 'Messages marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark messages as read',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restrict alumni from messaging
     */
    public function restrictAlumni($alumniId)
    {
        try {
            $alumni = Alumni::findOrFail($alumniId);
            $alumni->is_messaging_restricted = !$alumni->is_messaging_restricted;
            $alumni->save();

            return response()->json([
                'success' => true,
                'is_restricted' => $alumni->is_messaging_restricted,
                'message' => $alumni->is_messaging_restricted 
                    ? 'Alumni has been restricted from messaging' 
                    : 'Alumni messaging restriction has been removed',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update restriction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete conversation
     */
    public function deleteConversation($alumniId)
    {
        try {
            // Also delete reactions for messages in this conversation
            $messageIds = Message::where('alumni_id', $alumniId)->pluck('id');
            DB::table('message_reactions')->whereIn('message_id', $messageIds)->delete();
            
            Message::where('alumni_id', $alumniId)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Conversation deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete conversation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Add or toggle reaction on a message
     */
    public function addReaction(Request $request, $messageId)
    {
        try {
            $request->validate([
                'emoji' => 'required|string|max:10',
            ]);

            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $message = Message::findOrFail($messageId);
            
            // Determine user type based on the authenticated user
            // Check if user is an alumni
            $alumni = Alumni::where('email', $user->email)->first();
            if (!$alumni) {
                $alumni = Alumni::where('user_id', $user->id)->first();
            }
            
            // If alumni found, user is alumni; otherwise, user is admin
            $userType = $alumni ? 'alumni' : 'admin';
            $userId = $alumni ? $alumni->id : $user->id;

            // Check if reaction already exists
            $existingReaction = DB::table('message_reactions')->where([
                'message_id' => $messageId,
                'user_id' => $userId,
                'user_type' => $userType,
                'emoji' => $request->emoji,
            ])->first();

            if ($existingReaction) {
                // Toggle off - remove reaction
                DB::table('message_reactions')->where([
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'user_type' => $userType,
                    'emoji' => $request->emoji,
                ])->delete();
                $action = 'removed';
            } else {
                // Add reaction
                DB::table('message_reactions')->insert([
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'user_type' => $userType,
                    'emoji' => $request->emoji,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $action = 'added';
            }

            // Get updated reactions - return as array of emoji strings for frontend
            $reactions = DB::table('message_reactions')
                ->where('message_id', $messageId)
                ->pluck('emoji')
                ->toArray();

            return response()->json([
                'success' => true,
                'action' => $action,
                'reactions' => $reactions,
            ]);
        } catch (\Exception $e) {
            Log::error('Add Reaction Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to add reaction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    
    /**
     * Get reactions for a message
     */
    public function getMessageReactions($messageId)
    {
        try {
            // Return as array of emoji strings for frontend
            $reactions = DB::table('message_reactions')
                ->where('message_id', $messageId)
                ->pluck('emoji')
                ->toArray();

            return response()->json([
                'success' => true,
                'reactions' => $reactions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get reactions',
            ], 500);
        }
    }

    /**
 * Delete/Unsend a message (for everyone)
 */
public function deleteMessage($messageId)
{
    try {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        $message = Message::findOrFail($messageId);

        // Check if user can delete this message.
        // Fixed: identity was previously inferred from "does this user have
        // an Alumni row", which silently treated any non-alumni account
        // (e.g. a department_head) as "admin" and let it delete/edit ANY
        // admin's message (only sender_type was checked, not sender_id).
        // Branch on the real role instead, and require sender_id ownership
        // in both branches.
        if ($user->role === 'admin') {
            if ($message->sender_type !== 'admin' || (int) $message->sender_id !== (int) $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only delete your own messages',
                ], 403);
            }
        } else {
            $alumni = Alumni::where('user_id', $user->id)->first()
                ?? Alumni::where('email', $user->email)->first();

            if (!$alumni || $message->sender_type !== 'alumni' || (int) $message->sender_id !== (int) $alumni->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only delete your own messages',
                ], 403);
            }
        }

        // Delete reactions first
        DB::table('message_reactions')->where('message_id', $messageId)->delete();

        // Delete the message
        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    } catch (\Exception $e) {
        Log::error('Delete Message Error:', ['error' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'message' => 'Failed to delete message',
            'error' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Edit a message (text only)
 */
public function editMessage(Request $request, $messageId)
{
    try {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = Message::findOrFail($messageId);

        // Check if user can edit this message. Same fix as deleteMessage():
        // branch on real role and require sender_id ownership in both
        // branches (previously the admin branch only checked sender_type,
        // and any non-alumni account was treated as "admin").
        if ($user->role === 'admin') {
            if ($message->sender_type !== 'admin' || (int) $message->sender_id !== (int) $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only edit your own messages',
                ], 403);
            }
        } else {
            $alumni = Alumni::where('user_id', $user->id)->first()
                ?? Alumni::where('email', $user->email)->first();

            if (!$alumni || $message->sender_type !== 'alumni' || (int) $message->sender_id !== (int) $alumni->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only edit your own messages',
                ], 403);
            }
        }

        // Update the message
        $message->message = $request->message;
        $message->is_edited = true;
        $message->save();

        return response()->json([
            'success' => true,
            'message' => 'Message edited successfully',
            'data' => $message,
        ]);
    } catch (\Exception $e) {
        Log::error('Edit Message Error:', ['error' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'message' => 'Failed to edit message',
            'error' => $e->getMessage(),
        ], 500);
    }
}

}