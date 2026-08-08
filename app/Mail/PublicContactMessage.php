<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * PublicContactMessage
 * ============================================================
 * Sent whenever a visitor submits the public "Send us a Message"
 * form on PublicContactPage (/public-contact). Delivered straight to
 * the ATMS inbox, with the visitor's own address set as the Reply-To
 * so an admin can hit "Reply" in their mail client and it goes
 * straight back to the visitor — same reply pattern already used by
 * AdminAlumniMessageMail / job-post emails elsewhere in this app.
 * ============================================================
 */
class PublicContactMessage extends Mailable
{
    use Queueable, SerializesModels;

    public string $senderEmail;
    public string $messageSubject;
    public string $messageBody;

    public function __construct(string $senderEmail, string $messageSubject, string $messageBody)
    {
        $this->senderEmail    = $senderEmail;
        $this->messageSubject = $messageSubject;
        $this->messageBody    = $messageBody;
    }

    public function build()
    {
        return $this->from(
                config('mail.from.address'),
                config('mail.from.name')
            )
            ->replyTo($this->senderEmail)
            ->subject('[Contact Us] ' . $this->messageSubject)
            ->view('emails.public-contact-message')
            ->with([
                'senderEmail'    => $this->senderEmail,
                'messageSubject' => $this->messageSubject,
                'messageBody'    => $this->messageBody,
            ]);
    }
}