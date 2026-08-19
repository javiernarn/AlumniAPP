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
use App\Models\AuditLog;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cookie;
use App\Http\Middleware\TokenFromAuthCookie;
use Exception;

class AuthController extends Controller
{

    public function login(Request $request)
    {
        // Phase 4: login attempts are now rate-limited by the `login`
        // named limiter (throttle:login middleware, see
        // routes/api.php + RouteServiceProvider::configureRateLimiting).
        // The previous manual implementation here
        // (checkTooManyFailedAttempts() + scattered RateLimiter::hit()
        // calls) had a real bug: on lockout it threw a bare \Exception,
        // which Laravel's default handler renders as an uncaught 500,
        // not a proper 429. The middleware handles this correctly
        // (429 + Retry-After header) before the request even reaches
        // this method.
        $email = $request->email;
        $password = $request->password;

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response(['message' => 'This account has not been registered'], 403);
        }

        if (!Hash::check($password, $user->password)) {
            return response(['message' => 'Wrong password'], 403);
        }

        $loginData = array(
            'email' => $email,
            'password' => $password
        );

        if (!auth()->attempt($loginData)) {
            return response(['message' => 'Invalid Credentials'], 403);
        }

        $user = auth()->user();
        $accessToken = $user->createToken('authToken')->accessToken;

        // Phase 6: set the token as an HttpOnly, Secure, SameSite=Strict
        // cookie IN ADDITION to returning it in the JSON body below. The
        // web frontend is updated (see resources/js) to stop reading
        // `access_token` from the response and rely on this cookie
        // instead — JavaScript never touches the token at all, closing
        // the XSS-token-theft vector. The JSON field is kept so the
        // mobile app (which has no browser cookie jar and must store the
        // token itself in native secure storage) keeps working exactly
        // as before; only a browser client can ever receive this cookie.
        //
        // 'secure' is tied to APP_ENV rather than hardcoded true so this
        // still works over plain HTTP in local development — production
        // must run over HTTPS for this flag to have any effect, which
        // Phase 7 (transport security) covers.
        Cookie::queue(Cookie::make(
            TokenFromAuthCookie::COOKIE_NAME,
            $accessToken,
            60 * 24 * 14, // 14 days — matches Passport's default password-grant token lifetime
            '/',
            null,
            app()->environment('production'),
            true,   // HttpOnly — never readable by JavaScript
            false,
            'Strict' // same-origin SPA: no legitimate cross-site use for this cookie
        ));

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

            $this->logAudit($request, $user, 'login');

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

            $this->logAudit($request, $user, 'login', $alumni);
        }

        if ($user->role === 'admin') {
            $this->logAudit($request, $user, 'login');
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

                if (in_array($user->role, ['alumni', 'department_head', 'admin'], true)) {
                    $alumni = $user->role === 'alumni'
                        ? Alumni::where('user_id', $user->id)->first()
                        : null;

                    $this->logAudit($request, $user, 'logout', $alumni);
                }

                // Revoke the token
                $user->token()->revoke();
            }

            // Phase 6: clear the HttpOnly auth cookie on logout so a
            // stale cookie can't keep authenticating the browser after
            // the underlying Passport token has been revoked server-side
            // above.
            Cookie::queue(Cookie::forget(TokenFromAuthCookie::COOKIE_NAME));
            
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

    /**
     * Write one audit-log entry for a login or logout.
     *
     * Alumni and department-head logins/logouts used to each create an
     * admin Notification row (see the removed
     * notifyAdminsAbout*Login methods below in git history). With
     * hundreds of alumni, that flooded the admin notification bell to
     * the point real notifications (messages, event registrations,
     * etc.) got buried. This writes to the dedicated audit_logs table
     * instead — visible on the admin Audit Log page, filterable by
     * role/action/date, and no longer competing for space in the bell.
     */
    private function logAudit(Request $request, User $user, string $action, ?Alumni $alumni = null): void
    {
        $courseCode = null;
        if ($user->role === 'department_head' && $user->course_id) {
            $course = Course::find($user->course_id);
            $courseCode = $course->course_code ?? null;
        }

        $name = $user->role === 'alumni' && $alumni
            ? trim($alumni->first_name . ' ' . $alumni->last_name)
            : $user->name;

        AuditLog::record([
            'user_id' => $user->id,
            'alumni_id' => $alumni->id ?? null,
            'name' => $name ?: $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'course_code' => $courseCode,
            'action' => $action,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'occurred_at' => now(),
        ]);
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
}
