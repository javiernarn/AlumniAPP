<?php

namespace App\Observers;

use App\Models\Event;
use App\Support\CacheHelper;

/**
 * Phase 2 caching (audit §3). Same pattern as AnnouncementObserver:
 * forgets the unfiltered 'all:all' key immediately on every write, and
 * flushes the whole 'events' tag on a tag-capable driver (Redis) so
 * every type/category variant clears too. Other variants fall back to
 * their 60s TTL on non-tag drivers — see EventController@publicIndex.
 */
class EventObserver
{
    public function saved(Event $event): void
    {
        $this->flush();
    }

    public function deleted(Event $event): void
    {
        $this->flush();
    }

    private function flush(): void
    {
        CacheHelper::forget('public:events:all:all');
        CacheHelper::flushTags(['events']);
    }
}
