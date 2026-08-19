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

            // Alumni::$appends deliberately no longer auto-includes
            // profile_image_url / document_urls (data-minimization
            // hardening — see the comment on that property). Returning
            // $profile directly therefore silently dropped the alumni's
            // own profile image and documents from every place that
            // reads GET /profile (ProfilePage, the header/account
            // dropdown avatar, AlumniDetails "view own profile"). Build
            // the response as a plain array with the alumni relation run
            // through AlumniSelfResource so those accessors come back,
            // same as every other endpoint that returns alumni data.
            if (!$profile) {
                return $profile;
            }

            $data = $profile->toArray();
            if ($profile->alumni) {
                $data['alumni'] = (new \App\Http\Resources\Alumni\AlumniSelfResource($profile->alumni))
                    ->resolve();
            }

            return response()->json($data);
        }
        return $user;
    }
}
