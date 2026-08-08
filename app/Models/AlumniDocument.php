<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlumniDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'alumni_id',
        'document_type',
        'file_path',
        'file_name',
        'status',
        'rejection_reason'
    ];

    protected $casts = [
        'document_type' => 'string',
    ];

    // Relationships
    public function alumni()
    {
        return $this->belongsTo(Alumni::class);
    }

    // Accessors
    protected function fileUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => asset('storage/' . $this->file_path),
        );
    }

    protected function documentTypeLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $types = [
                    'student_id' => 'Student ID Card',
                    'alumni_id' => 'Alumni ID Card',
                    'government_id' => 'Government ID',
                    'diploma' => 'Diploma',
                    'transcript' => 'Transcript',
                ];
                return $types[$this->document_type] ?? $this->document_type;
            }
        );
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}