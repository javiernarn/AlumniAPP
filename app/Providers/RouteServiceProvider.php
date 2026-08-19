<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * This is used by Laravel authentication to redirect users after login.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * The controller namespace for the application.
     *
     * When present, controller route declarations will automatically be prefixed with this namespace.
     *
     * @var string|null
     */
    // protected $namespace = 'App\\Http\\Controllers';

    /**
     * Define your route model bindings, pattern filters, etc.
     *
     * @return void
     */
    public function boot()
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::prefix('api')
                ->middleware('api')
                ->namespace($this->namespace)
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->namespace($this->namespace)
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     *
     * @return void
     */
    protected function configureRateLimiting()
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(optional($request->user())->id ?: $request->ip());
        });

        // Phase 4 — named limiters for high-risk endpoints, applied on
        // top of the blanket throttle:120,1 already set on the whole
        // `api` middleware group (see app/Http/Kernel.php). These are
        // deliberately much stricter than the global default because
        // each protects against a specific abuse pattern (credential
        // stuffing, account enumeration, mass registration, spam), not
        // just raw request volume.

        // Login: keyed by email+IP so a single attacker can't lock out
        // a real user's account by spamming failed attempts against
        // their email from many IPs, while still rate-limiting any one
        // attacker. Replaces the previous ad hoc implementation in
        // AuthController, which threw a bare \Exception on lockout —
        // that produced an uncaught 500, not a proper 429.
        RateLimiter::for('login', function (Request $request) {
            $key = Str::lower((string) $request->input('email')) . '|' . $request->ip();
            return Limit::perHour(5)->by($key);
        });

        // Password reset: unauthenticated by design (find-account,
        // send-reset-link, reset, verify-token all live under this
        // group). Rate limited by IP to slow both account-enumeration
        // probing (find-account reveals whether an email exists) and
        // reset-email spam against a victim's inbox.
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perHour(5)->by($request->ip());
        });

        // Public self-registration: unauthenticated, writes a new DB
        // row and (per Phase 3) accepts file uploads. Keyed by IP to
        // slow bulk fake-account creation.
        RateLimiter::for('registration', function (Request $request) {
            return Limit::perHour(5)->by($request->ip());
        });

        // Authenticated password change.
        RateLimiter::for('change-password', function (Request $request) {
            return Limit::perHour(5)->by(optional($request->user())->id ?: $request->ip());
        });

        // Message sending (both the admin-to-alumni and alumni-to-admin
        // endpoints share this limiter): generous enough for normal
        // back-and-forth conversation, tight enough to stop a compromised
        // token or buggy client from flooding a conversation thread or
        // spamming AdminAlumniMessageMail.
        RateLimiter::for('message-send', function (Request $request) {
            return Limit::perMinute(20)->by(optional($request->user())->id ?: $request->ip());
        });

        // File-upload endpoints (alumni documents, profile images).
        RateLimiter::for('upload', function (Request $request) {
            return Limit::perMinute(10)->by(optional($request->user())->id ?: $request->ip());
        });

        // Quiz submission — one call per completed quiz attempt in
        // normal usage (see QuizController@saveAlumniQuiz), so this is
        // generous while still stopping automated spam submissions.
        RateLimiter::for('quiz-submission', function (Request $request) {
            return Limit::perMinute(10)->by(optional($request->user())->id ?: $request->ip());
        });

        // Government ID / confidential document downloads: id-image,
        // resume, and supporting-document endpoints (Phase 2). A tight
        // per-minute cap makes bulk scraping/enumeration attempts by an
        // authorized-but-malicious caller (or a compromised token)
        // noticeably slower without affecting normal single-document
        // review workflows.
        RateLimiter::for('government-id', function (Request $request) {
            return Limit::perMinute(20)->by(optional($request->user())->id ?: $request->ip());
        });

        // Alumni profile-image avatars: these render in bulk all over the
        // UI (alumni lists, department dashboards, conversation lists,
        // notification bell), unlike the one-off sensitive document
        // downloads above — a single dashboard screen can easily need
        // 20-50+ avatars at once. This used to share the 20/min
        // government-id limiter and got exhausted by normal usage,
        // breaking avatar loading across the app. Kept separate and
        // generous while still guarding against scraping.
        RateLimiter::for('profile-image', function (Request $request) {
            return Limit::perMinute(300)->by(optional($request->user())->id ?: $request->ip());
        });

        // Admin mutations: destructive/high-impact admin-only actions
        // (department-head account management, alumni status decisions,
        // restricting/deleting alumni conversations). Generous enough
        // for real admin workflows, but limits the blast radius of a
        // compromised admin token or a buggy automation script.
        RateLimiter::for('admin-mutation', function (Request $request) {
            return Limit::perMinute(30)->by(optional($request->user())->id ?: $request->ip());
        });

        // Public "Contact Us" form. Replaces the previous ad hoc
        // `throttle:5,1` on this route. That numeric shorthand form has
        // no name/prefix, so it shared the exact same unprefixed cache
        // key (sha1(domain|ip)) as the blanket `throttle:120,1` applied
        // to the whole `api` middleware group in Kernel.php — every
        // request to /contact was incrementing BOTH counters against the
        // same bucket, so the "5 requests/minute" limit was actually
        // tripping after roughly 2-3 requests in practice. Named
        // limiters don't have this problem (Laravel namespaces their
        // cache keys by limiter name internally).
        RateLimiter::for('public-contact', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // ATMS Feedback submissions (the "Give Feedback" widget). Each
        // submission carries up to 5 screenshot uploads, so this is
        // deliberately tighter than the general 'upload' limiter while
        // still allowing normal back-to-back bug reports.
        RateLimiter::for('feedback-submission', function (Request $request) {
            return Limit::perMinute(5)->by(optional($request->user())->id ?: $request->ip());
        });
    }
}
