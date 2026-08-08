{{-- <!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'ATMS - Opol Community College')</title>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link rel="icon" href="{{ asset('images/site-logo.png') }}" type="image/png">
</head>
<body>
    <div id="app"></div>

    <script src="{{ asset('js/app.js') }}"></script>
</body>
</html> --}}


{{-- <!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- TITLE -->
    <title>@yield('title', 'ATMS - Opol Community College')</title>

    <!-- FAVICON -->
    <link rel="icon" href="{{ asset('images/site-logo.png') }}" type="image/png">

    <!-- CSS -->
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

</head>

<body>

    <!-- APP ROOT -->
    <div id="app"></div>

    <!-- JS -->
    <script src="{{ asset('js/app.js') }}"></script>

</body>

</html> --}}


{{-- 

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Title -->
    <title>@yield('title', 'ATMS - Opol Community College')</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/site-logo.png') }}">
    <link rel="shortcut icon" href="{{ asset('images/site-logo.png') }}">

    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/site-logo.png') }}">

    <!-- Mobile Web App -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="ATMS">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">

    <!-- Theme Color -->
    <meta name="theme-color" content="#ffffff">

    <!-- CSS -->
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

</head>

<body>

    <div id="app"></div>

    <script src="{{ asset('js/app.js') }}"></script>

</body>

</html> --}}





{{-- <!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- TITLE (FIXED) -->
    <title>@yield('title', 'ATMS - Opol Community College')</title>

    <!-- Favicon -->
    <link rel="icon" href="{{ asset('images/site-logo.png') }}" type="image/png">

    <!-- CSS -->
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

    @stack('styles')
</head>

<body>

    <!-- Your frontend app (Vue/React/etc.) -->
    <div id="app"></div>

    <!-- JS -->
    <script src="{{ asset('js/app.js') }}"></script>

    @stack('scripts')

</body>
</html> --}}

{{-- 


<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- TITLE -->
  
   <title>@yield('title', 'ATMS - Opol Community College')</title>
  
    <!-- SEO META -->
    <meta name="title" content="ATMS - Opol Community College">
    <meta name="description" content="Opol Community College Alumni Tracing Management System. Manage alumni records, events, announcements, and stay connected with OCC.">

    <!-- KEYWORDS -->
    <meta name="keywords" content="OCC, Opol Community College, Alumni, ATMS, Alumni Tracing System, Opol Community College Alumni Association">

    <!-- AUTHOR -->
    <meta name="author" content="Opol Community College Alumni Association">

    <!-- GOOGLE -->
    <meta name="robots" content="index, follow">

    <!-- OPEN GRAPH (Facebook/Discord Preview) -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="ATMS - Opol Community College">
    <meta property="og:description" content="Official Alumni Tracing Management System of Opol Community College.">
    <meta property="og:image" content="{{ asset('images/site-logo.png') }}">
    <meta property="og:url" content="{{ url('/') }}">

    <!-- TWITTER -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="ATMS - Opol Community College">
    <meta name="twitter:description" content="Official Alumni Tracing Management System of Opol Community College.">
    <meta property="og:image" content="{{ url('/images/site-logo.png') }}">
<meta name="twitter:image" content="{{ url('/images/site-logo.png') }}">

      <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/site-logo.png') }}">
    <link rel="shortcut icon" href="{{ asset('images/site-logo.png') }}">

    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/site-logo.png') }}">

    <!-- Mobile Web App -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="ATMS">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">

    <!-- CSS -->
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
</head>

<body>
    <div id="app"></div>

    <script src="{{ asset('js/app.js') }}"></script>
</body>
    </html>  --}}

{{--     

{{-- <!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'ATMS - Opol Community College')</title>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link rel="icon" href="{{ asset('images/site-logo.png') }}" type="image/png">
</head>
<body>
    <div id="app"></div>

    <script src="{{ asset('js/app.js') }}"></script>
</body>
</html> --}}

@php

    $atmsTheme = request()->cookie('atms-theme', 'white');
    $atmsTheme = in_array($atmsTheme, ['black', 'white']) ? $atmsTheme : 'white';
    $atmsThemeColor = $atmsTheme === 'black' ? '#0a0c12' : '#ffffff';
    $atmsStatusBarStyle = $atmsTheme === 'black' ? 'black' : 'default';
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="{{ $atmsTheme === 'black' ? 'black' : '' }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <!-- Google Site Verification -->
    <meta name="google-site-verification" content="EoE6LVDV2xrA2R1kWgPDzyDYU4Dl98Sz5dktxhT68I0">

    <!-- CSRF -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- =======================================================
            PRIMARY SEO
    ======================================================== -->

    <title>{{ $seoTitle }}</title>

    <meta name="title" content="{{ $seoTitle }}">

    <meta name="description" content="{{ $seoDescription }}">

    <meta name="keywords" content="{{ $keywords }}">

    <meta name="author" content="{{ $author }}">

    <meta name="application-name" content="{{ $appName }} - {{ $siteName }}">

    <!-- =======================================================
            SEARCH ENGINE
    ======================================================== -->

    <meta name="robots" content="index, follow, max-image-preview:large">

    <meta name="googlebot" content="index, follow">

    <link rel="canonical" href="{{ $seoCanonical }}">

    <!-- =======================================================
            FAVICON
    ======================================================== -->

    <link rel="icon" type="image/png" sizes="32x32" href="{{ $logo }}">

    <link rel="icon" type="image/png" sizes="192x192" href="{{ $logo }}">

    <link rel="shortcut icon" href="{{ $logo }}">

    <link rel="apple-touch-icon" href="{{ $logo }}">

    <!-- =======================================================
            OPEN GRAPH
    ======================================================== -->

    <meta property="og:type" content="website">

    <meta property="og:site_name" content="{{ $siteName }}">

    <meta property="og:locale" content="{{ $locale }}">

    <meta property="og:title" content="{{ $seoTitle }}">

    <meta property="og:description" content="{{ $seoDescription }}">

    <meta property="og:url" content="{{ $seoCanonical }}">

    <meta property="og:image" content="{{ $logo }}">

    <meta property="og:image:alt" content="{{ $siteName }} {{ $appName }} Logo">

    <meta property="og:image:width" content="512">

    <meta property="og:image:height" content="512">

    <!-- =======================================================
            TWITTER
    ======================================================== -->

    <meta name="twitter:card" content="summary_large_image">

    <meta name="twitter:title" content="{{ $seoTitle }}">

    <meta name="twitter:description" content="{{ $seoDescription }}">

    <meta name="twitter:image" content="{{ $logo }}">

    <meta name="twitter:image:alt" content="{{ $siteName }} {{ $appName }} Logo">

    <!-- =======================================================
            MOBILE / PWA
    ======================================================== -->

    <meta name="theme-color" content="{{ $atmsThemeColor }}">

    <meta name="apple-mobile-web-app-capable" content="yes">

    <meta name="apple-mobile-web-app-title" content="{{ $appName }}">

    <meta name="apple-mobile-web-app-status-bar-style" content="{{ $atmsStatusBarStyle }}">

    <meta name="mobile-web-app-capable" content="yes">

    <link rel="manifest" href="{{ route('pwa.manifest') }}">

    {{-- <script>
        (function() {
            function hideToolbar() {
                window.scrollTo(0, 1);
            }

            window.addEventListener("load", function() {
                setTimeout(hideToolbar, 0);
                setTimeout(hideToolbar, 300);
            });

            window.addEventListener("orientationchange", function() {
                setTimeout(hideToolbar, 300);
            });
        })();
    </script> --}}
    <!-- =======================================================
            STRUCTURED DATA
    ======================================================== -->

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollegeOrUniversity",
                "name": "{{ $siteName }}",
                "url": "{{ url('/') }}",
                "logo": "{{ $logo }}",
                "image": "{{ $logo }}",
                "description": "{{ $seoDescription }}",
                "department": {
                    "@type": "Organization",
                    "name": "Alumni Tracing Management System ({{ $appName }})"
                }
            },
            {
                "@type": "Organization",
                "name": "{{ $siteName }}",
                "url": "{{ url('/') }}",
                "logo": {
                    "@type": "ImageObject",
                    "url": "{{ $logo }}"
                }
            },
            {
                "@type": "WebSite",
                "name": "{{ $siteName }}",
                "alternateName": "{{ $appName }}",
                "url": "{{ url('/') }}",
                "publisher": {
                    "@type": "CollegeOrUniversity",
                    "name": "{{ $siteName }}"
                },
                "inLanguage": "en-PH"
            }
        ]
    }
    </script>

    @stack('schema')
    <!-- =======================================================
            CSS
    ======================================================== -->

    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

    <!-- Fonts -->

    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">

</head>

<body>

    <div id="app"></div>

    <!-- React -->

    <script src="{{ asset('js/app.js') }}"></script>

</body>

</html>
