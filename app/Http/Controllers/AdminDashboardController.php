<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Alumni;
use App\Http\Resources\Alumni\AlumniDashboardResource;
use App\Support\CacheHelper;
use Illuminate\Http\Request;


class AdminDashboardController extends Controller
{

    function index(Request $request)
    {
        $year = $request->year;

        // Phase 2 caching + audit finding #4: this used to run three
        // Alumni-table queries (incl. a full `->get()` of every approved
        // alumnus's every column) on every single dashboard load/filter
        // change. Now cached per `year` for 60s, and the alumni list is
        // both column-limited (select() below) and wrapped in
        // AlumniDashboardResource so only the fields the chart actually
        // reads ever leave the DB or reach the response.
        //
        // Cache key uses '__none__' (not 'all') when $year is null/empty
        // — the query below only skips filtering when $year is exactly
        // the string 'all' (matching the original pre-Phase-2 behavior),
        // so a missing/blank $year still filters graduation_year by
        // null/'' and must not share a cache entry with a real
        // ?year=all request.
        $yearCacheKey = ($year === null || $year === '') ? '__none__' : $year;

        $payload = CacheHelper::remember(
            "admin:dashboard:{$yearCacheKey}",
            ['alumni'],
            60,
            function () use ($year) {
                $years = Alumni::select('graduation_year')
                    ->distinct()
                    ->orderBy('graduation_year', 'desc')
                    ->pluck('graduation_year');
                $industries = Alumni::select('industry')
                    ->distinct()
                    ->orderBy('industry', 'desc')
                    ->pluck('industry');
                $course = Course::all();

                $alumniQuery = Alumni::where('status', 'approved')
                    ->select([
                        'id',
                        'course_id',
                        'current_company',
                        'employment_status_id',
                        'femployment_status_id',
                        'graduation_year',
                        'industry',
                        'salary_range',
                        'years_experience',
                    ]);

                if ($year !== 'all') {
                    $alumniQuery->where('graduation_year', $year);
                }

                // .resolve() (not ::collection()) so this stays a plain
                // array, matching what DashboardPage.js already expects
                // from alumni.alumni (Array.isArray check) — ::collection()
                // would add react-query-breaking 'data' envelope wrapping.
                $alumni = $alumniQuery->get()->map(
                    fn ($alumnus) => (new AlumniDashboardResource($alumnus))->resolve()
                )->values();

                return [
                    'alumni' => $alumni,
                    'course' => $course,
                    'years' => $years,
                    'industries' => $industries,
                ];
            }
        );

        return response()->json(array_merge(['success' => true], $payload));
    }
}
