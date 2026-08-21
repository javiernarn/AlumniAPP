<?php

namespace App\Support;

use Illuminate\Cache\TaggableStore;
use Illuminate\Support\Facades\Cache;

/**
 * Phase 2 caching (audit §3).
 *
 * Thin wrapper around Cache::remember()/Cache::tags() that degrades
 * gracefully when the configured cache driver doesn't support tags
 * (e.g. `file` or `database`, vs `redis`). Controllers call
 * CacheHelper::remember() the same way regardless of driver; this class
 * decides whether it's safe to also attach tags so a whole resource
 * type (e.g. "alumni") can be flushed at once by the matching
 * *Observer instead of the controller/observer having to guess every
 * key that needs busting.
 *
 * Untagged fallback: on `file`/`database`, forget() (used by the
 * observers) still removes the exact keys they know about (built the
 * same way the controllers build them), so cache invalidation still
 * works correctly — it just can't do a blanket "flush everything
 * tagged X" the way Redis can.
 */
class CacheHelper
{
    public static function tagsSupported(): bool
    {
        return Cache::getStore() instanceof TaggableStore;
    }

    /**
     * @param string $key
     * @param array<string> $tags
     * @param int $ttlSeconds
     * @param \Closure $callback
     */
    public static function remember(string $key, array $tags, int $ttlSeconds, \Closure $callback)
    {
        if (!empty($tags) && static::tagsSupported()) {
            return Cache::tags($tags)->remember($key, $ttlSeconds, $callback);
        }

        return Cache::remember($key, $ttlSeconds, $callback);
    }

    /**
     * Flush every key under a tag when tags are supported; otherwise a
     * no-op — callers should also forget() the specific keys they know
     * about so untagged drivers still invalidate correctly.
     *
     * @param array<string> $tags
     */
    public static function flushTags(array $tags): void
    {
        if (static::tagsSupported()) {
            Cache::tags($tags)->flush();
        }
    }

    public static function forget(string $key): void
    {
        Cache::forget($key);
    }
}
