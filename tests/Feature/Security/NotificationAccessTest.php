<?php

namespace Tests\Feature\Security;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 1 — per-user notification ownership coverage, and the
 * registerDevice IDOR fix (previously trusted a client-supplied user_id).
 */
class NotificationAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();

        $notification = Notification::create([
            'user_id' => $owner->id,
            'notifiable_type' => 'message',
            'data' => ['title' => 'hi'],
            'read' => false,
        ]);

        Passport::actingAs($attacker);

        $response = $this->postJson("/api/notifications/{$notification->id}/mark-read");

        $response->assertStatus(404); // scoped query -> not found for a non-owner
        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'read' => false,
        ]);
    }

    public function test_user_cannot_delete_another_users_notification(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();

        $notification = Notification::create([
            'user_id' => $owner->id,
            'notifiable_type' => 'message',
            'data' => ['title' => 'hi'],
            'read' => false,
        ]);

        Passport::actingAs($attacker);

        $response = $this->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('notifications', ['id' => $notification->id]);
    }

    public function test_owner_can_mark_their_own_notification_as_read(): void
    {
        $owner = User::factory()->alumni()->create();

        $notification = Notification::create([
            'user_id' => $owner->id,
            'notifiable_type' => 'message',
            'data' => ['title' => 'hi'],
            'read' => false,
        ]);

        Passport::actingAs($owner);

        $this->postJson("/api/notifications/{$notification->id}/mark-read")
            ->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'read' => true,
        ]);
    }

    public function test_register_device_always_uses_the_authenticated_users_id(): void
    {
        $caller = User::factory()->alumni()->create();
        $victim = User::factory()->alumni()->create();

        Passport::actingAs($caller);

        // Attempt to register a device token under someone else's account
        // by supplying a foreign user_id — this previously worked.
        $response = $this->postJson('/api/notifications/register-device', [
            'user_id' => $victim->id,
            'device_token' => 'token-abc',
            'device_uuid' => 'uuid-abc',
            'platform' => 'android',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('device_tokens', [
            'token' => 'token-abc',
            'user_id' => $caller->id,
        ]);
        $this->assertDatabaseMissing('device_tokens', [
            'token' => 'token-abc',
            'user_id' => $victim->id,
        ]);
    }
}
