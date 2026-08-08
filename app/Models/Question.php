<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'question',
        'description',
        'required',
        'choices',
        'user_id'
    ];

    protected $casts = [
        'required' => 'boolean',
        'choices' => 'array'
    ];

    protected $appends = ['choices_with_urls'];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function quizzes()
    {
        return $this->belongsToMany(Quiz::class, 'quiz_question')
            ->withPivot('display_order')
            ->withTimestamps()
            ->orderBy('display_order');
    }

    // Accessors
    public function getChoicesCountAttribute()
    {
        return $this->type === 'abcd'
            ? count($this->choices ?? [])
            : 0;
    }

    public function getChoicesWithUrlsAttribute()
    {
        if (!$this->choices || !is_array($this->choices)) {
            return [];
        }

        return array_map(function ($choice) {
            return [
                'letter' => $choice['letter'] ?? null,
                'image' => $this->getImageUrl($choice['image'] ?? null),
                'interpretation' => $choice['interpretation'] ?? null,
            ];
        }, $this->choices);
    }

    protected function getImageUrl($imagePath)
    {
        if (!$imagePath) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($imagePath, FILTER_VALIDATE_URL)) {
            return $imagePath;
        }

        // If it's a storage path, generate the URL
        return Storage::url($imagePath);
    }

    // Scopes
    public function scopeRateType($query)
    {
        return $query->where('type', 'rate');
    }

    public function scopeAbcdType($query)
    {
        return $query->where('type', 'abcd');
    }

    public function scopeRequired($query)
    {
        return $query->where('required', true);
    }

    public function scopeOptional($query)
    {
        return $query->where('required', false);
    }
}