<?php

namespace App\Mail;

use App\Models\JobPost;
use App\Models\Alumni;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class JobPostRejected extends Mailable
{
    use Queueable, SerializesModels;

    public JobPost $jobPost;
    public $alumni;
    public string $adminNotes;

    public function __construct(JobPost $jobPost, $alumni, string $adminNotes)
    {
        $this->jobPost = $jobPost;
        $this->alumni = $alumni;
        $this->adminNotes = $adminNotes;
    }

    public function build()
    {
        return $this->from(
            config('mail.from.address'),
            config('mail.from.name')
        )
        ->subject('Job Post Submission Update - OCC Alumni')
        ->view('emails.job-post-rejected')
        ->with([
            'jobPost' => $this->jobPost,
            'alumni' => $this->alumni,
            'adminNotes' => $this->adminNotes,
        ]);
    }
}
