<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class GalleryController extends Controller
{
    // Get all galleries (for all roles)
    public function index(Request $request)
    {
        $query = Gallery::with('uploader:id,name,email')
            ->where('status', 'active')
            ->orderBy('created_at', 'desc');

        // Search filter (title or organization)
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', '%' . $searchTerm . '%')
                  ->orWhere('organization_name', 'like', '%' . $searchTerm . '%');
            });
        }

        // Date filter
        if ($request->has('year') && $request->year) {
            $query->whereYear('event_date', $request->year);
        }

        if ($request->has('month') && $request->month) {
            $query->whereMonth('event_date', $request->month);
        }

        $galleries = $query->paginate($request->get('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => $galleries,
        ]);
    }

    /**
     * Public, unauthenticated listing of galleries for the logged-out
     * home page AND the dedicated /public-gallery page. Used by
     * /public/galleries (see routes/api.php).
     *
     * SECURITY: deliberately does NOT eager-load the `uploader` relation
     * at all — neither PublicHomePage.js nor PublicGalleryPage.js display
     * uploader name/email, so nothing about the uploading account is
     * fetched from the database in the first place, rather than being
     * fetched and then trimmed.
     */
    public function publicIndex(Request $request)
    {
        // Column-level allowlist, same pattern as EventController and
        // JobPostController. PublicHomePage.js (getGalleryImageList,
        // gallery.map in the grid) and PublicGalleryPage.js /
        // usePublicGalleryData.js only ever read g.id, g.title,
        // g.image_urls / g.image_url, g.created_at, and now g.event_date
        // (added so the gallery page can bucket albums into Latest /
        // Ongoing / Completed the same way usePublicEventsData.js does
        // for events) — so that's all that's selected here.
        //
        // event_date is the date of the alumni event an album documents;
        // it isn't personal/account data, so exposing it publicly is safe
        // and is the same information already implied by "Published: …"
        // dates shown on the homepage teaser.
        //
        // image_path / image_paths ARE selected because the image_url /
        // image_urls accessors are computed from them, but they're then
        // stripped with makeHidden() before the response goes out, so the
        // raw storage paths never actually reach the response body.
        // uploaded_by (an internal user id), original_name, file_type,
        // file_size, status, organization_name, and updated_at are
        // dropped entirely — not fetched, not hidden.
        $query = Gallery::where('status', 'active')
            ->select(['id', 'title', 'image_path', 'image_paths', 'event_date', 'created_at'])
            ->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', '%' . $searchTerm . '%')
                  ->orWhere('organization_name', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->has('year') && $request->year) {
            $query->whereYear('event_date', $request->year);
        }

        if ($request->has('month') && $request->month) {
            $query->whereMonth('event_date', $request->month);
        }

        $galleries = $query->paginate($request->get('per_page', 12));

        $galleries->getCollection()->transform(function ($gallery) {
            return $gallery->makeHidden(['image_path', 'image_paths']);
        });

        return response()->json([
            'success' => true,
            'data' => $galleries,
        ]);
    }

    // Get single gallery
    public function show($id)
    {
        $gallery = Gallery::with('uploader:id,name,email')->find($id);

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Gallery not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $gallery,
        ]);
    }

    // Upload gallery (admin only) - Stores multiple images in ONE gallery entry
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can upload images.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'organization_name' => 'nullable|string|max:255',
            'images' => 'required|array|min:1|max:20',
            'images.*' => 'required|image|mimes:png,jpg,jpeg,gif,webp|max:10240',
            'event_date' => 'required|date',
        ], [
            'title.required' => 'The title field is required.',
            'images.required' => 'Please select at least one image to upload.',
            'images.min' => 'Please select at least one image to upload.',
            'images.*.required' => 'Each image file is required.',
            'images.*.image' => 'Each file must be a valid image.',
            'images.*.mimes' => 'Only PNG, JPG, JPEG, GIF and WEBP files are allowed.',
            'images.*.max' => 'Each image must be less than 10MB.',
            'event_date.required' => 'The event date field is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $uploadedPaths = [];
        $totalSize = 0;
        $firstOriginalName = null;
        $firstFileType = null;

        foreach ($request->file('images') as $index => $file) {
            $originalName = $file->getClientOriginalName();
            $fileType = strtolower($file->getClientOriginalExtension());
            $fileSize = $file->getSize();
            $fileName = time() . '_' . uniqid() . '_' . $index . '.' . $fileType;
            $filePath = $file->storeAs('galleries', $fileName, 'public');

            $uploadedPaths[] = $filePath;
            $totalSize += $fileSize;

            // Store first file info for backward compatibility
            if ($index === 0) {
                $firstOriginalName = $originalName;
                $firstFileType = $fileType;
            }
        }

        // Create a single gallery entry with all images
        $gallery = Gallery::create([
            'title' => $request->title,
            'organization_name' => $request->organization_name,
            'image_path' => $uploadedPaths[0], // First image for backward compatibility
            'image_paths' => $uploadedPaths,   // All images as JSON array
            'original_name' => $firstOriginalName,
            'file_type' => $firstFileType,
            'file_size' => $totalSize,
            'uploaded_by' => $user->id,
            'event_date' => $request->event_date,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => count($uploadedPaths) . ' image(s) uploaded successfully',
            'data' => $gallery->load('uploader:id,name,email'),
        ], 201);
    }

    // Update gallery (admin only) - Supports adding/replacing images
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can update images.',
            ], 403);
        }

        $gallery = Gallery::find($id);

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Gallery not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'organization_name' => 'nullable|string|max:255',
            'images' => 'sometimes|array|max:20',
            'images.*' => 'image|mimes:png,jpg,jpeg,gif,webp|max:10240',
            'event_date' => 'sometimes|required|date',
            'replace_images' => 'sometimes|boolean', // If true, replace all images; if false, append
        ], [
            'title.required' => 'The title field is required.',
            'images.*.image' => 'Each file must be a valid image.',
            'images.*.mimes' => 'Only PNG, JPG, JPEG, GIF and WEBP files are allowed.',
            'images.*.max' => 'Each image must be less than 10MB.',
            'event_date.required' => 'The event date field is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->hasFile('images')) {
            $replaceImages = $request->boolean('replace_images', true);
            $existingPaths = $gallery->image_paths ?? [];
            $totalSize = $replaceImages ? 0 : $gallery->file_size;

            // Delete old files if replacing
            if ($replaceImages && !empty($existingPaths)) {
                foreach ($existingPaths as $oldPath) {
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }
                $existingPaths = [];
            }

            // Upload new images
            $newPaths = [];
            foreach ($request->file('images') as $index => $file) {
                $fileName = time() . '_' . uniqid() . '_' . $index . '.' . strtolower($file->getClientOriginalExtension());
                $filePath = $file->storeAs('galleries', $fileName, 'public');
                $newPaths[] = $filePath;
                $totalSize += $file->getSize();
            }

            // Merge paths
            $allPaths = array_merge($existingPaths, $newPaths);

            $gallery->image_paths = $allPaths;
            $gallery->image_path = $allPaths[0]; // First image for backward compatibility
            $gallery->file_size = $totalSize;

            if (count($newPaths) > 0) {
                $firstNewFile = $request->file('images')[0];
                $gallery->original_name = $firstNewFile->getClientOriginalName();
                $gallery->file_type = strtolower($firstNewFile->getClientOriginalExtension());
            }
        }

        if ($request->has('title')) {
            $gallery->title = $request->title;
        }

        if ($request->has('organization_name')) {
            $gallery->organization_name = $request->organization_name;
        }

        if ($request->has('event_date')) {
            $gallery->event_date = $request->event_date;
        }

        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'Gallery updated successfully',
            'data' => $gallery->load('uploader:id,name,email'),
        ]);
    }

    // Delete gallery (admin only)
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can delete images.',
            ], 403);
        }

        $gallery = Gallery::find($id);

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Gallery not found',
            ], 404);
        }

        // Delete all image files from storage
        if ($gallery->image_paths && is_array($gallery->image_paths)) {
            foreach ($gallery->image_paths as $path) {
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        } elseif ($gallery->image_path && Storage::disk('public')->exists($gallery->image_path)) {
            // Fallback for single image
            Storage::disk('public')->delete($gallery->image_path);
        }

        $gallery->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gallery deleted successfully',
        ]);
    }

    // Download single image from gallery
    public function download($id, Request $request)
    {
        $gallery = Gallery::find($id);

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Gallery not found',
            ], 404);
        }

        // Get image index (default to 0 for first image)
        $imageIndex = $request->get('index', 0);
        $imagePaths = $gallery->image_paths ?? [$gallery->image_path];

        if ($imageIndex >= count($imagePaths)) {
            return response()->json([
                'success' => false,
                'message' => 'Image index out of range',
            ], 404);
        }

        $filePath = storage_path('app/public/' . $imagePaths[$imageIndex]);

        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        $filename = $gallery->title . '_' . ($imageIndex + 1) . '.' . pathinfo($imagePaths[$imageIndex], PATHINFO_EXTENSION);
        return response()->download($filePath, $filename);
    }

    // Delete single image from gallery (admin only)
    public function deleteImage($id, Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can delete images.',
            ], 403);
        }

        $gallery = Gallery::find($id);

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Gallery not found',
            ], 404);
        }

        $imageIndex = $request->get('index', 0);
        $imagePaths = $gallery->image_paths ?? [];

        if ($imageIndex >= count($imagePaths)) {
            return response()->json([
                'success' => false,
                'message' => 'Image index out of range',
            ], 404);
        }

        // Delete the file
        $pathToDelete = $imagePaths[$imageIndex];
        if (Storage::disk('public')->exists($pathToDelete)) {
            Storage::disk('public')->delete($pathToDelete);
        }

        // Remove from array
        array_splice($imagePaths, $imageIndex, 1);

        // If no images left, delete the gallery
        if (count($imagePaths) === 0) {
            $gallery->delete();
            return response()->json([
                'success' => true,
                'message' => 'Gallery deleted (no images remaining)',
            ]);
        }

        // Update gallery
        $gallery->image_paths = $imagePaths;
        $gallery->image_path = $imagePaths[0];
        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully',
            'data' => $gallery->load('uploader:id,name,email'),
        ]);
    }

    // Get gallery statistics (admin only)
    public function statistics()
    {
        $galleries = Gallery::where('status', 'active')->get();
        
        $totalImages = 0;
        foreach ($galleries as $gallery) {
            $imagePaths = $gallery->image_paths ?? [];
            $totalImages += count($imagePaths) > 0 ? count($imagePaths) : 1;
        }
        
        $totalSize = Gallery::where('status', 'active')->sum('file_size');
        $totalGalleries = $galleries->count();
        $thisMonthUploads = Gallery::where('status', 'active')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_galleries' => $totalGalleries,
                'total_images' => $totalImages,
                'total_size' => $this->formatBytes($totalSize),
                'this_month_uploads' => $thisMonthUploads,
            ],
        ]);
    }

    private function formatBytes($bytes)
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' bytes';
    }
}