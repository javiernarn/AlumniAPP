<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Alumni;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\JobApplicationAccepted;
use App\Mail\JobApplicationRejected;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\JobApplication\ApplyJobRequest;
use App\Support\ImageSanitizer;
use App\Support\UploadedFileNamer;
use Illuminate\Validation\ValidationException;


class JobApplicationController extends Controller
{
    /**
     * Phase 3 — store an uploaded file on the private disk, re-encoding
     * it first if it's a raster image; PDFs/DOC/DOCX pass through
     * unchanged (mirrors AlumniRegistrationController::storeSanitizedImage).
     */
    private function storeSanitizedFile($file, string $directory): string
    {
        $mime = $file->getMimeType();
        $imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (in_array($mime, $imageMimes, true)) {
            $reencoded = ImageSanitizer::reencode(file_get_contents($file->getRealPath()), $mime);

            if ($reencoded === null) {
                throw ValidationException::withMessages([
                    'file' => ['One of the uploaded files is not a valid image.'],
                ]);
            }

            $filename = \Illuminate\Support\Str::random(40) . '.jpg';
            Storage::disk('private')->put($directory . '/' . $filename, $reencoded);
            return $directory . '/' . $filename;
        }

        return $file->storeAs($directory, UploadedFileNamer::randomName($file), 'private');
    }

    // ============================================================
    // ============ EXISTING HELPERS (UNCHANGED) ==================
    // ============================================================

    /**
     * Helper to get alumni data from a user ID
     * Now includes contact and career information for review
     */
    private function getAlumniFromUserId($userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return null;
        }

        $alumni = Alumni::where('email', $user->email)->first();

        if ($alumni) {
            return [
                'id' => $alumni->id,
                'user_id' => $user->id,
                'name' => $alumni->first_name . ' ' . $alumni->last_name,
                'first_name' => $alumni->first_name,
                'last_name' => $alumni->last_name,
                'email' => $alumni->email,
                'profile_image' => $alumni->profile_image,
                'profile_image_url' => $alumni->profile_image_url,
                'phone' => $alumni->phone ?? $alumni->contact_number ?? null,
                'address' => $alumni->address ?? null,
                'current_company' => $alumni->current_company ?? $alumni->company ?? null,
                'job_title' => $alumni->job_title ?? $alumni->position ?? null,
                'years_experience' => $alumni->years_experience ?? $alumni->experience_years ?? null,
                'industry' => $alumni->industry ?? null,
                'previous_companies' => $alumni->previous_companies ?? null,
            ];
        }

        return null;
    }

    public function jobPostApplications($jobPostId)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $jobPost = JobPost::findOrFail($jobPostId);

        $isAdmin = $user->role === 'admin';
        $isCreator = $user->id === $jobPost->created_by_user_id;

        if (!$isAdmin && !$isCreator) {
            return response()->json(['message' => 'Only admins or post creators can view applications'], 403);
        }

        $applications = JobApplication::where('job_post_id', $jobPostId)
            ->with(['jobPost'])
            ->latest()
            ->get();

        $applicationsWithProfile = $applications->map(function ($application) {
            $applicationData = $application->toArray();

            $alumniData = $this->getAlumniFromUserId($application->alumni_id);
            if ($alumniData) {
                $applicationData['alumni'] = $alumniData;
            }

            if ($application->id_documents) {
                $applicationData['id_documents'] = json_decode($application->id_documents, true) ?? [];
            } else {
                $applicationData['id_documents'] = [];
            }

            if ($application->other_documents) {
                $applicationData['other_documents'] = json_decode($application->other_documents, true) ?? [];
            } else {
                $applicationData['other_documents'] = [];
            }

            return $applicationData;
        });

        return response()->json($applicationsWithProfile);
    }

    public function myApplications()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $applications = JobApplication::where('alumni_id', $user->id)
            ->with('jobPost.creator')
            ->latest()
            ->get();

        $applicationsWithCreatorProfile = $applications->map(function ($application) {
            $applicationData = $application->toArray();

            if ($application->jobPost && $application->jobPost->creator) {
                $creator = $application->jobPost->creator;

                if ($creator->role !== 'admin') {
                    $alumni = Alumni::where('email', $creator->email)->first();
                    if ($alumni) {
                        $applicationData['job_post']['creator']['profile_image'] = $alumni->profile_image;
                        $applicationData['job_post']['creator']['profile_image_url'] = $alumni->profile_image_url;
                        $applicationData['job_post']['creator']['phone'] = $alumni->phone ?? $alumni->contact_number ?? null;
                        $applicationData['job_post']['creator']['address'] = $alumni->address ?? null;
                        $applicationData['job_post']['creator']['current_company'] = $alumni->current_company ?? $alumni->company ?? null;
                        $applicationData['job_post']['creator']['job_title'] = $alumni->job_title ?? $alumni->position ?? null;
                        $applicationData['job_post']['creator']['years_experience'] = $alumni->years_experience ?? $alumni->experience_years ?? null;
                        $applicationData['job_post']['creator']['industry'] = $alumni->industry ?? null;
                        $applicationData['job_post']['creator']['previous_companies'] = $alumni->previous_companies ?? null;
                    }
                }
            }

            return $applicationData;
        });

        return response()->json($applicationsWithCreatorProfile);
    }

    // ============================================================
    // ============ apply() — EXTENDED for ID Verification ========
    // ============================================================
    public function apply(ApplyJobRequest $request, $jobPostId)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $jobPost = JobPost::findOrFail($jobPostId);

        if ($user->id === $jobPost->created_by_user_id) {
            return response()->json(['message' => 'You cannot apply to your own job post'], 422);
        }

        if ($jobPost->is_expired) {
            return response()->json(['message' => 'This job post has expired and is no longer accepting applications'], 422);
        }

        if ($jobPost->is_full) {
            return response()->json(['message' => 'This job post has reached its application capacity limit'], 422);
        }

        $existingApplication = JobApplication::where('job_post_id', $jobPostId)
            ->where('alumni_id', $user->id)
            ->first();

        if ($existingApplication) {
            return response()->json(['message' => 'You have already applied for this job'], 422);
        }

        // ApplyJobRequest has already validated resume/cover_letter/
        // id_documents/other_documents (mime, size, and count limits).
        $validated = $request->validated();

        // Phase 3 — orphan cleanup: if anything after these writes
        // fails, delete every file already written to the private disk
        // rather than leaving them unreferenced by any DB row.
        $writtenPaths = [];

        try {
            $resumePath = $this->storeSanitizedFile($request->file('resume'), 'resumes');
            $writtenPaths[] = $resumePath;

            $idDocumentsData = [];
            if ($request->has('id_documents')) {
                foreach ($request->id_documents as $index => $idDoc) {
                    if (isset($idDoc['file']) && isset($idDoc['type'])) {
                        $idFilePath = $this->storeSanitizedFile($idDoc['file'], 'id_documents');
                        $writtenPaths[] = $idFilePath;
                        $idDocumentsData[] = [
                            'type'      => $idDoc['type'],
                            'file_path' => $idFilePath,
                        ];
                    }
                }
            }

            $otherDocumentsData = [];
            if ($request->has('other_documents')) {
                foreach ($request->other_documents as $index => $file) {
                    if ($file) {
                        $otherFilePath = $this->storeSanitizedFile($file, 'other_documents');
                        $writtenPaths[] = $otherFilePath;
                        $otherDocumentsData[] = ['file_path' => $otherFilePath];
                    }
                }
            }

            $application = JobApplication::create([
                'job_post_id'  => $jobPostId,
                'alumni_id'    => $user->id,
                'resume_path'  => $resumePath,
                'cover_letter' => $validated['cover_letter'],
                'id_documents' => json_encode($idDocumentsData),
                'other_documents' => json_encode($otherDocumentsData),
                'status'       => 'applied',
            ]);
        } catch (\Exception $e) {
            foreach ($writtenPaths as $path) {
                Storage::disk('private')->delete($path);
            }
            throw $e;
        }

        return response()->json($application, 201);
    }

    // ============================================================
    // ============ EXISTING METHODS (UNCHANGED logic) ============
    // ============================================================

    public function show($id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $application = JobApplication::with(['jobPost'])->findOrFail($id);

        $this->authorize('view', $application);

        // Phase 5: JobApplicationResource replaces the previous manual
        // $application->toArray() + hand-built download-URL merging
        // here (same download-URL behavior, now centralized in one
        // place — see JobApplicationController::apply() for the other
        // caller). It also drops ocr_raw_text/ocr_extracted_data, which
        // toArray() was including in full: the raw OCR text dump and
        // structured PII parsed from the applicant's government ID scan
        // were leaking into this response on every view.
        $alumniData = $this->getAlumniFromUserId($application->alumni_id);
        $application->setRelation('alumni', $alumniData ? (object) $alumniData : null);

        return response()->json(
            (new \App\Http\Resources\JobApplication\JobApplicationResource($application))->resolve()
        );
    }

    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $application = JobApplication::with('jobPost.creator')->findOrFail($id);

        $this->authorize('updateStatus', $application);

        $validated = $request->validate([
            'status' => 'required|in:applied,reviewing,accepted,rejected',
            'admin_feedback' => 'nullable|string',
        ]);

        if ($validated['status'] === 'rejected') {
            $request->validate([
                'admin_feedback' => 'required|string|min:10|max:1000',
            ], [
                'admin_feedback.required' => 'Please provide feedback notes when rejecting an application.',
                'admin_feedback.min'      => 'Feedback notes must be at least 10 characters.',
            ]);
        }

        $previousStatus = $application->status;

        $application->update([
            'status'         => $validated['status'],
            'admin_feedback' => $validated['admin_feedback'] ?? null,
            'reviewed_at'    => now(),
        ]);

        if ($validated['status'] === 'accepted' && $previousStatus !== 'accepted') {
            $this->sendAcceptanceEmail($application);
        }

        if ($validated['status'] === 'rejected' && $previousStatus !== 'rejected') {
            $this->sendRejectionEmail($application, $validated['admin_feedback'], $user);
        }

        return response()->json($application);
    }

    private function sendAcceptanceEmail($application)
    {
        try {
            $alumniData = $this->getAlumniFromUserId($application->alumni_id);

            if (!$alumniData || !$alumniData['email']) {
                Log::warning('Could not send acceptance email - no alumni email found for application: ' . $application->id);
                return;
            }

            $jobPost = JobPost::with('creator')->find($application->job_post_id);

            if (!$jobPost) {
                Log::warning('Could not send acceptance email - job post not found for application: ' . $application->id);
                return;
            }

            $creatorData = null;
            if ($jobPost->creator) {
                if ($jobPost->creator->role !== 'admin') {
                    $creatorAlumni = Alumni::where('email', $jobPost->creator->email)->first();
                    if ($creatorAlumni) {
                        $creatorData = [
                            'name'  => $creatorAlumni->first_name . ' ' . $creatorAlumni->last_name,
                            'email' => $creatorAlumni->email,
                            'phone' => $creatorAlumni->phone ?? $creatorAlumni->contact_number ?? null,
                        ];
                    }
                } else {
                    $creatorData = [
                        'name'  => $jobPost->creator->name,
                        'email' => $jobPost->creator->email,
                        'phone' => null,
                    ];
                }
            }

            $emailData = [
                'applicant' => $alumniData,
                'jobPost'   => [
                    'title'       => $jobPost->title,
                    'description' => $jobPost->description,
                    'company'     => $jobPost->company,
                    'requirements'=> $jobPost->requirements,
                    'job_type'    => $jobPost->job_type,
                    'location'    => $jobPost->location,
                    'salary_min'  => $jobPost->salary_min,
                    'salary_max'  => $jobPost->salary_max,
                ],
                'creator' => $creatorData,
            ];

            Mail::to($alumniData['email'])->send(new JobApplicationAccepted($emailData));

            Log::info('Acceptance email sent successfully to: ' . $alumniData['email']);
        } catch (\Exception $e) {
            Log::error('Failed to send acceptance email: ' . $e->getMessage());
        }
    }

    private function sendRejectionEmail($application, string $feedbackNotes, $reviewer)
    {
        try {
            $alumniData = $this->getAlumniFromUserId($application->alumni_id);

            if (!$alumniData || !$alumniData['email']) {
                Log::warning('Could not send rejection email - no alumni email found for application: ' . $application->id);
                return;
            }

            $jobPost = JobPost::with('creator')->find($application->job_post_id);

            if (!$jobPost) {
                Log::warning('Could not send rejection email - job post not found for application: ' . $application->id);
                return;
            }

            $reviewerName = 'The Hiring Team';
            if ($reviewer->role === 'admin') {
                $reviewerName = trim(($reviewer->fname ?? '') . ' ' . ($reviewer->lname ?? '')) ?: ($reviewer->name ?? 'Administrator');
            } else {
                $reviewerAlumni = Alumni::where('email', $reviewer->email)->first();
                if ($reviewerAlumni) {
                    $reviewerName = $reviewerAlumni->first_name . ' ' . $reviewerAlumni->last_name;
                }
            }

            Mail::to($alumniData['email'])->send(new JobApplicationRejected($alumniData, $jobPost, $feedbackNotes, $reviewerName));

            Log::info('Rejection email sent successfully to: ' . $alumniData['email']);
        } catch (\Exception $e) {
            Log::error('Failed to send rejection email: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $application = JobApplication::with('jobPost')->findOrFail($id);

        $this->authorize('delete', $application);

        if ($application->resume_path && Storage::disk('private')->exists($application->resume_path)) {
            Storage::disk('private')->delete($application->resume_path);
        }

        if ($application->id_documents) {
            $idDocs = json_decode($application->id_documents, true) ?? [];
            foreach ($idDocs as $doc) {
                if (isset($doc['file_path']) && Storage::disk('private')->exists($doc['file_path'])) {
                    Storage::disk('private')->delete($doc['file_path']);
                }
            }
        }

        if ($application->other_documents) {
            $otherDocs = json_decode($application->other_documents, true) ?? [];
            foreach ($otherDocs as $doc) {
                if (isset($doc['file_path']) && Storage::disk('private')->exists($doc['file_path'])) {
                    Storage::disk('private')->delete($doc['file_path']);
                }
            }
        }

        $application->delete();
        return response()->json(['message' => 'Application deleted']);
    }

    /**
     * Serve a government ID image (front/back) attached to a job
     * application. This route previously had no implementing method at
     * all (the `job-applications.id-image` route pointed at a
     * non-existent controller action). Restricted to admins, the
     * applicant, and the job post creator via JobApplicationPolicy.
     *
     * NOTE: as of Phase 2, `government_id_front`/`government_id_back`
     * are read from the `private` disk. Separately (not a security
     * issue, flagged for product/engineering follow-up): nothing in this
     * controller currently *writes* to these two columns — the actual ID
     * scans captured today go through `id_documents` in apply() below.
     * This endpoint is correctly authorized and will serve a file the
     * moment those columns are populated by whatever upload flow ends up
     * using them; until then it correctly 404s.
     */
    public function downloadIdImage($id, $side)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $application = JobApplication::with('jobPost')->findOrFail($id);

        $this->authorize('viewIdImage', $application);

        $column = $side === 'front' ? 'government_id_front' : 'government_id_back';
        $path = $application->{$column};

        if (!$path || !Storage::disk('private')->exists($path)) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        return Storage::disk('private')->response($path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Authorized download for the applicant's resume. Previously the raw
     * resume_path was returned in show() and the frontend built a public
     * /storage/... URL itself; now that resumes live on the private
     * disk, that URL would 404 by design and this endpoint is the only
     * way to fetch the bytes.
     */
    public function downloadResume($id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $application = JobApplication::with('jobPost')->findOrFail($id);

        $this->authorize('view', $application);

        if (!$application->resume_path || !Storage::disk('private')->exists($application->resume_path)) {
            return response()->json(['message' => 'Resume not found'], 404);
        }

        return Storage::disk('private')->response($application->resume_path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Authorized download for one of the applicant's submitted ID or
     * "other" supporting documents. $type distinguishes which JSON array
     * to read from; $index must match an entry that actually belongs to
     * this application — this is what prevents path traversal / fetching
     * an arbitrary private-disk file via a crafted path.
     */
    public function downloadSupportingDocument($id, string $type, int $index)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (!in_array($type, ['id-documents', 'other-documents'], true)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $application = JobApplication::with('jobPost')->findOrFail($id);

        $this->authorize('view', $application);

        $column = $type === 'id-documents' ? 'id_documents' : 'other_documents';
        $docs = json_decode($application->{$column} ?? '[]', true) ?? [];

        if (!isset($docs[$index]['file_path'])) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $path = $docs[$index]['file_path'];

        if (!Storage::disk('private')->exists($path)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return Storage::disk('private')->response($path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}