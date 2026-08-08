<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Alumni;
use App\Models\PasswordChangeLog;

class ChangePasswordController extends Controller
{
    /**
     * Change password for the currently authenticated alumni/user.
     * Verifies current password, validates new password, updates, and logs.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password'     => [
                'required',
                'string',
                'min:8',
                'max:255',
                'confirmed',
                'regex:/[A-Z]/',      // at least one uppercase
                'regex:/[a-z]/',      // at least one lowercase
                'regex:/[0-9]/',      // at least one digit
                'different:current_password',
            ],
        ], [
            'new_password.confirmed'   => 'New password and confirmation do not match.',
            'new_password.regex'       => 'Password must contain uppercase, lowercase, number, and special character.',
            'new_password.different'   => 'New password must be different from the current password.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $authUser = Auth::user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Resolve email (works whether logged in via users or alumni-linked user)
        $email = $authUser->email;
        $user  = User::where('email', $email)->first();

        if (!$user) {
            // Fallback: try via alumni link
            $alumni = Alumni::where('email', $email)->first();
            if ($alumni && $alumni->user_id) {
                $user = User::find($alumni->user_id);
            }
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User account not found.',
            ], 404);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            PasswordChangeLog::create([
                'user_id'    => $user->id,
                'email'      => $user->email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status'     => 'failed',
                'reason'     => 'Incorrect current password',
            ]);

         return response()->json([
    'success' => false,
    'message' => 'Current password is incorrect.',
], 200);
        }

        try {
            $user->password = Hash::make($request->new_password);
            $user->save();

            PasswordChangeLog::create([
                'user_id'    => $user->id,
                'email'      => $user->email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status'     => 'success',
                'reason'     => 'Password changed by user',
            ]);

            Log::info("Password changed successfully for user: {$user->email}");

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Password change failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to change password. Please try again.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
