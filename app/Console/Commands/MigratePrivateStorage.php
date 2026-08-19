<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Phase 2 — private storage migration.
 *
 * This archive was found with public/storage/ as a REAL directory
 * containing every uploaded file (alumni documents, government IDs,
 * resumes, private messages, profile images, AND genuinely public
 * content like event/gallery/announcement images) — not the symlink to
 * storage/app/public that Laravel's `public` disk (see
 * config/filesystems.php) and `php artisan storage:link` are meant to
 * produce. That means every confidential upload has been directly,
 * permanently web-servable at a guessable /storage/... URL with zero
 * possibility of authorization, regardless of any application-level fix.
 *
 * This command is idempotent and does the following, in order:
 *   1. Moves every confidential category (alumni documents, alumni
 *      profile images, resumes, job-application id/other documents,
 *      message images) from wherever it currently lives (public/storage/*
 *      or storage/app/public/*, whichever is populated) into the new
 *      `private` disk (storage/app/private — outside public/, never
 *      symlinked, never web-servable).
 *   2. Moves the remaining, genuinely public categories (announcements,
 *      events, galleries, question-choice images, job-post banners) into
 *      storage/app/public, matching Laravel's expected layout.
 *   3. Removes the now-empty real public/storage directory and replaces
 *      it with the proper symlink via `storage:link`, so future public
 *      uploads work the way Laravel expects and confidential categories
 *      can never again be dropped directly under public/ by mistake.
 *
 * Run once during the Phase 2 deploy:
 *   php artisan storage:migrate-private
 */
class MigratePrivateStorage extends Command
{
    protected $signature = 'storage:migrate-private {--dry-run : List what would move without moving anything}';

    protected $description = 'Move confidential uploads to the private disk and fix the public/storage symlink.';

    /** @var string[] Relative paths considered confidential. */
    private array $confidentialPaths = [
        'alumni/documents',
        'alumni/profile-images',
        'resumes',
        'id_documents',
        'other_documents',
        'messages',
        'AdminAlumni',
    ];

    /** @var string[] Relative paths that are genuinely public. */
    private array $publicPaths = [
        'announcements',
        'events',
        'galleries',
        'questions',
        'job_posts',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $publicStorageRoot = public_path('storage');
        $legacyPublicDiskRoot = storage_path('app/public');

        // Prefer public/storage/<path> if it has files (the state this
        // archive was actually found in); fall back to the correct
        // storage/app/public/<path> location otherwise.
        $resolveSource = function (string $relative) use ($publicStorageRoot, $legacyPublicDiskRoot) {
            $candidateA = $publicStorageRoot . DIRECTORY_SEPARATOR . $relative;
            $candidateB = $legacyPublicDiskRoot . DIRECTORY_SEPARATOR . $relative;

            if (File::isDirectory($candidateA) && count(File::allFiles($candidateA)) > 0) {
                return $candidateA;
            }

            if (File::isDirectory($candidateB) && count(File::allFiles($candidateB)) > 0) {
                return $candidateB;
            }

            return File::isDirectory($candidateA) ? $candidateA : $candidateB;
        };

        $this->info('== Confidential categories -> private disk ==');
        foreach ($this->confidentialPaths as $relative) {
            $source = $resolveSource($relative);
            $dest = storage_path('app/private/' . $relative);
            $this->moveDirectory($source, $dest, $dryRun);
        }

        $this->info('== Public categories -> storage/app/public (proper Laravel layout) ==');
        foreach ($this->publicPaths as $relative) {
            $source = $publicStorageRoot . DIRECTORY_SEPARATOR . $relative;
            $dest = $legacyPublicDiskRoot . DIRECTORY_SEPARATOR . $relative;
            $this->moveDirectory($source, $dest, $dryRun);
        }

        if ($dryRun) {
            $this->warn('Dry run only — nothing was moved or linked.');
            return self::SUCCESS;
        }

        // Replace a real public/storage directory with the proper symlink.
        if (File::isDirectory($publicStorageRoot) && !is_link($publicStorageRoot)) {
            $remaining = File::allFiles($publicStorageRoot);
            if (count($remaining) === 0) {
                File::deleteDirectory($publicStorageRoot);
                $this->info('Removed the now-empty real public/storage directory.');
            } else {
                $this->warn(sprintf(
                    'public/storage still has %d file(s) not covered by this command — leaving it in place. Review manually.',
                    count($remaining)
                ));
                return self::FAILURE;
            }
        }

        if (!File::exists($publicStorageRoot)) {
            $this->call('storage:link');
        }

        $this->info('Private storage migration complete.');
        return self::SUCCESS;
    }

    private function moveDirectory(string $source, string $dest, bool $dryRun): void
    {
        if (!File::isDirectory($source) || count(File::allFiles($source)) === 0) {
            $this->line("  (skip) {$source} — nothing to move");
            return;
        }

        $count = count(File::allFiles($source));

        if ($dryRun) {
            $this->line("  {$source} -> {$dest} ({$count} file(s))");
            return;
        }

        File::ensureDirectoryExists(dirname($dest));

        if (File::isDirectory($dest)) {
            // Merge into an existing destination directory file-by-file
            // instead of overwriting it wholesale.
            foreach (File::allFiles($source) as $file) {
                $relative = $file->getRelativePathname();
                $target = $dest . DIRECTORY_SEPARATOR . $relative;
                File::ensureDirectoryExists(dirname($target));
                File::move($file->getPathname(), $target);
            }
            File::deleteDirectory($source);
        } else {
            File::moveDirectory($source, $dest);
        }

        $this->info("  moved {$count} file(s): {$source} -> {$dest}");
    }
}
