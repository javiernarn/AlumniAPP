<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AlumniRegistrationConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public $alumniData;
    public $applicationId;

    /**
     * Create a new message instance.
     */
    public function __construct(array $alumniData, string $applicationId)
    {
        $this->alumniData = $alumniData;
        $this->applicationId = $applicationId;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Alumni Registration Confirmation - OCC Alumni Association')
                    ->view('emails.alumni-registration-confirmation')
                    ->with([
                        'alumniData' => $this->alumniData,
                        'applicationId' => $this->applicationId,
                    ]);
    }
}
