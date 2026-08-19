<?php

namespace Tests\Feature\Security;

use App\Http\Middleware\TokenFromAuthCookie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7 — security headers and transport.
 */
class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_response_includes_content_type_options_header(): void
    {
        $response = $this->getJson('/api/get-courses');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_response_includes_referrer_policy_header(): void
    {
        $response = $this->getJson('/api/get-courses');

        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_response_includes_permissions_policy_header(): void
    {
        $response = $this->getJson('/api/get-courses');

        $response->assertHeader('Permissions-Policy');
        $this->assertStringContainsString('camera=()', $response->headers->get('Permissions-Policy'));
    }

    public function test_response_includes_x_frame_options_deny(): void
    {
        $response = $this->getJson('/api/get-courses');

        $response->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_response_includes_content_security_policy_with_frame_ancestors_none(): void
    {
        $response = $this->getJson('/api/get-courses');

        // Ships in report-only mode by default (see SecurityHeaders) —
        // either header name is an acceptable pass here, but exactly one
        // of them must be present.
        $enforced = $response->headers->get('Content-Security-Policy');
        $reportOnly = $response->headers->get('Content-Security-Policy-Report-Only');
        $csp = $enforced ?: $reportOnly;

        $this->assertNotNull($csp, 'A CSP header (enforced or report-only) must be present');
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("default-src 'self'", $csp);
    }

    public function test_hsts_header_is_absent_over_plain_http(): void
    {
        // HSTS is meaningless (and browsers ignore it) over plain HTTP;
        // sending it prematurely on a request that isn't actually
        // HTTPS-secured would be actively misleading.
        $response = $this->getJson('/api/get-courses');

        $response->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_hsts_header_is_present_over_https(): void
    {
        $response = $this->call('GET', 'https://localhost/api/get-courses', [], [], [], ['HTTPS' => 'on']);

        $response->assertHeader('Strict-Transport-Security');
        $this->assertStringContainsString('max-age=', $response->headers->get('Strict-Transport-Security'));
        $this->assertStringContainsString('includeSubDomains', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_headers_are_present_even_on_error_responses(): void
    {
        // Security headers must not depend on the response being a
        // "success" — an attacker profiling the app via error responses
        // should get the same hardened headers as anyone else.
        $response = $this->getJson('/api/alumni/999999');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_auth_cookie_carries_secure_flag_in_production_environment(): void
    {
        $this->app['env'] = 'production';
        config(['app.env' => 'production']);

        (new \Laravel\Passport\ClientRepository())->createPersonalAccessClient(
            null,
            'Test Personal Access Client',
            'http://localhost'
        );

        $user = User::factory()->admin()->create(['password' => bcrypt('correct-password')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === TokenFromAuthCookie::COOKIE_NAME);

        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isSecure(), 'auth_token cookie must be Secure in production');
    }
}
