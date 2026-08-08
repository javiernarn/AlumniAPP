<?php

namespace App\Mail;

use App\Models\Message;
use App\Models\Alumni;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminAlumniMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Message $message,
        public User $admin,
        public Alumni $alumni
    ) {}

 public function build()
{
    $adminName = trim(($this->admin->fname ?? '') . ' ' . ($this->admin->lname ?? ''))
        ?: ($this->admin->name ?? 'Guidance Counselor (Admin)');

    return $this->from(
            config('mail.from.address'),
            config('mail.from.name')
        )
        ->subject('New Message from ' . $adminName . ' - OCC Alumni')
        ->view('emails.admin-alumni-message')
        ->with([
            'chatMessage' => $this->message,
            'admin'       => $this->admin,
            'alumni'      => $this->alumni,
            'adminName'   => $adminName,
        ]);
}

}
