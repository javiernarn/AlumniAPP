<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\Course;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 5 — data minimization.
 *
 * Exit criterion from the plan: "Add tests proving sensitive fields
 * never appear in unauthorized responses." Each test below inspects the
 * actual JSON body (not just the HTTP status, which Phase 1's tests
 * already cover) for fields that should never be present for that
 * viewer.
 */
class DataMinimizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_alumni_self_view_never_contains_admin_only_fields(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create([
            'user_id' => $owner->id,
            'status' => 'approved',
            'admin_notes' => 'flagged for review — do not tell the alumnus this',
            'is_messaging_restricted' => true,
        ]);

        Passport::actingAs($owner);

        $response = $this->getJson("/api/alumni/{$alumni->id}");

        $response->assertStatus(200);
        $json = $response->json('data');

        $this->assertArrayNotHasKey('status', $json);
        $this->assertArrayNotHasKey('admin_notes', $json);
        $this->assertArrayNotHasKey('is_messaging_restricted', $json);
        $this->assertStringNotContainsString('flagged for review', $response->getContent());
    }

    public function test_alumni_self_view_never_contains_temp_password(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id]);

        Passport::actingAs($owner);

        $response = $this->getJson("/api/alumni/{$alumni->id}");

        $response->assertStatus(200);
        $this->assertStringNotContainsString('temp_password', $response->getContent());
    }

    public function test_alumni_self_view_never_contains_raw_public_storage_url(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create([
            'user_id' => $owner->id,
            'profile_image' => 'alumni/profile-images/x.jpg',
        ]);

        Passport::actingAs($owner);

        $response = $this->getJson("/api/alumni/{$alumni->id}");

        $response->assertStatus(200);
        // The profile_image_url field must point at the authorized
        // endpoint, never a direct /storage/... asset URL.
        $this->assertStringNotContainsString('/storage/alumni/profile-images', $response->getContent());
    }

    public function test_admin_view_does_contain_admin_only_fields(): void
    {
        // Sanity check for the test above: admins are SUPPOSED to see
        // these fields, so the resource isn't just silently broken.
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create([
            'status' => 'pending',
            'admin_notes' => 'some note',
        ]);

        Passport::actingAs($admin);

        $response = $this->getJson("/api/alumni/{$alumni->id}");

        $response->assertStatus(200);
        $json = $response->json('data');
        $this->assertArrayHasKey('status', $json);
        $this->assertArrayHasKey('admin_notes', $json);
    }

    public function test_department_head_view_never_contains_contact_info_or_admin_fields(): void
    {
        $course = Course::factory()->create();
        $head = User::factory()->departmentHead($course->id)->create();
        $alumni = Alumni::factory()->create([
            'course_id' => $course->id,
            'status' => 'approved',
            'email' => 'private-email@example.test',
            'phone' => '09999999999',
            'address' => 'Some Private Street',
            'admin_notes' => 'internal note',
        ]);

        Passport::actingAs($head);

        $response = $this->getJson("/api/alumni/{$alumni->id}");

        $response->assertStatus(200);
        $json = $response->json('data');

        foreach (['email', 'phone', 'address', 'bio', 'status', 'admin_notes', 'is_messaging_restricted', 'linkedin', 'github', 'documents'] as $field) {
            $this->assertArrayNotHasKey($field, $json, "Field '$field' should not be visible to a department head");
        }
        $this->assertStringNotContainsString('private-email@example.test', $response->getContent());
        $this->assertStringNotContainsString('Some Private Street', $response->getContent());
    }

    public function test_department_head_course_listing_never_contains_contact_info(): void
    {
        $course = Course::factory()->create();
        $head = User::factory()->departmentHead($course->id)->create();
        Alumni::factory()->create([
            'course_id' => $course->id,
            'status' => 'approved',
            'email' => 'listed-alumnus@example.test',
            'phone' => '09171112222',
            'admin_notes' => 'secret note',
        ]);

        Passport::actingAs($head);

        $response = $this->getJson('/api/department-head/alumni');

        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertStringNotContainsString('listed-alumnus@example.test', $content);
        $this->assertStringNotContainsString('09171112222', $content);
        $this->assertStringNotContainsString('secret note', $content);
        $this->assertStringNotContainsString('admin_notes', $content);
    }

    public function test_admin_alumni_directory_response_is_paginated_with_capped_page_size(): void
    {
        $admin = User::factory()->admin()->create();
        Alumni::factory()->count(3)->create();
        Passport::actingAs($admin);

        // Request an absurdly large page size; the server must cap it.
        $response = $this->getJson('/api/alumni?per_page=10000');

        $response->assertStatus(200);
        $response->assertJsonStructure(['data', 'links', 'meta']);
        $this->assertLessThanOrEqual(100, $response->json('meta.per_page'));
    }

    public function test_job_application_response_never_contains_raw_ocr_fields(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = JobPost::create([
            'title' => 'Engineer',
            'description' => 'desc',
            'company' => 'Acme',
            'requirements' => 'PHP',
            'job_type' => 'Full-time',
            'status' => 'approved',
            'created_by_user_id' => $creator->id,
            'created_by_role' => 'alumni',
        ]);

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
            'resume_path' => 'resumes/resume.pdf',
            'status' => 'applied',
            'ocr_raw_text' => 'FULL NAME: JOHN DOE\nID NUMBER: 12345678\nADDRESS: 123 Secret St',
            'ocr_extracted_data' => json_encode(['name' => 'John Doe', 'id_number' => '12345678']),
            'ocr_success' => true,
            'ocr_confidence' => 92.5,
        ]);

        Passport::actingAs($applicant);

        $response = $this->getJson("/api/job-applications/{$application->id}");

        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertStringNotContainsString('ocr_raw_text', $content);
        $this->assertStringNotContainsString('ocr_extracted_data', $content);
        $this->assertStringNotContainsString('12345678', $content);
        $this->assertStringNotContainsString('Secret St', $content);

        // Sanity: the summary/boolean fields ARE still present.
        $json = $response->json();
        $this->assertArrayHasKey('ocr_success', $json);
        $this->assertTrue($json['ocr_success']);
    }

    public function test_registration_response_does_not_echo_password(): void
    {
        $course = Course::factory()->create();

        $response = $this->postJson('/api/alumni/register', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'password' => 'super-secret-password',
            'email' => 'jane.no-echo@example.test',
            'phone' => '09171234567',
            'address' => '123 Main St',
            'gender' => 'female',
            'graduation_year' => 2020,
            'agreement' => true,
            'course_id' => $course->id,
        ]);

        $response->assertStatus(201);
        $this->assertStringNotContainsString('super-secret-password', $response->getContent());
        $this->assertStringNotContainsString('temp_password', $response->getContent());
    }
}
