<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 1 — vertical privilege escalation coverage for the
 * /admin-dashboard route.
 *
 * Before the fix: this route lived entirely outside the auth:api group,
 * so it was reachable with NO authentication at all.
 */
class AdminDashboardAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $response = $this->getJson('/api/admin-dashboard');

        $response->assertStatus(401);
    }

    public function test_alumni_cannot_access_admin_dashboard(): void
    {
        $alumni = User::factory()->alumni()->create();
        Passport::actingAs($alumni);

        $response = $this->getJson('/api/admin-dashboard');

        $response->assertStatus(403);
    }

    public function test_department_head_cannot_access_admin_dashboard(): void
    {
        $head = User::factory()->departmentHead()->create();
        Passport::actingAs($head);

        $response = $this->getJson('/api/admin-dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();
        Passport::actingAs($admin);

        $response = $this->getJson('/api/admin-dashboard');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }
}
