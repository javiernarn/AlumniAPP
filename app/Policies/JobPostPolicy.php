<?php

namespace App\Policies;

use App\Models\JobPost;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorization rules for job posts. Mirrors the ownership model already
 * enforced ad-hoc in JobPostController, expressed centrally so future
 * routes/controllers reuse the same rule instead of re-deriving it.
 */
class JobPostPolicy
{
    use HandlesAuthorization;

    public function update(User $user, JobPost $jobPost): bool
    {
        return $user->role === 'admin'
            || (int) $jobPost->created_by_user_id === (int) $user->id;
    }

    public function delete(User $user, JobPost $jobPost): bool
    {
        return $user->role === 'admin'
            || (int) $jobPost->created_by_user_id === (int) $user->id;
    }

    /**
     * Approving/rejecting postings is an admin-only moderation action.
     */
    public function moderate(User $user, JobPost $jobPost): bool
    {
        return $user->role === 'admin';
    }
}
