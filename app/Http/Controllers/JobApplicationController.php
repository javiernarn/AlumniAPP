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


class JobApplicationController extends Controller
{
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
    public function apply(Request $request, $jobPostId)
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

        // ===== EXISTING + NEW validation rules =====
        $validated = $request->validate([
            // existing
            'resume'                 => 'required|file|mimes:pdf,doc,docx|max:5120',
            'cover_letter'           => 'required|string',
            'id_documents'           => 'required|array|min:2',
            'id_documents.*.type'    => 'required|string',
            'id_documents.*.file'    => 'required|file|mimes:jpg,jpeg,pdf|max:5120',
            'other_documents'        => 'nullable|array',
            'other_documents.*'      => 'nullable|file|mimes:jpg,jpeg,pdf,doc,docx|max:5120',

        ], [
            'id_documents.required' => 'At least 2 valid ID documents are required',
            'id_documents.min'      => 'At least 2 valid ID documents are required',
            'cover_letter.required' => 'Cover letter is required',
        ]);


        // ===== Existing file storage (UNCHANGED) =====
        $resumePath = $request->file('resume')->store('resumes', 'public');

        $idDocumentsData = [];
        if ($request->has('id_documents')) {
            foreach ($request->id_documents as $index => $idDoc) {
                if (isset($idDoc['file']) && isset($idDoc['type'])) {
                    $idFilePath = $idDoc['file']->store('id_documents', 'public');
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
                    $otherFilePath = $file->store('other_documents', 'public');
                    $otherDocumentsData[] = ['file_path' => $otherFilePath];
                }
            }
        }


        $application = JobApplication::create([
            // existing
            'job_post_id'  => $jobPostId,
            'alumni_id'    => $user->id,
            'resume_path'  => $resumePath,
            'cover_letter' => $validated['cover_letter'],
            'id_documents' => json_encode($idDocumentsData),
            'other_documents' => json_encode($otherDocumentsData),
            'status'       => 'applied',

        ]);

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

        $isAdmin = $user->role === 'admin';
        $isOwner = $application->alumni_id === $user->id;

        $isJobCreator = false;
        if ($application->jobPost) {
            $isJobCreator = $user->id === $application->jobPost->created_by_user_id;
        }

        if (!$isAdmin && !$isOwner && !$isJobCreator) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applicationData = $application->toArray();

        $alumniData = $this->getAlumniFromUserId($application->alumni_id);
        if ($alumniData) {
            $applicationData['alumni'] = $alumniData;
        }

        if ($application->id_documents) {
            $applicationData['id_documents'] = json_decode($application->id_documents, true) ?? [];
        }

        if ($application->other_documents) {
            $applicationData['other_documents'] = json_decode($application->other_documents, true) ?? [];
        }

        return response()->json($applicationData);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $application = JobApplication::with('jobPost.creator')->findOrFail($id);

        $isAdmin = $user->role === 'admin';
        $isJobCreator = false;

        if ($application->jobPost) {
            $isJobCreator = $user->id === $application->jobPost->created_by_user_id;
        }

        if (!$isAdmin && !$isJobCreator) {
            return response()->json(['message' => 'Only admins or post creators can update application status'], 403);
        }

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

        $application = JobApplication::findOrFail($id);

        $isAdmin = $user->role === 'admin';
        $isOwner = $application->alumni_id === $user->id;

        $isJobCreator = false;
        if ($application->jobPost) {
            $isJobCreator = $user->id === $application->jobPost->created_by_user_id;
        }

        if (!$isAdmin && !$isOwner && !$isJobCreator) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($application->resume_path && Storage::disk('public')->exists($application->resume_path)) {
            Storage::disk('public')->delete($application->resume_path);
        }

        if ($application->id_documents) {
            $idDocs = json_decode($application->id_documents, true) ?? [];
            foreach ($idDocs as $doc) {
                if (isset($doc['file_path']) && Storage::disk('public')->exists($doc['file_path'])) {
                    Storage::disk('public')->delete($doc['file_path']);
                }
            }
        }

        if ($application->other_documents) {
            $otherDocs = json_decode($application->other_documents, true) ?? [];
            foreach ($otherDocs as $doc) {
                if (isset($doc['file_path']) && Storage::disk('public')->exists($doc['file_path'])) {
                    Storage::disk('public')->delete($doc['file_path']);
                }
            }
        }

        $application->delete();
        return response()->json(['message' => 'Application deleted']);
    }
}