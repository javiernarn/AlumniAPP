<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateEmploymentStatusesTable extends Migration
{
    public function up()
    {
        Schema::create('employment_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('status_name',30)->unique();
            $table->timestamps();
        });

        // Insert default statuses
        DB::table('employment_statuses')->insert([
            ['status_name' => 'Employed'],
            ['status_name' => 'Unemployed'],
            ['status_name' => 'Under Employed'],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('employment_statuses');
    }
}
