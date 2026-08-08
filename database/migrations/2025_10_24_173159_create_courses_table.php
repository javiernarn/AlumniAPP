<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateCoursesTable extends Migration
{
    public function up()
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('course_code', 10)->unique();
            $table->string('course_name');
            $table->timestamps();
        });

        // Insert sample courses
        DB::table('courses')->insert([
            [
                'course_code' => 'BSIT',
                'course_name' => 'Bachelor of Science in Information Technology'
            ],
            [
                'course_code' => 'BSEd',
                'course_name' => 'Bachelor in Teacher Education'
            ],
            [
                'course_code' => 'BEED',
                'course_name' => 'Bachelor of elementary and education'
            ],
                [
                'course_code' => 'BSBA',
                'course_name' => 'Bachelor of Science and business administration'
            ],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('courses');
    }
}
