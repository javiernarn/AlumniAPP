<?php

namespace App\Mail;

use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class JobApplicationRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $applicant;
    public JobPost $jobPost;
    public string $feedbackNotes;
    public $reviewerName;

    public function __construct($applicant, JobPost $jobPost, string $feedbackNotes, string $reviewerName)
    {
        $this->applicant = $applicant;
        $this->jobPost = $jobPost;
        $this->feedbackNotes = $feedbackNotes;
        $this->reviewerName = $reviewerName;
    }

    public function build()
    {
        return $this->from(
            config('mail.from.address'),
            config('mail.from.name')
        )
        ->subject('Application Status Update - OCC Alumni')
        ->view('emails.job-application-rejected')
        ->with([
            'applicant' => $this->applicant,
            'jobPost' => $this->jobPost,
            'feedbackNotes' => $this->feedbackNotes,
            'reviewerName' => $this->reviewerName,
        ]);
    }
}
