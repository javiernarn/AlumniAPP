<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;
    // Phase 2 (audit finding #1): `guarded = []` made every column
    // mass-assignable. Explicit list built from the migration's actual
    // columns + every field this app's own Notification::create() calls
    // pass at the top level (nested per-type fields like alumni_id,
    // event_id, etc. all live inside `data`, not as top-level columns).
    protected $fillable = [
        'user_id',
        'notifiable_type',
        'title',
        'message',
        'data',
        'read',
        'read_at',
    ];
    protected $table = 'notifications';

    protected $casts = [
        'data' => 'array',
        'read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
