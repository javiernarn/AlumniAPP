<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'alumni_id',
        'name',
        'email',
        'role',
        'course_code',
        'action',
        'ip_address',
        'user_agent',
        'occurred_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function alumni()
    {
        return $this->belongsTo(Alumni::class);
    }

    /**
     * Write one audit entry. Centralized here so every call site
     * (login, logout, and any future activity we want tracked) builds
     * the same shape of row and failures never bubble up and break the
     * actual login/logout flow.
     */
    public static function record(array $attributes): void
    {
        try {
            static::create($attributes);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to write audit log: ' . $e->getMessage());
        }
    }
}
