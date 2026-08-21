<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase 2 (audit finding #4): AdminDashboardController@index used to
 * return every column of every approved Alumni row, unpaginated,
 * straight to JSON. This resource limits the response to exactly the
 * fields DashboardPage.js reads to build its charts
 * (course/employment/graduation-year/industry/salary/experience
 * breakdowns) — nothing else about the alumnus (contact info,
 * documents, application data, etc.) is exposed here.
 */
class AlumniDashboardResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'current_company' => $this->current_company,
            'employment_status_id' => $this->employment_status_id,
            'femployment_status_id' => $this->femployment_status_id,
            'graduation_year' => $this->graduation_year,
            'industry' => $this->industry,
            'salary_range' => $this->salary_range,
            'years_experience' => $this->years_experience,
        ];
    }
}
