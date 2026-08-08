<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Alumni;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\AdminAlumniMessageMail;


class MessagingController extends Controller
{
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
            'image'         => 'nullable|image|max:5120', // 5MB
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
            $imagePath = $request->file('image')->store('messages', 'public');
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

        // ✅ Robust checkbox handling (React sends "1")
        $shouldSendEmail = in_array(
            $request->send_to_email,
            [1, '1', true, 'true'],
            true
        );

        if ($shouldSendEmail) {
            $alumni = Alumni::find($request->alumni_id);

            // ✅ Validate & sanitize email to avoid bounce errors
            if (
                $alumni &&
                filter_var(trim($alumni->email), FILTER_VALIDATE_EMAIL)
            ) {
                try {
                    Mail::to(trim($alumni->email))
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
                'image' => 'nullable|image|max:5120',
            ]);

            if (!$request->message && !$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message or image is required',
                ], 400);
            }

            $imagePath = null;

            if ($request->hasFile('image')) {
               $imagePath = $request->file('image')->store('AdminAlumni', 'public');
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

        // Check if user can delete this message
        $alumni = Alumni::where('email', $user->email)->first();
        if (!$alumni) {
            $alumni = Alumni::where('user_id', $user->id)->first();
        }

        // Admin can delete admin messages, Alumni can delete alumni messages
        if ($alumni) {
            // User is alumni
            if ($message->sender_type !== 'alumni' || $message->sender_id !== $alumni->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only delete your own messages',
                ], 403);
            }
        } else {
            // User is admin
            if ($message->sender_type !== 'admin') {
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

        // Check if user can edit this message
        $alumni = Alumni::where('email', $user->email)->first();
        if (!$alumni) {
            $alumni = Alumni::where('user_id', $user->id)->first();
        }

        // Admin can edit admin messages, Alumni can edit alumni messages
        if ($alumni) {
            // User is alumni
            if ($message->sender_type !== 'alumni' || $message->sender_id !== $alumni->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only edit your own messages',
                ], 403);
            }
        } else {
            // User is admin
            if ($message->sender_type !== 'admin') {
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