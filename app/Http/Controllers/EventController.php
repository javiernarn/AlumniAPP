<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Notification;
use App\Models\User;
use App\Http\Requests\StoreEventRequest;
use Illuminate\Http\Request;
use App\Mail\EventOrganizerRegistrationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
// At the top, with the other use statements (ADD this line):
use App\Mail\AlumniEventRegistrationMail;



// use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{

    // Get events for dropdowns
    public function getEventData()
    {
        $eventTypes = [
            ['value' => 'conference', 'label' => 'Conference', 'color' => 'blue'],
            ['value' => 'workshop', 'label' => 'Workshop', 'color' => 'green'],
            ['value' => 'meetup', 'label' => 'Meetup', 'color' => 'orange'],
            ['value' => 'seminar', 'label' => 'Seminar', 'color' => 'purple'],
            ['value' => 'social', 'label' => 'Social', 'color' => 'pink'],
            ['value' => 'sports', 'label' => 'Sports', 'color' => 'red'],
            ['value' => 'other', 'label' => 'Other', 'color' => 'gray'],
        ];

        $eventCategories = [
            ['value' => 'technology', 'label' => 'Technology'],
            ['value' => 'business', 'label' => 'Business'],
            ['value' => 'arts', 'label' => 'Arts & Culture'],
            ['value' => 'education', 'label' => 'Education'],
            ['value' => 'health', 'label' => 'Health & Wellness'],
            ['value' => 'sports', 'label' => 'Sports & Fitness'],
            ['value' => 'music', 'label' => 'Music'],
            ['value' => 'food', 'label' => 'Food & Drink'],
            ['value' => 'networking', 'label' => 'Networking'],
        ];

        return response()->json([
            'eventTypes' => $eventTypes,
            'eventCategories' => $eventCategories,
        ]);
    }

    // Store new event
    public function store(StoreEventRequest $request)
    {
        try {
            $imagePaths = [];

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('events/images', 'public');
                    $imagePaths[] = $path;
                }
            }

            $currentDateTime = now();
            $eventDate = $request->date;
            $startTime = $request->start_time ?? ($request->input('timeRange.0') ?? null);
            $endTime = $request->end_time ?? ($request->input('timeRange.1') ?? null);

            $eventDateTime = \Carbon\Carbon::parse($eventDate . ' ' . $startTime);
            $eventEndDateTime = \Carbon\Carbon::parse($eventDate . ' ' . $endTime);

            $status = 'upcoming';
            if ($currentDateTime->greaterThan($eventEndDateTime)) {
                $status = 'completed';
            } elseif ($currentDateTime->between($eventDateTime, $eventEndDateTime)) {
                $status = 'ongoing';
            }

            $event = Event::create([
                'title' => $request->title,
                'description' => $request->description,
                'event_type' => $request->event_type,
                'category' => $request->category,
                'date' => $request->date,
                'start_time' => $request->start_time ?? ($request->timeRange[0] ?? null),
                'end_time' => $request->end_time ?? ($request->timeRange[1] ?? null),
                'location' => $request->location,
                'price' => $request->price ?? 0,
                'capacity' => $request->capacity,
                'organizer' => $request->organizer,
                'contact_number' => $request->contact_number,   // NEW
                'contact_email' => $request->contact_email,     // NEW
                'tags' => $request->tags,
                'agenda' => $request->agenda,
                'featured' => (int) $request->featured,
                'images' => $imagePaths,
                'user_id' => auth()->id(),
                'status' => $status,
            ]);

            $alumniUsers = User::where('role', 'alumni')->get();

            // Get full image URLs for notification
            $eventImageUrls = [];
            if (!empty($imagePaths)) {
                foreach ($imagePaths as $path) {
                    $eventImageUrls[] = asset('storage/' . $path);
                }
            }

            foreach ($alumniUsers as $alumnus) {
                Notification::create([
                    'user_id' => $alumnus->id,
                    'notifiable_type' => 'new_event',
                    'data' => json_encode([
                        'title' => 'New Event Created',
                        'message' => 'A new event has been created: ' . $event->title,
                        'event_id' => $event->id,
                        'event_title' => $event->title,
                        'event_type' => $event->event_type,
                        'event_date' => $event->date,
                        'event_location' => $event->location,
                        'event_description' => substr($event->description, 0, 150),
                        'event_images' => $eventImageUrls, // Added event images to notification
                        'created_by' => auth()->user()->name ?? 'Admin',
                        'created_at' => now()->toIso8601String(),
                    ]),
                    'read' => false,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Event created successfully!',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create event: ' . $e->getMessage()
            ], 500);
        }
    }

    // Get all events (authenticated dashboard use)
    public function index(Request $request)
    {
        $alumniId = auth()->id(); // ← ADDED

        // $query = Event::with('user')->upcoming();
        $query = Event::with('user');

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('event_type', $request->type);
        }

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $events = $query->orderBy('date')->get();

        // INSERTED FEATURES
        $events = $events->map(function ($event) use ($alumniId) {
            $event->registered_count = EventRegistration::where('event_id', $event->id)->count();

            $event->is_user_registered = EventRegistration::where('event_id', $event->id)
                ->where('alumni_id', $alumniId)
                ->exists();

            return $event;
        });

        return response()->json($events);
    }

    /**
     * Public, unauthenticated listing of events for the logged-out home
     * page. Used by /public/events (see routes/api.php).
     *
     * SECURITY: deliberately does NOT eager-load the `user` relation —
     * PublicHomePage.js never displays organizer account info (name,
     * email, role, etc.), so it's never fetched from the database in
     * the first place rather than being fetched and then hidden. This
     * also means there's no Auth::user()/registration lookup here:
     * anonymous visitors are never "registered", so that's hardcoded
     * to false instead of querying with a null alumni_id.
     */
    public function publicIndex(Request $request)
    {
        // Serves BOTH the homepage teaser (usePublicHomeData.js, only
        // needs upcoming/capped-at-4) and the full public events page
        // (usePublicEventsData.js — Upcoming/Ongoing/Completed/Featured,
        // which needs the real date/time/location/status/featured
        // fields to render each card and to compute live status).
        //
        // CRASH-PROOF SELECT: a plain select(['start_time', ...]) threw
        // a 500 (SQL "Unknown column") because one or more of those
        // column names don't match this table's actual schema. Rather
        // than guess the right name, this now checks Schema::hasColumn()
        // for each optional field and only selects the ones that really
        // exist — so the endpoint can never crash over a column-name
        // mismatch again, it just quietly omits whatever isn't there
        // (and the frontend already falls back to "TBA" for those).
        $baseColumns = [
            'id',
            'title',
            'description',
            'event_type',
            'category',
            'date',
            'images',
            'created_at',
        ];

        $optionalColumns = [
            'start_time',
            'end_time',
            'location',
            'status',
            'featured',
            // Common alternate names, in case your migration used these
            // instead — harmless to check for even if unused.
            'event_date',
            'is_featured',
        ];

        $columns = $baseColumns;
        foreach ($optionalColumns as $col) {
            if (Schema::hasColumn('events', $col) && !in_array($col, $columns, true)) {
                $columns[] = $col;
            }
        }

        // Log once (not per-request-crashing) which of the fields the
        // events page actually needs are missing from the schema, so
        // it's easy to spot in storage/logs/laravel.log rather than
        // guessing from a blank "TBA" on the page.
        $missing = array_values(array_diff(
            ['start_time', 'end_time', 'location', 'status', 'featured'],
            $columns,
        ));
        if (!empty($missing)) {
            Log::warning('EventController@publicIndex: events table is missing expected columns', [
                'missing' => $missing,
            ]);
        }

        $query = Event::query()->select($columns);

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('event_type', $request->type);
        }

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $events = $query->orderBy('date')->get();

        // registered_count / is_user_registered dropped too: nothing in
        // PublicHomePage.js reads either one, and computing them meant an
        // extra EventRegistration query per event on every anonymous
        // page load for a value nobody displayed.

        return response()->json($events);
    }

    // Get single event
    public function show(Event $event)
    {
        $alumni = \App\Models\Alumni::where('user_id', auth()->id())->first();
        $alumniId = $alumni ? $alumni->id : null;

        $event->load('user');

        $event->registered_count = EventRegistration::where('event_id', $event->id)->count();

        $event->is_user_registered = $alumniId ? EventRegistration::where('event_id', $event->id)
            ->where('alumni_id', $alumniId)
            ->exists() : false;

        return response()->json($event);
    }


    public function update(Request $request, Event $event)
    {
        try {
            // If the frontend sent back which existing images to keep, use that list.
            // This honours any removals the user made in the edit modal.
            // Fall back to the full stored list only when the old client (no existing_images key) calls this.
            if ($request->has('existing_images')) {
                $keptUrls  = $request->input('existing_images', []);
                $storagePrefix = asset('storage') . '/';
                $imagePaths = array_values(array_filter(array_map(function ($url) use ($storagePrefix) {
                    // Strip the full URL prefix so we only store the relative path, e.g. events/images/xxx.jpg
                    return str_replace($storagePrefix, '', $url);
                }, is_array($keptUrls) ? $keptUrls : [])));
            } else {
                $imagePaths = $event->images ?? [];
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('events/images', 'public');
                    $imagePaths[] = $path;
                }
            }

            $currentDateTime = now();
            $eventDate = $request->date;
            $startTime = $request->start_time ?? ($request->input('timeRange.0') ?? null);
            $endTime = $request->end_time ?? ($request->input('timeRange.1') ?? null);

            $eventDateTime = \Carbon\Carbon::parse($eventDate . ' ' . $startTime);
            $eventEndDateTime = \Carbon\Carbon::parse($eventDate . ' ' . $endTime);

            $status = 'upcoming';
            if ($currentDateTime->greaterThan($eventEndDateTime)) {
                $status = 'completed';
            } elseif ($currentDateTime->between($eventDateTime, $eventEndDateTime)) {
                $status = 'ongoing';
            }

            $event->update([
                'title' => $request->title,
                'description' => $request->description,
                'event_type' => $request->event_type,
                'category' => $request->category,
                'date' => $eventDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'location' => $request->location,
                'price' => $request->price ?? 0,
                'capacity' => $request->capacity,
                'organizer' => $request->organizer,
                'contact_number' => $request->contact_number,   // NEW
                'contact_email' => $request->contact_email,     // NEW
                'tags' => $request->tags,
                'agenda' => $request->agenda,
                'featured' => (int) $request->featured,
                'images' => $imagePaths,
                'status' => $status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Event updated successfully!',
                'data' => $event->fresh('user')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update event: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Event $event)
    {
        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event deleted successfully'
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | INSERTED: EVENT REGISTRATION FUNCTIONS
    |--------------------------------------------------------------------------
    */

    // REGISTER
 // REGISTER
public function register(Request $request, Event $event)
{
    $alumni = \App\Models\Alumni::where('user_id', auth()->id())->first();

    if (!$alumni) {
        return response()->json([
            'success' => false,
            'message' => 'Alumni record not found for this user.'
        ], 404);
    }

    $alumniId = $alumni->id;

    if (
        EventRegistration::where('event_id', $event->id)
        ->where('alumni_id', $alumniId)
        ->exists()
    ) {
        return response()->json([
            'success' => false,
            'message' => 'You are already registered for this event.'
        ], 400);
    }

    if (
        EventRegistration::where('event_id', $event->id)->count()
        >= $event->capacity
    ) {
        return response()->json([
            'success' => false,
            'message' => 'This event is already fully booked.'
        ], 400);
    }

    EventRegistration::create([
        'event_id'  => $event->id,
        'alumni_id' => $alumniId,
    ]);

    $alumniProfileImage = null;
    if ($alumni->profile_image) {
        $alumniProfileImage = asset('storage/' . $alumni->profile_image);
    } elseif ($alumni->profile_image_url) {
        $alumniProfileImage = $alumni->profile_image_url;
    }

    // Notify admins (existing behavior)
    $adminUsers = User::where('role', 'admin')->get();
    foreach ($adminUsers as $admin) {
        Notification::create([
            'user_id' => $admin->id,
            'notifiable_type' => 'event_registration',
            'data' => json_encode([
                'title' => 'Event Registration',
                'message' => ($alumni->first_name . ' ' . $alumni->last_name) . ' has registered for: ' . $event->title,
                'event_id' => $event->id,
                'event_title' => $event->title,
                'alumni_id' => $alumni->id,
                'alumni_name' => $alumni->first_name . ' ' . $alumni->last_name,
                'alumni_profile_image' => $alumniProfileImage,
            ]),
            'read' => false,
        ]);
    }

    // Notify the registering alumni (existing behavior)
    Notification::create([
        'user_id' => auth()->id(),
        'notifiable_type' => 'event_registration_success',
        'data' => json_encode([
            'title' => 'Event Registration Successful',
            'message' => 'You have successfully registered for the event.',
            'event_id' => $event->id,
            'event_title' => $event->title,
            'event_date' => $event->date,
            'event_location' => $event->location,
        ]),
        'read' => false,
    ]);

    // Pre-compute registration counts once (reused by both emails)
    $totalRegistered = EventRegistration::where('event_id', $event->id)->count();
    $spotsRemaining  = max(0, ((int) $event->capacity) - $totalRegistered);
    $isFull          = $totalRegistered >= (int) $event->capacity;

    // Existing: email the event organizer's contact_email
    try {
        if (!empty($event->contact_email)) {
            Mail::to($event->contact_email)->send(new EventOrganizerRegistrationMail(
                $event,
                $alumni,
                $totalRegistered,
                $spotsRemaining,
                $isFull
            ));
        }
    } catch (\Exception $mailError) {
        Log::error('Failed to send organizer registration email: ' . $mailError->getMessage());
    }

    // NEW: email the registering alumni with their confirmation + reminders
    try {
        $alumniEmail = $alumni->email ?? optional(auth()->user())->email;

        if (!empty($alumniEmail)) {
            Mail::to($alumniEmail)->send(new AlumniEventRegistrationMail(
                $event,
                $alumni,
                $totalRegistered,
                $spotsRemaining,
                $isFull
            ));
        }
    } catch (\Exception $mailError) {
        Log::error('Failed to send alumni confirmation email: ' . $mailError->getMessage());
    }

    return response()->json([
        'success' => true,
        'message' => 'Successfully registered! A confirmation email has been sent to your inbox.'
    ]);
}



    // CANCEL
    public function cancelRegistration(Request $request, Event $event)
    {
        // Get the corresponding alumni record for the logged-in user
        $alumni = \App\Models\Alumni::where('user_id', auth()->id())->first();

        if (!$alumni) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni record not found.'
            ], 404);
        }

        $alumniId = $alumni->id;

        $registration = EventRegistration::where('event_id', $event->id)
            ->where('alumni_id', $alumniId)
            ->first();

        if (!$registration) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered for this event.'
            ], 404);
        }

        $registration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Registration cancelled successfully.'
        ]);
    }


    // LIST OF REGISTERED USERS (ADMIN)
    public function registrations(Event $event)
    {
        try {
            // Fetch all registrations with the related user/alumni info
            $registrations = EventRegistration::with('alumni')
                ->where('event_id', $event->id)
                ->get()
                ->map(function ($registration) {
                    return [
                        'id' => $registration->id,
                        'event_id' => $registration->event_id,
                        'alumni_id' => $registration->alumni_id,
                        'status' => $registration->status,
                        'registration_date' => $registration->registration_date,
                        'alumni' => $registration->alumni ? [
                            'name' => trim(
                                $registration->alumni->first_name . ' ' .
                                    ($registration->alumni->middle_name ?? '') . ' ' .
                                    $registration->alumni->last_name . ' ' .
                                    ($registration->alumni->suffix ?? '')
                            ),
                            'email' => $registration->alumni->email ?? null,
                            'contact_number' => $registration->alumni->phone ?? null,
                            'batch_year' => $registration->alumni->graduation_year ?? null,
                            // 'course' => $registration->alumni->course ?? null,
                        ] : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'event' => $event,
                'data' => $registrations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch registrations: ' . $e->getMessage()
            ], 500);
        }
    }
}