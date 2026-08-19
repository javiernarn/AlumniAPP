<?php

namespace App\Http\Resources\AtmsFeedbackReport;

use Illuminate\Http\Resources\Json\JsonResource;

class AtmsFeedbackReportResource extends JsonResource
{
    public function toArray($request)
    {
        $alumni = $this->resource->user?->alumni;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'area' => $this->area,
            'area_label' => $this->area_label,
            'details' => $this->details,
            'status' => $this->status,
            'admin_notes' => $this->admin_notes,

            'screenshot_urls' => $this->screenshot_urls,
            'screenshot_count' => is_array($this->screenshots) ? count($this->screenshots) : 0,

            'device_info' => $this->device_info,

            'submitted_by' => $this->when($this->user_id, [
                'id' => $this->user?->id,
                'name' => $alumni?->full_name ?? $this->user?->name,
                'email' => $this->user?->email,
                'profile_image_url' => $alumni?->profile_image_url,
            ]),

            'resolved_by' => $this->when($this->resolved_by, [
                'id' => $this->resolver?->id,
                'name' => $this->resolver?->name,
            ]),
            'resolved_at' => optional($this->resolved_at)->toIso8601String(),

            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
