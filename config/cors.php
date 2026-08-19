<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Phase 7: was ['*']. This API only ever needs these methods; an
    // explicit list is one less thing a misconfigured client/attacker
    // can rely on being permitted by default.
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Phase 6: was ['*']. A wildcard origin cannot be combined with
    // credentialed requests at all — browsers reject
    // `Access-Control-Allow-Origin: *` outright when a request carries
    // cookies/credentials, which the new HttpOnly auth-token cookie
    // (see AuthController::login()) requires. FRONTEND_URL should be
    // set to the SPA's real origin in .env; defaults to APP_URL for a
    // same-origin deployment (Laravel serving the built SPA itself).
    'allowed_origins' => [env('FRONTEND_URL', env('APP_URL', 'http://localhost'))],

    'allowed_origins_patterns' => [],

    // Phase 7: was ['*']. Explicit list covering what this app's
    // frontend actually sends (Content-Type/Accept for JSON, the
    // Authorization header for the mobile app's bearer-token flow,
    // X-Requested-With as a common AJAX marker some tooling adds
    // automatically).
    'allowed_headers' => ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Phase 6: required for the browser to send/receive the HttpOnly
    // auth-token cookie on cross-origin requests. Has no effect at all
    // for same-origin deployments (cookies are always sent same-origin
    // regardless of CORS), so this is safe either way.
    'supports_credentials' => true,

];
