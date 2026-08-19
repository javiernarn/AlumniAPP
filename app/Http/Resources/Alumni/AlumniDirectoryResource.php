<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The alumni-facing "browse the directory" view (AlumniList.js's
 * non-admin path — see routes/api.php GET /alumni/directory).
 *
 * Deliberately minimal: this is shown to every authenticated alumni
 * about every other alumni, so it excludes anything sensitive —
 * email/phone/address, employment/salary detail, documents, admin
 * fields — that AlumniSelfResource/AlumniAdminResource expose only to
 * the record's owner or an admin. Only approved alumni who've opted
 * in should ever reach this resource (enforced by the controller).
 */
class AlumniDirectoryResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'profile_image_url' => $this->profile_image_url,
            'course_id' => $this->course_id,
            'course' => $this->whenLoaded('course'),
            'graduation_year' => $this->graduation_year,
            'job_title' => $this->job_title,
            'current_company' => $this->current_company,
            'industry' => $this->industry,
            'linkedin' => $this->linkedin,
            'github' => $this->github,
            'portfolio' => $this->portfolio,
            'willing_to_mentor' => (bool) $this->willing_to_mentor,

            // Presence only — no other user-table data leaks through this
            // deliberately-minimal resource. Same source as
            // AlumniAdminResource (see AlumniRegistrationController@directory's
            // 'user' eager load).
            'is_online' => $this->relationLoaded('user') && $this->user
                ? (bool) $this->user->is_online
                : false,
            'last_active' => $this->relationLoaded('user') && $this->user
                ? $this->user->last_active_at
                : null,
        ];
    }
}
