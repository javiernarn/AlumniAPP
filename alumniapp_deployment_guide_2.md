# Alumni App — Deployment Guide (Phases 2, 3 & 4)

Covers applying the changes from `alumniAPP_phases_2_3_4.zip` in two
contexts: your local machine (coding/testing) and a production server
(deployment). Adjust paths, PHP version, and service names to match
your actual environment where noted.

---

## Part 1 — Local machine (applying the changes to keep coding)

Run these from your project root, after extracting the zip.

### 1. Copy the changed files in

```bash
cp -r alumniAPP_phases_2_3_4/app/. app/
cp -r alumniAPP_phases_2_3_4/resources/. resources/
cp alumniAPP_phases_2_3_4/composer.json composer.json
```

Do **not** blindly copy `.env`/`.env.example` over your real ones — your
actual `.env` has DB credentials, mail settings, etc. this one doesn't
include. Instead open both side by side and manually copy in this
block (paste it in, keep it exactly like this — `CACHE_DRIVER=redis`
and `REDIS_CLIENT=predis` stay **commented out** locally, and get
uncommented in Part 2 below when you deploy):

```env
# CACHE_DRIVER=redis      <- uncomment this AND the line below when deploying
CACHE_DRIVER=file          # keep this active locally — comment it out when deploying
...
# REDIS_CLIENT=predis     <- uncomment this when deploying (pairs with CACHE_DRIVER=redis above)
```

### 2. Delete the dead model

```bash
rm app/Models/Users.php
```

Unused duplicate of `User.php` with `protected $guarded = []` (a
mass-assignment landmine) — confirmed zero references anywhere in
`app/`, `database/`, or `routes/` before recommending the delete.

### 3. Install the new PHP dependency

```bash
composer update predis/predis
```

If that alone errors:

```bash
composer update
```

### 4. Clear Laravel's caches

You changed `.env`, `AppServiceProvider.php`, and several controllers —
stale config/route caches can mask the changes.

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 5. Restart your dev server (if already running)

```bash
php artisan serve
# or your Sail/Valet/Herd equivalent
```

### 6. Rebuild frontend assets

The Phase 3/4 changes are all in `resources/js/hooks/*` and one page
component — nothing new was added to `package.json`, so no
`npm install` needed.

```bash
npm run watch
```

Leave this running in a terminal tab (it watches for file changes and
rebuilds automatically) — or run `npm run dev` once for a single build
without the watcher, if you just want to confirm it compiles.

### 7. Smoke test

```bash
php artisan tinker --execute="echo 'boot ok';"
```

If that boots cleanly, the PHP changes have no fatal syntax errors
(I couldn't run PHP in my own sandbox to verify this myself, so this
step matters). Then click through in the browser:

- Public home page, announcements, events, gallery, job posts
  (Phase 3 hooks)
- Admin dashboard (Phase 2 caching + field minimization)
- Admin → Alumni List page (Phase 1/4 — online-status polling,
  `staleTime`)

---

## Part 2 — Production deployment

Generic VPS + Nginx + PHP-FPM flow. If you're on a managed platform
(Laravel Forge, Ploi, Laravel Cloud, etc.), steps 3–6 below usually run
automatically on deploy — you'd mainly just need to set the `.env`
values and confirm Redis is provisioned.

### 1. Pull the code

```bash
cd /var/www/alumniapp
git pull origin main
```

### 2. Set production `.env` values

Edit `.env` **on the server**, never commit it. Two things to change:

1. `APP_ENV`/`APP_DEBUG` as shown below.
2. Flip the cache driver: **comment out** `CACHE_DRIVER=file` and
   **uncomment** the two lines that were already sitting there
   commented out for exactly this moment — `# CACHE_DRIVER=redis` and
   `# REDIS_CLIENT=predis`.

```bash
nano .env
```

```env
APP_ENV=production
APP_DEBUG=false

CACHE_DRIVER=redis        # was commented out — uncomment it
# CACHE_DRIVER=file       # was active locally — comment it out now
REDIS_CLIENT=predis       # was commented out — uncomment it
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

If Redis isn't installed on this host yet:

```bash
sudo apt update && sudo apt install redis-server -y
sudo systemctl enable --now redis-server
redis-cli ping     # should reply PONG
```

If Redis genuinely isn't an option on this host, use
`CACHE_DRIVER=database` instead — everything still works, you just lose
cache-tag invalidation (see `app/Support/CacheHelper.php`'s docblock
for exactly what that means).

### 3. Install PHP dependencies (production mode)

```bash
composer install --no-dev --optimize-autoloader
```

`--no-dev` skips dev-only packages (phpunit, mockery, etc.);
`--optimize-autoloader` speeds up class loading. This is also what
pulls in `predis/predis`.

### 4. Build frontend assets

```bash
npm ci
npm run prod
```

`npm ci` (not `install`) for a clean, lockfile-exact install in
CI/production. `npm run prod` runs Mix in production mode — minifies
and versions the compiled assets, unlike `watch`/`dev` which leave them
unminified for faster local rebuilds.

### 5. Run database migrations

```bash
php artisan migrate --force
```

`--force` is required in production (Laravel normally prompts for
confirmation). No migrations shipped in Phases 1–4, but run this as a
standing habit on every deploy.

### 6. Rebuild all caches

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Note: `:cache`, not `:clear` — in production you want everything
pre-compiled, not cleared and rebuilt on the next incoming request.

### 7. Delete the dead model

```bash
rm app/Models/Users.php
```

### 8. Restart services

```bash
sudo systemctl restart php8.1-fpm     # match your actual PHP version
sudo systemctl restart nginx          # or apache2
php artisan queue:restart             # only relevant if production uses a real queue driver, not sync
```

### 9. Smoke test

```bash
curl -I https://your-domain.com/api/public/events
```

Confirm a `200` response, then check Redis directly to confirm caching
is actually populating:

```bash
redis-cli
> KEYS *public:events*
> TTL "public:events:all:all"
```

---

## Quick reference — what changed and why

| File(s) | Phase | What changed |
|---|---|---|
| `app/Support/CacheHelper.php` | 2 | New — tag-aware cache wrapper, degrades gracefully on non-Redis drivers |
| `app/Observers/*.php` (5 files) | 2 | New — cache invalidation on writes |
| `app/Providers/AppServiceProvider.php` | 2 | Registers the 5 observers |
| `AnnouncementController`, `EventController`, `GalleryController`, `GlobalAluminiController`, `AdminDashboardController` | 2 | Public/lookup/dashboard reads now cached |
| `AlumniRegistrationController::getOnlineStatuses()` | 2 | Cached 5s server-side (defense-in-depth on Phase 1's fix) |
| `AlumniDashboardResource.php` | 2 | New — fixes dashboard dumping full Alumni models |
| `Notification.php` | 2 | `guarded = []` → explicit `$fillable` |
| `.env`, `.env.example`, `composer.json` | 2 | `CACHE_DRIVER`, `REDIS_CLIENT`, `predis/predis` dependency |
| `app/Models/Users.php` | 2 | **Deleted** — unused duplicate, mass-assignment landmine |
| `usePublicEventsData.js`, `usePublicAnnouncementsData.js`, `usePublicGalleryData.js`, `usePublicJobPostsData.js`, `usePublicHomeData.js` | 3 | Migrated from hand-rolled `useEffect`+`axios` to react-query |
| `useOnlineStatus.js` | 4 | Fixed dangling `setTimeout` leak on rapid online/offline flapping |
| `FormPrimaryDetails.js` | 4 | Replaced `document.write` with direct `<img>` element append |
| `useAlumni.js`, `useAlumniDirectory.js` | 4 | Added explicit `staleTime: 30000` |
