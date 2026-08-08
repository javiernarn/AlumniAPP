<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Us Message - OCC Alumni Association</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="{{ $message->embed(resource_path('js/assets/images/OCC_LOGO.png')) }}" alt="OCC Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">New Contact Us Message</h1>
            <p style="color: #666; margin: 5px 0 0;">Opol Community College Alumni Association</p>
        </div>

        <div style="margin-bottom: 30px;">
            <p>Someone submitted the <strong>Contact Us</strong> form on the public ATMS Alumni Portal website.</p>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="font-weight: 600; color: #555; width: 100px; padding: 6px 0; vertical-align: top;">From:</td>
                        <td style="color: #333; padding: 6px 0;">
                            <a href="mailto:{{ $senderEmail }}" style="color: #1a1a2e; text-decoration: none;">{{ $senderEmail }}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 6px 0; vertical-align: top;">Subject:</td>
                        <td style="color: #333; padding: 6px 0;">{{ $messageSubject }}</td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #e8f4fd; border-left: 4px solid #1a1a2e; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #555; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
                <p style="margin: 0; color: #1a1a2e; font-size: 15px; white-space: pre-line;">{{ $messageBody }}</p>
            </div>

            <div style="background-color: #fff8d8; border-left: 4px solid #e0b100; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #856404;">
                <strong>Tip:</strong> Just hit Reply on this email — it will go directly to
                <strong>{{ $senderEmail }}</strong>, not back into this inbox.
            </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #dee2e6; padding-top: 20px; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Opol Community College Alumni Association</strong></p>
            <p style="margin: 5px 0;">Sent automatically from the public Contact Us page.</p>
            <p style="margin: 5px 0;">&copy; 2025 Opol Community College. All rights reserved.</p>
        </div>
    </div>
</body>
</html>