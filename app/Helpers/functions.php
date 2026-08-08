<?php

use App\Models\Classroom;
use App\Models\Classwork;


if (!function_exists('getClassId')) {
    function getClassId($slug)
    {
        $classroom = Classroom::where('slug', $slug)->first();

        if (!$classroom) {
            abort(404, 'Classroom not found');
        }

        return $classroom->id;
    }

    function getClassWorkId($slug)
    {
        $classroom = Classwork::where('slug', $slug)->first();

        if (!$classroom) {
            // If not found, you can throw a 404 or custom error
            abort(404, 'Classwork not found');
        }

        return $classroom;
    }
}