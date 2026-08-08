<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Alumni;
use Illuminate\Http\Request;


class AdminDashboardController extends Controller
{

    function index(Request $request)
    {
        $year = $request->year;
        $years = Alumni::select('graduation_year')
            ->distinct()
            ->orderBy('graduation_year', 'desc')
            ->pluck('graduation_year');
        $industries = Alumni::select('industry')
            ->distinct()
            ->orderBy('industry', 'desc')
            ->pluck('industry');
        $course = Course::all();
        if ($year === 'all') {
            $alumni = Alumni::where('status', 'approved')->get();
        } else {
            $alumni = Alumni::where('status', 'approved')
                ->where('graduation_year', $year)
                ->get(); 
        }


        return response()->json([
            'success' => true,
            'alumni' => $alumni,
            'course' => $course,
            'years ' => $years,
            'industries' => $industries
        ]);
    }
}
