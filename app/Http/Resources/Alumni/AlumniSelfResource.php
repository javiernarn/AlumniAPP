<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase 5 — the alumnus's own view of their own record.
 *
 * Everything they entered themselves, plus their own documents/profile
 * image as authorized download URLs (never raw asset('storage/...')
 * links — see Phase 2). Deliberately excludes admin-only fields:
 * `status`, `admin_notes`, `is_messaging_restricted` — an alumnus has no
 * business reason to see their own moderation status details or
 * internal admin notes about themselves through this resource (the
 * public-facing status is surfaced separately by the frontend's own
 * application-tracking UI, not this record dump).
 */
class AlumniSelfResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'middle_name' => $this->middle_name,
            'suffix' => $this->suffix,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'birth_date' => $this->birth_date,
            'gender' => $this->gender,
            'bio' => $this->bio,
            'profile_image_url' => $this->profile_image_url,

            'course_id' => $this->course_id,
            'course' => $this->whenLoaded('course'),
            'student_id' => $this->student_id,
            'graduation_year' => $this->graduation_year,
            'enrollment_year' => $this->enrollment_year,
            'honors' => $this->honors,
            'thesis_title' => $this->thesis_title,
            'academic_achievements' => $this->academic_achievements,
            'extracurricular' => $this->extracurricular,
            'continue_education' => (bool) $this->continue_education,

            'employment_status_id' => $this->employment_status_id,
            'current_company' => $this->current_company,
            'job_title' => $this->job_title,
            'industry' => $this->industry,
            'years_experience' => $this->years_experience,
            'salary_range' => $this->salary_range,
            'work_location' => $this->work_location,
            'career_goals' => $this->career_goals,
            'previous_companies' => $this->previous_companies,

            'linkedin' => $this->linkedin,
            'github' => $this->github,
            'portfolio' => $this->portfolio,
            'twitter' => $this->twitter,

            'technical_skills' => $this->technical_skills,
            'soft_skills' => $this->soft_skills,
            'certifications' => $this->certifications,
            'languages' => $this->languages,
            'professional_interests' => $this->professional_interests,
            'hobbies' => $this->hobbies,
            'volunteer_interests' => $this->volunteer_interests,
            'willing_to_mentor' => (bool) $this->willing_to_mentor,

            'newsletter' => (bool) $this->newsletter,
            'contact_permission' => (bool) $this->contact_permission,

            'documents' => $this->document_urls,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
