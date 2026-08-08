<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class UpdateCourseNamesInCoursesTable extends Migration
{
    public function up()
    {
        DB::table('courses')
            ->where('course_code', 'BSEd')
            ->update([
                'course_name' => 'Bachelor of Secondary Education'
            ]);

        DB::table('courses')
            ->where('course_code', 'BEED')
            ->update([
                'course_name' => 'Bachelor of Elementary Education'
            ]);

        DB::table('courses')
            ->where('course_code', 'BSBA')
            ->update([
                'course_name' => 'Bachelor of Science in Business Administration'
            ]);
    }

    public function down()
    {
        DB::table('courses')
            ->where('course_code', 'BSEd')
            ->update([
                'course_name' => 'Bachelor in Teacher Education'
            ]);

        DB::table('courses')
            ->where('course_code', 'BEED')
            ->update([
                'course_name' => 'Bachelor of elementary and education'
            ]);

        DB::table('courses')
            ->where('course_code', 'BSBA')
            ->update([
                'course_name' => 'Bachelor of Science and business administration'
            ]);
    }
}