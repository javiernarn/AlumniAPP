<?php

namespace Tests\Feature\Security;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 1 — vertical privilege escalation coverage for department-head
 * account management (create/list/edit/delete department-head USERS).
 *
 * Before the fix: DepartmentHeadController@index/store/update/destroy had
 * no role check whatsoever — any authenticated alumni account could
 * create, edit, or delete department-head accounts.
 */
class DepartmentHeadManagementAccessTest extends TestCase
{
    use RefreshDatabase;

    private function payload(int $courseId): array
    {
        return [
            'name' => 'New Department Head',
            'email' => 'newhead@example.test',
            'password' => 'secret123',
            'course_id' => $courseId,
        ];
    }

    public function test_alumni_cannot_list_department_heads(): void
    {
        $alumni = User::factory()->alumni()->create();
        Passport::actingAs($alumni);

        $this->getJson('/api/department-heads')->assertStatus(403);
    }

    public function test_alumni_cannot_create_department_head(): void
    {
        $alumni = User::factory()->alumni()->create();
        $course = Course::factory()->create();
        Passport::actingAs($alumni);

        $response = $this->postJson('/api/department-heads', $this->payload($course->id));

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'newhead@example.test']);
    }

    public function test_department_head_cannot_create_another_department_head(): void
    {
        $head = User::factory()->departmentHead()->create();
        $course = Course::factory()->create();
        Passport::actingAs($head);

        $response = $this->postJson('/api/department-heads', $this->payload($course->id));

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'newhead@example.test']);
    }

    public function test_alumni_cannot_delete_department_head(): void
    {
        $alumni = User::factory()->alumni()->create();
        $head = User::factory()->departmentHead()->create();
        Passport::actingAs($alumni);

        $response = $this->deleteJson("/api/department-heads/{$head->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $head->id]);
    }

    public function test_admin_can_create_and_delete_department_head(): void
    {
        $admin = User::factory()->admin()->create();
        $course = Course::factory()->create();
        Passport::actingAs($admin);

        $create = $this->postJson('/api/department-heads', $this->payload($course->id));
        $create->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'newhead@example.test',
            'role' => 'department_head',
        ]);

        $newId = $create->json('data.id');

        $delete = $this->deleteJson("/api/department-heads/{$newId}");
        $delete->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $newId]);
    }
}
