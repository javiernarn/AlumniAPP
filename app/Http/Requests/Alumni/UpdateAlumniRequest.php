<?php

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Phase 3 — validation for PUT /api/alumni/{id}.
 *
 * Deliberately does NOT define rules for status, admin_notes,
 * is_messaging_restricted, user_id, or course_id. Authorization
 * (AlumniPolicy, Phase 1) already restricts this route to admins and
 * the record's own owner, but this whitelist is a second, independent
 * layer: even if a future change wires $request->all() into an update
 * instead of the current explicit $validated array, those fields simply
 * aren't present here to leak through.
 */
class UpdateAlumniRequest extends FormRequest
{
    public function authorize(): bool
    {
        $alumni = \App\Models\Alumni::find($this->route('id'));

        if (!$alumni) {
            // Let the controller's findOrFail produce the 404; don't
            // block on authorization for a record that doesn't exist.
            return true;
        }

        return $this->user()?->can('update', $alumni) ?? false;
    }

    public function rules(): array
    {
        $alumniId = $this->route('id');

        return [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($alumniId) {
                    $existsInAlumni = \App\Models\Alumni::where('email', $value)
                        ->where('id', '!=', $alumniId)
                        ->exists();
                    $alumni = \App\Models\Alumni::find($alumniId);
                    $existsInUsers = \App\Models\User::where('email', $value)
                        ->where('id', '!=', $alumni?->user_id)
                        ->exists();

                    if ($existsInAlumni || $existsInUsers) {
                        $fail('This email is already in use.');
                    }
                },
            ],
            'phone' => [
                'sometimes',
                'string',
                'max:20',
                function ($attribute, $value, $fail) use ($alumniId) {
                    $existsInAlumni = \App\Models\Alumni::where('phone', $value)
                        ->where('id', '!=', $alumniId)
                        ->exists();

                    if ($existsInAlumni) {
                        $fail('This phone number is already in use.');
                    }
                },
            ],
            'address' => 'nullable|string|max:1000',
            'current_company' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'years_experience' => 'nullable|integer|min:0|max:50',
            'salary_range' => 'nullable|string|max:100',
            'work_location' => 'nullable|string|max:255',
            'previous_companies' => 'nullable|string|max:5000',
            // Phase 3: was 'sometimes|image|max:5120' — tightened to
            // exclude SVG/BMP/GIF, same rationale as StoreAlumniRequest.
            'profile_image' => 'sometimes|file|mimes:jpg,jpeg,png,webp|max:5120',
        ];
    }
}
