<?php

namespace App\Policies;

use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorization rules for job applications, including the government
 * ID images attached to an application.
 *
 * Allowed to view/manage an application:
 *  - admin
 *  - the applicant (alumni_id === user id)
 *  - the user who created the job post being applied to
 */
class JobApplicationPolicy
{
    use HandlesAuthorization;

    public function view(User $user, JobApplication $application): bool
    {
        return $this->isAdminOwnerOrCreator($user, $application);
    }

    /**
     * Viewing the attached government ID front/back images is the most
     * sensitive action on this resource, so it uses the same trusted set
     * (admin, applicant, job post creator) as view/delete.
     */
    public function viewIdImage(User $user, JobApplication $application): bool
    {
        return $this->isAdminOwnerOrCreator($user, $application);
    }

    /**
     * Only admins or the job post's creator may change an application's
     * status (accept/reject/review).
     */
    public function updateStatus(User $user, JobApplication $application): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $application->loadMissing('jobPost');

        return $application->jobPost
            && (int) $application->jobPost->created_by_user_id === (int) $user->id;
    }

    public function delete(User $user, JobApplication $application): bool
    {
        return $this->isAdminOwnerOrCreator($user, $application);
    }

    private function isAdminOwnerOrCreator(User $user, JobApplication $application): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ((int) $application->alumni_id === (int) $user->id) {
            return true;
        }

        $application->loadMissing('jobPost');

        return $application->jobPost
            && (int) $application->jobPost->created_by_user_id === (int) $user->id;
    }
}
