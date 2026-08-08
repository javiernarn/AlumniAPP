<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alumni Registration Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">Alumni Registration Confirmation</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 15px;">Dear {{ $alumniData['first_name'] }} {{ $alumniData['last_name'] }},</h2>

            <p>Thank you for registering with the Opol Community College Alumni Association! Your registration has been successfully submitted and is now pending review.</p>

            <div style="background-color: #e8f4fd; border: 2px dashed #1a1a2e; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 5px;">Your Application ID</label>
                <span style="font-size: 20px; font-weight: bold; color: #1a1a2e; letter-spacing: 1px;">{{ $applicationId }}</span>
            </div>

            <div style="background-color: #fff8d8; border-left: 4px solid #e0b100; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <strong style="color: #1a1a2e;">Registration Status:</strong>
                <span style="display: inline-block; background-color: #e0b100; color: #1a1a2e; padding: 5px 15px; border-radius: 20px; font-weight: 600; font-size: 14px;">Pending Review</span>
                <p style="margin: 10px 0 0; font-size: 14px; color: #856404;">Our team will review your registration and verify your information. You will receive another email once your registration has been approved.</p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Personal Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="font-weight: 600; color: #555; width: 150px; padding: 5px 0;">Full Name:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['first_name'] }} {{ $alumniData['middle_name'] ?? '' }} {{ $alumniData['last_name'] }} {{ $alumniData['suffix'] ?? '' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 5px 0;">Email:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['email'] }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 5px 0;">Phone:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['phone'] ?? 'Not provided' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 5px 0;">Address:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['address'] ?? 'Not provided' }}</td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Academic Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    @if(!empty($alumniData['student_id']))
                    <tr>
                        <td style="font-weight: 600; color: #555; width: 150px; padding: 5px 0;">Student ID:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['student_id'] }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 5px 0;">Year Graduated:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['graduation_year'] ?? 'Not provided' }}</td>
                    </tr>
                </table>
            </div>

            @if(!empty($alumniData['current_company']) || !empty($alumniData['job_title']))
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Employment Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    @if(!empty($alumniData['current_company']))
                    <tr>
                        <td style="font-weight: 600; color: #555; width: 150px; padding: 5px 0;">Company:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['current_company'] }}</td>
                    </tr>
                    @endif
                    @if(!empty($alumniData['job_title']))
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 5px 0;">Job Title:</td>
                        <td style="color: #333; padding: 5px 0;">{{ $alumniData['job_title'] }}</td>
                    </tr>
                    @endif
                </table>
            </div>
            @endif

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ config('app.url') }}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Visit Alumni Portal</a>
            </div>

            <p>Please keep your Application ID for future reference. If you have any questions or need to update your information, please don't hesitate to contact us.</p>

            <div style="background-color: #f1f1f1; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; font-size: 14px; color: #333;">
                <strong>Guidance Counselor</strong><br>
                <a href="mailto:occ.verula.annabelle@gmail.com" style="color: #1a1a2e; text-decoration: none;">occ.verula.annabelle@gmail.com</a><br>
                <em>Administrator</em>
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
