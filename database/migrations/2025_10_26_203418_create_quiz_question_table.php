<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuizQuestionTable extends Migration
{
    public function up()
    {
        Schema::create('quiz_question', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_id')->constrained()->onDelete('cascade');
            $table->integer('display_order')->default(0);
            $table->timestamps();
            
            $table->unique(['quiz_id', 'question_id']);
            $table->index(['quiz_id', 'display_order']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('quiz_question');
    }
}