<?php

namespace App\Http\Controllers;

use App\Models\Alumni;
use App\Models\AlumniDocument;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Mail\AlumniRegistrationConfirmation;
use App\Http\Requests\Alumni\StoreAlumniRequest;
use App\Http\Requests\Alumni\UpdateAlumniRequest;
use App\Http\Requests\Alumni\UploadAlumniDocumentRequest;
use App\Http\Requests\Alumni\UpdateProfileImageRequest;
use App\Support\ImageSanitizer;
use App\Support\UploadedFileNamer;
use App\Mail\AlumniAccountApproved;

class AlumniRegistrationController extends Controller
{

    /**
     * Normalize name fields to uppercase before persisting, per request:
     * names should be stored as ALL CAPS in the database regardless of
     * how the alumni typed them in the form.
     *
     * Uses mb_strtoupper (not strtoupper) so accented characters like
     * ñ, é, etc. are uppercased correctly instead of getting mangled.
     */
    private function uppercaseNameFields(array $data, array $fields = ['first_name', 'last_name', 'middle_name', 'suffix'])
    {
        foreach ($fields as $field) {
            if (!empty($data[$field]) && is_string($data[$field])) {
                $data[$field] = mb_strtoupper(trim($data[$field]), 'UTF-8');
            }
        }

        return $data;
    }

    public function store(StoreAlumniRequest $request)
    {
        DB::beginTransaction();

        // Phase 3 — orphan cleanup: track every file this request writes
        // to the private disk so we can delete them if anything after
        // the write fails and we roll back the transaction. Previously
        // a DB failure after a successful store() call left orphaned
        // files on disk forever with no DB row pointing at them.
        $writtenPaths = [];

        try {
            // Form Request (StoreAlumniRequest) has already validated
            // and authorized this request, including course_id /
            // employment_status_id foreign keys and the documents array
            // — none of that was previously checked at all.
            $validated = $request->validated();

            // Normalize name fields to uppercase before they get stored,
            // so "Jessa Mae" becomes "JESSA MAE" consistently in the DB.
            $validated = $this->uppercaseNameFields($validated);

            $birth_date = date('Y-m-d', strtotime($request->birth_date));

            // Generate application ID
            $applicationId = 'APP-' . date('Ymd') . '-' . Str::random(6);

            // Handle profile image upload
            $profileImagePath = null;
            if ($request->hasFile('profile_image')) {
                $profileImagePath = $this->storeSanitizedImage(
                    $request->file('profile_image'),
                    'alumni/profile-images'
                );
                $writtenPaths[] = $profileImagePath;
            }

            // Handle array fields - convert to JSON if they are arrays
            $arrayFields = [
                'honors',
                'technical_skills',
                'soft_skills',
                'certifications',
                'languages',
                'volunteer_interests'
            ];

            foreach ($arrayFields as $field) {
                if (isset($validated[$field]) && is_array($validated[$field])) {
                    $validated[$field] = json_encode($validated[$field]);
                }
            }

            $user = User::create([
                'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(), 
            ]);

            
            // Create alumni record
            $alumni = Alumni::create([
                'user_id' => $user->id,
                'application_id' => $applicationId,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'suffix' => $validated['suffix'] ?? null,
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'birth_date' => $birth_date,
                'gender' => $validated['gender'],
                'bio' => $validated['bio'] ?? null,
                'profile_image' => $profileImagePath,
                // Phase 5: previously stored the plaintext password here
                // ('temp_password' => $plainPassword) so it could be
                // included in the account-approval email as a
                // convenience reminder. That created a plaintext
                // credential at rest for however long the account sat
                // pending approval. Deleted — see
                // resources/views/emails/alumni-account-approved.blade.php
                // for the replacement wording, which just asks the
                // alumnus to use the password they already chose.

                // Academic Information
                // The legacy `course` string column is NOT NULL with no
                // default. Nothing has populated it since the app
                // migrated to the course_id foreign key — in production
                // this was silently masked by MySQL's non-strict mode
                // (config/database.php 'strict' => false), which just
                // inserts an empty string, but it's a real data-integrity
                // gap (every alumni row's `course` ends up ''). Populate
                // it from the related course when we have one, exactly
                // as the pre-existing $query->where('course', ...)
                // search filter elsewhere in this controller expects.
                'course' => optional(\App\Models\Course::find($validated['course_id'] ?? null))->course_code ?? '',
                'course_id' => $validated['course_id'] ?? null,
                'student_id' => $validated['student_id'] ?? null,
                'graduation_year' => $validated['graduation_year'],
                'enrollment_year' => $validated['enrollment_year'] ?? null,
                'honors' => $validated['honors'] ?? null,
                'thesis_title' => $validated['thesis_title'] ?? null,
                'academic_achievements' => $validated['academic_achievements'] ?? null,
                'extracurricular' => $validated['extracurricular'] ?? null,
                'continue_education' => $validated['continue_education'] ?? false,

                // Career Information
                'employment_status_id' => $validated['employment_status_id'] ?? null,
                'current_company' => $validated['current_company'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'industry' => $validated['industry'] ?? null,
                'years_experience' => $validated['years_experience'] ?? null,
                'salary_range' => $validated['salary_range'] ?? null,
                'work_location' => $validated['work_location'] ?? null,
                'career_goals' => $validated['career_goals'] ?? null,
                'previous_companies' => $validated['previous_companies'] ?? null,

                // Social Media
                'linkedin' => $validated['linkedin'] ?? null,
                'github' => $validated['github'] ?? null,
                'portfolio' => $validated['portfolio'] ?? null,
                'twitter' => $validated['twitter'] ?? null,

                // Skills
                'technical_skills' => $validated['technical_skills'] ?? null,
                'soft_skills' => $validated['soft_skills'] ?? null,
                'certifications' => $validated['certifications'] ?? null,
                'languages' => $validated['languages'] ?? null,
                'professional_interests' => $validated['professional_interests'] ?? null,
                'hobbies' => $validated['hobbies'] ?? null,
                'volunteer_interests' => $validated['volunteer_interests'] ?? null,
                'willing_to_mentor' => $validated['willing_to_mentor'] ?? false,

                // Agreements
                'agreement' => $validated['agreement'],
                'newsletter' => $validated['newsletter'] ?? false,
                'contact_permission' => $validated['contact_permission'] ?? false,
            ]);

            // Handle document uploads. Form Request validation already
            // enforced document_type against the enum and file
            // type/size, so both are now trustworthy here.
            if ($request->has('documents')) {
                foreach ($request->documents as $document) {
                    if (isset($document['file'])) {
                        $filePath = $this->storeSanitizedImage(
                            $document['file'],
                            'alumni/documents',
                            allowNonImagePassthrough: true // PDFs pass through unsanitized; images are re-encoded
                        );
                        $writtenPaths[] = $filePath;

                        AlumniDocument::create([
                            'alumni_id' => $alumni->id,
                            'document_type' => $document['type'],
                            'file_path' => $filePath,
                            'file_name' => $document['file']->getClientOriginalName(),
                        ]);
                    }
                }
            }

            DB::commit();

                // Send confirmation email after successful registration
            try {
                $alumniData = [
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'middle_name' => $validated['middle_name'] ?? '',
                    'suffix' => $validated['suffix'] ?? '',
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'student_id' => $validated['student_id'] ?? null,
                    'graduation_year' => $validated['graduation_year'] ?? null,
                    'current_company' => $validated['current_company'] ?? null,
                    'job_title' => $validated['job_title'] ?? null,
                ];

                Mail::to($validated['email'])->send(new AlumniRegistrationConfirmation($alumniData, $applicationId));
                Log::info('Alumni registration confirmation email sent to: ' . $validated['email']);
            } catch (\Exception $emailException) {
                // Log the email error but don't fail the registration
                Log::error('Failed to send alumni registration confirmation email: ' . $emailException->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Alumni registration submitted successfully!',
                'application_id' => $applicationId,
                'data' => new \App\Http\Resources\Alumni\AlumniSelfResource($alumni->load('documents'))
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // Phase 3 — orphan cleanup: delete every file this request
            // wrote to disk, not just the profile image (the document
            // loop above previously left orphaned files behind on any
            // failure after it ran).
            foreach ($writtenPaths as $path) {
                if ($path) {
                    Storage::disk('private')->delete($path);
                }
            }

            // Log the error for debugging
            Log::error('Alumni registration error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Phase 3 — store an uploaded file on the private disk, re-encoding
     * it first if it's a raster image (jpg/png/webp/gif). PDFs (used for
     * some alumni documents) pass through unchanged when
     * $allowNonImagePassthrough is true, since GD can't re-encode them;
     * they're still protected by the mimes/extension whitelist and the
     * server-generated random filename.
     *
     * Returns the stored path, or throws if an "image" mime claimed by
     * the upload can't actually be decoded by GD — a strong signal the
     * file's real content doesn't match what it claims to be.
     */
    private function storeSanitizedImage($file, string $directory, bool $allowNonImagePassthrough = false): string
    {
        $mime = $file->getMimeType();
        $imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (in_array($mime, $imageMimes, true)) {
            $reencoded = ImageSanitizer::reencode(file_get_contents($file->getRealPath()), $mime);

            if ($reencoded === null) {
                throw ValidationException::withMessages([
                    'file' => ['The uploaded file is not a valid image.'],
                ]);
            }

            $filename = \Illuminate\Support\Str::random(40) . '.jpg';
            Storage::disk('private')->put($directory . '/' . $filename, $reencoded);
            return $directory . '/' . $filename;
        }

        if ($allowNonImagePassthrough) {
            return $file->storeAs($directory, UploadedFileNamer::randomName($file), 'private');
        }

        throw ValidationException::withMessages([
            'file' => ['Unsupported file type.'],
        ]);
    }

    public function show($id)
    {
        $alumni = Alumni::with('documents')->findOrFail($id);

        // Previously unguarded: any authenticated user (including any
        // other alumnus) could fetch any alumni's full record, including
        // government-document metadata via the document_urls accessor.
        // Now: admin, the record owner, or a department head scoped to
        // the same course.
        $this->authorize('view', $alumni);

        // Phase 5 — audience-specific serialization instead of dumping
        // the raw Eloquent model. A department head only ever gets the
        // course-scoped, contact-info-free view even though the policy
        // above already limited *which* records they can reach; an
        // admin or the record's own owner gets the full picture.
        $user = auth()->user();
        $resource = $user->role === 'admin'
            ? new \App\Http\Resources\Alumni\AlumniAdminResource($alumni)
            : ($user->role === 'department_head'
                ? new \App\Http\Resources\Alumni\AlumniDepartmentHeadResource($alumni)
                : new \App\Http\Resources\Alumni\AlumniSelfResource($alumni));

        return response()->json([
            'success' => true,
            'data' => $resource
        ]);
    }

    /**
     * Phase 2 — authorized download for an alumnus's profile image.
     * Replaces the raw public asset('storage/...') URL previously
     * returned by Alumni::getProfileImageUrlAttribute; the file now
     * lives on the private disk.
     */
    public function downloadProfileImage($id)
    {
        $alumni = Alumni::findOrFail($id);

        $this->authorize('view', $alumni);

        if (!$alumni->profile_image || !Storage::disk('private')->exists($alumni->profile_image)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Unlike the confidential documents below, this is a public-facing
        // profile photo rendered in bulk everywhere (alumni lists,
        // conversation lists, notification bell — see the 'profile-image'
        // rate limiter comment in RouteServiceProvider). 'no-store' forced
        // the browser to re-fetch every avatar on every re-render/poll,
        // which was a major contributor to the app's 429 rate-limit
        // storms. Cache it privately in the browser instead; still
        // authorized per-request, just not re-downloaded needlessly.
        return Storage::disk('private')->response($alumni->profile_image, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    /**
     * Phase 2 — authorized download for a single alumni document (ID
     * card, diploma, transcript, etc.). Replaces the raw public
     * asset('storage/...') URL previously returned by
     * AlumniDocument::fileUrl; department heads are intentionally
     * excluded here even though they can view the alumni record itself
     * (AlumniDocumentPolicy — course scope does not imply a right to see
     * someone's ID documents).
     */
    public function downloadDocument($documentId)
    {
        $document = AlumniDocument::with('alumni')->findOrFail($documentId);

        $this->authorize('view', $document);

        if (!$document->file_path || !Storage::disk('private')->exists($document->file_path)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return Storage::disk('private')->response($document->file_path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $existsInAlumni = Alumni::where('email', $request->email)->exists();
        $existsInUsers = User::where('email', $request->email)->exists();

        return response()->json([
            'exists' => $existsInAlumni || $existsInUsers
        ]);
    }

    public function checkPhone(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        // Check only in alumni table
        $existsInAlumni = Alumni::where('phone', $request->phone)->exists();

        return response()->json([
            'exists' => $existsInAlumni
        ]);
    }

    public function checkStudentId(Request $request)
    {
        $request->validate([
            'studentId' => 'required|string',
        ]);

        $exists = Alumni::where('student_id', $request->studentId)->exists();

        return response()->json([
            'exists' => $exists
        ]);
    }

    public function updateStatus22(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:active,inactive,pending' // adjust allowed values
        ]);

        try {
            $alumni = Alumni::findOrFail($id);

            $alumni->update([
                'status' => $request->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status updated successfully!',
                'status'  => $alumni->status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

       public function update(UpdateAlumniRequest $request, $id)
    {
        $alumni = Alumni::findOrFail($id);

        // Previously unguarded: any authenticated user could edit any
        // alumni's record (horizontal privilege escalation). Now: admin
        // or the record's own owner only. Checked before opening the DB
        // transaction below so a rejected request never leaves a
        // transaction open (the existing catch block only handles
        // ValidationException, not AuthorizationException).
        $this->authorize('update', $alumni);

        DB::beginTransaction();

        try {
            // ============ CAREER INFO EDIT LOCK (60-day server-side) ============
            $careerFields = [
                'current_company',
                'job_title',
                'industry',
                'years_experience',
                'salary_range',
                'work_location',
                'previous_companies',
            ];

            $isEditingCareer = collect($careerFields)->contains(function ($field) use ($request, $alumni) {
                if (!$request->has($field)) return false;
                return (string) $request->input($field) !== (string) $alumni->{$field};
            });

            if ($isEditingCareer && $alumni->career_last_edited_at) {
                $unlockDate = $alumni->career_last_edited_at->copy()->addDays(60);
                if (now()->lt($unlockDate)) {
                    return response()->json([
                        'success'                => false,
                        'message'                => 'Career information is locked until ' . $unlockDate->format('F d, Y'),
                        'career_last_edited_at'  => $alumni->career_last_edited_at->toIso8601String(),
                        'career_unlock_at'       => $unlockDate->toIso8601String(),
                    ], 403);
                }
            }
            // ============ END CAREER LOCK CHECK ============

            $validated = $request->validated();

            // Normalize name fields to uppercase before they get stored.
            $validated = $this->uppercaseNameFields($validated);

            // Handle profile image update
            if ($request->hasFile('profile_image')) {
                if ($alumni->profile_image) {
                    Storage::disk('private')->delete($alumni->profile_image);
                }

                $profileImagePath = $this->storeSanitizedImage(
                    $request->file('profile_image'),
                    'alumni/profile-images'
                );
                $validated['profile_image'] = $profileImagePath;
            }

            $oldValues = $alumni->only(array_keys($validated));

            // Update Alumni
            $alumni->update($validated);

            // ============ STAMP CAREER LAST-EDITED TIMESTAMP ============
            if ($isEditingCareer) {
                $alumni->career_last_edited_at = now();
                $alumni->save();
            }
            // ============ END STAMP ============

            // Update associated User email if it exists
            if (isset($validated['email']) && $alumni->user_id) {
                $user = \App\Models\User::find($alumni->user_id);
                if ($user) {
                    $user->email = $validated['email'];
                    $user->save();
                }
            }

            $this->notifyAdminsAboutProfileUpdate($alumni, $validated, $oldValues);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Alumni information updated successfully!',
                'data'    => $alumni->fresh()->load('documents'),
                'career_last_edited_at' => optional($alumni->career_last_edited_at)->toIso8601String(),
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();

            // Phase 3 — orphan cleanup: if a new profile image was
            // already written to the private disk before the failure,
            // remove it rather than leaving an unreferenced file behind.
            if (isset($profileImagePath)) {
                Storage::disk('private')->delete($profileImagePath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    private function notifyAdminsAboutProfileUpdate($alumni, $newValues, $oldValues)
    {
        try {
            // Get all admin users
            $admins = User::where('role', 'admin')->get();

            if ($admins->isEmpty()) {
                Log::info('No admin users found to notify about profile update');
                return;
            }

            // Build list of changed fields
            $changedFields = [];
            foreach ($newValues as $field => $newValue) {
                if ($field === 'profile_image') continue; // Skip profile image in comparison
                
                $oldValue = $oldValues[$field] ?? null;
                if ($oldValue !== $newValue) {
                    $changedFields[] = ucwords(str_replace('_', ' ', $field));
                }
            }

            // If profile image was updated, add it to changed fields
            if (isset($newValues['profile_image'])) {
                $changedFields[] = 'Profile Image';
            }

            if (empty($changedFields)) {
                return; // No actual changes made
            }

            $alumniName = $alumni->first_name . ' ' . $alumni->last_name;
            $changedFieldsStr = implode(', ', $changedFields);

            $profileImageUrl = $alumni->profile_image_url;

            // Create notification for each admin
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'notifiable_type' => 'App\Models\Alumni',
                    'title' => 'Alumni Profile Updated',
                    'message' => "{$alumniName} has updated their profile information: {$changedFieldsStr}",
                    'data' => [
                        'alumni_id' => $alumni->id,
                        'alumni_name' => $alumniName,
                        'alumni_email' => $alumni->email,
                        'alumni_profile_image' => $profileImageUrl,
                        'changed_fields' => $changedFields,
                        'type' => 'profile_update'
                    ],
                    'read' => false,
                    'read_at' => null,
                ]);
            }

            Log::info("Profile update notifications sent to " . $admins->count() . " admins for alumni: {$alumniName}");

        } catch (\Exception $e) {
            Log::error('Failed to create admin notifications: ' . $e->getMessage());
            // Don't throw - we don't want notification failure to break the update
        }
    }

    public function updateStatus(Request $request)
    {
        $alumni = Alumni::findOrFail($request->id);
        
        $oldStatus = $alumni->status;

        $alumni->update([
            'status' => $request->status,
            'employment_status_id' => $request->employment_status_id,
            'admin_notes' => $request->admin_notes
        ]);

        if ($request->status === 'approved' && $oldStatus !== 'approved') {
            $this->notifyAlumniAboutApproval($alumni);
        }

        return response()->json([
            'success' => true,
            'message' => 'Alumni status updated successfully!',
            'data' => new \App\Http\Resources\Alumni\AlumniAdminResource($alumni)
        ]);
    }

   private function notifyAlumniAboutApproval($alumni)
{
    try {
        if (!$alumni->user_id) {
            Log::info('Alumni does not have an associated user account');
            return;
        }

        $alumniName = $alumni->first_name . ' ' . $alumni->last_name;

        Notification::create([
            'user_id' => $alumni->user_id,
            'notifiable_type' => 'account_approved',
            'title' => 'Account Approved',
            'message' => "Congratulations {$alumniName}! Your alumni account has been approved by the administrator. You can now login and access all alumni features.",
            'data' => [
                'alumni_id' => $alumni->id,
                'alumni_name' => $alumniName,
                'type' => 'account_approved'
            ],
            'read' => false,
            'read_at' => null,
        ]);

        Log::info("Account approval notification sent to alumni: {$alumniName}");

         try {
            $alumniData = [
                'first_name' => $alumni->first_name,
                'last_name' => $alumni->last_name,
                'middle_name' => $alumni->middle_name ?? '',
                'suffix' => $alumni->suffix ?? '',
                'email' => $alumni->email,
                'application_id' => $alumni->application_id ?? null,
                // Phase 5: no longer includes the plaintext password —
                // see the temp_password removal above.
                'admin_notes' => $alumni->admin_notes ?? null,
            ];

            Mail::to($alumni->email)->send(new AlumniAccountApproved($alumniData));
            Log::info('Alumni account approval email sent to: ' . $alumni->email);

        } catch (\Exception $emailException) {
            Log::error('Failed to send alumni account approval email: ' . $emailException->getMessage());
        }

    } catch (\Exception $e) {
        Log::error('Failed to create alumni approval notification: ' . $e->getMessage());
    }
}


    public function indexPagination(Request $request)
    {
        $query = Alumni::with('documents');

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by course
        if ($request->has('course')) {
            $query->where('course', $request->course);
        }

        // Pagination
        $alumni = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            // Phase 5: not just $alumni — this endpoint is unrouted
            // (dead code) as of this audit, but kept correct/consistent
            // with the rest of the controller rather than left as a raw
            // model dump in case it's wired up later.
            'data' => \App\Http\Resources\Alumni\AlumniAdminResource::collection($alumni)
        ]);
    }

    public function index(Request $request)
    {
        // Eager-load the linked user's presence columns so
        // AlumniAdminResource can expose real is_online/last_active_at
        // values instead of silently falling back to the alumni row's
        // own updated_at (registration/edit time, unrelated to login
        // activity) on the frontend.
        $query = Alumni::with(['documents', 'employmentStatus', 'user:id,last_active_at,is_online']);

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by course
        if ($request->has('course')) {
            $query->where('course', $request->course);
        }

        // Phase 5: previously ->get() (unbounded — every alumni row,
        // every time, no page limit) serialized via a bare
        // response()->json($alumni) (every raw Eloquent attribute,
        // including admin_notes/is_messaging_restricted). Paginated with
        // a capped page size and wrapped in AlumniAdminResource — this
        // route is already role:admin-gated (Phase 1), but "same data
        // for every admin, minimized and paginated" is still the right
        // default rather than a full unbounded dump.
        $perPage = min((int) $request->get('per_page', 25), 100);
        $alumni = $query->latest()->paginate($perPage);

        return \App\Http\Resources\Alumni\AlumniAdminResource::collection($alumni)->response();
    }

    /**
     * Alumni-facing "browse the directory" endpoint (GET /alumni/directory).
     *
     * GET /alumni (index() above) stays admin-only — regular alumni have
     * no business reason to enumerate every other alumni's full record
     * (email, phone, admin notes, documents, etc). But the app's own UI
     * (AlumniList.js's non-admin copy: "Browse the OCC Alumni Directory,
     * connect with fellow graduates...") is meant to let any
     * authenticated alumni browse a minimized, public-safe subset of
     * *approved* alumni — see AlumniDirectoryResource for exactly which
     * fields that includes.
     */
    public function directory(Request $request)
    {
        // Same reasoning as index() above — the alumni-facing card in
        // AlumniList.js renders a LastActiveIndicator too, so this needs
        // the same user:id,last_active_at,is_online eager load or every
        // card here falls back to "Never active" regardless of real status.
        $query = Alumni::approved()->with(['course', 'user:id,last_active_at,is_online']);

        if ($request->has('search')) {
            $query->search($request->search);
        }

        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        $perPage = min((int) $request->get('per_page', 25), 100);
        $alumni = $query->latest()->paginate($perPage);

        return \App\Http\Resources\Alumni\AlumniDirectoryResource::collection($alumni)->response();
    }


public function updateProfileImage(UpdateProfileImageRequest $request, $id)
    {
        try {
            $alumni = Alumni::findOrFail($id);

            // Delete old profile image if exists
            if ($alumni->profile_image && Storage::disk('private')->exists($alumni->profile_image)) {
                Storage::disk('private')->delete($alumni->profile_image);
            }

            // Upload new image (re-encoded + server-generated filename)
            $path = $this->storeSanitizedImage($request->file('profile_image'), 'alumni/profile-images');

            // Update alumni record
            $alumni->profile_image = $path;
            $alumni->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile image updated successfully',
                'profileImage' => route('alumni.profile-image', $alumni->id)
            ]);

        } catch (\Exception $e) {
            Log::error('Profile image upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile image',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function uploadDocument(UploadAlumniDocumentRequest $request, $id)
    {
        try {
            $alumni = Alumni::findOrFail($id);
            $documentType = $request->document_type;

            // Check if document of this type already exists
            $existingDocument = AlumniDocument::where('alumni_id', $id)
                ->where('document_type', $documentType)
                ->first();

            // Delete old file if exists
            if ($existingDocument && $existingDocument->file_path) {
                Storage::disk('private')->delete($existingDocument->file_path);
            }

            // Upload new file (re-encoded if it's an image, PDF passes
            // through unchanged; server-generated filename either way)
            $file = $request->file('file');
            $path = $this->storeSanitizedImage($file, 'alumni/documents', allowNonImagePassthrough: true);

            if ($existingDocument) {
                // Update existing record
                $existingDocument->update([
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'updated_at' => now()
                ]);
                $document = $existingDocument;
            } else {
                // Create new record
                $document = AlumniDocument::create([
                    'alumni_id' => $id,
                    'document_type' => $documentType,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'document' => [
                    'id' => $document->id,
                    'type' => $document->document_type,
                    'file_url' => route('alumni-documents.download', $document->id),
                    'file_name' => $document->file_name
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Document upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function deleteProfileImage($id)
    {
        try {
            $alumni = Alumni::findOrFail($id);

            if ($alumni->profile_image && Storage::disk('private')->exists($alumni->profile_image)) {
                Storage::disk('private')->delete($alumni->profile_image);
            }

            $alumni->profile_image = null;
            $alumni->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile image deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Profile image delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete profile image',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function deleteDocument($id, $documentId)
    {
        try {
            $document = AlumniDocument::where('id', $documentId)
                ->where('alumni_id', $id)
                ->firstOrFail();

            if ($document->file_path && Storage::disk('private')->exists($document->file_path)) {
                Storage::disk('private')->delete($document->file_path);
            }

            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Document delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }


    /**
 * Get online statuses for all alumni
 */
public function getOnlineStatuses()
{
    try {
        $alumni = Alumni::with('user:id,last_active_at,is_online')
            ->select('id', 'user_id')
            ->get()
            ->map(function ($alumnus) {
                // is_online / last_active_at live on the related `users`
                // row, not on Alumni itself — reading $alumnus->is_online
                // directly (as this used to) always resolved to null/false
                // regardless of the alumnus's real status.
                return [
                    'id' => $alumnus->id,
                    'is_online' => (bool) ($alumnus->user->is_online ?? false),
                    'last_active' => $alumnus->user->last_active_at ?? null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $alumni
        ], 200);
    } catch (\Exception $e) {
        Log::error('Error fetching online statuses: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Error fetching online statuses'
        ], 500);
    }
}


}