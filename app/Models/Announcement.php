<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'category',
        'status',
        'pinned',
        'publish_date',
        'expiry_date',
        'images',
        'user_id',
        'views_count',
    ];

    protected $casts = [
        'pinned' => 'boolean',
        'publish_date' => 'date',
        'expiry_date' => 'date',
        'images' => 'array',
        'views_count' => 'integer',
    ];

    protected $appends = ['image_urls'];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Accessors
    public function getImageUrlsAttribute()
    {
        if (!$this->images || !is_array($this->images)) {
            return [];
        }

        return array_map(function ($img) {
            return asset('storage/' . $img);
        }, $this->images);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopePinned($query)
    {
        return $query->where('pinned', true);
    }

    /**
     * Announcements that are published AND currently within their
     * publish/expiry window — this is what alumni should see.
     */
    public function scopeActive($query)
    {
        $today = now()->toDateString();

        return $query->where('status', 'published')
            ->where(function ($q) use ($today) {
                $q->whereNull('publish_date')->orWhereDate('publish_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('expiry_date')->orWhereDate('expiry_date', '>=', $today);
            });
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%");
        });
    }
}