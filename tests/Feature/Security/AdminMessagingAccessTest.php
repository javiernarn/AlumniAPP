<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 1 — vertical privilege escalation coverage for the /admin/*
 * messaging & document-management surface.
 *
 * Before the fix: this entire prefix only required auth:api with no role
 * check, so any authenticated alumni could read the full alumni
 * directory, browse every conversation, and read another alumnus's
 * private messages with staff.
 */
class AdminMessagingAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_alumni_cannot_list_full_alumni_directory_via_admin_endpoint(): void
    {
        $attacker = User::factory()->alumni()->create();
        Passport::actingAs($attacker);

        $this->getJson('/api/admin/alumni/all')->assertStatus(403);
    }

    public function test_alumni_cannot_browse_all_conversations(): void
    {
        $attacker = User::factory()->alumni()->create();
        Passport::actingAs($attacker);

        $this->getJson('/api/admin/conversations')->assertStatus(403);
    }

    public function test_alumni_cannot_read_another_alumnis_messages_via_admin_endpoint(): void
    {
        $attacker = User::factory()->alumni()->create();
        $victimAlumni = Alumni::factory()->create();

        Passport::actingAs($attacker);

        $this->getJson("/api/admin/messages/{$victimAlumni->id}")->assertStatus(403);
    }

    public function test_alumni_cannot_restrict_another_alumni(): void
    {
        $attacker = User::factory()->alumni()->create();
        $victimAlumni = Alumni::factory()->create(['is_messaging_restricted' => false]);

        Passport::actingAs($attacker);

        $this->postJson("/api/admin/messages/restrict/{$victimAlumni->id}")->assertStatus(403);

        $this->assertDatabaseHas('alumni', [
            'id' => $victimAlumni->id,
            'is_messaging_restricted' => false,
        ]);
    }

    public function test_admin_can_list_full_alumni_directory(): void
    {
        $admin = User::factory()->admin()->create();
        Passport::actingAs($admin);

        $this->getJson('/api/admin/alumni/all')->assertStatus(200);
    }
}
