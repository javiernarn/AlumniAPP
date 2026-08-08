<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasFactory;

    protected $table = 'event_registrations';

    protected $fillable = [
        'event_id',
        'alumni_id',
        'registration_date',
        'status',
    ];

     protected $casts = [
        'registration_date' => 'datetime',
    ];
    
    // Relationship to Event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    // Relationship to the alumni who registered
    public function alumni()
    {
        return $this->belongsTo(\App\Models\Alumni::class, 'alumni_id');
    }
}
