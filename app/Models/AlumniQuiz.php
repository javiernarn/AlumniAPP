<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlumniQuiz extends Model
{
    use HasFactory;

    protected $table = 'alumni_quizzes';

    protected $fillable = [
        'user_id',
        'type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function answers()
    {
        return $this->hasMany(AlumniQuizQuestion::class, 'alumni_quiz_id');
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'alumni_quiz_question', 'alumni_quiz_id', 'question_id')
                    ->withPivot('answer')
                    ->withTimestamps();
    }
}