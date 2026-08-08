<?php
// app/Models/Quiz.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type',
        'isActive',
        'user_id'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'quiz_question')
            ->withPivot('display_order')
            ->withTimestamps()
            ->orderBy('display_order');
    }

    // Accessors
    public function getQuestionCountAttribute()
    {
        return $this->questions()->count();
    }

    // Methods
    public function addQuestion($questionId, $displayOrder = null)
    {
        $maxOrder = $this->questions()->max('display_order') ?? 0;
        $displayOrder = $displayOrder ?? $maxOrder + 1;

        return $this->questions()->attach($questionId, ['display_order' => $displayOrder]);
    }

    public function reorderQuestions($questionIds)
    {
        foreach ($questionIds as $index => $questionId) {
            $this->questions()->updateExistingPivot($questionId, [
                'display_order' => $index + 1
            ]);
        }
    }
}