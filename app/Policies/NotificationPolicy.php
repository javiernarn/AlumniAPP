<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * A notification belongs to exactly one user; nobody else — including
 * admins — has a business reason to read or delete another user's
 * personal notification feed through this resource.
 */
class NotificationPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Notification $notification): bool
    {
        return (int) $notification->user_id === (int) $user->id;
    }

    public function delete(User $user, Notification $notification): bool
    {
        return (int) $notification->user_id === (int) $user->id;
    }
}
