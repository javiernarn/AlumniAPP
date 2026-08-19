<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 1 — horizontal & vertical privilege escalation coverage for
 * individual alumni records.
 *
 * Before the fix: AlumniRegistrationController@show and @update had no
 * ownership or role check at all — any authenticated user (including a
 * different alumnus) could view or edit any other alumnus's full record
 * (a classic IDOR).
 */
class AlumniRecordAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makeAlumni(?int $userId = null, ?int $courseId = null): Alumni
    {
        return Alumni::factory()->create([
            'user_id' => $userId,
            'course_id' => $courseId,
        ]);
    }

    public function test_alumni_cannot_view_another_alumnis_record(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();
        $victimRecord = $this->makeAlumni($owner->id);

        Passport::actingAs($attacker);

        $response = $this->getJson("/api/alumni/{$victimRecord->id}");

        $response->assertStatus(403);
    }

    public function test_alumni_can_view_their_own_record(): void
    {
        $owner = User::factory()->alumni()->create();
        $ownRecord = $this->makeAlumni($owner->id);

        Passport::actingAs($owner);

        $response = $this->getJson("/api/alumni/{$ownRecord->id}");

        $response->assertStatus(200);
    }

    public function test_alumni_cannot_edit_another_alumnis_record(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();
        $victimRecord = $this->makeAlumni($owner->id);

        Passport::actingAs($attacker);

        $response = $this->putJson("/api/alumni/{$victimRecord->id}", [
            'first_name' => 'Hacked',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('alumni', [
            'id' => $victimRecord->id,
            'first_name' => 'Hacked',
        ]);
    }

    public function test_admin_can_view_and_edit_any_alumni_record(): void
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->alumni()->create();
        $record = $this->makeAlumni($owner->id);

        Passport::actingAs($admin);

        $this->getJson("/api/alumni/{$record->id}")->assertStatus(200);

        $response = $this->putJson("/api/alumni/{$record->id}", [
            'first_name' => 'AdminEdited',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('alumni', [
            'id' => $record->id,
            'first_name' => 'ADMINEDITED', // controller uppercases name fields
        ]);
    }

    public function test_department_head_can_view_alumni_in_their_own_course_only(): void
    {
        $courseA = Course::factory()->create();
        $courseB = Course::factory()->create();
        $head = User::factory()->departmentHead($courseA->id)->create();

        $inCourse = $this->makeAlumni(null, $courseA->id);
        $outsideCourse = $this->makeAlumni(null, $courseB->id);

        Passport::actingAs($head);

        $this->getJson("/api/alumni/{$inCourse->id}")->assertStatus(200);
        $this->getJson("/api/alumni/{$outsideCourse->id}")->assertStatus(403);
    }

    public function test_department_head_cannot_edit_alumni_records(): void
    {
        $course = Course::factory()->create();
        $head = User::factory()->departmentHead($course->id)->create();
        $record = $this->makeAlumni(null, $course->id);

        Passport::actingAs($head);

        $response = $this->putJson("/api/alumni/{$record->id}", [
            'first_name' => 'ShouldNotWork',
        ]);

        $response->assertStatus(403);
    }

    public function test_alumni_cannot_list_full_alumni_directory(): void
    {
        $attacker = User::factory()->alumni()->create();
        Passport::actingAs($attacker);

        $this->getJson('/api/alumni')->assertStatus(403);
    }

    public function test_admin_can_list_full_alumni_directory(): void
    {
        $admin = User::factory()->admin()->create();
        Passport::actingAs($admin);

        $this->getJson('/api/alumni')->assertStatus(200);
    }
}
