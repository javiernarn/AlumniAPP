<?php


namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'event_type' => 'required|string',
            'category' => 'required|string|max:255',
            'date' => 'required|date|after_or_equal:today',
            'timeRange' => 'required|array|size:2',
            'timeRange.0' => 'required|date_format:H:i',
            'timeRange.1' => 'required|date_format:H:i|after:timeRange.0',
            'location' => 'required|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'capacity' => 'required|integer|min:1',
            'organizer' => 'required|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'agenda' => 'nullable|string',
            //'featured' => 'boolean|nullable',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048'
        ];

        return $rules;
    }

    public function messages()
    {
        return [
            'timeRange.1.after' => 'End time must be after start time.',
            'date.after_or_equal' => 'Event date must be today or in the future.',
        ];
    }
}