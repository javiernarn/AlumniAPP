<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use App\Models\Alumni;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DepartmentHeadController extends Controller
{
    /**
     * Display a listing of department heads.
     */
    public function index()
    {
        try {
            $departmentHeads = User::where('role', 'department_head')
                ->with('course')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'course_id' => $user->course_id,
                        'course' => $user->course,
                        'is_online' => (bool) $user->is_online,
                        'last_active_at' => $user->last_active_at,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $departmentHeads
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch department heads: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch department heads'
            ], 500);
        }
    }

    /**
     * Store a newly created department head.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'course_id' => 'required|exists:courses,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if a department head already exists for this course
            $existingHead = User::where('role', 'department_head')
                ->where('course_id', $request->course_id)
                ->first();

            if ($existingHead) {
                $course = Course::find($request->course_id);
                return response()->json([
                    'success' => false,
                    'message' => "A department head already exists for {$course->course_code}. Please delete the existing one first."
                ], 422);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'department_head',
                'course_id' => $request->course_id,
                'email_verified_at' => now(),
            ]);

            $user->load('course');

            return response()->json([
                'success' => true,
                'message' => 'Department head created successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'course_id' => $user->course_id,
                    'course' => $user->course,
                    'is_online' => (bool) $user->is_online,
                    'last_active_at' => $user->last_active_at,
                    'created_at' => $user->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create department head: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create department head',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update the specified department head.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:6',
            'course_id' => 'sometimes|required|exists:courses,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('id', $id)
                ->where('role', 'department_head')
                ->firstOrFail();

            // Check if changing course and if new course already has a head
            if ($request->has('course_id') && $request->course_id != $user->course_id) {
                $existingHead = User::where('role', 'department_head')
                    ->where('course_id', $request->course_id)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingHead) {
                    $course = Course::find($request->course_id);
                    return response()->json([
                        'success' => false,
                        'message' => "A department head already exists for {$course->course_code}."
                    ], 422);
                }
            }

            $updateData = $request->only(['name', 'email', 'course_id']);

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);
            $user->load('course');

            return response()->json([
                'success' => true,
                'message' => 'Department head updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'course_id' => $user->course_id,
                    'course' => $user->course,
                    'is_online' => (bool) $user->is_online,
                    'last_active_at' => $user->last_active_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update department head: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update department head'
            ], 500);
        }
    }

    /**
     * Remove the specified department head.
     */
    public function destroy($id)
    {
        try {
            $user = User::where('id', $id)
                ->where('role', 'department_head')
                ->firstOrFail();

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Department head deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete department head: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete department head'
            ], 500);
        }
    }

    /**
     * Get dashboard data for department head (filtered by course)
     */
    public function dashboard(Request $request)
    {
        try {
            $user = auth()->user();

            // <CHANGE> Better null check and error message
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            if ($user->role !== 'department_head') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Not a department head'
                ], 403);
            }

            // <CHANGE> Return empty data if no course assigned instead of error
            if (!$user->course_id) {
                return response()->json([
                    'success' => true,
                    'alumni' => [],
                    'course' => null,
                    'total' => 0,
                ]);
            }

            $courseId = $user->course_id;
            $year = $request->get('year', 'all');

            $query = Alumni::where('course_id', $courseId)
                ->where('status', 'approved'); // <CHANGE> Added status filter

            if ($year !== 'all') {
                $query->where('graduation_year', $year);
            }

            // <CHANGE> Removed problematic relationships - just get alumni data
            $alumni = $query->get();

            // profile_image_url is an accessor on the Alumni model but is
            // not in its default $appends, so it's silently dropped when
            // serializing raw models to JSON (unlike the /department-head/
            // alumni endpoint, which goes through AlumniDepartmentHeadResource
            // and explicitly includes it). Append it here too so the
            // dashboard actually gets each alumnus's photo.
            $alumni->each->append('profile_image_url');

            $course = Course::find($courseId);

            return response()->json([
                'success' => true,
                'alumni' => $alumni,
                'course' => $course,
                'total' => $alumni->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch department head dashboard: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get alumni list for department head (filtered by their course)
     */
    public function alumni(Request $request)
    {
        try {
            $user = auth()->user();

            // <CHANGE> Better null check
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            if ($user->role !== 'department_head') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Not a department head'
                ], 403);
            }

            // <CHANGE> Return empty data if no course assigned
            if (!$user->course_id) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // <CHANGE> Removed problematic relationships, added status filter
            $alumni = Alumni::where('course_id', $user->course_id)
                ->where('status', 'approved')
                ->get();

            return response()->json([
                'success' => true,
                // Phase 5: was a raw model dump (full contact info,
                // admin_notes, documents, everything) even though the
                // query itself was already correctly course-scoped.
                // AlumniDepartmentHeadResource keeps the scoping and
                // drops everything a department head doesn't need.
                'data' => \App\Http\Resources\Alumni\AlumniDepartmentHeadResource::collection($alumni)
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch department head alumni: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch alumni data',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}