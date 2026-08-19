<?php

namespace Tests\Feature\Security;

use App\Models\Alumni;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Phase 9 — database hardening.
 */
class DatabaseHardeningTest extends TestCase
{
    use RefreshDatabase;

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

    // ---- Encryption at rest ----

    public function test_ocr_fields_are_encrypted_at_rest_in_the_raw_database_row(): void
    {
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        $plainName = 'Juan Dela Cruz';
        $plainIdNumber = '01-2345-6789012-3';
        $plainRawText = 'REPUBLIC OF THE PHILIPPINES\nNAME: JUAN DELA CRUZ\nID NO: 01-2345-6789012-3';

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
            'resume_path' => 'resumes/resume.pdf',
            'status' => 'applied',
            'ocr_name' => $plainName,
            'ocr_id_number' => $plainIdNumber,
            'ocr_raw_text' => $plainRawText,
            'ocr_extracted_data' => ['name' => $plainName, 'id_number' => $plainIdNumber],
        ]);

        // Read the RAW database row, bypassing Eloquent's cast layer
        // entirely — this is what a raw DB dump, backup file, or
        // compromised read-only DB credential would actually see.
        $raw = DB::table('job_applications')->where('id', $application->id)->first();

        $this->assertStringNotContainsString($plainName, $raw->ocr_name);
        $this->assertStringNotContainsString($plainIdNumber, $raw->ocr_id_number);
        $this->assertStringNotContainsString($plainIdNumber, $raw->ocr_raw_text);
        $this->assertStringNotContainsString($plainIdNumber, $raw->ocr_extracted_data);
        $this->assertStringNotContainsString('DELA CRUZ', $raw->ocr_raw_text);

        // But Eloquent transparently decrypts it back for legitimate
        // application code.
        $application->refresh();
        $this->assertSame($plainName, $application->ocr_name);
        $this->assertSame($plainIdNumber, $application->ocr_id_number);
        $this->assertSame($plainRawText, $application->ocr_raw_text);
        $this->assertSame($plainIdNumber, $application->ocr_extracted_data['id_number']);
    }

    public function test_ocr_name_survives_encryption_without_truncation(): void
    {
        // Regression test for the exact risk this phase's column-widening
        // migration addresses: a plain VARCHAR(255) is comfortably large
        // enough for a name in plaintext, but Laravel's encrypted cast
        // output (IV + ciphertext + MAC, JSON-wrapped, base64-encoded)
        // can exceed 255 characters even for a short input.
        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        $name = 'Maria Clara De La Santisima Trinidad'; // still a short, realistic name

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
            'resume_path' => 'resumes/resume.pdf',
            'status' => 'applied',
            'ocr_name' => $name,
        ]);

        $application->refresh();
        $this->assertSame($name, $application->ocr_name, 'ocr_name must round-trip exactly — any mismatch indicates truncation');
    }

    // ---- Unique constraints (DB-level, not just app validation) ----

    public function test_database_rejects_duplicate_phone_even_bypassing_model_validation(): void
    {
        Alumni::factory()->create(['phone' => '09171234567']);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Raw insert deliberately bypasses Eloquent/Form Request
        // validation entirely — this is what proves the constraint is
        // enforced by the database itself, not just the application.
        DB::table('alumni')->insert([
            'application_id' => 'APP-DUPTEST-1',
            'first_name' => 'Test',
            'last_name' => 'Duplicate',
            'email' => 'dup-phone-test@example.test',
            'phone' => '09171234567',
            'address' => 'x',
            'gender' => 'male',
            'course' => '',
            'graduation_year' => 2020,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_database_rejects_duplicate_student_id_even_bypassing_model_validation(): void
    {
        Alumni::factory()->create(['student_id' => 'STU-0001']);

        $this->expectException(\Illuminate\Database\QueryException::class);

        DB::table('alumni')->insert([
            'application_id' => 'APP-DUPTEST-2',
            'first_name' => 'Test',
            'last_name' => 'Duplicate',
            'email' => 'dup-student-test@example.test',
            'phone' => '09179999999',
            'address' => 'x',
            'gender' => 'male',
            'course' => '',
            'student_id' => 'STU-0001',
            'graduation_year' => 2020,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ---- Cascade-delete behavior ----

    public function test_deleting_job_post_creator_does_not_delete_other_alumnis_applications(): void
    {
        // Skip on SQLite: the FK-behavior fix in this phase is MySQL-
        // only (see migration doc comment — SQLite FK constraints are
        // fixed at table-creation time and this project has no
        // doctrine/dbal-equivalent tooling to recreate the table).
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Cascade-behavior fix is MySQL-only; see migration doc comment.');
        }

        $creator = User::factory()->alumni()->create();
        $applicant = User::factory()->alumni()->create();
        $jobPost = $this->makeJobPost($creator->id);

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'alumni_id' => $applicant->id,
            'resume_path' => 'resumes/resume.pdf',
            'status' => 'applied',
        ]);

        $creator->delete();

        $this->assertDatabaseHas('job_posts', ['id' => $jobPost->id]);
        $this->assertDatabaseHas('job_applications', ['id' => $application->id]);
        $this->assertDatabaseHas('job_posts', ['id' => $jobPost->id, 'created_by_user_id' => null]);
    }

    // ---- Foreign keys added where missing ----

    public function test_deleting_user_preserves_their_password_change_log_history(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('FK-add fix is MySQL-only; see migration doc comment.');
        }

        $user = User::factory()->alumni()->create();

        $logId = DB::table('password_change_logs')->insertGetId([
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => '127.0.0.1',
            'status' => 'success',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user->delete();

        // The audit log row survives — this is the whole point of using
        // SET NULL instead of CASCADE here (see the migration's doc
        // comment): losing this history is exactly what an attacker
        // deleting a compromised account to cover their tracks would
        // want, so it must not happen automatically as a side effect.
        $this->assertDatabaseHas('password_change_logs', [
            'id' => $logId,
            'user_id' => null,
            'email' => $user->email,
        ]);
    }
}
