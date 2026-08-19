<?php

namespace App\Http\Requests\JobApplication;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Phase 3 — validation for POST /api/job-applications/{jobPostId}
 * (submitting a job application with resume + government ID scans).
 */
class ApplyJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any authenticated user may apply; the controller separately
        // rejects applying to one's own posting, expired/full postings,
        // and duplicate applications — none of that is an authorization
        // concern this Form Request needs to duplicate.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'resume' => 'required|file|mimes:pdf,doc,docx|max:5120',
            'cover_letter' => 'required|string|max:10000',
            'id_documents' => 'required|array|min:2|max:5',
            'id_documents.*.type' => 'required|string|max:50',
            // Phase 3: id document images are re-encoded (see
            // JobApplicationController::storeSanitizedFile), so only the
            // raster/pdf whitelist matters here — no SVG.
            'id_documents.*.file' => 'required|file|mimes:jpg,jpeg,pdf|max:5120',
            // Phase 3: previously uncapped — added a max count so a
            // single application can't be used to upload an unbounded
            // number of files.
            'other_documents' => 'nullable|array|max:5',
            'other_documents.*' => 'nullable|file|mimes:jpg,jpeg,pdf,doc,docx|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'id_documents.required' => 'At least 2 valid ID documents are required',
            'id_documents.min' => 'At least 2 valid ID documents are required',
            'id_documents.max' => 'No more than 5 ID documents may be submitted',
            'other_documents.max' => 'No more than 5 additional documents may be submitted',
            'cover_letter.required' => 'Cover letter is required',
        ];
    }
}
