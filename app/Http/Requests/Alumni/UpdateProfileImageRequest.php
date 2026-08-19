<?php

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        // This route is already gated by role:admin middleware (Phase 1).
        return true;
    }

    public function rules(): array
    {
        return [
            'profile_image' => 'required|file|mimes:jpg,jpeg,png,webp|max:5120',
        ];
    }
}
