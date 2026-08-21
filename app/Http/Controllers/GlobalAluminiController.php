<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\EmploymentStatus;
use App\Models\User;
use App\Models\Alumni;
use App\Models\AlumniQuizzes;
use App\Support\CacheHelper;


class GlobalAluminiController extends Controller
{

    // Phase 2 caching (audit §3): courses/employment statuses are
    // near-static lookup tables (admin-managed, rarely change) but were
    // being re-queried on every single page that renders a course or
    // employment-status dropdown/filter. Long TTL (1 hour) — CourseObserver
    // / EmploymentStatusObserver forget these keys immediately on any
    // save/delete, so admin edits still show up right away instead of
    // waiting out the TTL.
    function courses()
    {
        $courses = CacheHelper::remember('lookup:courses', ['courses'], 3600, function () {
            return Course::all();
        });
        return response()->json($courses);
    }

    function employeeStatus()
    {
        $status = CacheHelper::remember('lookup:employment-statuses', ['employment-statuses'], 3600, function () {
            return EmploymentStatus::all();
        });
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
