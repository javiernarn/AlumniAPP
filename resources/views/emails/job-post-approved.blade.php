<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Post Approved - OCC Alumni Association</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">Job Post Approved</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 15px;">Dear {{ $alumni['first_name'] }} {{ $alumni['last_name'] }},</h2>

            <p>Great news! Your job post has been <strong style="color: #1a1a2e;">approved</strong> by the administrator and is now live on the Alumni Portal.</p>

            <div style="background-color: #e8f4fd; border-left: 4px solid #1a1a2e; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 10px; color: #1a1a2e; font-size: 18px;">{{ $jobPost->title }}</h3>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Company:</strong> {{ $jobPost->company }}
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Job Type:</strong> {{ $jobPost->job_type }}
                </p>
                @if($jobPost->location)
                <p style="margin: 5px 0; color: #666;">
                    <strong>Location:</strong> {{ $jobPost->location }}
                </p>
                @endif
            </div>

            <h3 style="color: #1a1a2e; font-size: 16px; margin-top: 25px;">What's Next?</h3>
            <ul style="color: #666; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Your job post is now visible to all alumni members</li>
                <li style="margin-bottom: 8px;">You will receive notifications when alumni apply to your job post</li>
                <li style="margin-bottom: 8px;">You can review and manage applications directly from the Job Posts page</li>
                <li style="margin-bottom: 8px;">Accept or reject applicants based on their qualifications</li>
            </ul>

            <p>Log in to the Alumni Portal to monitor applications and manage your job post.</p>

            <div style="text-align: center; margin: 35px 0;">
                <a href="{{ config('app.url') }}/login?redirect=/job-posts" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View My Job Post</a>
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