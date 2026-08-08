<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlumniQuizzes extends Model
{
    use HasFactory;

    protected $table = 'alumni_quizzes';

    protected $fillable = [
        'course_code',
        'course_name',
    ];
}
