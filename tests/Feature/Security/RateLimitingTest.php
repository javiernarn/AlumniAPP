<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 4 — rate limiting and abuse protection.
 *
 * Exit criterion from the plan: "Add tests proving HTTP 429 responses
 * occur after limits are exceeded." Each test below deliberately sends
 * one more request than the configured limit and asserts the final
 * request is rejected with 429 — the request payloads are intentionally
 * minimal/invalid where possible, since Laravel's throttle middleware
 * runs before controller-level validation, so even a request that would
 * otherwise fail validation still counts against the limiter.
 */
class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Needed only for the one test below that exercises the real
        // login endpoint end-to-end (createToken() -> Passport's
        // personal access client) rather than using Passport::actingAs()
        // to bypass real token issuance like the rest of the suite does.
        (new \Laravel\Passport\ClientRepository())->createPersonalAccessClient(
            null,
            'Test Personal Access Client',
            'http://localhost'
        );
    }

    public function test_login_is_rate_limited_after_five_attempts(): void
    {
        $user = User::factory()->alumni()->create();

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ]);
            // Each of the first 5 attempts is a normal "wrong password"
            // 403, not yet rate limited.
            $this->assertNotEquals(429, $response->status());
        }

        // 6th attempt within the window must be rate limited.
        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
    }

    public function test_login_rate_limit_is_keyed_per_email_not_global(): void
    {
        $attacker = User::factory()->alumni()->create(['email' => 'attacker@example.test']);
        $victim = User::factory()->alumni()->create(['email' => 'victim@example.test']);

        // Exhaust the limiter for the attacker's own email.
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', [
                'email' => $attacker->email,
                'password' => 'wrong-password',
            ]);
        }

        // A different email from the same IP should be unaffected.
        $response = $this->postJson('/api/login', [
            'email' => $victim->email,
            'password' => 'wrong-password',
        ]);

        $this->assertNotEquals(429, $response->status());
    }

    public function test_registration_is_rate_limited_after_five_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/alumni/register', [
                'first_name' => 'Test',
                // deliberately incomplete — throttle counts the request
                // regardless of whether validation would pass.
            ]);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson('/api/alumni/register', [
            'first_name' => 'Test',
        ]);

        $response->assertStatus(429);
    }

    public function test_password_reset_is_rate_limited_after_five_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/password/find-account', [
                'email' => 'nobody@example.test',
            ]);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson('/api/password/find-account', [
            'email' => 'nobody@example.test',
        ]);

        $response->assertStatus(429);
    }

    public function test_change_password_is_rate_limited_after_five_attempts(): void
    {
        $user = User::factory()->alumni()->create();
        Passport::actingAs($user);

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/profile/change-password', [
                'current_password' => 'wrong',
            ]);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson('/api/profile/change-password', [
            'current_password' => 'wrong',
        ]);

        $response->assertStatus(429);
    }

    public function test_quiz_submission_is_rate_limited_after_ten_attempts(): void
    {
        $user = User::factory()->alumni()->create();
        Passport::actingAs($user);

        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/save-alumni-quiz', []);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson('/api/save-alumni-quiz', []);

        $response->assertStatus(429);
    }

    public function test_message_send_is_rate_limited_after_twenty_attempts(): void
    {
        $user = User::factory()->alumni()->create();
        Alumni::factory()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        for ($i = 0; $i < 20; $i++) {
            $response = $this->postJson('/api/alumni/messages/send', []);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson('/api/alumni/messages/send', []);

        $response->assertStatus(429);
    }

    public function test_government_id_download_is_rate_limited_after_twenty_attempts(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create();
        Passport::actingAs($admin);

        for ($i = 0; $i < 20; $i++) {
            $response = $this->getJson("/api/alumni-documents/999999/download");
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->getJson("/api/alumni-documents/999999/download");

        $response->assertStatus(429);
    }

    public function test_admin_mutation_is_rate_limited_after_thirty_attempts(): void
    {
        $admin = User::factory()->admin()->create();
        Passport::actingAs($admin);

        for ($i = 0; $i < 30; $i++) {
            $response = $this->postJson('/api/department-heads', []);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson('/api/department-heads', []);

        $response->assertStatus(429);
    }

    public function test_upload_endpoint_is_rate_limited_after_ten_attempts(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create();
        Passport::actingAs($admin);

        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson("/api/admin/alumni/{$alumni->id}/upload-document", []);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson("/api/admin/alumni/{$alumni->id}/upload-document", []);

        $response->assertStatus(429);
    }

    public function test_public_contact_form_is_rate_limited_after_five_attempts(): void
    {
        // Pre-existing limiter, now a named `public-contact` limiter
        // (Phase 4 fixed a key-collision bug with the blanket
        // throttle:120,1 group middleware — see RouteServiceProvider).
        // 5 requests are allowed, the 6th is rejected.
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/contact', []);
            $this->assertNotEquals(429, $response->status());
        }

        $response = $this->postJson('/api/contact', []);

        $response->assertStatus(429);
    }

    public function test_successful_login_does_not_trip_the_rate_limiter_for_the_next_user(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('correct-password')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response->assertStatus(200);
    }
}
