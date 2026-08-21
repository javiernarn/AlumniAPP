<?php

namespace App\Observers;

use App\Models\Course;
use App\Support\CacheHelper;

/**
 * Phase 2 caching (audit §3). Courses are cached for a long TTL (1hr)
 * in GlobalAluminiController@courses() since they rarely change — this
 * observer makes sure an admin adding/editing/removing a course shows
 * up immediately instead of waiting up to an hour.
 */
class CourseObserver
{
    public function saved(Course $course): void
    {
        $this->flush();
    }

    public function deleted(Course $course): void
    {
        $this->flush();
    }

    private function flush(): void
    {
        CacheHelper::forget('lookup:courses');
        CacheHelper::flushTags(['courses']);
    }
}
