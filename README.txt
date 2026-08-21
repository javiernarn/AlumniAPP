Alumni App — Phases 2, 3 & 4 (combined)
========================================

This zip contains ONLY the files that changed across Phases 2–4 of
AlumniApp_Fix_Plan.md, with their real project paths preserved. Copy
them into your project at the matching paths (they overwrite the
Phase-1 versions where applicable).

One file also needs DELETING (a zip diff can't represent a deletion):

    app/Models/Users.php

Reason: unused duplicate of app/Models/User.php, with `protected
$guarded = []` (mass-assignment landmine). Confirmed zero references to
App\Models\Users anywhere in app/, database/, or routes/ before
recommending the delete. Just `rm app/Models/Users.php` in your project.

--------------------------------------------------------------
.env — READ THIS BEFORE COPYING IT IN
--------------------------------------------------------------
The .env in this zip has CACHE_DRIVER=file (matches what you're
actually running locally, per your note) plus a REDIS_CLIENT=predis
line that stays inert until you switch CACHE_DRIVER to redis later
for deployment. If your local .env already has other project-specific
values (API keys, DB credentials, etc.) that aren't shown here, don't
blindly overwrite your real .env with this one — just copy the
CACHE_DRIVER comment block + the REDIS_CLIENT=predis line into your
existing .env instead, or diff the two.

.env.example (the template committed to the repo, not your real env)
DOES still recommend CACHE_DRIVER=redis, since that file's job is to
document the production-recommended setting for whoever deploys this
later.

--------------------------------------------------------------
composer.json — predis/predis was added
--------------------------------------------------------------
Needed for CACHE_DRIVER=redis without requiring the phpredis PHP
extension. Since CACHE_DRIVER=file locally, you don't strictly need to
install it right now — but if you do `composer install`/`composer
update` after copying this in, it'll pull in predis/predis harmlessly
(it just won't be used until you switch drivers). I couldn't run
composer from this sandbox (packagist.org isn't reachable here) to
regenerate composer.lock for you, so run one of these after pulling
these files in, whenever you're ready for it:

    composer require predis/predis
    # or, since composer.json is already updated:
    composer update predis/predis

--------------------------------------------------------------
What's in each phase
--------------------------------------------------------------
PHASE 2 — Backend caching (audit §3, backend) + finding #1 cleanup
  app/Support/CacheHelper.php                          (new)
  app/Observers/AnnouncementObserver.php                (new)
  app/Observers/EventObserver.php                       (new)
  app/Observers/GalleryObserver.php                     (new)
  app/Observers/CourseObserver.php                      (new)
  app/Observers/EmploymentStatusObserver.php            (new)
  app/Providers/AppServiceProvider.php                  (registers the 5 observers)
  app/Http/Controllers/AnnouncementController.php       (publicIndex cached)
  app/Http/Controllers/EventController.php              (publicIndex cached)
  app/Http/Controllers/GalleryController.php            (publicIndex cached)
  app/Http/Controllers/GlobalAluminiController.php      (courses/employeeStatus cached)
  app/Http/Controllers/AdminDashboardController.php     (cached + finding #4 field minimization)
  app/Http/Controllers/AlumniRegistrationController.php (getOnlineStatuses cached 5s)
  app/Http/Resources/Alumni/AlumniDashboardResource.php (new)
  app/Models/Notification.php                           (guarded=[] -> explicit fillable)
  .env / .env.example / composer.json                   (CACHE_DRIVER + predis)
  [DELETE] app/Models/Users.php

PHASE 3 — Migrate usePublic*Data hooks to react-query (audit §3, frontend)
  resources/js/hooks/usePublicEventsData.js
  resources/js/hooks/usePublicAnnouncementsData.js
  resources/js/hooks/usePublicGalleryData.js
  resources/js/hooks/usePublicJobPostsData.js
  resources/js/hooks/usePublicHomeData.js

PHASE 4 — Remaining low-urgency cleanup (audit §1, §2 secondary)
  resources/js/hooks/useOnlineStatus.js                 (timer leak fix)
  resources/js/pages/shared/profile/FormPrimaryDetails.js (document.write -> appendChild)
  resources/js/hooks/useAlumni.js                       (explicit staleTime)
  resources/js/hooks/useAlumniDirectory.js              (explicit staleTime)

--------------------------------------------------------------
Sanity checks already done
--------------------------------------------------------------
No PHP/Node interpreter is available in this sandbox, so nothing here
was run — everything was checked manually: every edited method was
traced end-to-end, and every changed file passed a brace/paren balance
check. Worth running `php -l` on the PHP files and a quick smoke test
in the app after copying these in, just in case.


composer update predis/predis