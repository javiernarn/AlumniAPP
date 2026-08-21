# Production Deploy Checklist — ATMS

Generated from a validated audit pass. Items marked ✅ were fixed in this pass;
items marked ⚠️ still need action before deploy, and could not be executed
inside this environment.

## ✅ Fixed in this pass (code changes)

- `MessagingController::deleteMessage()` / `editMessage()` — admin branch was
  identity-inferred ("no Alumni row = admin") and never checked `sender_id`,
  so a non-alumni, non-admin account (e.g. `department_head`) could edit or
  delete *any* admin's message. Now branches on `$user->role === 'admin'`
  explicitly and requires `sender_id` ownership in both branches.
- `/api/admin/messages/{id}/delete` and `/edit` — moved inside an explicit
  `role:admin` middleware check so the route layer matches the `/admin/` URL,
  instead of relying solely on the controller check above.
- Removed dead code: `resources/js/pages/faculty/**`, `ContentRemarks.js`
  (imported a state module — `~/states/facultyDashboardState` — that does not
  exist anywhere in this repo; would have failed to compile if ever used),
  the commented-out top half of `axiosConfig.js`, the `App\Http\Controllers\Api\ScheduleController`
  dead import in `routes/web.php`, the unused `auth:sanctum /api/user` route,
  and the orphaned `app/Events/MessageSent.php` (hardcoded to a
  `public-user.208` channel that didn't even match `routes/channels.php`,
  never dispatched anywhere).

## ⚠️ Must fix before deploy — could not execute here

1. **`APP_DEBUG=true`** in the uploaded `.env` — set `false` in production.
   Verified: this is a local dev `.env` (`APP_ENV=local`), so this wasn't
   changed here; don't just copy this file to prod as-is.
2. **`QUEUE_CONNECTION=sync`** — set to `redis` or `database` in production,
   or uploads/mail/notifications will block the request thread.
3. **`MAIL_PASSWORD`** is populated in the uploaded `.env`. Rotate it if it's
   a real, live credential — this can't be done from inside this sandbox.
4. **`composer install --no-dev`, `php artisan migrate --force`,
   `config:cache`, `route:cache`** — no PHP interpreter is available in this
   environment and `packagist.org` isn't reachable from it, so these were
   **not run**. Run them for real against a clean checkout before deploy.

## Newly confirmed in this pass

- **`npm install` / `npm ci` fail outright** on modern npm (10.x, Node 22)
  with an `ERESOLVE` peer-dependency conflict: `react-refresh@0.18.0` vs.
  `@pmmmwh/react-refresh-webpack-plugin@0.5.0-rc.0`, which wants
  `react-refresh@^0.10.0`. This reproduces even against the committed
  `package-lock.json` (`npm ci`), so it isn't just a "someday" version-drift
  note — a clean CI/deploy pipeline running plain `npm ci` will fail today.
  **Fix**: either downgrade `react-refresh` to `^0.10.x`, or (simpler) add
  `--legacy-peer-deps` to the install step in your deploy pipeline / CI
  config / README. Confirmed the build succeeds once this flag is added.
- With `--legacy-peer-deps`, `npm run production` **does** complete
  successfully. Output: `js/app.js` is **4.79 MiB** uncompressed — the
  original report's flag on the heavy dependency set (antd + mapbox-gl +
  recharts + @rive-app/react-canvas) is confirmed as a real, sizeable bundle,
  worth a `source-map-explorer` pass and code-splitting if load time matters.

## Confirmed safe (previously "unverified" in the prior report)

- `AlumniPolicy`, `AlumniDocumentPolicy`, `NotificationPolicy`,
  `JobPostPolicy`, `JobApplicationPolicy` — read directly, and all correctly
  restrict to owner/admin/scoped-role. Confirmed `AuthServiceProvider::boot()`
  actually calls `registerPolicies()` (this is the easy-to-forget step that
  would silently make every `$this->authorize()` call a no-op if missing —
  it's present and correct here).
- `JobApplication.alumni_id` is a foreign key to `users`, not `alumni`
  (confirmed via migration), despite the misleading column name — so the
  policy's `alumni_id === user->id` comparison is correct, not a bug.
- Gallery upload/moderation endpoints use inline `role !== 'admin'` checks
  (not per-user data, so no IDOR surface — this matches the original report).

## Not independently checked in this pass either

- Full 140-file frontend import graph (beyond the specific dead files traced
  above).
- Actual production infra behavior (Redis queue config, HTTPS/HSTS in a real
  deployed environment).
