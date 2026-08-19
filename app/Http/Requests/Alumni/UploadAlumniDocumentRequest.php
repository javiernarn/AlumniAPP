<?php

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

class UploadAlumniDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // This route is already gated by role:admin middleware (Phase 1).
        return true;
    }

    public function rules(): array
    {
        return [
            // Phase 3: dropped `gif` from the previous
            // `mimes:jpeg,png,jpg,gif` — no legitimate use for an ID/
            // diploma/transcript scan and GIF has its own history of
            // parser exploits.
            'file' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'document_type' => 'required|string|in:student_id,alumni_id,government_id,diploma,transcript',
        ];
    }
}
