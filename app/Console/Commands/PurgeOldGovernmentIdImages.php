<?php

namespace App\Console\Commands;

use App\Models\JobApplication;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

/**
 * Auto-deletes stored Government ID images 90 days after the application
 * is closed (status = accepted or rejected).
 *
 * Schedule in App\Console\Kernel:
 *   $schedule->command('ids:purge-old')->daily();
 */
class PurgeOldGovernmentIdImages extends Command
{
    protected $signature = 'ids:purge-old {--days=90}';
    protected $description = 'Delete Government ID images for closed applications older than N days (default 90).';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = Carbon::now()->subDays($days);

        $query = JobApplication::whereIn('status', ['accepted', 'rejected'])
            ->where('reviewed_at', '<=', $cutoff)
            ->where(function ($q) {
                $q->whereNotNull('government_id_front')
                  ->orWhereNotNull('government_id_back');
            });

        $count = 0;
        $query->chunkById(100, function ($apps) use (&$count) {
            foreach ($apps as $app) {
                if ($app->government_id_front && Storage::disk('local')->exists($app->government_id_front)) {
                    Storage::disk('local')->delete($app->government_id_front);
                }
                if ($app->government_id_back && Storage::disk('local')->exists($app->government_id_back)) {
                    Storage::disk('local')->delete($app->government_id_back);
                }
                $app->update([
                    'government_id_front' => null,
                    'government_id_back'  => null,
                    'verification_status' => $app->verification_status === 'verified' ? 'verified_purged' : $app->verification_status,
                ]);
                $count++;
            }
        });

        $this->info("Purged Government ID images for {$count} application(s).");
        return self::SUCCESS;
    }
}
