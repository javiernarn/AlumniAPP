<?php

namespace App\Policies;

use App\Models\Alumni;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorization rules for the Alumni resource.
 *
 * Roles:
 *  - admin: full access to every alumni record.
 *  - department_head: read access limited to alumni within their own course.
 *  - alumni: access limited to their own record.
 */
class AlumniPolicy
{
    use HandlesAuthorization;

    /**
     * Admins can list/browse the full alumni directory.
     * Department heads use their own course-scoped endpoints
     * (DepartmentHeadController@alumni), not this listing.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * View a single alumni record.
     */
    public function view(User $user, Alumni $alumni): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'department_head') {
            return $user->course_id !== null
                && $alumni->course_id === $user->course_id;
        }

        // An alumnus may view only their own profile.
        return $this->isOwner($user, $alumni);
    }

    /**
     * Update a single alumni record.
     * Admins may edit any record. Alumni may only edit their own.
     * Department heads are read-only with respect to alumni records.
     */
    public function update(User $user, Alumni $alumni): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $this->isOwner($user, $alumni);
    }

    /**
     * Manage (approve/reject status, upload/delete documents & profile
     * images, view government-style documents) is an admin-only action
     * in this application.
     */
    public function manage(User $user, Alumni $alumni): bool
    {
        return $user->role === 'admin';
    }

    private function isOwner(User $user, Alumni $alumni): bool
    {
        if ($alumni->user_id !== null && (int) $alumni->user_id === (int) $user->id) {
            return true;
        }

        // Some alumni rows are linked to a user by matching email rather
        // than a populated user_id (see MessagingController lookups).
        return $alumni->email !== null
            && strcasecmp($alumni->email, (string) $user->email) === 0;
    }
}
