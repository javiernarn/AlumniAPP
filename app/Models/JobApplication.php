<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    protected $fillable = [
        // ===== EXISTING FIELDS (UNCHANGED) =====
        'job_post_id',
        'alumni_id',
        'resume_path',
        'cover_letter',
        'id_documents',
        'other_documents',
        'status',
        'admin_feedback',
        'reviewed_at',

        // ===== NEW: Government ID Verification fields =====
        'id_type',
        'verification_status',
        'ocr_name',
        'ocr_id_number',
        'ocr_raw_text',
        'ocr_extracted_data',
        'government_id_front',
        'government_id_back',
        'ocr_success',
        'id_type_match',
        'ocr_confidence',
        'verified_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',

        // ===== NEW: verification casts =====
        'ocr_extracted_data' => 'array',
        'ocr_success'        => 'boolean',
        'id_type_match'      => 'boolean',
        'verified_at'        => 'datetime',
        'ocr_confidence'     => 'decimal:2',
    ];

    public function jobPost(): BelongsTo
    {
        return $this->belongsTo(JobPost::class);
    }

    public function alumni(): BelongsTo
    {
        return $this->belongsTo(User::class, 'alumni_id');
    }

    public function scopeApplied($query)    { return $query->where('status', 'applied'); }
    public function scopeReviewing($query)  { return $query->where('status', 'reviewing'); }
    public function scopeAccepted($query)   { return $query->where('status', 'accepted'); }
    public function scopeRejected($query)   { return $query->where('status', 'rejected'); }

    // ===== NEW: verification scopes =====
    public function scopeVerified($query)         { return $query->where('verification_status', 'verified'); }
    public function scopePendingVerification($q)  { return $q->where('verification_status', 'pending'); }
    public function scopeVerificationFailed($q)   { return $q->where('verification_status', 'failed'); }

    /**
     * Get parsed ID documents as array  (EXISTING - UNCHANGED)
     */
    public function getIdDocumentsArrayAttribute()
    {
        return $this->id_documents ? json_decode($this->id_documents, true) : [];
    }

    /**
     * Get parsed other documents as array  (EXISTING - UNCHANGED)
     */
    public function getOtherDocumentsArrayAttribute()
    {
        return $this->other_documents ? json_decode($this->other_documents, true) : [];
    }
}
