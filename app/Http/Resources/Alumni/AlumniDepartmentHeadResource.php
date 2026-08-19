<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase 5 — department-head listing view, scoped to their own course
 * (the query building the collection this wraps already filters by
 * course_id — see DepartmentHeadController@alumni; AlumniPolicy enforces
 * the same scope for single-record access).
 *
 * Deliberately excludes:
 *  - email/phone/address/bio — personal contact details a department
 *    head doesn't need for employability tracking/reporting.
 *  - documents — AlumniDocumentPolicy already blocks department heads
 *    from the document download endpoint; not listing document
 *    metadata here keeps that consistent instead of showing a link that
 *    would just 403.
 *  - admin_notes/status/is_messaging_restricted — moderation-only
 *    fields with no department-head use case.
 *  - social links (linkedin/github/portfolio/twitter) — personal, not
 *    part of the alumni-tracer employment picture.
 *
 * Includes exactly what a department head's core job requires: who
 * graduated, when, and their employment/career trajectory.
 */
class AlumniDepartmentHeadResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'profile_image_url' => $this->profile_image_url,

            'course_id' => $this->course_id,
            'student_id' => $this->student_id,
            'graduation_year' => $this->graduation_year,
            'enrollment_year' => $this->enrollment_year,
            'honors' => $this->honors,
            'continue_education' => (bool) $this->continue_education,

            'employment_status_id' => $this->employment_status_id,
            'current_company' => $this->current_company,
            'job_title' => $this->job_title,
            'industry' => $this->industry,
            'years_experience' => $this->years_experience,
            'work_location' => $this->work_location,
        ];
    }
}
