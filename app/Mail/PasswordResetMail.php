<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public $fullName;
    public $resetUrl;
    public $userEmail;

    /**
     * Create a new message instance.
     */
    public function __construct(string $fullName, string $resetUrl, string $email)
    {
        $this->fullName = $fullName;
        $this->resetUrl = $resetUrl;
        $this->userEmail = $email;
    }

    /**
     * Build the message.
     * 
     * Using build() method instead of envelope/content for better compatibility
     */
    public function build()
    {
        return $this->subject('Password Reset Request - Opol Community College')
                    ->view('emails.password-reset')
                    ->with([
                        'fullName' => $this->fullName,
                        'resetUrl' => $this->resetUrl,
                        'email' => $this->userEmail,
                    ]);
    }
}
