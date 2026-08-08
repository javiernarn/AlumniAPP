<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('alumni', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('employment_status_id')->nullable();
            $table->unsignedBigInteger('femployment_status_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->string('application_id',30)->unique();

            // Personal Information
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('suffix')->nullable();
            $table->string('email',100)->unique();
            $table->string('phone');
            $table->text('address');
            $table->date('birth_date')->nullable();

            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say']);
            $table->text('bio')->nullable();
            $table->string('profile_image')->nullable();

            // Academic Information
            $table->string('course');
            $table->string('student_id')->nullable();
            $table->integer('graduation_year');
            $table->integer('enrollment_year')->nullable();
            //$table->json('honors')->nullable();
            $table->text('honors')->nullable();
            
            $table->string('thesis_title')->nullable();
            $table->text('academic_achievements')->nullable();
            $table->text('extracurricular')->nullable();
            $table->boolean('continue_education')->default(false);

            // Career Information
            $table->string('current_company')->nullable();
            $table->string('job_title')->nullable();
            $table->string('industry')->nullable();
            $table->integer('years_experience')->nullable();
            $table->string('salary_range')->nullable();
            $table->string('work_location')->nullable();
            $table->text('career_goals')->nullable();
            $table->text('previous_companies')->nullable();

            // Social Media
            $table->string('linkedin')->nullable();
            $table->string('github')->nullable();
            $table->string('portfolio')->nullable();
            $table->string('twitter')->nullable();

            // Skills
            $table->text('technical_skills')->nullable();
            $table->text('soft_skills')->nullable();
            $table->text('certifications')->nullable();
            $table->text('languages')->nullable();
            $table->text('professional_interests')->nullable();
            $table->text('hobbies')->nullable();
            $table->text('volunteer_interests')->nullable();
            $table->boolean('willing_to_mentor')->default(false);

            // Agreements
            $table->boolean('agreement')->default(false);
            $table->boolean('newsletter')->default(false);
            $table->boolean('contact_permission')->default(false);

            // Status
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();

            // Temp password (plain text for temporary use) 
            $table->string('temp_password')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('employment_status_id')->references('id')->on('employment_statuses')->onDelete('cascade');
            $table->foreign('femployment_status_id')->references('id')->on('employment_statuses')->onDelete('cascade');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');


            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('alumni');
    }
};
