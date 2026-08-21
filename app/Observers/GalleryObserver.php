<?php

namespace App\Observers;

use App\Models\Gallery;
use App\Support\CacheHelper;

/**
 * Phase 2 caching (audit §3). GalleryController@publicIndex's cache
 * key includes a hash of search/pagination params on top of
 * year:month, so (unlike Announcement/Event) there's no single fixed
 * "the common one" key to forget on a non-tag cache driver — that's
 * fine, the plan explicitly expects this to degrade to "flush the
 * whole tag on Redis, let it expire on its own (60s TTL) on
 * file/database". Forgetting the plain unfiltered 'all:all:*' base
 * case isn't possible without the filter hash, so this only does the
 * tag flush; see CacheHelper's docblock for the reasoning.
 */
class GalleryObserver
{
    public function saved(Gallery $gallery): void
    {
        CacheHelper::flushTags(['gallery']);
    }

    public function deleted(Gallery $gallery): void
    {
        CacheHelper::flushTags(['gallery']);
    }
}
