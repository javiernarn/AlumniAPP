<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    /**
     * List announcements.
     * - Admins see everything (draft/published/archived), with optional filters.
     * - Alumni only ever see "active" announcements (published + inside the
     *   publish/expiry window), pinned ones first.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role === 'admin';

        $query = Announcement::with('user');

        if ($isAdmin) {
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            if ($request->filled('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }
            if ($request->filled('search')) {
                $query->search($request->search);
            }
        } else {
            $query->active();
            if ($request->filled('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }
        }

        $announcements = $query
            ->orderByDesc('pinned')
            ->orderByDesc('publish_date')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    /**
     * Public, unauthenticated listing (mirrors EventController@publicIndex)
     * for a logged-out home/announcements teaser page, if one is added later.
     */
    public function publicIndex(Request $request)
    {
        // Same "select only what the public pages actually render" shape
        // as before, now with an optional ?category=xxx filter so the
        // dedicated public announcements page (and its per-category jump
        // links / header dropdown) can ask for one category at a time
        // instead of always pulling everything and filtering client-side.
        // Mirrors EventController@publicIndex's `?category=` handling.
        $query = Announcement::active();

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $announcements = $query
            ->orderByDesc('pinned')
            ->orderByDesc('publish_date')
            ->get(['id', 'title', 'content', 'category', 'images', 'pinned', 'publish_date', 'created_at']);

        return response()->json($announcements);
    }

    public function store(Request $request)
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can create announcements.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'nullable|string|max:50',
            'status' => 'nullable|in:draft,published,archived',
            'pinned' => 'nullable|boolean',
            'publish_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:publish_date',
            'images.*' => 'nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $imagePaths = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $imagePaths[] = $image->store('announcements/images', 'public');
                }
            }

            $announcement = Announcement::create([
                'title' => $request->title,
                'content' => $request->content,
                'category' => $request->category ?? 'general',
                'status' => $request->status ?? 'draft',
                'pinned' => (bool) $request->pinned,
                'publish_date' => $request->publish_date ?? now()->toDateString(),
                'expiry_date' => $request->expiry_date,
                'images' => $imagePaths,
                'user_id' => auth()->id(),
            ]);

            // Notify alumni only when it's actually going live now — not
            // when it's published but scheduled for a future publish_date,
            // since that would send a notification (and a working
            // "View Announcement" link) for something that scopeActive()
            // still hides from their feed today.
            if ($this->isLiveNow($announcement)) {
                $this->notifyAlumni($announcement);
            }

            return response()->json([
                'success' => true,
                'message' => 'Announcement created successfully!',
                'data' => $announcement->fresh('user'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create announcement: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Announcement $announcement)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role === 'admin';

        // Alumni viewing a specific announcement counts as a "view".
        if (!$isAdmin) {
            $announcement->increment('views_count');
        }

        $announcement->load('user');

        return response()->json([
            'success' => true,
            'data' => $announcement,
        ]);
    }

    public function update(Request $request, Announcement $announcement)
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can edit announcements.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'nullable|string|max:50',
            'status' => 'nullable|in:draft,published,archived',
            'pinned' => 'nullable|boolean',
            'publish_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:publish_date',
            'images.*' => 'nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $wasPublished = $announcement->status === 'published';

            // Keep whichever existing images the frontend still lists.
            //
            // IMPORTANT: we can't tell "kept images" apart from "removed all
            // images" by checking $request->has('existing_images') alone —
            // when the admin deletes every image, existing_images[] has zero
            // entries, so the key never arrives in the request at all and
            // has() returns false, which used to make this fall through to
            // "keep the old images" (the bug where removed images came
            // back). The frontend now always sends an explicit
            // 'images_touched' marker whenever the image picker was
            // rendered, so we use that instead to decide whether to trust
            // whatever existing_images[] did (or didn't) arrive.
            if ($request->has('images_touched')) {
                $keptUrls = $request->input('existing_images', []);
                $storagePrefix = asset('storage') . '/';
                $imagePaths = array_values(array_filter(array_map(function ($url) use ($storagePrefix) {
                    return str_replace($storagePrefix, '', $url);
                }, is_array($keptUrls) ? $keptUrls : [])));
            } else {
                $imagePaths = $announcement->images ?? [];
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $imagePaths[] = $image->store('announcements/images', 'public');
                }
            }

            $announcement->update([
                'title' => $request->title,
                'content' => $request->content,
                'category' => $request->category ?? $announcement->category,
                'status' => $request->status ?? $announcement->status,
                'pinned' => (bool) $request->pinned,
                'publish_date' => $request->publish_date,
                'expiry_date' => $request->expiry_date,
                'images' => $imagePaths,
            ]);

            // Only notify the first time it flips draft/archived -> published,
            // and only if it's actually live today (see isLiveNow()).
            if (!$wasPublished && $this->isLiveNow($announcement)) {
                $this->notifyAlumni($announcement);
            }

            return response()->json([
                'success' => true,
                'message' => 'Announcement updated successfully!',
                'data' => $announcement->fresh('user'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update announcement: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Announcement $announcement)
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can delete announcements.',
            ], 403);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully',
        ]);
    }

    /**
     * True when the announcement is published AND its publish_date (if any)
     * is today or earlier — i.e. it's actually visible to alumni right now
     * via Announcement::scopeActive(), not just marked "published" while
     * scheduled for later. Mirrors the frontend's isScheduled() check in
     * AnnouncementsPage.js.
     */
    private function isLiveNow(Announcement $announcement): bool
    {
        if ($announcement->status !== 'published') {
            return false;
        }

        if (!$announcement->publish_date) {
            return true;
        }

        return $announcement->publish_date->lte(now()->startOfDay());
    }

    /**
     * Fan out an in-app notification to every alumni user, same pattern
     * as EventController@store for new events.
     */
    private function notifyAlumni(Announcement $announcement)
    {
        $alumniUsers = User::where('role', 'alumni')->get();

        foreach ($alumniUsers as $alumnus) {
            Notification::create([
                'user_id' => $alumnus->id,
                'notifiable_type' => 'new_announcement',
                'data' => json_encode([
                    'title' => 'New Announcement',
                    'message' => $announcement->title,
                    'announcement_id' => $announcement->id,
                    'announcement_title' => $announcement->title,
                    'announcement_category' => $announcement->category,
                    'announcement_excerpt' => substr($announcement->content, 0, 150),
                    'created_by' => auth()->user()->name ?? 'Admin',
                    'created_at' => now()->toIso8601String(),
                ]),
                'read' => false,
            ]);
        }
    }
}