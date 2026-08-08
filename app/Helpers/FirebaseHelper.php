<?php

namespace App\Helpers;

use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Laravel\Firebase\Facades\Firebase;
use App\Models\ClassroomStudent;

class FirebaseHelper
{
    public static function sendClassworkNotification(string $token, array $payload): void
    {
        // Build the base notification with title and body
        $notification = [
            'title' => '📚 ' . $payload['title'], // Emoji + title
            'body' => '📝 ' . $payload['message'], // Emoji + message
        ];

        // Add image only if it exists in the payload
        if (!empty($payload['image'])) {
            $notification['image'] = $payload['image'];
        }

        $message = CloudMessage::withTarget('token', $token)
            ->withData([
                'id' => $payload['id'],
                'type' => 'classwork',
                'classwork_id' => $payload['classwork_id'] ?? null,
                'user_id' => $payload['user_id'],
                'data' => json_encode([
                    'title' => $payload['title'],
                    'className' => $payload['className'] ?? null,
                    'message' => $payload['message'],
                    'class_id' => $payload['class_id'],
                    'class_slug' => $payload['class_slug'],
                    'classwork_slug' => $payload['classwork_slug'] ?? null,
                    'id' => $payload['id'],
                    'other_id' => $payload['other_id'] ?? null,
                    'notifiable_type' => $payload['notifiable_type'],
                ]),
            ])
            ->withNotification($notification); // Apply the conditional notification

        Firebase::messaging()->send($message);
    }

    public static function getClassRoomStudents($class_id)
    {
        $students = ClassroomStudent::join('students', 'students.id', '=', 'classroom_students.student_id')
            ->join('users', 'users.id', '=', 'students.user_id')
            ->where('classroom_students.class_id', $class_id)
            ->select('classroom_students.student_id', 'users.id as user_id')
            ->get();
        return $students;
    }
}
