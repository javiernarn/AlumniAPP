<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\PwaManifestController;
use App\Http\Controllers\SpaController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Route::get('/', function () {
//     return view('welcome');
// });

// Route::view('/{path?}', 'app');

// Route::any('*', function(){
// 	return view('app');
// });


// Route::get('/schedule-details-pdf/{id}', [ ScheduleController::class, 'schedDetailsPdf'] );
// Route::get('/schedule-pdf/{sy}/{sem}/{category}/{college}/{dept}', [ ScheduleController::class, 'schedPdf'] );

// Dynamic PWA manifest — must come before the catch-all route below,
// since Route::get('/{path?}', ...) would otherwise swallow
// /manifest.json and return the app.blade.php view instead of JSON.
Route::get('/manifest.json', PwaManifestController::class)->name('pwa.manifest');

// Catch-all SPA route — now passes through SpaController so the server
// can inject per-route SEO tags (title/description/canonical) into
// app.blade.php before React takes over on the client.
//
// IMPORTANT: the `path` constraint below EXCLUDES common static-asset
// extensions (images, icons, fonts, css/js, txt/xml/json, etc.).
//
// Why this matters: normally a physical file in /public (e.g.
// public/images/site-logo.png) is served directly by the web server
// and never reaches this route at all. But if that file is EVER
// missing — wrong build path, asset not deployed, typo — the old
// `->where('path', '.*')` constraint matched literally everything,
// so the request fell through to this catch-all and SpaController
// happily returned a 200 OK with the full HTML app page instead of a
// 404. Browsers and crawlers (including Googlebot fetching your
// favicon/OG image) would receive text/html where they expected an
// image, and silently fail — which is exactly what caused the missing
// logo/favicon in Google search results and social link previews.
//
// With this constraint, a request for a missing static file now
// correctly 404s instead of being masked as a successful HTML page,
// so broken asset paths fail loudly (in server logs / dev tools)
// instead of silently breaking favicons, OG previews, and SEO.
Route::get('/{path?}', [SpaController::class, 'index'])
    ->where('path', '^(?!.*\.(?:ico|png|jpe?g|gif|webp|svg|css|js|map|txt|xml|json|webmanifest|woff2?|ttf|eot|pdf)$).*$');