<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'alumni_id',
        'sender_type',
        'sender_id',
        'message',
        'is_read',
        'read_at',
        'image_path', // added image_path column
        'is_edited', // added is_edited column
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the alumni that owns the message
     */
    public function alumni()
    {
        return $this->belongsTo(Alumni::class);
    }

    /**
     * Get the sender of the message (admin or alumni)
     */
    public function sender()
    {
        if ($this->sender_type === 'admin') {
            return $this->belongsTo(\App\Models\User::class, 'sender_id');
        }

        return $this->belongsTo(\App\Models\Alumni::class, 'sender_id');
    }

    /**
     * Get all reactions for this message
     */
    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    /**
     * Get grouped reactions by emoji type
     */
    public function getReactionSummary()
{
    return $this->reactions()
        ->selectRaw('emoji, COUNT(*) as count')
        ->groupBy('emoji')
        ->get();
}

}
