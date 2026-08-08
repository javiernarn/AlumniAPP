<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Application Accepted - OCC Alumni Association</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">Congratulations!</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 15px;">Dear {{ $emailData['applicant']['first_name'] }} {{ $emailData['applicant']['last_name'] }},</h2>

            <p>We are pleased to inform you that your job application has been <strong style="color: #1a1a2e;">accepted</strong>.</p>

            <div style="background-color: #e8f4fd; border: 2px solid #1a1a2e; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 48px; display: block; margin-bottom: 10px; color: #1a1a2e;">✓</span>
                <span style="font-size: 20px; font-weight: bold; color: #1a1a2e; letter-spacing: 1px;">Your Application Has Been Accepted!</span>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Job Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="font-weight: 600; color: #555; width: 150px; padding: 8px 0; vertical-align: top;">Job Title:</td>
                        <td style="color: #333; padding: 8px 0;">{{ $emailData['jobPost']['title'] }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 8px 0; vertical-align: top;">Company:</td>
                        <td style="color: #333; padding: 8px 0;">{{ $emailData['jobPost']['company'] }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 8px 0; vertical-align: top;">Job Type:</td>
                        <td style="color: #333; padding: 8px 0;">{{ $emailData['jobPost']['job_type'] }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 8px 0; vertical-align: top;">Location:</td>
                        <td style="color: #333; padding: 8px 0;">{{ $emailData['jobPost']['location'] ?? 'Remote' }}</td>
                    </tr>
                    @if($emailData['jobPost']['salary_min'] || $emailData['jobPost']['salary_max'])
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 8px 0; vertical-align: top;">Salary Range:</td>
                        <td style="color: #333; padding: 8px 0;">₱{{ number_format($emailData['jobPost']['salary_min'] ?? 0) }} - ₱{{ number_format($emailData['jobPost']['salary_max'] ?? 0) }}</td>
                    </tr>
                    @endif
                </table>
            </div>

            <div style="background-color: #e8f4fd; border-left: 4px solid #1a1a2e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <strong style="color: #1a1a2e;">Job Description:</strong>
                <p style="margin: 10px 0 0; font-size: 14px; white-space: pre-wrap;">{{ $emailData['jobPost']['description'] }}</p>
            </div>

            <div style="background-color: #fff8d8; border-left: 4px solid #e0b100; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <strong style="color: #1a1a2e;">Requirements:</strong>
                <p style="margin: 10px 0 0; font-size: 14px; white-space: pre-wrap; color: #856404;">{{ $emailData['jobPost']['requirements'] }}</p>
            </div>

            <div style="background-color: #e8f4fd; border-left: 4px solid #1a1a2e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <strong style="color: #1a1a2e;">What's Next?</strong>
                <p style="margin: 10px 0 0; font-size: 14px;">
                    Please wait for a moment. The job poster will contact you soon to schedule an interview.
                    Make sure to check your email and phone regularly for updates.
                </p>
            </div>

            @if($emailData['creator'])
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #dee2e6;">
                <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">
                    Employer Contact Information
                </h3>
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                    For any clarifications about the job or interview, you may contact:
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="font-weight: 600; color: #555; width: 100px; padding: 5px 0;">Name:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $emailData['creator']['name'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 5px 0;">Email:</td>
                        <td style="color: #333; padding: 5px 0;">
                            <a href="mailto:{{ $emailData['creator']['email'] }}" style="color: #1a1a2e; text-decoration: none;">
                                {{ $emailData['creator']['email'] ?? 'N/A' }}
                            </a>
                        </td>
                    </tr>
                    @if($emailData['creator']['phone'])
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 5px 0;">Phone:</td>
                        <td style="color: #333; padding: 5px 0;">
                            <a href="tel:{{ $emailData['creator']['phone'] }}" style="color: #1a1a2e; text-decoration: none;">
                                {{ $emailData['creator']['phone'] }}
                            </a>
                        </td>
                    </tr>
                    @endif
                </table>
            </div>
            @endif

            <div style="background-color: #e8f4fd; border-left: 4px solid #1a1a2e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <strong style="color: #1a1a2e;">Tips for Your Interview:</strong>
                <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 14px;">
                    <li>Research about the company beforehand</li>
                    <li>Prepare answers for common interview questions</li>
                    <li>Dress professionally (even for virtual interviews)</li>
                    <li>Have copies of your resume and requirements ready</li>
                    <li>Be punctual and arrive early</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ config('app.url') }}/login?redirect=/job-posts" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Job Posts</a>
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to contact the employer directly using the contact information above.</p>

            <div style="background-color: #f1f1f1; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; font-size: 14px; color: #333;">
                <strong>Need Help?</strong><br>
                <a href="mailto:occ.verula.annabelle@gmail.com" style="color: #1a1a2e; text-decoration: none;">occ.verula.annabelle@gmail.com</a><br>
                <em>Guidance Counselor - Administrator</em>
            </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #dee2e6; padding-top: 20px; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Opol Community College Alumni Association</strong></p>
            <p style="margin: 5px 0;">Job Posts Management System</p>
            <p style="margin: 5px 0;">This is an automated message. Please do not reply directly to this email.</p>
           <p style="margin: 5px 0;">&copy; 2025 Opol Community College. All rights reserved.</p>
        </div>
    </div>
</body>
</html>