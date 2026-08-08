<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\EmploymentStatus;
use App\Models\User;
use App\Models\Alumni;
use App\Models\AlumniQuizzes;


class GlobalAluminiController extends Controller
{

    function courses()
    {
        $courses = Course::all();
        return response()->json($courses);
    }

    function employeeStatus()
    {
        $status = EmploymentStatus::all();
        return response()->json($status);
    }

    function profile()
    {
        $user  = auth()->user();
        if ($user->role === 'alumni') {
            $profile = User::with(['alumni','alumniQuizzes'])
                //->withCount(['alumniQuizzes as has_quiz']) // This creates a 'has_quiz_count' attribute
                ->find($user->id);
            return $profile;
        }
        return $user;
    }
}
