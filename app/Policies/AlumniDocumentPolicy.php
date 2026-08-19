<?php

namespace App\Policies;

use App\Models\AlumniDocument;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorization rules for confidential alumni documents
 * (ID documents, resumes, uploaded proof documents, etc.).
 *
 * Only the owning alumnus and admins may view/download these files.
 * Department heads are intentionally excluded — course scoping does not
 * imply a right to see another person's confidential identity documents.
 */
class AlumniDocumentPolicy
{
    use HandlesAuthorization;

    public function view(User $user, AlumniDocument $document): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $document->loadMissing('alumni');
        $alumni = $document->alumni;

        if (!$alumni) {
            return false;
        }

        if ($alumni->user_id !== null && (int) $alumni->user_id === (int) $user->id) {
            return true;
        }

        return $alumni->email !== null
            && strcasecmp($alumni->email, (string) $user->email) === 0;
    }

    public function manage(User $user, AlumniDocument $document): bool
    {
        return $user->role === 'admin';
    }
}
