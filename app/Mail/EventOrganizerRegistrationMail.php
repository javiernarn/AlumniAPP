<?php

namespace App\Mail;

use App\Models\Event;
use App\Models\Alumni;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EventOrganizerRegistrationMail extends Mailable
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
            ->subject('New Alumni Registration - ' . $this->event->title . ' | OCC Alumni')
            ->view('emails.event-organizer-registration')
            ->with([
                'event'            => $this->event,
                'alumni'           => $this->alumni,
                'totalRegistered'  => $this->totalRegistered,
                'spotsRemaining'   => $this->spotsRemaining,
                'isFull'           => $this->isFull,
                'organizerName'    => $this->event->organizer,
            ]);
    }
}
