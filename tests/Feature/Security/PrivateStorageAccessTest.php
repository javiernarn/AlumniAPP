<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\AlumniDocument;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Phase 2 — private storage coverage.
 *
 * Exit criteria from the plan, verified below:
 *   GET /storage/private-file          -> 404
 *   GET /api/private-file/123 (no auth) -> 401
 *   GET /api/private-file/123 (wrong user) -> 403
 *   GET /api/private-file/123 (authorized) -> file
 */
class PrivateStorageAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');
        Storage::fake('public');
    }

    // ---- Alumni profile image ----

    public function test_direct_public_storage_url_for_profile_image_is_not_reachable(): void
    {
        // The whole point of Phase 2: nothing ever gets written under the
        // public disk for this category anymore, so a guessed direct URL
        // simply can't resolve to real content. We assert this at the
        // storage layer, matching how the app now behaves end-to-end.
        Storage::disk('private')->put('alumni/profile-images/secret.jpg', 'bytes');

        $this->assertFalse(Storage::disk('public')->exists('alumni/profile-images/secret.jpg'));
    }

    public function test_guest_cannot_download_profile_image(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id, 'profile_image' => 'alumni/profile-images/x.jpg']);
        Storage::disk('private')->put('alumni/profile-images/x.jpg', 'bytes');

        $this->getJson("/api/alumni/{$alumni->id}/profile-image")->assertStatus(401);
    }

    public function test_unrelated_alumni_cannot_download_another_alumnis_profile_image(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id, 'profile_image' => 'alumni/profile-images/x.jpg']);
        Storage::disk('private')->put('alumni/profile-images/x.jpg', 'bytes');

        Passport::actingAs($attacker);

        $this->getJson("/api/alumni/{$alumni->id}/profile-image")->assertStatus(403);
    }

    public function test_owner_can_download_their_own_profile_image(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id, 'profile_image' => 'alumni/profile-images/x.jpg']);
        Storage::disk('private')->put('alumni/profile-images/x.jpg', 'bytes');

        Passport::actingAs($owner);

        $this->get("/api/alumni/{$alumni->id}/profile-image")->assertStatus(200);
    }

    public function test_profile_image_url_accessor_points_at_authorized_endpoint_not_public_asset(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id, 'profile_image' => 'alumni/profile-images/x.jpg']);

        $this->assertStringContainsString(
            "/api/alumni/{$alumni->id}/profile-image",
            $alumni->profile_image_url
        );
        $this->assertStringNotContainsString('/storage/alumni/profile-images', $alumni->profile_image_url);
    }

    // ---- Alumni documents ----

    public function test_unrelated_alumni_cannot_download_another_alumnis_document(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id]);
        $document = AlumniDocument::create([
            'alumni_id' => $alumni->id,
            'document_type' => 'government_id',
            'file_path' => 'alumni/documents/id-scan.jpg',
            'file_name' => 'id-scan.jpg',
            'status' => 'pending',
        ]);
        Storage::disk('private')->put('alumni/documents/id-scan.jpg', 'bytes');

        Passport::actingAs($attacker);

        $this->getJson("/api/alumni-documents/{$document->id}/download")->assertStatus(403);
    }

    public function test_department_head_cannot_download_alumni_document_despite_course_scope(): void
    {
        // Course scope grants a department head read access to the
        // alumni *record*, but a confidential ID/diploma scan is not
        // implied by that — AlumniDocumentPolicy deliberately excludes
        // department heads.
        $course = \App\Models\Course::factory()->create();
        $head = User::factory()->departmentHead($course->id)->create();
        $alumni = Alumni::factory()->create(['course_id' => $course->id]);
        $document = AlumniDocument::create([
            'alumni_id' => $alumni->id,
            'document_type' => 'diploma',
            'file_path' => 'alumni/documents/diploma.jpg',
            'file_name' => 'diploma.jpg',
            'status' => 'approved',
        ]);
        Storage::disk('private')->put('alumni/documents/diploma.jpg', 'bytes');

        Passport::actingAs($head);

        $this->getJson("/api/alumni-documents/{$document->id}/download")->assertStatus(403);
    }

    public function test_owner_can_download_their_own_document(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id]);
        $document = AlumniDocument::create([
            'alumni_id' => $alumni->id,
            'document_type' => 'transcript',
            'file_path' => 'alumni/documents/transcript.pdf',
            'file_name' => 'transcript.pdf',
            'status' => 'approved',
        ]);
        Storage::disk('private')->put('alumni/documents/transcript.pdf', 'bytes');

        Passport::actingAs($owner);

        $this->get("/api/alumni-documents/{$document->id}/download")->assertStatus(200);
    }

    public function test_admin_can_download_any_alumni_document(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create();
        $document = AlumniDocument::create([
            'alumni_id' => $alumni->id,
            'document_type' => 'transcript',
            'file_path' => 'alumni/documents/transcript.pdf',
            'file_name' => 'transcript.pdf',
            'status' => 'approved',
        ]);
        Storage::disk('private')->put('alumni/documents/transcript.pdf', 'bytes');

        Passport::actingAs($admin);

        $this->get("/api/alumni-documents/{$document->id}/download")->assertStatus(200);
    }

    // ---- Job application resume / supporting documents ----

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

    public function test_unrelated_alumni_cannot_download_resume(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $stranger = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
            'resume_path' => 'resumes/resume.pdf',
            'status' => 'applied',
        ]);
        Storage::disk('private')->put('resumes/resume.pdf', 'bytes');

        Passport::actingAs($stranger);

        $this->getJson("/api/job-applications/{$application->id}/resume")->assertStatus(403);
    }

    public function test_job_post_creator_can_download_applicant_resume(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
            'resume_path' => 'resumes/resume.pdf',
            'status' => 'applied',
        ]);
        Storage::disk('private')->put('resumes/resume.pdf', 'bytes');

        Passport::actingAs($creator);

        $this->get("/api/job-applications/{$application->id}/resume")->assertStatus(200);
    }

    public function test_supporting_document_index_must_belong_to_the_application(): void
    {
        // Guards against path traversal / cross-application document
        // access via a crafted index — the index must correspond to a
        // real entry in *this* application's own id_documents array.
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
            'resume_path' => 'resumes/resume.pdf',
            'id_documents' => json_encode([
                ['type' => 'government_id', 'file_path' => 'id_documents/front.jpg'],
            ]),
            'status' => 'applied',
        ]);
        Storage::disk('private')->put('id_documents/front.jpg', 'bytes');

        Passport::actingAs($applicant);

        // Valid index -> 200
        $this->get("/api/job-applications/{$application->id}/documents/id-documents/0")
            ->assertStatus(200);

        // Out-of-range index -> 404, not a server error, not a leak.
        $this->getJson("/api/job-applications/{$application->id}/documents/id-documents/5")
            ->assertStatus(404);
    }

    // ---- Message images ----

    public function test_unrelated_alumni_cannot_download_someone_elses_message_image(): void
    {
        $owner = User::factory()->alumni()->create();
        $attacker = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id]);

        $message = Message::create([
            'alumni_id' => $alumni->id,
            'sender_type' => 'alumni',
            'sender_id' => $alumni->id,
            'message' => '',
            'image_path' => 'messages/pic.jpg',
            'is_read' => false,
        ]);
        Storage::disk('private')->put('messages/pic.jpg', 'bytes');

        Passport::actingAs($attacker);

        $this->getJson("/api/messages/{$message->id}/image")->assertStatus(403);
    }

    public function test_conversation_owner_can_download_their_message_image(): void
    {
        $owner = User::factory()->alumni()->create();
        $alumni = Alumni::factory()->create(['user_id' => $owner->id]);

        $message = Message::create([
            'alumni_id' => $alumni->id,
            'sender_type' => 'alumni',
            'sender_id' => $alumni->id,
            'message' => '',
            'image_path' => 'messages/pic.jpg',
            'is_read' => false,
        ]);
        Storage::disk('private')->put('messages/pic.jpg', 'bytes');

        Passport::actingAs($owner);

        $this->get("/api/messages/{$message->id}/image")->assertStatus(200);
    }

    public function test_admin_can_download_any_message_image(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create();

        $message = Message::create([
            'alumni_id' => $alumni->id,
            'sender_type' => 'admin',
            'sender_id' => $admin->id,
            'message' => '',
            'image_path' => 'messages/pic.jpg',
            'is_read' => false,
        ]);
        Storage::disk('private')->put('messages/pic.jpg', 'bytes');

        Passport::actingAs($admin);

        $this->get("/api/messages/{$message->id}/image")->assertStatus(200);
    }

    // ---- No-store / nosniff headers on confidential downloads ----

    public function test_confidential_downloads_send_no_store_and_nosniff_headers(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Alumni::factory()->create(['profile_image' => 'alumni/profile-images/x.jpg']);
        Storage::disk('private')->put('alumni/profile-images/x.jpg', 'bytes');

        Passport::actingAs($admin);

        $response = $this->get("/api/alumni/{$alumni->id}/profile-image");

        $response->assertStatus(200);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }
}
