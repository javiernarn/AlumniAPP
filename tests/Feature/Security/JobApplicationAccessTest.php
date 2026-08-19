<?php

namespace Tests\Feature\Security;

use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 1 — horizontal & vertical privilege escalation coverage for job
 * applications, including the government-ID image download endpoint,
 * which previously pointed at a controller method that did not exist.
 */
class JobApplicationAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makeJobPost(int $creatorId): JobPost
    {
        return JobPost::create([
            'title' => 'Software Engineer',
            'description' => 'Build things.',
            'company' => 'Acme',
            'requirements' => 'PHP',
            'job_type' => 'Full-time',
            'status' => 'approved',
            'created_by_user_id' => $creatorId,
            'created_by_role' => 'alumni',
        ]);
    }

    private function makeApplication(int $jobPostId, int $applicantId): JobApplication
    {
        return JobApplication::create([
            'job_post_id' => $jobPostId,
            'alumni_id' => $applicantId,
            'resume_path' => 'resumes/fake.pdf',
            'status' => 'applied',
            'government_id_front' => 'gov-ids/front.jpg',
            'government_id_back' => 'gov-ids/back.jpg',
        ]);
    }

    public function test_unrelated_alumni_cannot_view_someone_elses_application(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $stranger = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($stranger);

        $this->getJson("/api/job-applications/{$application->id}")->assertStatus(403);
    }

    public function test_applicant_can_view_their_own_application(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($applicant);

        $this->getJson("/api/job-applications/{$application->id}")->assertStatus(200);
    }

    public function test_job_post_creator_can_view_application_to_their_posting(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($creator);

        $this->getJson("/api/job-applications/{$application->id}")->assertStatus(200);
    }

    public function test_unrelated_alumni_cannot_update_application_status(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $stranger = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($stranger);

        $response = $this->putJson("/api/job-applications/{$application->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'status' => 'applied',
        ]);
    }

    public function test_applicant_cannot_update_their_own_application_status(): void
    {
        // Only admins or the job post creator may decide the outcome —
        // an applicant approving their own application would be a
        // vertical privilege escalation.
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($applicant);

        $response = $this->putJson("/api/job-applications/{$application->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(403);
    }

    public function test_unrelated_alumni_cannot_download_government_id_image(): void
    {
        Storage::fake('private');
        Storage::disk('private')->put('gov-ids/front.jpg', 'fake-image-bytes');

        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $stranger = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($stranger);

        $response = $this->getJson("/api/job-applications/{$application->id}/id-image/front");

        $response->assertStatus(403);
    }

    public function test_applicant_can_download_their_own_government_id_image(): void
    {
        Storage::fake('private');
        Storage::disk('private')->put('gov-ids/front.jpg', 'fake-image-bytes');

        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($applicant);

        $response = $this->get("/api/job-applications/{$application->id}/id-image/front");

        $response->assertStatus(200);
    }

    public function test_admin_can_download_any_government_id_image(): void
    {
        Storage::fake('private');
        Storage::disk('private')->put('gov-ids/front.jpg', 'fake-image-bytes');

        $admin = User::factory()->admin()->create();
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();

        $jobPost = $this->makeJobPost($creator->id);
        $application = $this->makeApplication($jobPost->id, $applicant->id);

        Passport::actingAs($admin);

        $response = $this->get("/api/job-applications/{$application->id}/id-image/front");

        $response->assertStatus(200);
    }
}
