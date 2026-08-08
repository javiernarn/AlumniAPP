<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'organization_name',
        'image_path',
        'image_paths',
        'original_name',
        'file_type',
        'file_size',
        'uploaded_by',
        'event_date',
        'status',
    ];

    protected $casts = [
        'event_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'image_paths' => 'array',
    ];

    protected $appends = ['image_url', 'image_urls', 'formatted_date', 'formatted_size'];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Single image URL (backward compatibility)
    public function getImageUrlAttribute()
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    // Multiple image URLs
    public function getImageUrlsAttribute()
    {
        if ($this->image_paths && is_array($this->image_paths)) {
            return array_map(function ($path) {
                return asset('storage/' . $path);
            }, $this->image_paths);
        }
        
        // Fallback to single image if image_paths is empty
        if ($this->image_path) {
            return [asset('storage/' . $this->image_path)];
        }
        
        return [];
    }

    public function getFormattedDateAttribute()
    {
        return $this->event_date ? $this->event_date->format('F d, Y') : $this->created_at->format('F d, Y');
    }

    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' bytes';
    }
}
