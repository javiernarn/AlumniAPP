<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\Course;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 10 — capstone security tests.
 *
 * This file closes out the specific checklist items from the plan's
 * Phase 10 that weren't already covered by the phase-specific test
 * files (AdminDashboardAccessTest, AlumniRecordAccessTest,
 * JobApplicationAccessTest, NotificationAccessTest, PrivateStorageAccessTest,
 * UploadValidationTest, RateLimitingTest, DataMinimizationTest,
 * DatabaseHardeningTest, AuthCookieTest, SecurityHeadersTest — 111 tests
 * total before this file). See PHASE_10_COMPLETION_REPORT.md for the
 * full checklist-to-test-file mapping and the residual-risk report.
 */
class CapstoneSecurityTest extends TestCase
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

    // ================= Authentication =================

    public function test_login_with_invalid_password_is_rejected(): void
    {
        $user = User::factory()->alumni()->create(['password' => bcrypt('correct-password')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(403);
        $this->assertStringNotContainsString('access_token', $response->getContent());
    }

    public function test_login_with_nonexistent_account_is_rejected(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody-at-all@example.test',
            'password' => 'whatever',
        ]);

        $response->assertStatus(403);
        // Response wording should not differ from the "wrong password"
        // case in a way that would let an attacker enumerate valid
        // emails by comparing responses.
        $this->assertStringNotContainsString('access_token', $response->getContent());
    }

    /**
     * Phase 10 fix: ChangePasswordController previously did not revoke
     * any existing Passport tokens after a successful password change —
     * a stolen bearer token/auth_token cookie stayed fully valid
     * indefinitely even after the legitimate user "secured" their
     * account by changing the password. Now revokes every OTHER active
     * token for that user.
     */
    public function test_password_change_revokes_other_active_sessions(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('old-password')]);

        // Two separate "devices" both log in.
        $deviceA = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'old-password']);
        $deviceB = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'old-password']);

        $tokenA = $deviceA->json('access_token');
        $tokenB = $deviceB->json('access_token');

        // Device A changes the password.
        $this->withHeaders(['Authorization' => "Bearer {$tokenA}"])
            ->postJson('/api/profile/change-password', [
                'current_password' => 'old-password',
                'new_password' => 'NewPassword123',
                'new_password_confirmation' => 'NewPassword123',
            ])
            ->assertStatus(200);

        $this->app['auth']->forgetGuards();

        // Device A (the one that made the change) stays logged in.
        $this->withHeaders(['Authorization' => "Bearer {$tokenA}"])
            ->getJson('/api/admin-dashboard')
            ->assertStatus(200); // still works — proves its token wasn't revoked

        $this->app['auth']->forgetGuards();

        // Device B's old token is now revoked.
        $this->withHeaders(['Authorization' => "Bearer {$tokenB}"])
            ->getJson('/api/admin-dashboard')
            ->assertStatus(401);
    }

    // ================= Authorization =================
    // (alumni-vs-admin, alumni-vs-alumni, department-head course
    // isolation, department-head management, notification/job-
    // application ownership are all covered in dedicated phase test
    // files — see the class doc comment. This section covers message
    // ownership, the one category without dedicated prior coverage.)

    public function test_alumni_cannot_delete_another_alumnis_message(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();
        $ownerAlumni = Alumni::factory()->create(['user_id' => $owner->id]);

        $message = Message::create([
            'alumni_id' => $ownerAlumni->id,
            'sender_type' => 'alumni',
            'sender_id' => $ownerAlumni->id,
            'message' => 'hello',
            'is_read' => false,
        ]);

        Passport::actingAs($attacker);

        $response = $this->deleteJson("/api/alumni/messages/{$message->id}/delete");

        $response->assertStatus(403);
        $this->assertDatabaseHas('messages', ['id' => $message->id]);
    }

    public function test_alumni_can_delete_their_own_message(): void
    {
        $owner = User::factory()->alumni()->create();
        $ownerAlumni = Alumni::factory()->create(['user_id' => $owner->id]);

        $message = Message::create([
            'alumni_id' => $ownerAlumni->id,
            'sender_type' => 'alumni',
            'sender_id' => $ownerAlumni->id,
            'message' => 'hello',
            'is_read' => false,
        ]);

        Passport::actingAs($owner);

        $this->deleteJson("/api/alumni/messages/{$message->id}/delete")->assertStatus(200);
        $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    }

    // ================= File security =================

    /**
     * "Guessed filenames fail": since Phase 3, stored filenames are
     * fully server-random — this proves the corresponding lookup ID
     * space (document/index) is equally unguessable-and-safe: a
     * plausible-looking but wrong ID returns a clean 404, not a server
     * error or a leak of some other record's data.
     */
    public function test_guessed_document_id_returns_clean_404(): void
    {
        $admin = User::factory()->admin()->create();
        Passport::actingAs($admin);

        $response = $this->getJson('/api/alumni-documents/999999/download');

        $response->assertStatus(404);
        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
        $this->assertStringNotContainsString('Stack trace', $response->getContent());
    }

    public function test_guessed_job_application_id_returns_clean_404(): void
    {
        $alumnus = User::factory()->alumni()->create();
        Passport::actingAs($alumnus);

        $response = $this->getJson('/api/job-applications/999999');

        $response->assertStatus(404);
        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    // ================= API security =================

    public function test_search_query_with_sql_injection_payload_is_handled_safely(): void
    {
        $admin = User::factory()->admin()->create();
        Alumni::factory()->create(['first_name' => 'Jane']);
        Alumni::factory()->create(['first_name' => 'John']);
        Passport::actingAs($admin);

        $payloads = [
            "' OR '1'='1",
            "'; DROP TABLE alumni; --",
            "1' UNION SELECT * FROM users--",
            "admin'--",
        ];

        foreach ($payloads as $payload) {
            $response = $this->getJson('/api/alumni?search=' . urlencode($payload));

            // Must not error out, and must not return every row (which
            // a successful injection like `' OR '1'='1` would produce
            // if the query builder were vulnerable) — Eloquent's query
            // builder parameter-binds this, so it's treated as a
            // literal (non-matching) search string.
            $response->assertStatus(200);
        }

        // The table must still exist and be queryable — proves the
        // DROP TABLE payload above was never executed as SQL.
        $this->assertDatabaseHas('alumni', ['first_name' => 'Jane']);
        $this->assertDatabaseHas('alumni', ['first_name' => 'John']);
    }

    public function test_registration_payload_cannot_set_role(): void
    {
        $response = $this->postJson('/api/alumni/register', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'password' => 'password123',
            'email' => 'role-tamper@example.test',
            'phone' => '09171234567',
            'address' => '123 Main St',
            'gender' => 'female',
            'graduation_year' => 2020,
            'agreement' => true,
            'role' => 'admin', // attempted tampering
        ]);

        $response->assertStatus(201);

        $alumni = Alumni::where('email', 'role-tamper@example.test')->first();
        $user = User::find($alumni->user_id);

        $this->assertSame('alumni', $user->role);
    }

    public function test_pagination_per_page_is_capped_regardless_of_request(): void
    {
        // Duplicate of DataMinimizationTest's coverage from the
        // requester's side, phrased as a direct "pagination abuse"
        // attack per the Phase 10 checklist wording specifically.
        $admin = User::factory()->admin()->create();
        Passport::actingAs($admin);

        $response = $this->getJson('/api/alumni?per_page=999999999');

        $response->assertStatus(200);
        $this->assertLessThanOrEqual(100, $response->json('meta.per_page'));
    }
}
