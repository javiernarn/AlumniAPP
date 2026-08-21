<?php

namespace App\Observers;

use App\Models\EmploymentStatus;
use App\Support\CacheHelper;

/**
 * Phase 2 caching (audit §3). Same reasoning as CourseObserver — long
 * (1hr) TTL cache in GlobalAluminiController@employeeStatus(), forced
 * to refresh immediately on any admin edit instead.
 */
class EmploymentStatusObserver
{
    public function saved(EmploymentStatus $status): void
    {
        $this->flush();
    }

    public function deleted(EmploymentStatus $status): void
    {
        $this->flush();
    }

    private function flush(): void
    {
        CacheHelper::forget('lookup:employment-statuses');
        CacheHelper::flushTags(['employment-statuses']);
    }
}
