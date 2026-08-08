<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateDefaultAdminName extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Update the default admin's name
        DB::table('users')
            ->where('email', 'occ.guidance@gmail.com')
            ->update([
                'name' => 'Guidance Counselor',
            ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert back if needed
        DB::table('users')
            ->where('email', 'occ.guidance@gmail.com')
            ->update([
                'name' => 'Guidance Counselor', // original version
            ]);
    }
}
