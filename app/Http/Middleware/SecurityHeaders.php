<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Phase 7 — security headers and transport.
 *
 * Applied globally (see Kernel.php $middleware, not a group — this runs
 * on every request, API and web alike). Adds the standard set of
 * browser-enforced hardening headers this app had none of before.
 *
 * A note on what this middleware does NOT do: it does not redirect
 * HTTP to HTTPS. That's handled separately by
 * App\Http\Middleware\ForceHttps (opt-in via FORCE_HTTPS, see that
 * class for why) — TLS termination topology varies too much between
 * deployments to safely bundle into an always-on header middleware.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Content-Security-Policy is shipped in REPORT-ONLY mode by
        // default (env: CSP_REPORT_ONLY, defaults to true) — it reports
        // violations to the browser console without blocking anything,
        // until the deploying team has validated it against the real
        // built frontend bundle and explicitly sets CSP_REPORT_ONLY=false
        // in production. See the policy itself and its rationale further
        // down; the short version is this couldn't be tested against a
        // running build in this environment, so it ships safe-by-default
        // rather than enforced-and-possibly-wrong.
        //
        // HSTS: only meaningful (and only sent) over an actual HTTPS
        // connection — browsers ignore this header entirely over plain
        // HTTP, and sending it prematurely on a misconfigured proxy
        // setup would be actively harmful (it can lock users out of the
        // site if HTTPS isn't actually working yet). 6 months,
        // includeSubDomains; not adding `preload` here — that requires
        // deliberate submission to the browser preload list and is a
        // one-way door the deploying team should opt into explicitly,
        // not something a middleware should decide for them.
        if ($request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=15768000; includeSubDomains'
            );
        }

        // Prevents the browser from trying to "helpfully" guess a
        // different content type than what the server declared (e.g.
        // treating an uploaded file as HTML/JS based on sniffed
        // content) — the classic MIME-sniffing-to-XSS vector. Already
        // set ad hoc on the private-file download responses (Phase 2);
        // this makes it universal.
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Only send the referring URL's origin (not full path/query —
        // which could leak alumni IDs, tokens in query strings, search
        // terms, etc. to a third-party site) when navigating cross-origin;
        // full URL is fine for same-origin navigation.
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Deny access to browser features this app has no legitimate
        // use for. Conservative allowlist — nothing in this codebase
        // uses camera/mic/geolocation/payment APIs etc.
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
        );

        // Clickjacking protection. X-Frame-Options is the older/wider-
        // supported mechanism; frame-ancestors in the CSP below is the
        // modern equivalent — sent together since some older browsers
        // only understand one or the other.
        $response->headers->set('X-Frame-Options', 'DENY');

        // Content-Security-Policy. This is a reasoned starting point,
        // not a blindly-trusted final policy — see
        // PHASE_7_COMPLETION_REPORT.md for exactly what's allowed and
        // why, and for the strong recommendation to validate this
        // against the real built frontend bundle (report-only mode
        // first) before relying on it in production. Built from what's
        // actually referenced in resources/views/app.blade.php: the
        // same-origin JS bundle and Google Fonts.
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self'",
            // 'unsafe-inline' here because this app bundles Ant Design,
            // whose components inject <style> tags / style="" attributes
            // at runtime — this codebase has no CSP-nonce plumbing for
            // style tags, so a strict style-src would break the UI.
            // script-src above deliberately does NOT get the same
            // allowance — that's the directive that actually matters
            // most for XSS mitigation.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ]);

        $headerName = filter_var(env('CSP_REPORT_ONLY', true), FILTER_VALIDATE_BOOLEAN)
            ? 'Content-Security-Policy-Report-Only'
            : 'Content-Security-Policy';
        $response->headers->set($headerName, $csp);

        return $response;
    }
}
