<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Illuminate\Support\Facades\Storage;

class Alumni extends Model
{
    use HasFactory;

    protected $table = 'alumni';

    protected $fillable = [
        'user_id',
        'application_id',
        'first_name',
        'last_name',
        'middle_name',
        'suffix',
        'email',
        'phone',
        'address',
        'birth_date',
        'gender',
        'bio',
        'profile_image',
        'temp_password',
        'course_id',
        'student_id',
        'graduation_year',
        'enrollment_year',
        'honors',
        'thesis_title',
        'academic_achievements',
        'extracurricular',
        'continue_education',
        'employment_status_id',
        'femployment_status_id',
        'current_company',
        'job_title',
        'industry',
        'years_experience',
        'salary_range',
        'work_location',
        'career_goals',
        'previous_companies',
        'career_last_edited_at',
        'linkedin',
        'github',
        'portfolio',
        'twitter',
        'technical_skills',
        'soft_skills',
        'certifications',
        'languages',
        'professional_interests',
        'hobbies',
        'volunteer_interests',
        'willing_to_mentor',
        'agreement',
        'newsletter',
        'contact_permission',
        'status',
        'admin_notes',
        'is_messaging_restricted',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'honors' => 'array',
        'technical_skills' => 'array',
        'soft_skills' => 'array',
        'certifications' => 'array',
        'languages' => 'array',
        'volunteer_interests' => 'array',
        'continue_education' => 'boolean',
        'willing_to_mentor' => 'boolean',
        'agreement' => 'boolean',
        'newsletter' => 'boolean',
        'contact_permission' => 'boolean',
        'is_messaging_restricted' => 'boolean',
        'career_last_edited_at' => 'datetime',
        
    ];

    protected $appends = ['profile_image_url', 'full_name', 'document_urls', 'is_online', 'last_active'];

    // Relationships
    public function documents()
    {
        return $this->hasMany(AlumniDocument::class);
    }

    // Accessor Methods

    /**
     * Get the full name attribute
     */
    public function getFullNameAttribute()
    {
        $name = $this->first_name;

        if (!empty($this->middle_name)) {
            $name .= ' ' . $this->middle_name;
        }

        $name .= ' ' . $this->last_name;

        if (!empty($this->suffix)) {
            $name .= ' ' . $this->suffix;
        }

        return trim($name);
    }

    /**
     * Get the profile image URL attribute
     */
    public function getProfileImageUrlAttribute()
    {
        if (!$this->profile_image) {
            return null;
        }

        if (filter_var($this->profile_image, FILTER_VALIDATE_URL)) {
            return $this->profile_image;
        }

        return asset('storage/' . $this->profile_image);
    }

    /**
     * Get document URLs with full file paths
     */
    public function getDocumentUrlsAttribute()
    {
        if (!$this->relationLoaded('documents')) {
            $this->load('documents');
        }

        return $this->documents->map(function ($document) {
            return [
                'id' => $document->id,
                'document_type' => $document->document_type,
                'file_name' => $document->file_name,
                'file_path' => $document->file_path,
                'file_url' => asset('storage/' . $document->file_path),
                'status' => $document->status,
                'rejection_reason' => $document->rejection_reason,
                'created_at' => $document->created_at,
            ];
        });
    }


    
    /**
     * Get online status from related user
     */
    public function getIsOnlineAttribute()
    {
        return $this->user ? $this->user->online_status : false;
    }

    /**
     * Get last active timestamp from related user
     */
    public function getLastActiveAttribute()
    {
        return $this->user ? $this->user->last_active_at : null;
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

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('student_id', 'like', "%{$search}%");
        });
    }

    public function scopeWithDocuments($query)
    {
        return $query->with('documents');
    }

    public function scopeWithPendingDocuments($query)
    {
        return $query->with(['documents' => function ($q) {
            $q->where('status', 'pending');
        }]);
    }

    // Employment Status Relationships
    public function employmentStatus()
    {
        return $this->belongsTo(EmploymentStatus::class, 'employment_status_id');
    }

    public function femploymentStatus()
    {
        return $this->belongsTo(EmploymentStatus::class, 'femployment_status_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    // Helper methods for documents
    public function getPendingDocuments()
    {
        return $this->documents()->where('status', 'pending')->get();
    }

    public function getApprovedDocuments()
    {
        return $this->documents()->where('status', 'approved')->get();
    }

    public function hasDocumentType($documentType)
    {
        return $this->documents()->where('document_type', $documentType)->exists();
    }

    public function getDocumentByType($documentType)
    {
        return $this->documents()->where('document_type', $documentType)->first();
    }
}