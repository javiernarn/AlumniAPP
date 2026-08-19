<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Phase 7 — HTTPS everywhere.
 *
 * Redirects plain-HTTP GET/HEAD requests to HTTPS. Deliberately opt-in
 * via the FORCE_HTTPS env var (default: off) rather than always-on:
 * whether Laravel can correctly detect "this request is actually
 * HTTPS" depends entirely on the deployment's TLS termination topology.
 *
 *  - If Laravel itself terminates TLS: $request->secure() is accurate
 *    out of the box, and this middleware is safe to enable immediately.
 *  - If a reverse proxy / load balancer terminates TLS in front of
 *    Laravel (very common — Nginx, an AWS ALB, Cloudflare, etc.): the
 *    connection Laravel actually sees is plain HTTP, and
 *    $request->secure() is only accurate if App\Http\Middleware\
 *    TrustProxies has been configured with that proxy's IP (or '*' if
 *    it's on a private network you control) so Laravel trusts the
 *    X-Forwarded-Proto header. TrustProxies ships in this app with no
 *    proxies configured (a safe default — trusting an unconfigured
 *    proxy would let a spoofed X-Forwarded-Proto header lie about the
 *    connection's security). Enabling FORCE_HTTPS without first
 *    configuring TrustProxies correctly for your actual topology would
 *    cause a redirect loop (every request looks insecure to Laravel, so
 *    every request gets redirected, forever).
 *
 * Only redirects GET/HEAD (POST/PUT/etc. over plain HTTP are simply
 * rejected with a 400 rather than redirected, since a 307/308 redirect
 * that silently replays a request body — including file uploads or
 * credentials — across a scheme change is its own footgun).
 */
class ForceHttps
{
    public function handle(Request $request, Closure $next)
    {
        if (!$this->shouldEnforce($request)) {
            return $next($request);
        }

        if ($request->isMethod('get') || $request->isMethod('head')) {
            return redirect()->secure($request->getRequestUri(), 301);
        }

        return response()->json([
            'success' => false,
            'message' => 'HTTPS is required.',
        ], 400);
    }

    private function shouldEnforce(Request $request): bool
    {
        return filter_var(env('FORCE_HTTPS', false), FILTER_VALIDATE_BOOLEAN)
            && !$request->secure();
    }
}
