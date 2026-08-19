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
use App\Http\Controllers\NotificationPreferencesController;
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
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AtmsFeedbackReportController;



Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/mobile/login', 'App\Http\Controllers\AuthController@login')->middleware('throttle:login');
Route::post('/login', 'App\Http\Controllers\AuthController@login')->middleware('throttle:login');


Route::prefix('password')->middleware('throttle:password-reset')->group(function () {
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
    ->middleware('throttle:public-contact');

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
    Route::post('/profile/change-password', [ChangePasswordController::class, 'changePassword'])
        ->middleware('throttle:change-password');

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

    Route::post('save-alumni-quiz', [QuizController::class, 'saveAlumniQuiz'])
        ->middleware('throttle:quiz-submission');

    Route::prefix('alumni')->group(function () {
        // Approving/rejecting/changing an alumni's application status is
        // an administrative moderation action.
        Route::post('/update-stastus', [AlumniRegistrationController::class, 'updateStatus'])
            ->middleware(['role:admin', 'throttle:admin-mutation']);

        // Full, unfiltered alumni directory — admin only. (Department
        // heads have their own course-scoped listing at
        // /department-head/alumni; regular alumni have no business reason
        // to enumerate every other alumni's full record.)
        Route::get('/', [AlumniRegistrationController::class, 'index'])
            ->middleware('role:admin');

        // Minimized, public-safe directory browse for the alumni-facing
        // "/alumni" nav page (AlumniList.js's non-admin view). Any
        // authenticated user may hit this — it only ever returns the
        // limited fields in AlumniDirectoryResource for approved alumni.
        // Must be registered before /{id} so "directory" doesn't get
        // swallowed by that route's numeric-only constraint... it won't
        // (that route requires digits), but keeping it here for clarity.
        Route::get('/directory', [AlumniRegistrationController::class, 'directory']);

        // Ownership/role checks for a single record are enforced inside
        // the controller via AlumniPolicy (admin, the record owner, or a
        // department head scoped to the same course).
        Route::get('/{id}', [AlumniRegistrationController::class, 'show'])->where('id', '[0-9]+');
        Route::put('/{id}', [AlumniRegistrationController::class, 'update'])
            ->middleware('throttle:upload');
        // Phase 2 — authorized download endpoints for private-disk files.
        // Phase 4 — rate limited to slow bulk scraping/enumeration.
        Route::get('/{id}/profile-image', [AlumniRegistrationController::class, 'downloadProfileImage'])
            ->where('id', '[0-9]+')
            ->middleware('throttle:profile-image')
            ->name('alumni.profile-image');
        Route::patch('/{id}/status', [AlumniRegistrationController::class, 'updateStatus'])
            ->middleware(['role:admin', 'throttle:admin-mutation']);

        Route::get('/messages', [MessagingController::class, 'getAlumniMessages']);
        Route::post('/messages/send', [MessagingController::class, 'sendAlumniMessage'])
            ->middleware('throttle:message-send');
        Route::post('/messages/mark-read', [MessagingController::class, 'markAlumniMessagesAsRead']);
        Route::get('/messages/unread-count', [MessagingController::class, 'getAlumniUnreadCount']);
    });

    // Keyed by document id (not alumni id), so it lives outside the
    // /alumni/{id} prefix group above.
    Route::get('/alumni-documents/{documentId}/download', [AlumniRegistrationController::class, 'downloadDocument'])
        ->where('documentId', '[0-9]+')
        ->middleware('throttle:government-id')
        ->name('alumni-documents.download');

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

    // Per-user, server-side notification preferences (email/sound/push
    // toggles in the Notification Settings modal). Available to every
    // authenticated role — alumni and admin each manage their own.
    Route::prefix('notification-settings')->group(function () {
        Route::get('/', [NotificationPreferencesController::class, 'show']);
        Route::put('/', [NotificationPreferencesController::class, 'update']);
    });

    // Department-head account management (create/list/edit/delete department
    // head USERS) is an administrative action, not a department-head one —
    // gate the whole group with the `role:admin` middleware. Previously
    // these four routes had no role check at all: any authenticated user
    // (including a plain alumni account) could list, create, edit, or
    // delete department-head accounts.
    Route::prefix('department-heads')->middleware(['role:admin', 'throttle:admin-mutation'])->group(function () {
        Route::get('/', [DepartmentHeadController::class, 'index']);
        Route::post('/', [DepartmentHeadController::class, 'store']);
        Route::put('/{id}', [DepartmentHeadController::class, 'update']);
        Route::delete('/{id}', [DepartmentHeadController::class, 'destroy']);
    });

    // These two remain open to any authenticated user; DepartmentHeadController
    // enforces role === 'department_head' internally and course-scopes the
    // response. Left unchanged (business logic already correct).
    Route::get('/department-head/dashboard', [DepartmentHeadController::class, 'dashboard']);
    Route::get('/department-head/alumni', [DepartmentHeadController::class, 'alumni']);

    // Audit Log — admin-only history of alumni/department-head/admin
    // login & logout activity. Replaces the old approach of pushing
    // every login as an admin Notification (see AuthController), which
    // flooded the notification bell and made it unreadable.
    Route::prefix('audit-logs')->middleware('role:admin')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('/summary', [AuditLogController::class, 'summary']);
    });

    // ============================================================
    // ATMS FEEDBACK REPORTS
    // ============================================================
    // Backs the "Give Feedback to ATMS" widget in
    // resources/js/components/layout/index.js. Any authenticated user
    // (alumni, department head, or admin browsing the app) can submit a
    // report and see their own past reports; only admins can list every
    // report, change its status, or delete it — gated below the same way
    // /audit-logs and /admin are.
    Route::prefix('atms-feedback')->group(function () {
        Route::post('/', [AtmsFeedbackReportController::class, 'store'])
            ->middleware('throttle:feedback-submission');
        Route::get('/my-reports', [AtmsFeedbackReportController::class, 'myReports']);
        // Authorized screenshot download — admin, or the alumni who
        // attached it. Rate limited the same as other confidential
        // document downloads (resume/ID-image).
        Route::get('/{id}/screenshots/{index}', [AtmsFeedbackReportController::class, 'downloadScreenshot'])
            ->where(['id' => '[0-9]+', 'index' => '[0-9]+'])
            ->middleware('throttle:government-id')
            ->name('atms-feedback.screenshot');
        // Single-report lookup for the alumni who submitted it — powers
        // the "view admin note" modal opened from the notification bell.
        Route::get('/{id}', [AtmsFeedbackReportController::class, 'showOwn'])->where('id', '[0-9]+');
    });

    Route::prefix('admin/atms-feedback')->middleware('role:admin')->group(function () {
        Route::get('/', [AtmsFeedbackReportController::class, 'index']);
        Route::get('/statistics', [AtmsFeedbackReportController::class, 'statistics']);
        Route::get('/{id}', [AtmsFeedbackReportController::class, 'show'])->where('id', '[0-9]+');
        Route::patch('/{id}/status', [AtmsFeedbackReportController::class, 'updateStatus'])
            ->where('id', '[0-9]+')
            ->middleware('throttle:admin-mutation');
        Route::delete('/{id}', [AtmsFeedbackReportController::class, 'destroy'])
            ->where('id', '[0-9]+')
            ->middleware('throttle:admin-mutation');
    });

    // Everything under /admin is an administrator-only surface: full alumni
    // directory search, every alumni's message threads, restricting/deleting
    // conversations, and confidential document/profile-image management.
    // Previously this entire prefix only required auth:api, so ANY
    // authenticated alumni could read every other alumni's private
    // messages and manage other people's documents. Gate the group.
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/alumni/all', [MessagingController::class, 'getAllAlumni']);
        Route::get('/conversations', [MessagingController::class, 'getAdminConversations']);
        Route::get('/messages/{alumniId}', [MessagingController::class, 'getAdminMessages']);
        Route::post('/messages/send', [MessagingController::class, 'sendAdminMessage'])
            ->middleware('throttle:message-send');
        Route::post('/messages/{alumniId}/mark-read', [MessagingController::class, 'markAdminMessagesAsRead']);
        Route::post('/messages/restrict/{alumniId}', [MessagingController::class, 'restrictAlumni'])
            ->middleware('throttle:admin-mutation');
        Route::delete('/messages/conversation/{alumniId}', [MessagingController::class, 'deleteConversation'])
            ->middleware('throttle:admin-mutation');
        Route::delete('/messages/{alumniId}', [MessagingController::class, 'deleteConversation'])
            ->middleware('throttle:admin-mutation');
        
        Route::post('/messages/{messageId}/reactions', [MessagingController::class, 'addReaction']);
        Route::get('/messages/{messageId}/reactions', [MessagingController::class, 'getMessageReactions']);

        Route::post('/alumni/{id}/profile-image', [AlumniRegistrationController::class, 'updateProfileImage'])
            ->middleware('throttle:upload');
        Route::post('/alumni/{id}/upload-document', [AlumniRegistrationController::class, 'uploadDocument'])
            ->middleware('throttle:upload');
        Route::delete('/alumni/{id}/profile-image', [AlumniRegistrationController::class, 'deleteProfileImage']);
        Route::delete('/alumni/{id}/document/{documentId}', [AlumniRegistrationController::class, 'deleteDocument']);
    });

    Route::delete('/admin/messages/{messageId}/delete', [MessagingController::class, 'deleteMessage']);
    Route::put('/admin/messages/{messageId}/edit', [MessagingController::class, 'editMessage']);
    Route::post('/messages/{messageId}/reactions', [MessagingController::class, 'addReaction']);
    Route::get('/messages/{messageId}/reactions', [MessagingController::class, 'getMessageReactions']);
    Route::get('/messages/{messageId}/image', [MessagingController::class, 'downloadImage'])
        ->name('messages.image');

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
        Route::post('/{jobPostId}', [JobApplicationController::class, 'apply'])
            ->middleware('throttle:upload');
        Route::get('/my-applications', [JobApplicationController::class, 'myApplications']);
        Route::get('/job-post/{jobPostId}', [JobApplicationController::class, 'jobPostApplications']);
        Route::get('/{id}', [JobApplicationController::class, 'show']);
        Route::put('/{id}/status', [JobApplicationController::class, 'updateStatus']);
        Route::delete('/{id}', [JobApplicationController::class, 'destroy']);

        
// Authenticated download for private Government ID images.
// NOTE: this route lives inside the Route::prefix('job-applications')
// group above, so it must NOT repeat the "job-applications" segment
// itself. The original file had `Route::get('/job-applications/{id}/...')`
// here, which — nested inside the prefix group — actually registered at
// /api/job-applications/job-applications/{id}/id-image/{side}, silently
// breaking the endpoint (the URL the frontend/tests actually expect,
// /api/job-applications/{id}/id-image/{side}, never resolved to this
// route at all).
Route::get('/{id}/id-image/{side}', [JobApplicationController::class, 'downloadIdImage'])
    ->where('side', 'front|back')
    ->middleware('throttle:government-id')
    ->name('job-applications.id-image');

// Phase 2 — authorized download endpoints for private-disk files.
// Phase 4 — rate limited (same limiter as the ID-image route above).
Route::get('/{id}/resume', [JobApplicationController::class, 'downloadResume'])
    ->where('id', '[0-9]+')
    ->middleware('throttle:government-id')
    ->name('job-applications.resume');
Route::get('/{id}/documents/{type}/{index}', [JobApplicationController::class, 'downloadSupportingDocument'])
    ->where(['id' => '[0-9]+', 'type' => 'id-documents|other-documents', 'index' => '[0-9]+'])
    ->middleware('throttle:government-id')
    ->name('job-applications.supporting-document');

    });

    // Was previously outside the auth:api group entirely — a fully
    // unauthenticated route serving every approved alumni's full record.
    // Moved inside auth:api + role:admin.
    Route::get('/admin-dashboard', [AdminDashboardController::class, 'index'])
        ->middleware('role:admin');
});

Route::post('/alumni/register', [AlumniRegistrationController::class, 'store'])
    ->middleware('throttle:registration');
Route::get('/get-courses', [GlobalAluminiController::class, 'courses']);
Route::get('/get-employee-status', [GlobalAluminiController::class, 'employeeStatus']);