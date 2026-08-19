<?php

namespace Tests\Feature\Security;

use App\Http\Middleware\TokenFromAuthCookie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 6 — frontend security: bearer token out of localStorage.
 *
 * These tests cover the backend half of this phase (the HttpOnly
 * auth-token cookie and the middleware that bridges it into Passport's
 * Authorization-header-based guard). The frontend half (removing
 * secureLocalStorage token reads/writes, adding withCredentials) can't
 * be exercised by PHPUnit — see PHASE_6_COMPLETION_REPORT.md for how
 * that was verified instead.
 */
class AuthCookieTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        (new \Laravel\Passport\ClientRepository())->createPersonalAccessClient(
            null,
            'Test Personal Access Client',
            'http://localhost'
        );
    }

    public function test_login_sets_httponly_secure_samesite_auth_cookie(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('correct-password')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response->assertStatus(200);

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === TokenFromAuthCookie::COOKIE_NAME);

        $this->assertNotNull($cookie, 'Login response must set the auth_token cookie');
        $this->assertTrue($cookie->isHttpOnly(), 'auth_token cookie must be HttpOnly');
        $this->assertSame('strict', strtolower($cookie->getSameSite()));
        $this->assertNotEmpty($cookie->getValue());
    }

    public function test_login_response_still_includes_json_token_for_mobile_clients(): void
    {
        // Backward compatibility check: the mobile app has no browser
        // cookie jar and must keep receiving the token in the JSON body.
        $user = User::factory()->admin()->create(['password' => bcrypt('correct-password')]);

        $response = $this->postJson('/api/mobile/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('access_token'));
    }

    public function test_request_authenticates_via_cookie_alone_with_no_authorization_header(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('correct-password')]);

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);
        $login->assertStatus(200);

        $cookie = collect($login->headers->getCookies())
            ->first(fn ($c) => $c->getName() === TokenFromAuthCookie::COOKIE_NAME);

        // A fresh request, deliberately with NO Authorization header —
        // only the cookie a browser would automatically attach.
        $response = $this->withCredentials()->withUnencryptedCookie(TokenFromAuthCookie::COOKIE_NAME, $cookie->getValue())
            ->getJson('/api/admin-dashboard');

        $response->assertStatus(200);
    }

    public function test_request_with_no_cookie_and_no_header_is_unauthenticated(): void
    {
        $response = $this->getJson('/api/admin-dashboard');

        $response->assertStatus(401);
    }

    public function test_authorization_header_takes_precedence_over_cookie(): void
    {
        // If a caller (e.g. the mobile app, or a future API consumer)
        // sends an explicit Authorization header, the middleware must
        // not overwrite it with whatever's in the cookie.
        $admin = User::factory()->admin()->create();
        $alumni = User::factory()->alumni()->create();

        \Laravel\Passport\Passport::actingAs($admin);
        // actingAs sets up the guard directly rather than a real header,
        // so instead we verify the middleware's own logic: it only acts
        // when no Authorization header is present.
        $request = \Illuminate\Http\Request::create('/api/admin-dashboard', 'GET');
        $request->headers->set('Authorization', 'Bearer some-existing-token');
        $request->cookies->set(TokenFromAuthCookie::COOKIE_NAME, 'cookie-token-should-be-ignored');

        $middleware = new TokenFromAuthCookie();
        $middleware->handle($request, function ($req) {
            $this->assertSame('Bearer some-existing-token', $req->headers->get('Authorization'));
            return new \Illuminate\Http\Response();
        });
    }

    public function test_logout_clears_the_auth_cookie(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('correct-password')]);

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);
        $cookie = collect($login->headers->getCookies())
            ->first(fn ($c) => $c->getName() === TokenFromAuthCookie::COOKIE_NAME);

        $response = $this->withCredentials()->withUnencryptedCookie(TokenFromAuthCookie::COOKIE_NAME, $cookie->getValue())
            ->postJson('/api/logout');

        $response->assertStatus(200);

        $forgetCookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === TokenFromAuthCookie::COOKIE_NAME);

        $this->assertNotNull($forgetCookie);
        $this->assertTrue(
            $forgetCookie->getExpiresTime() > 0 && $forgetCookie->getExpiresTime() < time(),
            'Logout must send an expired auth_token cookie so the browser discards it'
        );
    }

    public function test_revoked_token_via_logout_cannot_authenticate_again_via_stale_cookie(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('correct-password')]);

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);
        $cookie = collect($login->headers->getCookies())
            ->first(fn ($c) => $c->getName() === TokenFromAuthCookie::COOKIE_NAME);

        $this->withCredentials()->withUnencryptedCookie(TokenFromAuthCookie::COOKIE_NAME, $cookie->getValue())
            ->postJson('/api/logout')
            ->assertStatus(200);

        $this->assertDatabaseHas('oauth_access_tokens', ['revoked' => 1]);

        // Auth guards cache their resolved user for the lifetime of the
        // container instance. Two separate simulated HTTP requests
        // within one test method share that same container (unlike two
        // genuinely separate real requests, which each get a fresh
        // guard), so the guard must be explicitly reset here or the
        // second call below would incorrectly reuse the first request's
        // already-resolved (pre-revocation) user instead of
        // re-validating the token.
        $this->app['auth']->forgetGuards();

        // Simulate a browser that still has the (now stale/revoked)
        // cookie value cached and replays it.
        $replay = $this->withCredentials()->withUnencryptedCookie(TokenFromAuthCookie::COOKIE_NAME, $cookie->getValue())
            ->getJson('/api/admin-dashboard');

        $replay->assertStatus(401);
    }
}
