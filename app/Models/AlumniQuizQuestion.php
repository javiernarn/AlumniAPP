<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class AlumniQuizQuestion extends Pivot
{
    use HasFactory;

    protected $table = 'alumni_quiz_question';

    protected $fillable = [
        'alumni_quiz_id',
        'question_id',
        'answer',
    ];

    public $incrementing = true;
    public $timestamps = true;

    public function quiz()
    {
        return $this->belongsTo(AlumniQuiz::class, 'alumni_quiz_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}