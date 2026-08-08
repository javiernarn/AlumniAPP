<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update - OCC Alumni Association</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">Application Status Update</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 15px;">Dear {{ $applicant['first_name'] }} {{ $applicant['last_name'] }},</h2>

            <p>Thank you for your interest in the position below. After careful consideration of your application, we regret to inform you that your application was <strong style="color: #1a1a2e;">not selected</strong> to move forward at this time.</p>

            <div style="background-color: #f8f9fa; border-left: 4px solid #1a1a2e; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
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

            <div style="background-color: #fff8d8; border-left: 4px solid #e0b100; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="margin: 0 0 10px; color: #1a1a2e; font-size: 16px;">Feedback from {{ $reviewerName }}:</h4>
                <p style="margin: 0; color: #856404; font-style: italic;">
                    "{{ $feedbackNotes }}"
                </p>
            </div>

            <h3 style="color: #1a1a2e; font-size: 16px; margin-top: 25px;">Don't Be Discouraged!</h3>
            <p style="color: #666;">This decision does not reflect your overall qualifications. We encourage you to:</p>
            <ul style="color: #666; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Continue exploring other job opportunities on the Alumni Portal</li>
                <li style="margin-bottom: 8px;">Update your profile to highlight your latest skills and experiences</li>
                <li style="margin-bottom: 8px;">Consider the feedback provided to strengthen future applications</li>
                <li style="margin-bottom: 8px;">Network with fellow alumni for more opportunities</li>
            </ul>

            <div style="text-align: center; margin: 35px 0;">
                <a href="{{ config('app.url') }}/login?redirect=/job-posts" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Browse More Jobs</a>
            </div>

            <p style="color: #666; font-size: 14px;">We wish you the best in your job search and future endeavors!</p>
        </div>

        <div style="text-align: center; border-top: 1px solid #dee2e6; padding-top: 20px; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Opol Community College Alumni Association</strong></p>
            <p style="margin: 5px 0;">This is an automated message. Please do not reply directly to this email.</p>
           <p style="margin: 5px 0;">&copy; 2025 Opol Community College. All rights reserved.</p>
        </div>
    </div>
</body>
</html>