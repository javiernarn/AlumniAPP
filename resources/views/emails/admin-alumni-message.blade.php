<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Message - OCC Alumni Association</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">New Message</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 15px;">Dear {{ $alumni->first_name }} {{ $alumni->last_name }},</h2>

            <p>You have received a new message from the <strong>Alumni Tracing Management System</strong> via <strong>{{ $adminName }}</strong>.</p>

            <div style="background-color: #e8f4fd; border-left: 4px solid #1a1a2e; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-style: italic; color: #1a1a2e; font-size: 16px;">
                    "{{ $chatMessage->message }}"
                </p>

                @if($chatMessage->image_path && file_exists(storage_path('app/private/' . $chatMessage->image_path)))
                <div style="margin-top: 15px; text-align: center;">
                    <img src="{{ $message->embed(storage_path('app/private/' . $chatMessage->image_path)) }}" alt="Attached Image" style="max-width: 100%; border-radius: 4px; border: 1px solid #dee2e6;">
                </div>
                @endif
            </div>

            <p>Please log in to the Alumni Portal to view the full conversation and respond to this message.</p>

            <div style="text-align: center; margin: 35px 0;">
                <a href="{{ config('app.url') }}/login?redirect=/messages" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Login to Website</a>
            </div>

            <div style="background-color: #f1f1f1; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; font-size: 14px; color: #333;">
                <strong>{{ $adminName }}</strong><br>
                <a href="mailto:{{ $admin->email }}" style="color: #1a1a2e; text-decoration: none;">{{ $admin->email }}</a><br>
                <em>Administrator / Guidance Office</em>
            </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #dee2e6; padding-top: 20px; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Opol Community College Alumni Association</strong></p>
            <p style="margin: 5px 0;">This is an automated message. Please do not reply directly to this email.</p>
           <p style="margin: 5px 0;">&copy; 2025 Opol Community College. All rights reserved.</p>
        </div>
    </div>
</body>
</html>