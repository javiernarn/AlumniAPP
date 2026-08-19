<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase 5 — admin's full view of an alumni record. The only resource
 * that includes moderation fields (`status`, `admin_notes`,
 * `is_messaging_restricted`).
 */
class AlumniAdminResource extends JsonResource
{
    public function toArray($request)
    {
        return array_merge(
            (new AlumniSelfResource($this->resource))->toArray($request),
            [
                'user_id' => $this->user_id,
                'status' => $this->status,
                'admin_notes' => $this->admin_notes,
                'is_messaging_restricted' => (bool) $this->is_messaging_restricted,
                'agreement' => (bool) $this->agreement,

                // Real login/session presence, sourced from the linked
                // users row (see AlumniRegistrationController@index's
                // 'user' eager load) — NOT this alumni row's own
                // updated_at, which only changes when the profile is
                // edited/approved and has nothing to do with logins or
                // the heartbeat.
                'is_online' => $this->relationLoaded('user') && $this->user
                    ? (bool) $this->user->is_online
                    : false,
                'last_active' => $this->relationLoaded('user') && $this->user
                    ? $this->user->last_active_at
                    : null,
            ]
        );
    }
}
