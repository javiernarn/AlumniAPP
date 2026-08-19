<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Centralized role-gate middleware.
 *
 * Usage: ->middleware('role:admin') or ->middleware('role:admin,department_head')
 *
 * This middleware ONLY checks that an already-authenticated user's `role`
 * column is in the allowed list. It must always run after an auth
 * middleware (e.g. `auth:api`) that populates the request user — it does
 * not itself authenticate the request.
 */
class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles  One or more allowed roles.
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (empty($roles) || !in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action.',
            ], 403);
        }

        return $next($request);
    }
}
