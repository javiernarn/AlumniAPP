<?php

namespace App\Providers;

use App\Models\Alumni;
use App\Models\AlumniDocument;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Notification;
use App\Policies\AlumniDocumentPolicy;
use App\Policies\AlumniPolicy;
use App\Policies\JobApplicationPolicy;
use App\Policies\JobPostPolicy;
use App\Policies\NotificationPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Laravel\Passport\Passport; // passport

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * IMPORTANT: this array does nothing unless registerPolicies() runs in
     * boot() below. It was previously unregistered (boot() was commented
     * out entirely), so no Policy — even one added by a developer — was
     * ever actually enforced. See Phase 1 of the security hardening plan.
     *
     * @var array
     */
    protected $policies = [
        Alumni::class => AlumniPolicy::class,
        AlumniDocument::class => AlumniDocumentPolicy::class,
        JobApplication::class => JobApplicationPolicy::class,
        JobPost::class => JobPostPolicy::class,
        Notification::class => NotificationPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        if (! $this->app->routesAreCached()) {
            Passport::routes();
        }
    }
}