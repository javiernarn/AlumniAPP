<?php

namespace App\Mail;

use App\Models\Event;
use App\Models\Alumni;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AlumniEventRegistrationMail extends Mailable
{
    use Queueable, SerializesModels;

    public Event $event;
    public Alumni $alumni;
    public int $totalRegistered;
    public int $spotsRemaining;
    public bool $isFull;

    public function __construct(
        Event $event,
        Alumni $alumni,
        int $totalRegistered,
        int $spotsRemaining,
        bool $isFull
    ) {
        $this->event           = $event;
        $this->alumni          = $alumni;
        $this->totalRegistered = $totalRegistered;
        $this->spotsRemaining  = $spotsRemaining;
        $this->isFull          = $isFull;
    }

    public function build()
    {
        return $this->from(
                config('mail.from.address'),
                config('mail.from.name')
            )
            ->subject('Registration Confirmed - ' . $this->event->title . ' | OCC Alumni')
            ->view('emails.alumni-event-registration')
            ->with([
                'event'           => $this->event,
                'alumni'          => $this->alumni,
                'totalRegistered' => $this->totalRegistered,
                'spotsRemaining'  => $this->spotsRemaining,
                'isFull'          => $this->isFull,
                'alumniName'      => trim(
                    $this->alumni->first_name . ' ' .
                    ($this->alumni->middle_name ?? '') . ' ' .
                    $this->alumni->last_name . ' ' .
                    ($this->alumni->suffix ?? '')
                ),
                'organizerName'   => $this->event->organizer,
            ]);
    }
}
