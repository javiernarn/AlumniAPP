<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SpaController extends Controller
{
    protected function siteDefaults(): array
    {
        return [
            'siteName' => 'Opol Community College',
            'appName' => 'ATMS',
            'logo' => asset('images/site-logo.png'),
            'locale' => 'en_PH',
            'author' => 'Opol Community College Alumni Association',
            'keywords' => 'Opol Community College, OCC, Alumni, Alumni Tracking, Alumni Tracing Management System, ATMS, Graduate Tracking, Alumni Association, OCC Alumni',
        ];
    }

    protected function seoMap(): array
    {
        return [
            '/' => [
                'title' => 'ATMS - Opol Community College',
                'description' => 'Official Alumni Tracing Management System (ATMS) of Opol Community College. Register as an alumnus, update your profile, browse job opportunities, receive announcements, participate in alumni activities, and stay connected with the OCC Alumni Association.',
            ],
           
            '/PublicHomePage' => [
                'title' => 'Home | ATMS - Opol Community College',
                'description' => 'Welcome to the Opol Community College Alumni Tracing Management System (ATMS). Explore upcoming alumni events, browse the photo gallery, view career opportunities, and sign in or register to stay connected with the OCC Alumni Association.',
            ],
            '/login' => [
                'title' => 'Login | ATMS - Opol Community College',
                'description' => 'Log in to the Opol Community College Alumni Tracing Management System (ATMS) to update your profile, view job opportunities, and stay connected with fellow alumni.',
            ],
            '/register' => [
                'title' => 'Alumni Registration | ATMS - Opol Community College',
                'description' => 'Register as an Opol Community College alumnus to update your profile, browse job opportunities, and stay connected through the ATMS.',
            ],
            '/public-events' => [
                'title' => 'Events | ATMS - Opol Community College',
                'description' => 'Browse upcoming, ongoing, and completed alumni events hosted by Opol Community College. Stay in the loop on reunions, activities, and gatherings from the OCC Alumni Association.',
            ],
            '/public-announcements' => [
                'title' => 'Announcements | ATMS - Opol Community College',
                'description' => 'Read the latest announcements from Opol Community College and the OCC Alumni Association, including updates on events, services, and important alumni notices.',
            ],
            '/public-faq' => [
                'title' => 'FAQ | ATMS - Opol Community College',
                'description' => 'Find answers to frequently asked questions about the Opol Community College Alumni Tracing Management System (ATMS), registration, and alumni services.',
            ],
            '/public-about' => [
                'title' => 'About | ATMS - Opol Community College',
                'description' => 'Learn more about Opol Community College and the OCC Alumni Association, and the mission behind the Alumni Tracing Management System (ATMS).',
            ],
            '/public-gallery' => [
                'title' => 'Gallery | ATMS - Opol Community College',
                'description' => 'Explore photo galleries from Opol Community College alumni events and activities, organized by year and month, through the OCC Alumni Association.',
            ],
            '/public-job-posts' => [
                'title' => 'Job Posts | ATMS - Opol Community College',
                'description' => 'Discover full-time, part-time, and contract job opportunities shared by Opol Community College and its partner companies for OCC alumni.',
            ],
            '/occ-services' => [
                'title' => 'OCC Services | ATMS - Opol Community College',
                'description' => 'Learn about the services offered by Opol Community College to its alumni through the Alumni Tracing Management System (ATMS).',
            ],
            '/forgot-password' => [
                'title' => 'Forgot Password | ATMS - Opol Community College',
                'description' => 'Reset your password for the Opol Community College Alumni Tracing Management System (ATMS) and regain access to your alumni profile.',
            ],
        ];
    }

    public function index(Request $request)
    {
        $path = '/' . trim($request->path(), '/');

        $default = [
            'title' => 'ATMS - Opol Community College',
            'description' => 'Official Alumni Tracing Management System (ATMS) of Opol Community College. Register as an alumnus, update your profile, browse job opportunities, receive announcements, participate in alumni activities, and stay connected with the OCC Alumni Association.',
        ];

        $seo = $this->seoMap()[$path] ?? $default;

        return view('app', array_merge($this->siteDefaults(), [
            'seoTitle' => $seo['title'],
            'seoDescription' => $seo['description'],
            'seoCanonical' => $request->url(),
        ]));
    }
}