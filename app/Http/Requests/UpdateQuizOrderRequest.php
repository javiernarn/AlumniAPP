<?php
// app/Http/Requests/UpdateQuizOrderRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuizOrderRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'questions' => 'required|array|min:1',
            'questions.*' => 'exists:questions,id',
        ];
    }
}