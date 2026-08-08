<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\AlumniRegistrationController;
use App\Http\Controllers\GlobalAluminiController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\DepartmentHeadController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\JobPostController;
use App\Http\Controllers\JobApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\ChangePasswordController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\PublicContactController;



Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/mobile/login', 'App\Http\Controllers\AuthController@login');
Route::post('/login', 'App\Http\Controllers\AuthController@login');


Route::prefix('password')->group(function () {
    Route::post('/find-account', [PasswordResetController::class, 'findAccount']);
    Route::post('/send-reset-link', [PasswordResetController::class, 'sendResetLink']);
    Route::post('/reset', [PasswordResetController::class, 'resetPassword']);
    Route::post('/verify-token', [PasswordResetController::class, 'verifyToken']);
});

//public route
Route::get('/check-email', [AlumniRegistrationController::class, 'checkEmail']);
Route::get('/check-phone', [AlumniRegistrationController::class, 'checkPhone']);
Route::get('/check-student-id', [AlumniRegistrationController::class, 'checkStudentId']);

// ============================================================
// PUBLIC (UNAUTHENTICATED) READ-ONLY ROUTES
// ============================================================
// Used by PublicHomePage.js / usePublicHomeData.js on the logged-out
// home page. These live OUTSIDE the auth:api group on purpose — the
// /events, /galleries and /job-posts routes below in the auth:api
// group are for the admin/alumni dashboards and correctly stay
// protected. Anonymous visitors need their own read-only doors in.
//
// SECURITY NOTE: all three of these now call dedicated public*()
// controller methods (not the shared authenticated index() methods).
// Each one deliberately skips eager-loading the related account
// (creator/uploader/user) entirely, since PublicHomePage.js never
// displays that data — so names/emails/phone numbers never leave the
// database for these routes, rather than being fetched and trimmed.
//
// /public/job-posts also hardcodes JobPost::approved() itself — it does
// NOT read status from the request at all. This means a visitor cannot
// see pending/rejected postings no matter what query string they send,
// and (unlike the authenticated index() method) it has no Auth::user()
// check, so anonymous visitors don't get bounced with a 401.
Route::prefix('public')->group(function () {
    Route::get('/events', [EventController::class, 'publicIndex']);
    Route::get('/galleries', [GalleryController::class, 'publicIndex']);

    Route::get('/job-posts', [JobPostController::class, 'publicIndex']);
    Route::get('/announcements', [AnnouncementController::class, 'publicIndex']);
});

// ============================================================
// PUBLIC "CONTACT US" FORM
// ============================================================
// Backs the message form on PublicContactPage.js (/public-contact).
// Unauthenticated on purpose — same reasoning as the /public group
// above, but this one writes (sends an email) instead of reading, so
// it's throttled to 5 submissions/minute per IP to keep it from being
// spammed. See PublicContactController@send / App\Mail\PublicContactMessage.
Route::post('/contact', [PublicContactController::class, 'send'])
    ->middleware('throttle:5,1');

Route::group([
    'middleware' => 'auth:api'
], function () {

// Gallery routes
Route::get('/galleries', [GalleryController::class, 'index']);
Route::get('/galleries/statistics', [GalleryController::class, 'statistics']);
Route::get('/galleries/{id}', [GalleryController::class, 'show']);
Route::post('/galleries', [GalleryController::class, 'store']);
Route::post('/galleries/{id}', [GalleryController::class, 'update']);
Route::delete('/galleries/{id}', [GalleryController::class, 'destroy']);
Route::get('/galleries/{id}/download', [GalleryController::class, 'download']);
// Add this line after the existing gallery routes
Route::delete('/galleries/{id}/image', [GalleryController::class, 'deleteImage']);

    // Change password (authenticated user)
    Route::post('/profile/change-password', [ChangePasswordController::class, 'changePassword']);

        // Set user offline without revoking token
    Route::post('/set-offline', [AuthController::class, 'setOffline']);

    // Logout route
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Heartbeat route for online status
    Route::post('/heartbeat', [AuthController::class, 'heartbeat']);
    
    // Get alumni online statuses
    Route::get('/alumni/online-statuses', [AlumniRegistrationController::class, 'getOnlineStatuses']);

    // Event Registration
    Route::post('/events/{event}/register', [EventController::class, 'register']);
    Route::post('/events/{event}/cancel-registration', [EventController::class, 'cancelRegistration']);
    Route::get('/events/{event}/registrations', [EventController::class, 'registrations']);

    Route::get('/events/data', [EventController::class, 'getEventData']);
    Route::post('/events', [EventController::class, 'store']);
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);

    // Announcements (admin: full manage, alumni: read-only via role check in controller)
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show']);
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    
    Route::get('/questions', [QuestionController::class, 'index']);
    Route::post('/questions', [QuestionController::class, 'store']);
    Route::get('/questions/{question}', [QuestionController::class, 'show']);
    Route::put('/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);

    // Quizzes Routes
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::post('/quizzes', [QuizController::class, 'store']);
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::put('/quizzes/{quiz}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy']);
    Route::post('/quizzes/{quiz}/duplicate', [QuizController::class, 'duplicate']);
    Route::put('/quizzes/{quiz}/order', [QuizController::class, 'updateOrder']);
    Route::post('quiz-active', [QuizController::class, 'quizActive']);
    Route::get('/answer-quizzes', [QuizController::class, 'answerQuiz']);
    Route::get('/quizzes-result', [QuizController::class, 'quizzesResult']);

    Route::post('save-alumni-quiz', [QuizController::class, 'saveAlumniQuiz']);

    Route::prefix('alumni')->group(function () {
        Route::post('/update-stastus', [AlumniRegistrationController::class, 'updateStatus']);
        Route::get('/', [AlumniRegistrationController::class, 'index']);
        Route::get('/{id}', [AlumniRegistrationController::class, 'show'])->where('id', '[0-9]+');
        Route::put('/{id}', [AlumniRegistrationController::class, 'update']);
        Route::patch('/{id}/status', [AlumniRegistrationController::class, 'updateStatus']);

        Route::get('/messages', [MessagingController::class, 'getAlumniMessages']);
        Route::post('/messages/send', [MessagingController::class, 'sendAlumniMessage']);
        Route::post('/messages/mark-read', [MessagingController::class, 'markAlumniMessagesAsRead']);
        Route::get('/messages/unread-count', [MessagingController::class, 'getAlumniUnreadCount']);
    });

    Route::delete('/alumni/messages/{messageId}/delete', [MessagingController::class, 'deleteMessage']);
    Route::put('/alumni/messages/{messageId}/edit', [MessagingController::class, 'editMessage']);

    Route::get('/profile', [GlobalAluminiController::class, 'profile']);

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/count', [NotificationController::class, 'count']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/{id}/mark-read', [NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
        Route::post('/register-device', [NotificationController::class, 'registerDevice']);
    });

    Route::prefix('department-heads')->group(function () {
        Route::get('/', [DepartmentHeadController::class, 'index']);
        Route::post('/', [DepartmentHeadController::class, 'store']);
        Route::put('/{id}', [DepartmentHeadController::class, 'update']);
        Route::delete('/{id}', [DepartmentHeadController::class, 'destroy']);
    });

    Route::get('/department-head/dashboard', [DepartmentHeadController::class, 'dashboard']);
    Route::get('/department-head/alumni', [DepartmentHeadController::class, 'alumni']);

    Route::prefix('admin')->group(function () {
        Route::get('/alumni/all', [MessagingController::class, 'getAllAlumni']);
        Route::get('/conversations', [MessagingController::class, 'getAdminConversations']);
        Route::get('/messages/{alumniId}', [MessagingController::class, 'getAdminMessages']);
        Route::post('/messages/send', [MessagingController::class, 'sendAdminMessage']);
        Route::post('/messages/{alumniId}/mark-read', [MessagingController::class, 'markAdminMessagesAsRead']);
        Route::post('/messages/restrict/{alumniId}', [MessagingController::class, 'restrictAlumni']);
        Route::delete('/messages/conversation/{alumniId}', [MessagingController::class, 'deleteConversation']);
        Route::delete('/messages/{alumniId}', [MessagingController::class, 'deleteConversation']);
        
        Route::post('/messages/{messageId}/reactions', [MessagingController::class, 'addReaction']);
        Route::get('/messages/{messageId}/reactions', [MessagingController::class, 'getMessageReactions']);

        Route::post('/alumni/{id}/profile-image', [AlumniRegistrationController::class, 'updateProfileImage']);
        Route::post('/alumni/{id}/upload-document', [AlumniRegistrationController::class, 'uploadDocument']);
        Route::delete('/alumni/{id}/profile-image', [AlumniRegistrationController::class, 'deleteProfileImage']);
        Route::delete('/alumni/{id}/document/{documentId}', [AlumniRegistrationController::class, 'deleteDocument']);
    });

    Route::delete('/admin/messages/{messageId}/delete', [MessagingController::class, 'deleteMessage']);
    Route::put('/admin/messages/{messageId}/edit', [MessagingController::class, 'editMessage']);
    Route::post('/messages/{messageId}/reactions', [MessagingController::class, 'addReaction']);
    Route::get('/messages/{messageId}/reactions', [MessagingController::class, 'getMessageReactions']);

    Route::prefix('job-posts')->group(function () {
        Route::get('/', [JobPostController::class, 'index']);
        Route::post('/', [JobPostController::class, 'store']);
        Route::get('/my-postings', [JobPostController::class, 'myPostings']);
        Route::get('/admin/pending', [JobPostController::class, 'pendingPosts']);
        Route::get('/pending', [JobPostController::class, 'pendingPosts']);
        Route::get('/full-or-expired', [JobPostController::class, 'fullOrExpiredPosts']);
        Route::post('/{id}/approve', [JobPostController::class, 'approve'])->where('id', '[0-9]+');
        Route::post('/{id}/reject', [JobPostController::class, 'reject'])->where('id', '[0-9]+');
        Route::get('/{id}', [JobPostController::class, 'show'])->where('id', '[0-9]+');
        Route::put('/{id}', [JobPostController::class, 'update'])->where('id', '[0-9]+');
        Route::delete('/{id}', [JobPostController::class, 'destroy'])->where('id', '[0-9]+');
    });

    Route::prefix('job-applications')->group(function () {
        Route::post('/{jobPostId}', [JobApplicationController::class, 'apply']);
        Route::get('/my-applications', [JobApplicationController::class, 'myApplications']);
        Route::get('/job-post/{jobPostId}', [JobApplicationController::class, 'jobPostApplications']);
        Route::get('/{id}', [JobApplicationController::class, 'show']);
        Route::put('/{id}/status', [JobApplicationController::class, 'updateStatus']);
        Route::delete('/{id}', [JobApplicationController::class, 'destroy']);

        
// Authenticated download for private Government ID images
Route::get('/job-applications/{id}/id-image/{side}', [JobApplicationController::class, 'downloadIdImage'])
    ->where('side', 'front|back')
    ->name('job-applications.id-image');

    });

});

Route::post('/alumni/register', [AlumniRegistrationController::class, 'store']);
Route::get('/get-courses', [GlobalAluminiController::class, 'courses']);
Route::get('/get-employee-status', [GlobalAluminiController::class, 'employeeStatus']);
Route::get('/admin-dashboard', [AdminDashboardController::class, 'index']);