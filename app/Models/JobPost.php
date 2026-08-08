<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class JobPost extends Model
{
    protected $fillable = [
        'title',
        'description',
        'company',
        'location',
        'requirements',
        'job_type',
        'salary_min',
        'salary_max',
        'status',
        'created_by_user_id',
        'created_by_role',
        'approved_by_user_id',
        'admin_notes',
        'approved_at',
        'banner_image',
        'capacity',
        'expires_at',
        // ============ Job Post Verification System ============
        'reference_source_type',
        'reference_url',
        'verification_notes',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $appends = ['is_full', 'is_expired', 'applications_count', 'remaining_capacity', 'expiration_display'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    // ============ ACCESSORS ============

    /**
     * Get total applications count
     */
    public function getApplicationsCountAttribute(): int
    {
        return $this->applications()->count();
    }

    /**
     * Check if job post capacity is full
     */
    public function getIsFullAttribute(): bool
    {
        if (is_null($this->capacity)) {
            return false;
        }
        return $this->applications()->count() >= $this->capacity;
    }

    /**
     * Check if job post is expired
     */
    public function getIsExpiredAttribute(): bool
    {
        if (is_null($this->expires_at)) {
            return false;
        }
        return Carbon::now()->greaterThan($this->expires_at);
    }

    /**
     * Get remaining capacity
     */
    public function getRemainingCapacityAttribute(): ?int
    {
        if (is_null($this->capacity)) {
            return null;
        }
        $remaining = $this->capacity - $this->applications()->count();
        return max(0, $remaining);
    }

    /**
     * Get human-readable expiration display
     * Shows: 1 week, 2 weeks, 1 month, etc.
     */
    public function getExpirationDisplayAttribute(): ?string
    {
        if (is_null($this->expires_at)) {
            return null;
        }

        $now = Carbon::now();
        $expiresAt = Carbon::parse($this->expires_at);

        if ($now->greaterThan($expiresAt)) {
            return 'Expired';
        }

        $diffInDays = $now->diffInDays($expiresAt);
        $diffInWeeks = floor($diffInDays / 7);
        $diffInMonths = $now->diffInMonths($expiresAt);
        $diffInYears = $now->diffInYears($expiresAt);

        if ($diffInYears >= 1) {
            return $diffInYears == 1 ? '1 year' : $diffInYears . ' years';
        } elseif ($diffInMonths >= 1) {
            return $diffInMonths == 1 ? '1 month' : $diffInMonths . ' months';
        } elseif ($diffInWeeks >= 1) {
            return $diffInWeeks == 1 ? '1 week' : $diffInWeeks . ' weeks';
        } else {
            return $diffInDays <= 1 ? '1 day' : $diffInDays . ' days';
        }
    }

    // ============ SCOPES ============

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeByAlumni($query)
    {
        return $query->where('created_by_role', 'alumni');
    }

    public function scopeByAdmin($query)
    {
        return $query->where('created_by_role', 'admin');
    }

    public function scopeForAlumniListing($query)
    {
        return $query->approved();
    }

    /**
     * Scope for active (not full and not expired) job posts
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', Carbon::now());
        })->where(function ($q) {
            $q->whereNull('capacity')
              ->orWhereRaw('capacity > (SELECT COUNT(*) FROM job_applications WHERE job_applications.job_post_id = job_posts.id)');
        });
    }

    /**
     * Scope for full or expired job posts
     */
    public function scopeFullOrExpired($query)
    {
        return $query->where(function ($q) {
            // Expired
            $q->where(function ($subQ) {
                $subQ->whereNotNull('expires_at')
                     ->where('expires_at', '<=', Carbon::now());
            })
            // Or Full
            ->orWhere(function ($subQ) {
                $subQ->whereNotNull('capacity')
                     ->whereRaw('capacity <= (SELECT COUNT(*) FROM job_applications WHERE job_applications.job_post_id = job_posts.id)');
            });
        });
    }
}
