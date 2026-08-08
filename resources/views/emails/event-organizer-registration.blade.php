<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Alumni Registration - OCC Alumni Association</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">

        {{-- Header --}}
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">New Alumni Registration</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        {{-- Greeting --}}
        <div style="margin-bottom: 25px;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 15px;">Dear {{ $organizerName }},</h2>
            <p>
                A new alumni has successfully registered for your hosted event
                <strong>"{{ $event->title }}"</strong> through the
                <strong>Alumni Tracing Management System</strong>.
            </p>
        </div>

        {{-- Registrant Highlight --}}
        <div style="background-color: #e8f4fd; border-left: 4px solid #1a1a2e; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 6px; font-size: 14px; color: #555;">Newly Registered Alumni</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a2e;">
                {{ $alumni->first_name }} {{ $alumni->middle_name ?? '' }} {{ $alumni->last_name }} {{ $alumni->suffix ?? '' }}
            </p>
            @if(!empty($alumni->graduation_year))
                <p style="margin: 6px 0 0; font-size: 13px; color: #555;">
                    Batch {{ $alumni->graduation_year }}
                </p>
            @endif
            @if(!empty($alumni->phone))
                <p style="margin: 4px 0 0; font-size: 13px; color: #555;">
                    Contact: {{ $alumni->phone }}
                </p>
            @endif
        </div>

        {{-- Registration Summary --}}
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Registration Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="font-weight: 600; color: #555; width: 180px; padding: 5px 0;">Event:</td>
                    <td style="color: #333; padding: 5px 0;">{{ $event->title }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #555; padding: 5px 0;">Date:</td>
                    <td style="color: #333; padding: 5px 0;">{{ \Carbon\Carbon::parse($event->date)->format('F d, Y') }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #555; padding: 5px 0;">Time:</td>
                    <td style="color: #333; padding: 5px 0;">
                        {{ \Carbon\Carbon::parse($event->start_time)->format('h:i A') }} -
                        {{ \Carbon\Carbon::parse($event->end_time)->format('h:i A') }}
                    </td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #555; padding: 5px 0;">Location:</td>
                    <td style="color: #333; padding: 5px 0;">{{ $event->location }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #555; padding: 5px 0;">Total Registered:</td>
                    <td style="color: #333; padding: 5px 0;">
                        <strong>{{ $totalRegistered }}</strong> / {{ $event->capacity }}
                    </td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #555; padding: 5px 0;">Spots Remaining:</td>
                    <td style="color: #333; padding: 5px 0;">
                        @if($isFull)
                            <span style="display: inline-block; background-color: #fff8d8; color: #856404; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px;">FULL</span>
                        @else
                            <strong>{{ $spotsRemaining }}</strong>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        {{-- Capacity / Print Reminder --}}
        <div style="background-color: #fff8d8; border-left: 4px solid #e0b100; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Reminder:</strong>
                @if($isFull)
                    Your event has reached <strong>full capacity</strong>. You may now request a printed copy of the
                    official registered alumni list from the <strong>Guidance Counselor</strong> for your event-day attendance
                    checking. Each registered alumni will appear with a checkbox you can mark with a ballpen on the day of the event.
                @else
                    Once the event reaches full capacity or all required participants have confirmed,
                    you may request a printed copy of the registered alumni list from the
                    <strong>Guidance Counselor</strong>. The printed list includes a checkbox beside each
                    name so you can manually check off attendees with a ballpen during the event.
                @endif
            </p>
        </div>

        {{-- Login CTA --}}
        <p style="margin: 20px 0 10px;">
            You may log in to the Alumni Portal anytime to view your hosted event, monitor the
            updated registration list, and manage event details.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.url') }}/login?redirect=/events" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Login to View My Event
            </a>
        </div>

        {{-- Organizer Contact Box --}}
        <div style="background-color: #f1f1f1; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; font-size: 14px; color: #333;">
            <strong>{{ $organizerName }}</strong><br>
            @if(!empty($event->contact_email))
                <a href="mailto:{{ $event->contact_email }}" style="color: #1a1a2e; text-decoration: none;">{{ $event->contact_email }}</a><br>
            @endif
            @if(!empty($event->contact_number))
                <span>{{ $event->contact_number }}</span><br>
            @endif
            <em>Event Organizer / Host</em>
        </div>

        {{-- Footer --}}
        <div style="text-align: center; border-top: 1px solid #dee2e6; padding-top: 20px; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Opol Community College Alumni Association</strong></p>
            <p style="margin: 5px 0;">This is an automated message. Please do not reply directly to this email.</p>
           <p style="margin: 5px 0;">&copy; 2025 Opol Community College. All rights reserved.</p>
        </div>
    </div>
</body>
</html>