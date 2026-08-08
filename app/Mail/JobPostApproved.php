<?php

namespace App\Mail;

use App\Models\JobPost;
use App\Models\Alumni;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class JobPostApproved extends Mailable
{
    use Queueable, SerializesModels;

    public JobPost $jobPost;
    public $alumni;

    public function __construct(JobPost $jobPost, $alumni)
    {
        $this->jobPost = $jobPost;
        $this->alumni = $alumni;
    }

    public function build()
    {
        return $this->from(
            config('mail.from.address'),
            config('mail.from.name')
        )
        ->subject('Your Job Post Has Been Approved - OCC Alumni')
        ->view('emails.job-post-approved')
        ->with([
            'jobPost' => $this->jobPost,
            'alumni' => $this->alumni,
        ]);
    }
}
