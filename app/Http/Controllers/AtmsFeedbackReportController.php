<?php

namespace App\Http\Controllers;

use App\Http\Resources\AtmsFeedbackReport\AtmsFeedbackReportResource;
use App\Models\AtmsFeedbackReport;
use App\Models\Notification;
use App\Models\User;
use App\Support\ImageSanitizer;
use App\Support\UploadedFileNamer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AtmsFeedbackReportController extends Controller
{
    /**
     * Re-encode/rename an uploaded screenshot and store it on the
     * PRIVATE disk (mirrors JobApplicationController::storeSanitizedFile
     * — screenshots can contain sensitive on-screen information, so they
     * are never written to the public disk and are only ever served
     * back through the authorized downloadScreenshot() action below).
     */
    private function storeScreenshot($file, int $userId): string
    {
        $directory = 'feedback-screenshots/' . $userId;
        $mime = $file->getMimeType();
        $imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (in_array($mime, $imageMimes, true)) {
            $reencoded = ImageSanitizer::reencode(file_get_contents($file->getRealPath()), $mime);

            if ($reencoded === null) {
                abort(422, 'One of the attached screenshots is not a valid image.');
            }

            $filename = Str::random(40) . '.jpg';
            Storage::disk('private')->put($directory . '/' . $filename, $reencoded);

            return $directory . '/' . $filename;
        }

        return $file->storeAs($directory, UploadedFileNamer::randomName($file), 'private');
    }

    /**
     * POST /atms-feedback
     * Alumni-facing submit. Screenshots are NOT optional — at least one
     * is required, matching the redesigned modal's "Add screenshot
     * (required)" control.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'type' => ['required', Rule::in(AtmsFeedbackReport::TYPES)],
            'area' => ['required', 'string', 'max:60'],
            'details' => ['required', 'string', 'max:2000'],
            'screenshots' => ['required', 'array', 'min:1', 'max:5'],
            'screenshots.*' => ['file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'page_url' => ['nullable', 'string', 'max:2048'],
            'theme' => ['nullable', 'string', 'max:20'],
        ], [
            'screenshots.required' => 'Please attach at least one screenshot of the issue.',
            'screenshots.min' => 'Please attach at least one screenshot of the issue.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $screenshotPaths = [];
            foreach ($request->file('screenshots') as $file) {
                $screenshotPaths[] = $this->storeScreenshot($file, $user->id);
            }

            $report = AtmsFeedbackReport::create([
                'user_id' => $user->id,
                'type' => $request->input('type'),
                'area' => $request->input('area'),
                'details' => $request->input('details'),
                'screenshots' => $screenshotPaths,
                'status' => 'pending',
                'device_info' => [
                    'page_url' => $request->input('page_url'),
                    'theme' => $request->input('theme'),
                    'user_agent' => $request->userAgent(),
                    'ip_address' => $request->ip(),
                    'submitted_at' => now()->toIso8601String(),
                    'app' => 'ATMS',
                ],
            ]);

            $this->notifyAdmins($report, $user);

            return response()->json([
                'success' => true,
                'message' => 'Thanks! Your feedback has been submitted.',
                'data' => new AtmsFeedbackReportResource($report->load(['user.alumni', 'resolver'])),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Failed to submit ATMS feedback report: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feedback. Please try again.',
            ], 500);
        }
    }

    /**
     * GET /admin/atms-feedback
     * Paginated, filterable listing for the admin "Feedback Reports" page.
     * Mirrors AuditLogController@index's filter/paginate/transform shape.
     */
    public function index(Request $request)
    {
        try {
            $query = AtmsFeedbackReport::query()->with(['user.alumni', 'resolver']);

            if ($search = trim((string) $request->get('search'))) {
                $query->where(function ($q) use ($search) {
                    $q->where('details', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            if (($type = $request->get('type')) && $type !== 'all') {
                $query->ofType($type);
            }

            if (($area = $request->get('area')) && $area !== 'all') {
                $query->ofArea($area);
            }

            if (($status = $request->get('status')) && $status !== 'all') {
                $query->where('status', $status);
            }

            if ($dateFrom = $request->get('date_from')) {
                $query->whereDate('created_at', '>=', $dateFrom);
            }

            if ($dateTo = $request->get('date_to')) {
                $query->whereDate('created_at', '<=', $dateTo);
            }

            $perPage = (int) $request->get('per_page', 12);
            $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 12;

            $reports = $query->orderByDesc('created_at')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => AtmsFeedbackReportResource::collection($reports->getCollection()),
                'meta' => [
                    'current_page' => $reports->currentPage(),
                    'last_page' => $reports->lastPage(),
                    'per_page' => $reports->perPage(),
                    'total' => $reports->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch ATMS feedback reports: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch feedback reports',
            ], 500);
        }
    }

    /**
     * GET /admin/atms-feedback/statistics
     * Small summary block for the top of the admin Feedback Reports page.
     */
    public function statistics()
    {
        try {
            $weekStart = now()->startOfWeek();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => AtmsFeedbackReport::count(),
                    'pending' => AtmsFeedbackReport::where('status', 'pending')->count(),
                    'in_review' => AtmsFeedbackReport::where('status', 'in_review')->count(),
                    'resolved' => AtmsFeedbackReport::where('status', 'resolved')->count(),
                    'dismissed' => AtmsFeedbackReport::where('status', 'dismissed')->count(),
                    'this_week' => AtmsFeedbackReport::where('created_at', '>=', $weekStart)->count(),
                    'bug_reports' => AtmsFeedbackReport::where('type', 'wrong')->count(),
                    'improvement_suggestions' => AtmsFeedbackReport::where('type', 'improve')->count(),
                    'by_area' => AtmsFeedbackReport::query()
                        ->selectRaw('area, count(*) as total')
                        ->groupBy('area')
                        ->orderByDesc('total')
                        ->limit(5)
                        ->get()
                        ->map(fn ($row) => [
                            'area' => $row->area,
                            'label' => AtmsFeedbackReport::AREAS[$row->area] ?? ucfirst($row->area),
                            'total' => $row->total,
                        ]),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch ATMS feedback statistics: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch feedback statistics',
            ], 500);
        }
    }

    /**
     * GET /admin/atms-feedback/{id}
     */
    public function show($id)
    {
        $report = AtmsFeedbackReport::with(['user.alumni', 'resolver'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new AtmsFeedbackReportResource($report),
        ]);
    }

    /**
     * PATCH /admin/atms-feedback/{id}/status
     * Admin moderation action: change status and/or leave a note. When
     * moved to resolved/dismissed, stamps who resolved it and when, and
     * notifies the alumni who submitted it (if the account still exists).
     */
    public function updateStatus(Request $request, $id)
    {
        $admin = auth()->user();
        $report = AtmsFeedbackReport::with('user')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => ['required', Rule::in(AtmsFeedbackReport::STATUSES)],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $newStatus = $request->input('status');
        $wasResolvedOrDismissed = in_array($report->status, ['resolved', 'dismissed'], true);
        $isNowResolvedOrDismissed = in_array($newStatus, ['resolved', 'dismissed'], true);

        $report->status = $newStatus;

        if ($request->has('admin_notes')) {
            $report->admin_notes = $request->input('admin_notes');
        }

        if ($isNowResolvedOrDismissed) {
            $report->resolved_by = $admin->id;
            $report->resolved_at = now();
        } elseif (!$isNowResolvedOrDismissed && $wasResolvedOrDismissed) {
            $report->resolved_by = null;
            $report->resolved_at = null;
        }

        $report->save();

        if (!$wasResolvedOrDismissed && $isNowResolvedOrDismissed && $report->user_id) {
            Notification::create([
                'user_id' => $report->user_id,
                'notifiable_type' => 'feedback_report_update',
                'data' => json_encode([
                    'title' => 'Your feedback was reviewed',
                    'message' => $newStatus === 'resolved'
                        ? 'An admin marked your ATMS feedback report as resolved.'
                        : 'An admin reviewed your ATMS feedback report.',
                    'feedback_report_id' => $report->id,
                    'status' => $newStatus,
                    // Snapshot the note as it read at the moment this
                    // notification fired. The modal opened from the bell
                    // also fetches the live report, but keeping a copy
                    // here means the notification text itself is
                    // self-contained even if the note is edited later.
                    'admin_notes' => $report->admin_notes,
                    'feedback_type' => $report->type,
                    'feedback_area' => $report->area,
                    'created_at' => now()->toIso8601String(),
                ]),
                'read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Feedback report updated successfully!',
            'data' => new AtmsFeedbackReportResource($report->fresh(['user.alumni', 'resolver'])),
        ]);
    }

    /**
     * DELETE /admin/atms-feedback/{id}
     */
    public function destroy($id)
    {
        $report = AtmsFeedbackReport::findOrFail($id);

        foreach ((array) $report->screenshots as $path) {
            if ($path && Storage::disk('private')->exists($path)) {
                Storage::disk('private')->delete($path);
            }
        }

        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Feedback report deleted successfully',
        ]);
    }

    /**
     * GET /atms-feedback/my-reports
     * Lets an alumni see the status of feedback they personally submitted.
     */
    public function myReports(Request $request)
    {
        $user = auth()->user();

        $reports = AtmsFeedbackReport::with(['resolver'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate((int) $request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => AtmsFeedbackReportResource::collection($reports->getCollection()),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * GET /atms-feedback/{id}
     * Lets an alumni open a single report they submitted — used by the
     * "resolved" notification modal so it can show the live status and
     * admin note rather than the snapshot baked into the notification.
     * Owner-only (mirrors downloadScreenshot's ownership check); admins
     * use the separate /admin/atms-feedback/{id} route instead.
     */
    public function showOwn($id)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $report = AtmsFeedbackReport::with(['resolver'])->findOrFail($id);

        if ((int) $report->user_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new AtmsFeedbackReportResource($report),
        ]);
    }

    /**
     * GET /atms-feedback/{id}/screenshots/{index}
     * Authorized, streamed download of one screenshot — admin, or the
     * alumni who submitted the report, only. Mirrors
     * JobApplicationController::downloadResume / downloadIdImage.
     */
    public function downloadScreenshot($id, $index)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $report = AtmsFeedbackReport::findOrFail($id);

        $isOwner = $report->user_id && (int) $report->user_id === (int) $user->id;
        $isAdmin = $user->role === 'admin';

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $paths = (array) $report->screenshots;
        $index = (int) $index;

        if (!isset($paths[$index])) {
            return response()->json(['message' => 'Screenshot not found'], 404);
        }

        $path = $paths[$index];

        if (!Storage::disk('private')->exists($path)) {
            return response()->json(['message' => 'Screenshot not found'], 404);
        }

        return Storage::disk('private')->response($path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Fan out an in-app notification to every admin user, same pattern
     * as AnnouncementController@notifyAlumni (just aimed at admins
     * instead of alumni).
     */
    private function notifyAdmins(AtmsFeedbackReport $report, User $submitter)
    {
        $admins = User::where('role', 'admin')->get();
        $submitterAlumni = $submitter->relationLoaded('alumni') ? $submitter->alumni : $submitter->alumni()->first();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'notifiable_type' => 'new_feedback_report',
                'data' => json_encode([
                    'title' => 'New ATMS Feedback',
                    'message' => $submitter->name . ' submitted feedback: ' . $report->area,
                    'feedback_report_id' => $report->id,
                    'feedback_type' => $report->type,
                    'feedback_area' => $report->area,
                    'submitted_by' => $submitter->name,
                    'alumni_id' => $submitterAlumni?->id,
                    // Powers the notification bell avatar on the admin
                    // side — without this the bell falls back to a
                    // generic user icon for every feedback notification.
                    'alumni_profile_image' => $submitterAlumni?->profile_image_url,
                    'created_at' => now()->toIso8601String(),
                ]),
                'read' => false,
            ]);
        }
    }
}
