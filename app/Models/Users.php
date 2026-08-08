<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Users extends Model
{
    use HasFactory;
    protected $guarded = [];
    protected $table = 'users';

    public function alumni()
    {
        return $this->belongsTo(Alumni::class);
    }

}


    