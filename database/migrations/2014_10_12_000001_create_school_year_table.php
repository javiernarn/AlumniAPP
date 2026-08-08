<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSchoolYearTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('school_year', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->length(4)->unique();
            $table->integer('year2')->length(4);
            $table->tinyInteger('default')->default(0);
            $table->timestamps();
        });

        DB::table('school_year')->insert(
            array(
                'year' => "2024",
                'year2' => "2025",
            )
        );
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('school_year');
    }
}
