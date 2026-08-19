<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Phase 6 — frontend security: bearer token out of localStorage.
 *
 * The web frontend no longer stores the Passport access token in
 * (secure)localStorage, where it was readable by any JavaScript running
 * on the page — including an attacker's, via XSS. Instead,
 * AuthController::login() sets it as an HttpOnly, Secure, SameSite=Strict
 * cookie (`auth_token`), which JavaScript can never read at all.
 *
 * Passport's `auth:api` guard only ever looks at the `Authorization:
 * Bearer <token>` header — it has no concept of reading from a cookie.
 * This middleware bridges the two: if a request has no Authorization
 * header but does have the auth_token cookie (already decrypted by
 * EncryptCookies, which runs before this in the `api` middleware group),
 * copy it into the Authorization header before the route's `auth:api`
 * middleware resolves the user. Every existing policy/controller that
 * calls `$request->user()` or `Auth::user()` keeps working completely
 * unchanged.
 *
 * The mobile app is unaffected: it authenticates via `/mobile/login`,
 * receives the token in the JSON response body (appropriate for a
 * native app, which stores it in platform secure storage — Keychain/
 * Keystore — rather than a browser-readable location), and sends it as
 * a normal Authorization header on every request, exactly as before.
 * This middleware only acts when that header is absent.
 */
class TokenFromAuthCookie
{
    public const COOKIE_NAME = 'auth_token';

    public function handle(Request $request, Closure $next)
    {
        if (!$request->headers->has('Authorization') && $request->cookie(self::COOKIE_NAME)) {
            $request->headers->set('Authorization', 'Bearer ' . $request->cookie(self::COOKIE_NAME));
        }

        return $next($request);
    }
}
