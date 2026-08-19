<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A single "Give Feedback to ATMS" submission from an alumni.
 *
 * @property array $screenshots  Private-disk paths — never exposed raw;
 *                                always go through screenshot_urls.
 */
class AtmsFeedbackReport extends Model
{
    use HasFactory;

    protected $table = 'atms_feedback_reports';

    protected $fillable = [
        'user_id',
        'type',
        'area',
        'details',
        'screenshots',
        'device_info',
        'status',
        'admin_notes',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'screenshots' => 'array',
        'device_info' => 'array',
        'resolved_at' => 'datetime',
    ];

    public const TYPES = ['improve', 'wrong'];
    public const STATUSES = ['pending', 'in_review', 'resolved', 'dismissed'];

    public const AREAS = [
        'gallery' => 'Photo Library',
        'dashboard' => 'Dashboard',
        'alumni' => 'Alumni List',
        'events' => 'Events',
        'questions' => 'Questions',
        'create-dha' => 'Create D.H.A',
        'messages' => 'Messages',
        'job-posts' => 'Job Posts',
        'faq' => 'FAQs',
        'about' => 'About',
        'profile' => 'Profile',
        'notifications' => 'Notifications',
        'login' => 'Login / Authentication',
        'image-quiz' => 'Image Quiz',
        'rating-quiz' => 'Rating Quiz',
        'registration' => 'Registration',
        'other' => 'Other',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOfArea($query, string $area)
    {
        return $query->where('area', $area);
    }

    public function getAreaLabelAttribute(): string
    {
        return self::AREAS[$this->area] ?? ucfirst(str_replace('-', ' ', (string) $this->area));
    }

    public function getTypeLabelAttribute(): string
    {
        return $this->type === 'wrong' ? 'Something went wrong' : 'Help us improve ATMS';
    }

    /**
     * Authenticated, ownership-checked download URLs for every screenshot
     * attached to this report — never the raw private-disk path.
     */
    public function getScreenshotUrlsAttribute(): array
    {
        if (!is_array($this->screenshots)) {
            return [];
        }

        return collect($this->screenshots)
            ->values()
            ->map(function ($path, $index) {
                return route('atms-feedback.screenshot', [
                    'id' => $this->id,
                    'index' => $index,
                ]);
            })
            ->all();
    }
}
