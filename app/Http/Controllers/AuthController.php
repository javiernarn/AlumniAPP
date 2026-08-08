<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Faculties;
use App\Models\Alumni;
use App\Models\Coaches;
use App\Models\Notification;
use App\Models\User;
use App\Models\Course;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;

class AuthController extends Controller
{

    public function login(Request $request)
    {
        $this->checkTooManyFailedAttempts();
        
        $email = $request->email;
        $password = $request->password;

        $user = User::where('email', $email)->first();

        if (!$user) {
            RateLimiter::hit($this->throttleKey(), $seconds = 3600);
            return response(['message' => 'This account has not been registered'], 403);
        }

        if (!Hash::check($password, $user->password)) {
            RateLimiter::hit($this->throttleKey(), $seconds = 3600);
            return response(['message' => 'Wrong password'], 403);
        }

        $loginData = array(
            'email' => $email,
            'password' => $password
        );

        if (!auth()->attempt($loginData)) {
            RateLimiter::hit($this->throttleKey(), $seconds = 3600);
            return response(['message' => 'Invalid Credentials'], 403);
        }

        RateLimiter::clear($this->throttleKey());
        $user = auth()->user();
        $accessToken = $user->createToken('authToken')->accessToken;

        // Update user's online status
        $user->update([
            'last_active_at' => Carbon::now(),
            'is_online' => true,
        ]);

        $responseData = [
            'user' => $user,
            'access_token' => $accessToken
        ];

        if ($user->role === 'department_head') {
            $responseData['course_id'] = $user->course_id;
            
            $this->notifyAdminsAboutDepartmentHeadLogin($user);
            
            return response($responseData, 200);
        }

        if ($user->role === 'alumni') {
            $alumni = Alumni::where('user_id', $user->id)->firstOrFail();

            if ($alumni->status === 'pending') {
                $this->notifyAdminsAboutPendingAlumniLogin($alumni);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Your alumni account is pending approval. Please wait for administrator approval. You will be notified via email once your account has been approved!'
                ], 403);
            }

            if ($alumni->status === 'inactive') {
                return response()->json([
                    'success' => false,
                    'message' => 'Your alumni account is inactive. Please contact administrator to reactivate your account.'
                ], 403);
            }

            if ($alumni->status === 'rejected') {
                // Frontend (FormLogin.js) detects the "REJECTED::" prefix and
                // pops up the Account Rejected modal, displaying the admin notes
                // and instructing the alumni to contact the Administrator Office.
                $adminNotes = $alumni->admin_notes ?: 'No additional notes were provided by the administrator.';
                return response()->json([
                    'success' => false,
                    'message' => 'REJECTED::' . $adminNotes,
                ], 403);
            }

            $responseData['alumni_id'] = $alumni->id;
            
            $this->notifyAdminsAboutAlumniLogin($alumni);
        }

        return response($responseData, 200);
    }

    /**
     * Logout user and set offline status
     */
    public function logout(Request $request)
    {
        try {
            $user = auth()->user();
            
            if ($user) {
                // Set user as offline
                $user->update([
                    'is_online' => false,
                ]);
                
                // Revoke the token
                $user->token()->revoke();
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Successfully logged out'
            ], 200);
        } catch (Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error during logout'
            ], 500);
        }
    }

    /**
     * Heartbeat endpoint to update user's last active status
     */
    public function heartbeat(Request $request)
    {
        try {
            $user = auth()->user();
            
            if ($user) {
                $user->update([
                    'last_active_at' => Carbon::now(),
                    'is_online' => true,
                ]);
                
                return response()->json([
                    'success' => true,
                    'last_active_at' => $user->last_active_at,
                    'is_online' => true
                ], 200);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        } catch (Exception $e) {
            Log::error('Heartbeat error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating heartbeat'
            ], 500);
        }
    }

    private function notifyAdminsAboutDepartmentHeadLogin($user)
    {
        try {
            $admins = User::where('role', 'admin')->get();

            if ($admins->isEmpty()) {
                Log::info('No admin users found to notify about department head login');
                return;
            }

            $departmentHeadName = $user->name;
            $course = Course::find($user->course_id);
            $courseName = $course ? $course->course_name : 'Unknown Course';
            $courseCode = $course ? $course->course_code : 'N/A';

            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'notifiable_type' => 'App\Models\User',
                    'title' => 'Department Head Login',
                    'message' => "{$departmentHeadName} ({$courseCode}) has logged into their department head account.",
                    'data' => [
                        'user_id' => $user->id,
                        'department_head_name' => $departmentHeadName,
                        'department_head_email' => $user->email,
                        'course_id' => $user->course_id,
                        'course_code' => $courseCode,
                        'course_name' => $courseName,
                        'type' => 'department_head_login'
                    ],
                    'read' => false,
                    'read_at' => null,
                ]);
            }

            Log::info("Department head login notifications sent to " . $admins->count() . " admins for: {$departmentHeadName} ({$courseCode})");

        } catch (\Exception $e) {
            Log::error('Failed to create admin notifications for department head login: ' . $e->getMessage());
        }
    }

    private function notifyAdminsAboutPendingAlumniLogin($alumni)
    {
        try {
            $admins = User::where('role', 'admin')->get();

            if ($admins->isEmpty()) {
                Log::info('No admin users found to notify about pending alumni login attempt');
                return;
            }

            $alumniName = $alumni->first_name . ' ' . $alumni->last_name;
            $profileImageUrl = $alumni->profile_image_url;

            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'notifiable_type' => 'App\Models\Alumni',
                    'title' => 'Pending Alumni Login Attempt',
                    'message' => "{$alumniName} is waiting for account approval. They attempted to login but their account is still pending.",
                    'data' => [
                        'alumni_id' => $alumni->id,
                        'alumni_name' => $alumniName,
                        'alumni_email' => $alumni->email,
                        'alumni_profile_image' => $profileImageUrl,
                        'type' => 'pending_alumni_login'
                    ],
                    'read' => false,
                    'read_at' => null,
                ]);
            }

            Log::info("Pending alumni login notifications sent to " . $admins->count() . " admins for alumni: {$alumniName}");

        } catch (\Exception $e) {
            Log::error('Failed to create admin notifications for pending alumni login: ' . $e->getMessage());
        }
    }

    private function notifyAdminsAboutAlumniLogin($alumni)
    {
        try {
            $admins = User::where('role', 'admin')->get();

            if ($admins->isEmpty()) {
                Log::info('No admin users found to notify about alumni login');
                return;
            }

            $alumniName = $alumni->first_name . ' ' . $alumni->last_name;
            $profileImageUrl = $alumni->profile_image_url;

            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'notifiable_type' => 'App\Models\Alumni',
                    'title' => 'Alumni Login',
                    'message' => "{$alumniName} has logged into their alumni account.",
                    'data' => [
                        'alumni_id' => $alumni->id,
                        'alumni_name' => $alumniName,
                        'alumni_email' => $alumni->email,
                        'alumni_profile_image' => $profileImageUrl,
                        'type' => 'alumni_login'
                    ],
                    'read' => false,
                    'read_at' => null,
                ]);
            }

            Log::info("Alumni login notifications sent to " . $admins->count() . " admins for alumni: {$alumniName}");

        } catch (\Exception $e) {
            Log::error('Failed to create admin notifications for alumni login: ' . $e->getMessage());
        }
    }

    /**
     * Explicitly mark the current user as offline.
     * Called when the browser tab is closed / page is unloaded (via keepalive fetch).
     * Does NOT revoke the token — the user can come back and be marked online again.
     */
    public function setOffline(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user) {
                $user->update([
                    'is_online' => false,
                ]);

                return response()->json([
                    'success' => true,
                    'message'  => 'User set to offline',
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        } catch (Exception $e) {
            Log::error('Set-offline error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error setting offline status',
            ], 500);
        }
    }

    public function throttleKey()
    {
        return Str::lower(request('email')) . '|' . request()->ip();
    }

    public function checkTooManyFailedAttempts()
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        throw new Exception('IP address banned. Too many login attempts.');
    }
}
