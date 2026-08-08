<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Alumni;
use App\Models\User;
use App\Models\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\PasswordResetMail;

class PasswordResetController extends Controller
{
    private function getAlumniFullName($alumni)
    {
        $nameParts = [];
        if ($alumni->first_name) {
            $nameParts[] = $alumni->first_name;
        }
        if ($alumni->middle_name) {
            $nameParts[] = $alumni->middle_name;
        }
        if ($alumni->last_name) {
            $nameParts[] = $alumni->last_name;
        }
        if ($alumni->suffix) {
            $nameParts[] = $alumni->suffix;
        }
        return implode(' ', $nameParts);
    }

    /**
     * Find account by email
     */
    public function findAccount(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->email;

        // First check in alumni table
        $alumni = Alumni::where('email', $email)->first();

        if ($alumni) {
            return response()->json([
                'success' => true,
                'message' => 'Account found',
                'data' => [
                    'full_name' => $this->getAlumniFullName($alumni),
                    'email' => $alumni->email,
                ]
            ]);
        }

        // If not found in alumni, check users table
        $user = User::where('email', $email)->first();

        if ($user) {
            return response()->json([
                'success' => true,
                'message' => 'Account found',
                'data' => [
                    'full_name' => $user->name,
                    'email' => $user->email,
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No account found with this email address.'
        ], 404);
    }

    /**
     * Send password reset link
     * Improved error handling and using DB facade as fallback
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->email;

        // Check if email exists in alumni or users
        $alumni = Alumni::where('email', $email)->first();
        $user = User::where('email', $email)->first();

        if (!$alumni && !$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found with this email address.'
            ], 404);
        }

        $fullName = $alumni ? $this->getAlumniFullName($alumni) : $user->name;

        // Generate unique token
        $token = Str::random(64);

        try {
            // Delete any existing password reset tokens for this email
            DB::table('password_resets')->where('email', $email)->delete();

            // Create new password reset record using DB facade for compatibility
            DB::table('password_resets')->insert([
                'email' => $email,
                'token' => Hash::make($token),
                'created_at' => Carbon::now()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create password reset token: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to process password reset request.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }

        // Generate reset URL
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $resetUrl = $frontendUrl . '/login?token=' . $token . '&email=' . urlencode($email);

        // Send email
        try {
            Mail::to($email)->send(new PasswordResetMail($fullName, $resetUrl, $email));

            Log::info('Password reset email sent to: ' . $email);

            return response()->json([
                'success' => true,
                'message' => 'Password reset link has been sent to your email.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            // Return more detailed error in debug mode
            return response()->json([
                'success' => false,
                'message' => 'Failed to send password reset email. Please check your mail connection/configuration.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Reset password
     * Using DB facade for compatibility
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $email = $request->email;
        $token = $request->token;

        // Find the password reset record
        $passwordReset = DB::table('password_resets')->where('email', $email)->first();

        if (!$passwordReset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password reset request.'
            ], 400);
        }

        // Check if token matches
        if (!Hash::check($token, $passwordReset->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired password reset token.'
            ], 400);
        }

        // Check if token is expired (60 minutes)
        $tokenCreatedAt = Carbon::parse($passwordReset->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) > 60) {
            // Delete expired token
            DB::table('password_resets')->where('email', $email)->delete();

            return response()->json([
                'success' => false,
                'message' => 'Password reset link has expired. Please request a new one.'
            ], 400);
        }

        // Update password in users table
        $user = User::where('email', $email)->first();

        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();

            Log::info('Password reset successful for user: ' . $email);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'User account not found.'
            ], 404);
        }

        // Delete the password reset token
        DB::table('password_resets')->where('email', $email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully.'
        ]);
    }

    /**
     * Verify reset token
     * Using DB facade for compatibility
     */
    public function verifyToken(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $email = $request->email;
        $token = $request->token;

        $passwordReset = DB::table('password_resets')->where('email', $email)->first();

        if (!$passwordReset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password reset request.'
            ], 400);
        }

        if (!Hash::check($token, $passwordReset->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password reset token.'
            ], 400);
        }

        $tokenCreatedAt = Carbon::parse($passwordReset->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) > 60) {
            DB::table('password_resets')->where('email', $email)->delete();

            return response()->json([
                'success' => false,
                'message' => 'Password reset link has expired.'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Token is valid.'
        ]);
    }
}
