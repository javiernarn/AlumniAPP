<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AlumniAccountApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $alumniData;

    /**
     * Create a new message instance.
     */
    public function __construct(array $alumniData)
    {
        $this->alumniData = $alumniData;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Account Approved - OCC Alumni Association')
                    ->view('emails.alumni-account-approved')
                    ->with([
                        'alumniData' => $this->alumniData,
                    ]);
    }
}
