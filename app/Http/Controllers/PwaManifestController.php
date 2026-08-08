<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PwaManifestController extends Controller
{
    /**
     * Serve the web app manifest dynamically so its theme_color and
     * background_color match the visitor's current black/white theme
     * (read from the same "atms-theme" cookie useAppTheme.js writes).
     *
     * A static /manifest.json can't vary per visitor, which is why the
     * splash screen / OS-level chrome used to stay stuck on white even
     * after toggling the in-app theme. This route fixes that: the
     * manifest is re-fetched by the browser periodically and on
     * reinstall/relaunch, so it picks up theme changes going forward.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $theme = $request->cookie('atms-theme', 'white');
        $theme = in_array($theme, ['black', 'white']) ? $theme : 'white';

        $isBlack = $theme === 'black';

        $manifest = [
            'name' => 'ATMS - Opol Community College',
            'short_name' => 'ATMS',
            'description' => 'Opol Community College Alumni Tracing Management System',
            'start_url' => '/',
            'scope' => '/',
            'display' => 'standalone',
            'orientation' => 'any',
            'background_color' => $isBlack ? '#0a0c12' : '#ffffff',
            'theme_color' => $isBlack ? '#0a0c12' : '#ffffff',
            'lang' => 'en-PH',
            'categories' => ['education', 'productivity'],
            'icons' => [
                [
                    'src' => asset('images/site-logo.png'),
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any',
                ],
                [
                    'src' => asset('images/site-logo.png'),
                    'sizes' => '384x384',
                    'type' => 'image/png',
                    'purpose' => 'any',
                ],
                [
                    'src' => asset('images/site-logo.png'),
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any',
                ],
            ],
        ];

        return response()
            ->json($manifest)
            ->header('Content-Type', 'application/manifest+json')
            // Short cache so a theme toggle is picked up on the next
            // reasonably-soon manifest refetch, without refetching on
            // literally every request.
            ->header('Cache-Control', 'private, max-age=300');
    }
}