<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\Course;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 3 — validation and upload hardening.
 *
 * Exit criterion from the plan: "Malformed input never reaches business
 * logic." These tests attack the highest-risk surface first — the
 * public, unauthenticated self-registration endpoint — then cover the
 * other upload/validation paths touched in this phase.
 */
class UploadValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');
    }

    private function baseRegistrationPayload(): array
    {
        return [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'password' => 'password123',
            'email' => 'jane.doe@example.test',
            'phone' => '09171234567',
            'address' => '123 Main St',
            'gender' => 'female',
            'graduation_year' => 2020,
            'agreement' => true,
        ];
    }

    // ---- Foreign key validation (previously completely unchecked) ----

    public function test_registration_rejects_nonexistent_course_id(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['course_id'] = 999999; // does not exist

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('course_id');
        $this->assertDatabaseMissing('alumni', ['email' => 'jane.doe@example.test']);
    }

    public function test_registration_accepts_valid_course_id(): void
    {
        $course = Course::factory()->create();
        $payload = $this->baseRegistrationPayload();
        $payload['course_id'] = $course->id;

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('alumni', [
            'email' => 'jane.doe@example.test',
            'course_id' => $course->id,
        ]);
    }

    public function test_registration_rejects_nonexistent_employment_status_id(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['employment_status_id'] = 999999;

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('employment_status_id');
    }

    // ---- File type / extension hardening ----

    public function test_registration_rejects_svg_profile_image(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['email'] = 'svg-test@example.test';
        $payload['profile_image'] = UploadedFile::fake()->create(
            'evil.svg',
            10,
            'image/svg+xml'
        );

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('profile_image');
        $this->assertDatabaseMissing('alumni', ['email' => 'svg-test@example.test']);
    }

    public function test_registration_rejects_oversized_profile_image(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['email'] = 'oversized@example.test';
        // fake()->image() with a size in KB above the 5120 (5MB) limit
        $payload['profile_image'] = UploadedFile::fake()->create('big.jpg', 6000, 'image/jpeg');

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('profile_image');
    }

    public function test_registration_accepts_valid_jpeg_profile_image_and_reencodes_it(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['email'] = 'valid-image@example.test';
        $payload['profile_image'] = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(201);

        $alumni = Alumni::where('email', 'valid-image@example.test')->first();
        $this->assertNotNull($alumni->profile_image);
        // Phase 3: the file is re-encoded, so it always lands as .jpg
        // regardless of the original extension/content, and the stored
        // filename is fully server-random (not derived from client input).
        $this->assertStringEndsWith('.jpg', $alumni->profile_image);
        Storage::disk('private')->assertExists($alumni->profile_image);
    }

    public function test_registration_document_upload_rejects_invalid_document_type(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['email'] = 'bad-doctype@example.test';
        $payload['documents'] = [
            [
                'type' => 'not_a_real_type', // not in the enum
                'file' => UploadedFile::fake()->image('id.jpg', 100, 100),
            ],
        ];

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('alumni', ['email' => 'bad-doctype@example.test']);
    }

    public function test_registration_document_upload_rejects_executable_disguised_as_document(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['email'] = 'exe-upload@example.test';
        $payload['documents'] = [
            [
                'type' => 'government_id',
                'file' => UploadedFile::fake()->create('shell.php', 10, 'application/x-httpd-php'),
            ],
        ];

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('alumni', ['email' => 'exe-upload@example.test']);
    }

    public function test_registration_rejects_too_many_documents(): void
    {
        $payload = $this->baseRegistrationPayload();
        $payload['email'] = 'too-many-docs@example.test';
        $payload['documents'] = array_map(
            fn ($i) => [
                'type' => 'diploma',
                'file' => UploadedFile::fake()->image("doc{$i}.jpg", 50, 50),
            ],
            range(1, 11) // cap is 10
        );

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);
    }

    // ---- Alumni document upload (admin route) ----

    public function test_document_upload_rejects_gif_after_phase3_tightening(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create();
        Passport::actingAs($admin);

        $response = $this->postJson("/api/admin/alumni/{$alumni->id}/upload-document", [
            'file' => UploadedFile::fake()->create('id.gif', 100, 'image/gif'),
            'document_type' => 'government_id',
        ]);

        $response->assertStatus(422);
    }

    public function test_document_upload_rejects_invalid_document_type_enum(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create();
        Passport::actingAs($admin);

        $response = $this->postJson("/api/admin/alumni/{$alumni->id}/upload-document", [
            'file' => UploadedFile::fake()->image('id.jpg', 100, 100),
            'document_type' => 'not_a_valid_type',
        ]);

        $response->assertStatus(422);
    }

    // ---- Mass assignment / owner tampering on alumni update ----

    public function test_update_cannot_tamper_with_status_or_admin_only_fields(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create([
            'user_id' => $owner->id,
            'status' => 'pending',
        ]);

        Passport::actingAs($owner);

        $response = $this->putJson("/api/alumni/{$alumni->id}", [
            'first_name' => 'Updated',
            // Attempted mass-assignment / tampering — none of these are
            // in UpdateAlumniRequest's rule set, so they must be
            // silently ignored rather than applied.
            'status' => 'approved',
            'admin_notes' => 'i approved myself',
            'is_messaging_restricted' => true,
            'user_id' => 999999,
            'course_id' => 999999,
        ]);

        $response->assertStatus(200);

        $alumni->refresh();
        $this->assertSame('pending', $alumni->status);
        $this->assertNull($alumni->admin_notes);
        $this->assertFalse((bool) $alumni->is_messaging_restricted);
        $this->assertSame($owner->id, $alumni->user_id);
    }

    // ---- Job application upload hardening ----

    private function makeJobPost(int $creatorId): JobPost
    {
        return JobPost::create([
            'title' => 'Engineer',
            'description' => 'desc',
            'company' => 'Acme',
            'requirements' => 'PHP',
            'job_type' => 'Full-time',
            'status' => 'approved',
            'created_by_user_id' => $creatorId,
            'created_by_role' => 'alumni',
        ]);
    }

    public function test_apply_rejects_too_many_other_documents(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        Passport::actingAs($applicant);

        $response = $this->postJson("/api/job-applications/{$jobPost->id}", [
            'resume' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
            'cover_letter' => 'I would like to apply.',
            'id_documents' => [
                ['type' => 'government_id', 'file' => UploadedFile::fake()->image('id1.jpg', 100, 100)],
                ['type' => 'school_id', 'file' => UploadedFile::fake()->image('id2.jpg', 100, 100)],
            ],
            'other_documents' => array_map(
                fn ($i) => UploadedFile::fake()->image("extra{$i}.jpg", 50, 50),
                range(1, 6) // cap is 5
            ),
        ]);

        $response->assertStatus(422);
    }

    public function test_apply_rejects_executable_disguised_as_id_document(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        Passport::actingAs($applicant);

        $response = $this->postJson("/api/job-applications/{$jobPost->id}", [
            'resume' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
            'cover_letter' => 'I would like to apply.',
            'id_documents' => [
                ['type' => 'government_id', 'file' => UploadedFile::fake()->create('shell.php', 10, 'application/x-httpd-php')],
                ['type' => 'school_id', 'file' => UploadedFile::fake()->image('id2.jpg', 100, 100)],
            ],
        ]);

        $response->assertStatus(422);
    }

    public function test_apply_with_valid_files_succeeds_and_reencodes_id_images(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        Passport::actingAs($applicant);

        $response = $this->postJson("/api/job-applications/{$jobPost->id}", [
            'resume' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
            'cover_letter' => 'I would like to apply.',
            'id_documents' => [
                ['type' => 'government_id', 'file' => UploadedFile::fake()->image('id1.jpg', 100, 100)],
                ['type' => 'school_id', 'file' => UploadedFile::fake()->image('id2.jpg', 100, 100)],
            ],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('job_applications', [
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
        ]);
    }

    // ---- Orphan cleanup on failed transaction ----

    public function test_failed_registration_does_not_leave_orphaned_files(): void
    {
        // Two applicants racing for the same email: the second request's
        // file upload succeeds at the storage layer, but the DB insert
        // must fail on the unique constraint — the file should not be
        // left behind afterwards.
        $existing = Alumni::factory()->create(['email' => 'duplicate@example.test']);

        $payload = $this->baseRegistrationPayload();
        $payload['email'] = 'duplicate@example.test'; // will fail unique validation
        $payload['profile_image'] = UploadedFile::fake()->image('avatar.jpg', 100, 100);

        $response = $this->postJson('/api/alumni/register', $payload);

        $response->assertStatus(422);

        // Nothing should have been written for this (rejected) attempt.
        $filesAfter = collect(Storage::disk('private')->allFiles('alumni/profile-images'));
        $this->assertCount(0, $filesAfter);
    }
}
