<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use App\Models\Alumni;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\JobPostApproved;
use App\Mail\JobPostRejected;
use Carbon\Carbon;

class JobPostController extends Controller
{
    /**
     * Helper function to get alumni data from user
     */
    private function getAlumniFromUser($user)
    {
        if (!$user) {
            return null;
        }
        
        $alumni = Alumni::where('email', $user->email)->first();
        
        if ($alumni) {
            return [
                'id' => $alumni->id,
                'user_id' => $user->id,
                'first_name' => $alumni->first_name,
                'last_name' => $alumni->last_name,
                'email' => $alumni->email,
                'phone' => $alumni->phone ?? $alumni->contact_number ?? null,
            ];
        }
        
        return null;
    }

    /**
     * Helper function to add profile image to creator data for alumni
     */
    private function addCreatorProfileImage($jobPost)
    {
        if ($jobPost->creator) {
            // Check if creator is alumni (not admin)
            if ($jobPost->creator->role !== 'admin') {
                // Fetch profile image from Alumni model using user ID or email
                $alumni = Alumni::where('id', $jobPost->creator->id)
                    ->orWhere('email', $jobPost->creator->email)
                    ->first();
                    
                if ($alumni) {
                    $jobPost->creator->profile_image = $alumni->profile_image;
                    $jobPost->creator->profile_image_url = $alumni->profile_image_url;
                    $jobPost->creator->phone = $alumni->phone ?? $alumni->contact_number;
                }
            }
        }
        return $jobPost;
    }

    /**
     * Helper function to add profile images to a collection of job posts
     */
    private function addCreatorProfileImages($posts)
    {
        return $posts->map(function ($jobPost) {
            return $this->addCreatorProfileImage($jobPost);
        });
    }

    /**
     * Public, unauthenticated listing of approved job posts.
     * Used by /public/job-posts (see routes/api.php) for the
     * logged-out home page. Deliberately has NO Auth::user() check —
     * anonymous visitors are expected here. The route that calls this
     * already forces status=approved server-side before this runs, so
     * only approved posts are ever eligible regardless of what query
     * string is sent.
     *
     * SECURITY: deliberately does NOT eager-load the `creator` relation
     * (and skips addCreatorProfileImage(), which used to bolt the
     * poster's phone number onto the response). PublicHomePage.js only
     * ever displays the job's own `company` field, never who posted it,
     * so the poster's name/email/phone never need to leave the server
     * for this endpoint.
     */
    public function publicIndex(Request $request)
    {
        // Column-level allowlist, same approach as EventController::publicIndex.
        // Everything admin-review-only — created_by_user_id, created_by_role,
        // approved_by_user_id, admin_notes, approved_at, reference_source_type,
        // reference_url, verification_notes, status — never leaves the database
        // for this route. JobPost::approved() still filters correctly at the
        // SQL level even though 'status' isn't selected, since WHERE clauses
        // don't depend on the SELECT list.
        //
        // Tightened further to what PublicHomePage.js / PublicJobPostsPage.js
        // actually read off a job card (job.id, job.title, job.banner_image,
        // job.job_type, job.location, job.company, job.description,
        // job.created_at) plus capacity and expires_at, which stay because
        // usePublicHomeData.js / usePublicJobPostsData.js filter on
        // job.is_full / job.is_expired — accessors computed from those two
        // columns. Dropped: requirements, salary_min, salary_max,
        // updated_at — none of them are rendered on either public page.
        $query = JobPost::approved()->select([
            'id',
            'title',
            'description',
            'company',
            'location',
            'job_type',
            'banner_image',
            'capacity',
            'expires_at',
            'created_at',
        ]);

        // PublicHomePage.js's teaser only ever asks for the default page
        // size (latest 4, capped client-side), but the dedicated
        // /public-job-posts page (usePublicJobPostsData.js) needs the FULL
        // approved list so it can group every post into its Full-time /
        // Part-time / Contract section — same per_page pattern already
        // used by EventController::publicIndex for /public/events.
        // Clamped to 200 so a crafted query string can't force an
        // unbounded query.
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1) {
            $perPage = 10;
        }
        $perPage = min($perPage, 200);

        $jobPosts = $query->latest()->paginate($perPage);

        return response()->json($jobPosts);
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = JobPost::query();
        $isAdmin = $user->role === 'admin';

        if ($isAdmin) {
            $query->with(['creator', 'applications.alumni']);
        } else {
            $query->approved()->with(['creator', 'applications.alumni']);
        }

        if ($isAdmin && $request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('company', 'like', "%{$searchTerm}%");
            });
        }

        $jobPosts = $query->latest()->paginate(10);
        
        // Add profile images to creators
        $jobPosts->getCollection()->transform(function ($jobPost) {
            return $this->addCreatorProfileImage($jobPost);
        });

        return response()->json($jobPosts);
    }

    public function show($id)
    {
        $jobPost = JobPost::with(['creator', 'applications.alumni'])
            ->findOrFail($id);
        
        // Add profile image to creator
        $jobPost = $this->addCreatorProfileImage($jobPost);
        
        return response()->json($jobPost);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'company' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'requirements' => 'required|string',
            'job_type' => 'required|in:Full-time,Part-time,Contract',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'capacity' => 'nullable|integer|min:1',
            'expiration_days' => 'nullable|integer|min:1',
            // ============ Job Post Verification System ============
            'reference_source_type' => 'nullable|string|max:100',
            'reference_url' => 'nullable|url|max:2000',
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        $isAdmin = $user->role === 'admin';
        $status = $isAdmin ? 'approved' : 'pending';

        // Handle banner image upload
        $bannerImagePath = null;
        if ($request->hasFile('banner_image')) {
            $bannerImagePath = $request->file('banner_image')->store('job_posts/banners', 'public');
        }

        // Calculate expiration date if days provided
        $expiresAt = null;
        if ($request->filled('expiration_days')) {
            $expiresAt = Carbon::now()->addDays((int) $request->expiration_days);
        }

        $jobPost = JobPost::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'company' => $validated['company'],
            'location' => $validated['location'] ?? null,
            'requirements' => $validated['requirements'],
            'job_type' => $validated['job_type'],
            'salary_min' => $validated['salary_min'] ?? null,
            'salary_max' => $validated['salary_max'] ?? null,
            'banner_image' => $bannerImagePath,
            'status' => $status,
            'created_by_user_id' => $user->id,
            'created_by_role' => $isAdmin ? 'admin' : 'alumni',
            'approved_at' => $isAdmin ? now() : null,
            'approved_by_user_id' => $isAdmin ? $user->id : null,
            'capacity' => $validated['capacity'] ?? null,
            'expires_at' => $expiresAt,
            // ============ Job Post Verification System ============
            'reference_source_type' => $validated['reference_source_type'] ?? null,
            'reference_url' => $validated['reference_url'] ?? null,
            'verification_notes' => $validated['verification_notes'] ?? null,
        ]);

        // Load creator relationship and add profile image
        $jobPost->load('creator');
        $jobPost = $this->addCreatorProfileImage($jobPost);

        return response()->json($jobPost, 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $jobPost = JobPost::findOrFail($id);

        // Check if user can edit this post
        if ($user->role !== 'admin' && $jobPost->created_by_user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to edit this post'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'company' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'requirements' => 'required|string',
            'job_type' => 'required|in:Full-time,Part-time,Contract',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'capacity' => 'nullable|integer|min:1',
            'expiration_days' => 'nullable|integer|min:1',
            // ============ Job Post Verification System ============
            'reference_source_type' => 'nullable|string|max:100',
            'reference_url' => 'nullable|url|max:2000',
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        // Handle banner image upload
        if ($request->hasFile('banner_image')) {
            // Delete old image if exists
            if ($jobPost->banner_image) {
                Storage::disk('public')->delete($jobPost->banner_image);
            }
            $validated['banner_image'] = $request->file('banner_image')->store('job_posts/banners', 'public');
        }

        // Handle capacity
        $validated['capacity'] = $validated['capacity'] ?? null;

        // Calculate expiration date if days provided
        if ($request->filled('expiration_days')) {
            $validated['expires_at'] = Carbon::now()->addDays((int) $request->expiration_days);
        } else {
            $validated['expires_at'] = null;
        }

        // Remove expiration_days from validated as it's not a column
        unset($validated['expiration_days']);

        // If alumni edits, reset to pending
        if ($user->role !== 'admin') {
            $validated['status'] = 'pending';
            $validated['approved_at'] = null;
            $validated['approved_by_user_id'] = null;
        }

        $jobPost->update($validated);

        // Load creator relationship and add profile image
        $jobPost->load('creator');
        $jobPost = $this->addCreatorProfileImage($jobPost);

        return response()->json($jobPost);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $jobPost = JobPost::findOrFail($id);

        // Check if user can delete this post
        if ($user->role !== 'admin' && $jobPost->created_by_user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to delete this post'], 403);
        }

        // Delete banner image if exists
        if ($jobPost->banner_image) {
            Storage::disk('public')->delete($jobPost->banner_image);
        }

        $jobPost->delete();

        return response()->json(['message' => 'Job post deleted successfully']);
    }

    public function myPostings()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $posts = JobPost::where('created_by_user_id', $user->id)
            ->with(['creator', 'applications.alumni'])
            ->latest()
            ->get();

        // Add profile images to creators
        $posts = $this->addCreatorProfileImages($posts);

        return response()->json(['data' => $posts]);
    }

    public function pendingPosts()
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Only admins can view pending posts'], 403);
        }

        $posts = JobPost::pending()
            ->with(['creator', 'applications.alumni'])
            ->latest()
            ->get();

        // Add profile images to creators
        $posts = $this->addCreatorProfileImages($posts);

        return response()->json(['data' => $posts]);
    }

    /**
     * Get full or expired posts for the current user
     */
    public function fullOrExpiredPosts()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = JobPost::fullOrExpired()->with(['creator', 'applications.alumni']);

        // If not admin, only show their own posts
        if ($user->role !== 'admin') {
            $query->where('created_by_user_id', $user->id);
        }

        $posts = $query->latest()->get();

        // Add profile images to creators
        $posts = $this->addCreatorProfileImages($posts);

        return response()->json(['data' => $posts]);
    }

    public function approve($id)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Only admins can approve posts'], 403);
        }

        $jobPost = JobPost::with('creator')->findOrFail($id);
        
        $jobPost->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by_user_id' => $user->id,
        ]);

        // Send approval email to the alumni who created the post
        $this->sendApprovalEmail($jobPost);

        // Load creator relationship and add profile image
        $jobPost->load('creator');
        $jobPost = $this->addCreatorProfileImage($jobPost);

        return response()->json($jobPost);
    }

    public function reject(Request $request, $id)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Only admins can reject posts'], 403);
        }

        $validated = $request->validate([
            'admin_notes' => 'required|string|min:10|max:1000',
        ]);

        $jobPost = JobPost::with('creator')->findOrFail($id);
        
        $jobPost->update([
            'status' => 'rejected',
            'admin_notes' => $validated['admin_notes'],
        ]);

        // Send rejection email to the alumni who created the post
        $this->sendRejectionEmail($jobPost, $validated['admin_notes']);

        // Load creator relationship and add profile image
        $jobPost->load('creator');
        $jobPost = $this->addCreatorProfileImage($jobPost);

        return response()->json($jobPost);
    }

    /**
     * Send approval email to the job post creator
     */
    private function sendApprovalEmail(JobPost $jobPost)
    {
        try {
            if (!$jobPost->creator || $jobPost->created_by_role === 'admin') {
                return; // Don't send email if creator is admin
            }

            $alumni = $this->getAlumniFromUser($jobPost->creator);
            
            if (!$alumni || !$alumni['email']) {
                Log::warning('Could not send approval email - no alumni email found for job post: ' . $jobPost->id);
                return;
            }

            Mail::to($alumni['email'])->send(new JobPostApproved($jobPost, $alumni));
            
            Log::info('Job post approval email sent to: ' . $alumni['email']);
            
        } catch (\Exception $e) {
            Log::error('Failed to send job post approval email: ' . $e->getMessage());
        }
    }

    /**
     * Send rejection email to the job post creator
     */
    private function sendRejectionEmail(JobPost $jobPost, string $adminNotes)
    {
        try {
            if (!$jobPost->creator || $jobPost->created_by_role === 'admin') {
                return; // Don't send email if creator is admin
            }

            $alumni = $this->getAlumniFromUser($jobPost->creator);
            
            if (!$alumni || !$alumni['email']) {
                Log::warning('Could not send rejection email - no alumni email found for job post: ' . $jobPost->id);
                return;
            }

            Mail::to($alumni['email'])->send(new JobPostRejected($jobPost, $alumni, $adminNotes));
            
            Log::info('Job post rejection email sent to: ' . $alumni['email']);
            
        } catch (\Exception $e) {
            Log::error('Failed to send job post rejection email: ' . $e->getMessage());
        }
    }
}