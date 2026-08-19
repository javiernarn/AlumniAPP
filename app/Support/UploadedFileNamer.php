<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/**
 * Phase 3 — server-generated random filenames.
 *
 * Several upload endpoints built the stored filename by concatenating
 * time(), a short random suffix, and $file->getClientOriginalExtension()
 * — i.e. partly derived from a client-supplied string. Laravel's `mimes:`
 * validation rule does cross-check that extension against the detected
 * content type, which closes most of the practical risk, but it's not a
 * fully server-controlled name. This helper generates a name entirely
 * from a fixed, server-owned MIME->extension map plus Str::random(40),
 * so nothing about the stored filename is ever attacker-influenced.
 */
class UploadedFileNamer
{
    private const EXTENSION_MAP = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    ];

    /**
     * @param  UploadedFile  $file  Must already have passed MIME/extension
     *                              validation before this is called.
     */
    public static function randomName(UploadedFile $file): string
    {
        $mime = $file->getMimeType();
        $extension = self::EXTENSION_MAP[$mime] ?? $file->extension() ?? 'bin';

        return Str::random(40) . '.' . $extension;
    }
}
