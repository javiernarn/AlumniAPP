<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * These middleware are run during every request to your application.
     *
     * @var array<int, class-string|string>
     */
    protected $middleware = [
        // \App\Http\Middleware\TrustHosts::class,
        \App\Http\Middleware\TrustProxies::class,
        \Fruitcake\Cors\HandleCors::class,
        // Phase 7 — runs on every request, web and API alike.
        // ForceHttps is a conditional no-op unless FORCE_HTTPS=true is
        // set (see that class for why); SecurityHeaders always adds its
        // response headers regardless of scheme (HSTS itself is
        // internally gated to HTTPS-only requests).
        \App\Http\Middleware\ForceHttps::class,
        \App\Http\Middleware\SecurityHeaders::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * The application's route middleware groups.
     *
     * @var array<string, array<int, class-string|string>>
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            // \Illuminate\Session\Middleware\AuthenticateSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        'api' => [
            // Phase 6: EncryptCookies + AddQueuedCookiesToResponse were
            // previously only in the 'web' group, so Cookie::queue()
            // calls anywhere in the API (e.g. AuthController::login())
            // were silently dropped — nothing ever attached them to the
            // response. Needed for the HttpOnly auth-token cookie below.
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            // Reads the auth_token HttpOnly cookie (if present and no
            // Authorization header was already sent) into the
            // Authorization header before Passport's `auth:api` guard
            // resolves the user. This is what lets the web frontend
            // authenticate via cookie alone — see
            // App\Http\Middleware\TokenFromAuthCookie.
            \App\Http\Middleware\TokenFromAuthCookie::class,
            // Was 120/min. This runs before the per-route auth guard
            // resolves the user, so ThrottleRequests falls back to keying
            // by IP for every request — meaning every admin/alumni on the
            // same network (e.g. campus WiFi/NAT) shares ONE 120/min
            // budget across the whole API. Combined with 5s dashboard
            // polling and no-store avatar images (each one is a fresh
            // request, never cached — see profile-image/messages.image
            // routes), that shared budget was exhausted almost
            // immediately, well below any real abuse. Raised to match the
            // generous per-route limiters already in place (e.g.
            // 'profile-image' at 300/min) — this blanket limit is a
            // backstop, not the primary defense; each sensitive endpoint
            // still has its own tighter named limiter (see
            // RouteServiceProvider::configureRateLimiting).
            'throttle:300,1',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * The application's route middleware.
     *
     * These middleware may be assigned to groups or used individually.
     *
     * @var array<string, class-string|string>
     */
    protected $routeMiddleware = [
        'auth' => \App\Http\Middleware\Authenticate::class,
        'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can' => \Illuminate\Auth\Middleware\Authorize::class,
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
        'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        'role' => \App\Http\Middleware\CheckRole::class,
    ];
}