<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAlumniQuizQuestionTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('alumni_quiz_question', function (Blueprint $table) {
            $table->id();
            
            // Make sure these match exactly with the referenced tables
            $table->unsignedBigInteger('alumni_quiz_id');
            $table->unsignedBigInteger('question_id');
            
            $table->string('answer', 10);
            $table->timestamps();

            // Add foreign keys with explicit references
            $table->foreign('alumni_quiz_id')
                  ->references('id')
                  ->on('alumni_quizzes') // Make sure this table name is correct
                  ->onDelete('cascade');
                  
            $table->foreign('question_id')
                  ->references('id')
                  ->on('questions') // Make sure this table name is correct
                  ->onDelete('cascade');

            $table->unique(['alumni_quiz_id', 'question_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('alumni_quiz_question');
    }
}