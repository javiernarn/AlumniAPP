<?php

namespace App\Http\Resources\JobApplication;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase 5 — job application response, used by
 * JobApplicationController::show() for anyone JobApplicationPolicy
 * already let through (admin, the applicant, or the job post creator).
 *
 * Deliberately excludes raw OCR internals — `ocr_raw_text` (the full
 * text dump the OCR engine extracted from a government ID scan) and
 * `ocr_extracted_data` (structured PII parsed from that scan). Neither
 * is something the frontend renders or needs; both are intermediate
 * processing artifacts that would otherwise leak parsed government-ID
 * contents into a JSON payload every time an application is viewed. The
 * boolean/summary fields (`ocr_success`, `id_type_match`,
 * `ocr_confidence`, `verification_status`) are kept — they're exactly
 * what a reviewer needs to see ("did the ID look legitimate?") without
 * needing the raw extracted text.
 */
class JobApplicationResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'job_post_id' => $this->job_post_id,
            'alumni_id' => $this->alumni_id,
            'alumni' => $this->when(isset($this->resource->alumni), $this->resource->alumni ?? null),
            'cover_letter' => $this->cover_letter,
            'status' => $this->status,
            'admin_feedback' => $this->admin_feedback,

            'resume_url' => $this->when(
                $this->relationLoaded('jobPost') || $this->id,
                fn () => route('job-applications.resume', $this->id)
            ),

            'id_type' => $this->id_type,
            'verification_status' => $this->verification_status,
            'id_type_match' => (bool) $this->id_type_match,
            'ocr_success' => (bool) $this->ocr_success,
            'ocr_confidence' => $this->ocr_confidence,
            'verified_at' => $this->verified_at,

            'id_documents' => $this->when($this->id_documents, function () {
                $decoded = json_decode($this->id_documents, true) ?? [];
                return collect($decoded)->values()->map(function ($doc, $index) {
                    return [
                        'type' => $doc['type'] ?? null,
                        'download_url' => route('job-applications.supporting-document', [
                            'id' => $this->id,
                            'type' => 'id-documents',
                            'index' => $index,
                        ]),
                    ];
                });
            }),

            'other_documents' => $this->when($this->other_documents, function () {
                $decoded = json_decode($this->other_documents, true) ?? [];
                return collect($decoded)->values()->map(function ($doc, $index) {
                    return [
                        'download_url' => route('job-applications.supporting-document', [
                            'id' => $this->id,
                            'type' => 'other-documents',
                            'index' => $index,
                        ]),
                    ];
                });
            }),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
