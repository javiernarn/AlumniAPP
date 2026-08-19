<?php

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Phase 3 — validation for the public, unauthenticated alumni
 * self-registration endpoint (POST /api/alumni/register).
 *
 * Being unauthenticated makes this the single most exposed write path in
 * the application — anyone on the internet can call it. Every field it
 * accepts is validated here, including two that were previously read
 * straight off the request with no validation at all (course_id,
 * employment_status_id) and file uploads that previously allowed SVG.
 */
class StoreAlumniRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public endpoint by design
    }

    public function rules(): array
    {
        return [
            // Personal Information
            'first_name' => 'required|string|max:255',
            'password' => 'required|string|min:8|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:10',
            'email' => 'required|email|max:255|unique:alumni,email|unique:users,email',
            'phone' => 'required|string|max:20|unique:alumni,phone',
            'address' => 'required|string|max:1000',
            'gender' => 'required|in:male,female,other,prefer_not_to_say',
            'bio' => 'nullable|string|max:5000',
            // Phase 3: was 'nullable|image|max:5120' — Laravel's `image`
            // rule alone permits svg/bmp/gif. Restricted to a raster
            // whitelist that excludes SVG entirely (stored-XSS risk) and
            // bmp/gif (no legitimate use here).
            'profile_image' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',

            // Academic Information
            // Phase 3: previously read via $request->course_id /
            // $request->employment_status_id with zero validation of any
            // kind — an unauthenticated caller could send any value at
            // all straight into these foreign keys.
            'course_id' => 'nullable|integer|exists:courses,id',
            'employment_status_id' => 'nullable|integer|exists:employment_statuses,id',
            'student_id' => 'nullable|string|max:50|unique:alumni,student_id',
            'graduation_year' => 'required|integer|min:1900|max:' . (date('Y') + 5),
            'enrollment_year' => 'nullable|integer|min:1900|max:' . date('Y'),
            'honors' => 'nullable|array|max:20',
            'honors.*' => 'string|max:255',
            'thesis_title' => 'nullable|string|max:500',
            'academic_achievements' => 'nullable|string|max:5000',
            'extracurricular' => 'nullable|string|max:5000',
            'continue_education' => 'boolean',

            // Career Information
            'current_company' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'years_experience' => 'nullable|integer|min:0|max:50',
            'salary_range' => 'nullable|string|max:50',
            'work_location' => 'nullable|string|max:255',
            'career_goals' => 'nullable|string|max:5000',
            'previous_companies' => 'nullable|string|max:5000',

            // Social Media
            'linkedin' => 'nullable|url|max:255',
            'github' => 'nullable|url|max:255',
            'portfolio' => 'nullable|url|max:255',
            'twitter' => 'nullable|url|max:255',

            // Skills
            'technical_skills' => 'nullable|array|max:50',
            'technical_skills.*' => 'string|max:255',
            'soft_skills' => 'nullable|array|max:50',
            'soft_skills.*' => 'string|max:255',
            'certifications' => 'nullable|array|max:50',
            'certifications.*' => 'string|max:255',
            'languages' => 'nullable|array|max:20',
            'languages.*' => 'string|max:255',
            'professional_interests' => 'nullable|string|max:5000',
            'hobbies' => 'nullable|string|max:5000',
            'volunteer_interests' => 'nullable|array|max:50',
            'volunteer_interests.*' => 'string|max:255',
            'willing_to_mentor' => 'boolean',

            // Agreements
            'agreement' => 'required|accepted',
            'newsletter' => 'boolean',
            'contact_permission' => 'boolean',

            // Phase 3: documents uploaded during registration previously
            // had NO validation at all — any file type/size, and
            // document_type wasn't checked against the enum the
            // alumni_documents table actually expects.
            'documents' => 'nullable|array|max:10',
            'documents.*.type' => 'required_with:documents|string|in:student_id,alumni_id,government_id,diploma,transcript',
            'documents.*.file' => 'required_with:documents|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'documents.*.file.mimes' => 'Each document must be a JPG, PNG, or PDF file.',
            'profile_image.mimes' => 'Profile image must be a JPG, PNG, or WebP file.',
        ];
    }
}
