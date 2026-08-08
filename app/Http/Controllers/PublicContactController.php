<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Mail\PublicContactMessage;

/**
 * PublicContactController
 * ============================================================
 * Backs the public "Send us a Message" form on PublicContactPage
 * (/public-contact). No auth required — this is the public site.
 * Every submission is emailed straight to RECIPIENT_EMAIL below
 * (same address shown on the Contact page and in the site footer),
 * with the visitor's address set as Reply-To on the mail itself.
 * ============================================================
 */
class PublicContactController extends Controller
{
    /**
     * Where every Contact Us submission is delivered. Keep this in
     * sync with CONTACT_EMAIL in PublicContactPage.js.
     */
    protected const RECIPIENT_EMAIL = 'occ.antiquina.joneejohn@gmail.com';

    public function send(Request $request)
    {
        try {
            $validated = $request->validate([
                'email'   => 'required|email|max:255',
                'subject' => 'required|string|max:150',
                'message' => 'required|string|max:1000',
                // Honeypot — hidden from real visitors via CSS, so it
                // only ever gets filled in by bots that auto-fill
                // every field. A non-empty value fails this rule and
                // the submission is rejected below.
                'website' => 'nullable|string|max:0',
            ]);

            Mail::to(self::RECIPIENT_EMAIL)
                ->send(new PublicContactMessage(
                    trim($validated['email']),
                    trim($validated['subject']),
                    trim($validated['message'])
                ));

            return response()->json([
                'success' => true,
                'message' => "Thanks! Your message has been sent — we'll get back to you soon.",
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Please check the form and try again.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to send public contact message: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong sending your message. Please try again later.',
            ], 500);
        }
    }
}