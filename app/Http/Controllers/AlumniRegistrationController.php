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

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                // Personal Information
                'first_name' => 'required|string|max:255',
                'password' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'suffix' => 'nullable|string|max:10',
                'email' => 'required|email|unique:alumni,email|unique:users,email',
                'phone' => 'required|string|max:20|unique:alumni,phone',
                'address' => 'required|string',
                // 'birth_date' => 'required|date', 
                'gender' => 'required|in:male,female,other,prefer_not_to_say',
                'bio' => 'nullable|string',
                'profile_image' => 'nullable|image|max:5120', // 5MB

                // Academic Information
                // 'course' => 'required|string|max:255',
                'student_id' => 'nullable|string|max:50|unique:alumni,student_id',
                'graduation_year' => 'required|integer|min:1900|max:' . (date('Y') + 5),
                'enrollment_year' => 'nullable|integer|min:1900|max:' . date('Y'),
                'honors' => 'nullable|array',
                'thesis_title' => 'nullable|string|max:500',
                'academic_achievements' => 'nullable|string',
                'extracurricular' => 'nullable|string',
                'continue_education' => 'boolean',

                // Career Information
                // 'employment_status' => 'required|in:employed,unemployed,self-employed,freelancer,graduate_student,entrepreneur,seeking_opportunities',
                'current_company' => 'nullable|string|max:255',
                'job_title' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'years_experience' => 'nullable|integer|min:0|max:50',
                'salary_range' => 'nullable|string|max:50',
                'work_location' => 'nullable|string|max:255',
                'career_goals' => 'nullable|string',
                'previous_companies' => 'nullable|string',

                // Social Media
                'linkedin' => 'nullable|url|max:255',
                'github' => 'nullable|url|max:255',
                'portfolio' => 'nullable|url|max:255',
                'twitter' => 'nullable|url|max:255',

                // Skills
                'technical_skills' => 'nullable|array',
                'soft_skills' => 'nullable|array',
                'certifications' => 'nullable|array',
                'languages' => 'nullable|array',
                'professional_interests' => 'nullable|string',
                'hobbies' => 'nullable|string',
                'volunteer_interests' => 'nullable|array',
                'willing_to_mentor' => 'boolean',

                // Agreements
                'agreement' => 'required|accepted',
                'newsletter' => 'boolean',
                'contact_permission' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration failed. Please check the errors below.',
                    'errors' => $validator->errors(),
                    'field_errors' => $validator->errors()->all(),
                    'specific_errors' => $validator->errors()->toArray()
                ], 422);
            }

            // Process and format the birth_date after successful validation
            $validated = $validator->validated();

            // Normalize name fields to uppercase before they get stored,
            // so "Jessa Mae" becomes "JESSA MAE" consistently in the DB.
            $validated = $this->uppercaseNameFields($validated);

            $birth_date = date('Y-m-d', strtotime($request->birth_date));

            // Generate application ID
            $applicationId = 'APP-' . date('Ymd') . '-' . Str::random(6);

            // Handle profile image upload
            $profileImagePath = null;
            if ($request->hasFile('profile_image')) {
                $profileImagePath = $request->file('profile_image')->store('alumni/profile-images', 'public');
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

            $plainPassword = $validated['password'];
            
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
                'temp_password' => $plainPassword,

                // Academic Information
                'course_id' => $request->course_id,
                'student_id' => $validated['student_id'] ?? null,
                'graduation_year' => $validated['graduation_year'],
                'enrollment_year' => $validated['enrollment_year'] ?? null,
                'honors' => $validated['honors'] ?? null,
                'thesis_title' => $validated['thesis_title'] ?? null,
                'academic_achievements' => $validated['academic_achievements'] ?? null,
                'extracurricular' => $validated['extracurricular'] ?? null,
                'continue_education' => $validated['continue_education'] ?? false,

                // Career Information
                'employment_status_id' => $request->employment_status_id,
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

            // Handle document uploads
            if ($request->has('documents')) {
                foreach ($request->documents as $document) {
                    if (isset($document['file'])) {
                        $filePath = $document['file']->store('alumni/documents', 'public');

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
                'data' => $alumni->load('documents')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // Clean up uploaded files if any
            if (isset($profileImagePath)) {
                Storage::disk('public')->delete($profileImagePath);
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

    public function show($id)
    {
        $alumni = Alumni::with('documents')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $alumni
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

       public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $alumni = Alumni::findOrFail($id);

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

            $validated = $request->validate([
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => [
                    'sometimes',
                    'email',
                    function ($attribute, $value, $fail) use ($alumni) {
                        if ($value) {
                            $existsInAlumni = \App\Models\Alumni::where('email', $value)
                                ->where('id', '!=', $alumni->id)
                                ->exists();

                            $existsInUsers = \App\Models\User::where('email', $value)
                                ->where('id', '!=', $alumni->user_id)
                                ->exists();

                            if ($existsInAlumni || $existsInUsers) {
                                $fail('This email is already in use.');
                            }
                        }
                    },
                ],
                'phone' => [
                    'sometimes',
                    'string',
                    'max:20',
                    function ($attribute, $value, $fail) use ($alumni) {
                        if ($value) {
                            $existsInAlumni = \App\Models\Alumni::where('phone', $value)
                                ->where('id', '!=', $alumni->id)
                                ->exists();

                            if ($existsInAlumni) {
                                $fail('This phone number is already in use.');
                            }
                        }
                    },
                ],
                'address' => 'nullable|string|max:255',
                'current_company' => 'nullable|string|max:255',
                'job_title' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'years_experience' => 'nullable|integer|min:0|max:50',
                'salary_range' => 'nullable|string|max:100',
                'work_location' => 'nullable|string|max:255',
                'previous_companies' => 'nullable|string',
                'profile_image' => 'sometimes|image|max:5120',
            ]);

            // Normalize name fields to uppercase before they get stored.
            $validated = $this->uppercaseNameFields($validated);

            // Handle profile image update
            if ($request->hasFile('profile_image')) {
                if ($alumni->profile_image) {
                    Storage::disk('public')->delete($alumni->profile_image);
                }

                $profileImagePath = $request->file('profile_image')->store('alumni/profile-images', 'public');
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
            // (keep your existing catch blocks below unchanged)
            DB::rollBack();
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
            'data' => $alumni
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
                'password' => $alumni->temp_password ?? null, // Include stored temp password
                'admin_notes' => $alumni->admin_notes ?? null, // NEW: include admin notes in email
            ];

            Mail::to($alumni->email)->send(new AlumniAccountApproved($alumniData));
            Log::info('Alumni account approval email sent to: ' . $alumni->email);

            if ($alumni->temp_password) {
                $alumni->update(['temp_password' => null]);
            }
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
            'data' => $alumni
        ]);
    }

    public function index(Request $request)
    {
        $query = Alumni::with(['documents', 'employmentStatus']);

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

        // Get all results WITHOUT toArray() to preserve accessors
        $alumni = $query->latest()->get();

        return response()->json($alumni);
    }


public function updateProfileImage(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors()
                ], 422);
            }

            $alumni = Alumni::findOrFail($id);

            // Delete old profile image if exists
            if ($alumni->profile_image && Storage::disk('public')->exists($alumni->profile_image)) {
                Storage::disk('public')->delete($alumni->profile_image);
            }

            // Upload new image
            $file = $request->file('profile_image');
            $filename = time() . '_profile_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('alumni/profile-images', $filename, 'public');

            // Update alumni record
            $alumni->profile_image = $path;
            $alumni->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile image updated successfully',
                'profileImage' => url('storage/' . $path)
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

    public function uploadDocument(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
                'document_type' => 'required|string|in:student_id,alumni_id,government_id,diploma,transcript'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors()
                ], 422);
            }

            $alumni = Alumni::findOrFail($id);
            $documentType = $request->document_type;

            // Check if document of this type already exists
            $existingDocument = AlumniDocument::where('alumni_id', $id)
                ->where('document_type', $documentType)
                ->first();

            // Delete old file if exists
            if ($existingDocument && $existingDocument->file_path) {
                Storage::disk('public')->delete($existingDocument->file_path);
            }

            // Upload new file
            $file = $request->file('file');
            $filename = time() . '_' . $documentType . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('alumni/documents', $filename, 'public');

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
                    'file_url' => url('storage/' . $path),
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

            if ($alumni->profile_image && Storage::disk('public')->exists($alumni->profile_image)) {
                Storage::disk('public')->delete($alumni->profile_image);
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

            if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
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
                return [
                    'id' => $alumnus->id,
                    'is_online' => $alumnus->is_online,
                    'last_active' => $alumnus->last_active,
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