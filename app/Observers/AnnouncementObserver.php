<?php

namespace App\Observers;

use App\Models\Announcement;
use App\Support\CacheHelper;

/**
 * Phase 2 caching (audit §3). Forgets the 'all' category cache key
 * (the one PublicHomePage.js / the unfiltered announcements list
 * actually uses) on every write, and flushes the whole 'announcements'
 * tag on a tag-capable cache driver (Redis) so every per-category
 * variant clears immediately too. On file/database (no tag support),
 * a per-category variant can stay stale for up to its 60s TTL after an
 * edit — see AnnouncementController@publicIndex and CacheHelper for
 * why that's an accepted tradeoff rather than a bug.
 */
class AnnouncementObserver
{
    public function saved(Announcement $announcement): void
    {
        $this->flush();
    }

    public function deleted(Announcement $announcement): void
    {
        $this->flush();
    }

    private function flush(): void
    {
        CacheHelper::forget('public:announcements:active:all');
        CacheHelper::flushTags(['announcements']);
    }
}
