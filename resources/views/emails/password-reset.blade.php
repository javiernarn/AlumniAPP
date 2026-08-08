<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - OCC Alumni Association</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <!-- Redesigned header to match alumni-account-approved style with embedded logo and no colored background -->
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">Password Reset Request</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 15px;">Hello {{ $fullName }},</h2>
            
            <p>We received a request to reset your password. Click the button below to set up a new password for your account.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $resetUrl }}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
            </div>

            <div style="background-color: #fff8d8; border-left: 4px solid #e0b100; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <strong>⏳ Link Expiration</strong>
                <p style="margin: 10px 0 0; font-size: 14px;">This reset link will expire in <strong>60 minutes</strong> for security purposes.</p>
            </div>

            <div style="background-color: #fff8d8; border-left: 4px solid #e0b100; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <strong>🔒 Security Notice</strong>
                <p style="margin: 10px 0 0; font-size: 14px;">If you did not request a password reset, please ignore this email. Your account will remain secure.</p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Button not working?</h3>
                <p style="font-size: 13px; margin-bottom: 10px;">Copy and paste the link below into your browser:</p>
                <div style="background-color: #e8f4fd; padding: 12px; border-radius: 4px; word-break: break-all;">
                    <a href="{{ $resetUrl }}" style="color: #1a1a2e; text-decoration: none; font-size: 13px;">{{ $resetUrl }}</a>
                </div>
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>

            <!-- Admin Contact Info -->
            <div style="background-color: #f1f1f1; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; font-size: 14px; color: #333;">
                <strong>Guidance Counselor</strong><br>
                <a href="mailto:occ.verula.annabelle@gmail.com" style="color: #1a1a2e; text-decoration: none;">occ.verula.annabelle@gmail.com</a><br>
                <em>Administrator</em>
            </div>
        </div>

        <!-- Redesigned footer to match alumni-account-approved style with no colored background -->
        <div style="text-align: center; border-top: 1px solid #dee2e6; padding-top: 20px; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Opol Community College Alumni Association</strong></p>
            <p style="margin: 5px 0;">This is an automated message. Please do not reply directly to this email.</p>
            <p style="margin: 5px 0;">&copy; 2025 Opol Community College. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
