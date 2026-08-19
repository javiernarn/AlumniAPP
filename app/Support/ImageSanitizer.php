<?php

namespace App\Support;

/**
 * Phase 3 — image re-encoding.
 *
 * Decodes an uploaded raster image with GD and re-saves it as a fresh
 * JPEG/PNG/WebP. This strips anything riding along in the file that
 * isn't actual pixel data — embedded scripts in polyglot files, tracker
 * pixels/EXIF metadata, appended payloads after the image data ends —
 * because only the decoded pixel grid survives the round-trip. It also
 * acts as a second content check beyond MIME sniffing: GD will refuse to
 * decode a file that isn't a genuine image of the claimed type.
 *
 * Deliberately does not touch PDFs or SVGs — PDFs are handled by the
 * mimes/extension whitelist instead (re-encoding a PDF is a much bigger
 * undertaking), and SVGs are rejected outright elsewhere in this phase
 * rather than sanitized, per the plan's "reject SVG unless explicitly
 * sanitized" guidance — no sanitizer is wired up, so SVG stays rejected.
 */
class ImageSanitizer
{
    /**
     * Re-encode raw image bytes of a known MIME type. Returns the new
     * binary contents, or null if GD could not decode the input (a
     * strong signal the file is not what it claims to be).
     */
    public static function reencode(string $bytes, string $mime): ?string
    {
        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromstring($bytes),
            'image/png' => @imagecreatefromstring($bytes),
            'image/webp' => @imagecreatefromstring($bytes),
            'image/gif' => @imagecreatefromstring($bytes),
            default => null,
        };

        if (!$image) {
            return null;
        }

        $width = imagesx($image);
        $height = imagesy($image);

        // Cap the long edge. Uploads from modern phone cameras are
        // routinely 4000-8000px on a side (12-48MP) — decoding,
        // flattening, and re-encoding a canvas that large is what was
        // making image-attached chat messages take dramatically longer
        // than text-only ones (and made the resulting email attachment
        // several MB, slowing SMTP delivery too). 1600px is plenty for
        // a chat/email attachment.
        $maxDimension = 1600;
        if ($width > $maxDimension || $height > $maxDimension) {
            $scale = min($maxDimension / $width, $maxDimension / $height);
            $newWidth = max(1, (int) round($width * $scale));
            $newHeight = max(1, (int) round($height * $scale));

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled(
                $resized,
                $image,
                0,
                0,
                0,
                0,
                $newWidth,
                $newHeight,
                $width,
                $height
            );
            imagedestroy($image);
            $image = $resized;
            $width = $newWidth;
            $height = $newHeight;
        }

        // Flatten transparency onto white for formats that support alpha,
        // then always emit JPEG — simplest, smallest, and removes any
        // format-specific metadata chunks (EXIF, ICC profiles, XMP, etc).
        $flattened = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($flattened, 255, 255, 255);
        imagefill($flattened, 0, 0, $white);
        imagecopy($flattened, $image, 0, 0, 0, 0, $width, $height);

        ob_start();
        imagejpeg($flattened, null, 88);
        $output = ob_get_clean();

        imagedestroy($image);
        imagedestroy($flattened);

        return $output === false ? null : $output;
    }
}
