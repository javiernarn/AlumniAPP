<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::table('alumni')->orderBy('id')->chunk(200, function ($alumniRows) {
            foreach ($alumniRows as $row) {
                $firstName  = $row->first_name !== null ? mb_strtoupper(trim($row->first_name), 'UTF-8') : $row->first_name;
                $lastName   = $row->last_name !== null ? mb_strtoupper(trim($row->last_name), 'UTF-8') : $row->last_name;
                $middleName = $row->middle_name !== null ? mb_strtoupper(trim($row->middle_name), 'UTF-8') : $row->middle_name;
                $suffix     = $row->suffix !== null ? mb_strtoupper(trim($row->suffix), 'UTF-8') : $row->suffix;

                DB::table('alumni')->where('id', $row->id)->update([
                    'first_name'  => $firstName,
                    'last_name'   => $lastName,
                    'middle_name' => $middleName,
                    'suffix'      => $suffix,
                ]);

                if ($row->user_id) {
                    DB::table('users')->where('id', $row->user_id)->update([
                        'name' => trim($firstName . ' ' . $lastName),
                    ]);
                }
            }
        });
    }

    public function down()
    {
       
    }
};