// src/hooks/usePublicHomeData.js
//
// ============================================================
// PUBLIC HOME DATA HOOK
// ============================================================
// Single source of truth for every piece of data the public
// (logged-out) home page needs: events, gallery highlights, and
// approved job posts.
//
// WHY THIS EXISTS
// ----------------
// Previously PublicHomePage.js had three separate, duplicated
// useEffect blocks calling /events, /galleries and /job-posts —
// the SAME endpoints the authenticated admin/alumni pages use.
// If those routes are behind auth middleware on the backend, an
// anonymous visitor gets a 401, the error is caught silently
// (by design, so it doesn't redirect them to /login), and the
// sections just render empty with no obvious clue why.
//
// THE FIX HAD TWO HALVES:
// 1. FRONTEND (this file) — one hook, one shape, one place to
//    reason about "what does the public page show".
// 2. BACKEND (routes/api.php) — DONE: dedicated, unauthenticated,
//    read-only routes now exist at /public/events, /public/galleries
//    and /public/job-posts, living outside the auth:api group. The
//    /public/job-posts route also forces status=approved server-side
//    (overwriting whatever the client sends) so approval can't be
//    bypassed by editing the request in devtools.
//
// USAGE
// -----
//   const {
//     events, eventsLoading,
//     gallery, galleryLoading,
//     jobs, jobsLoading,
//     refetch,
//   } = usePublicHomeData();
//
// DATA RULES (kept in sync with homePage.js / AlumniEvents.js)
// --------------------------------------------------------------
// - events   -> only UPCOMING events (date today or later), soonest
//               first, capped at 4.
// - gallery  -> the 8 most recently uploaded galleries (by created_at),
//               newest first.
// - jobs     -> approved job posts that aren't full/expired, newest
//               first, capped at 4.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import axiosConfig from "~/utils/axiosConfig";

// ------------------------------------------------------------
// Endpoint config — change these in ONE place if/when the
// backend grows dedicated public routes (recommended, see note
// above). Until then this safely falls back to the shared
// endpoints with silent + skipAuthRedirect so a 401 doesn't
// send visitors to the login screen.
// ------------------------------------------------------------
const PUBLIC_ENDPOINTS = {
    events: "/public/events",
    gallery: "/public/galleries",
    jobs: "/public/job-posts",
};

const REQUEST_OPTS = {
    silent: true, // don't trigger the global error modal
    skipAuthRedirect: true, // don't bounce anonymous visitors to /login
};

// Response payloads can come back as {data:{data:[...]}}, {data:[...]}
// or just [...] depending on whether Laravel pagination wraps it.
// This unwraps whichever shape shows up.
const unwrapList = (response) => {
    const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data ||
        [];
    return Array.isArray(raw) ? raw : [];
};

const sortByDateDesc = (list, getDate) =>
    [...list].sort((a, b) => {
        const da = new Date(getDate(a) || 0).getTime();
        const db = new Date(getDate(b) || 0).getTime();
        return db - da;
    });

const sortByDateAsc = (list, getDate) =>
    [...list].sort((a, b) => {
        const da = new Date(getDate(a) || 0).getTime();
        const db = new Date(getDate(b) || 0).getTime();
        return da - db;
    });

// An event counts as "upcoming" if its date is today or later.
// Mirrors the same "still ahead of us" rule used on the authenticated
// home page (homePage.js) and AlumniEvents.js, just without needing the
// start/end-time-of-day precision those pages use for the Live Now /
// Completed tags — the public teaser only needs Upcoming vs. not.
const isUpcoming = (event) => {
    const raw = event?.date || event?.event_date;
    if (!raw) return true; // no date info — don't hide it, just show it
    const eventDay = new Date(raw);
    if (Number.isNaN(eventDay.getTime())) return true;
    eventDay.setHours(23, 59, 59, 999); // whole day still counts as upcoming
    return eventDay.getTime() >= Date.now();
};

// A job post is still worth showing if it isn't full and hasn't expired,
// same rule homePage.js applies to its "Latest Job Posts" widget.
const isActiveJob = (job) => !job?.is_full && !job?.is_expired;

export default function usePublicHomeData() {
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsError, setEventsError] = useState(null);

    const [gallery, setGallery] = useState([]);
    const [galleryLoading, setGalleryLoading] = useState(true);
    const [galleryError, setGalleryError] = useState(null);

    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsError, setJobsError] = useState(null);

    // bumping this re-runs every fetch (see refetch() below)
    const [refreshToken, setRefreshToken] = useState(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ------------- Events -------------
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setEventsLoading(true);
                setEventsError(null);
                const response = await axiosConfig.get(
                    PUBLIC_ENDPOINTS.events,
                    REQUEST_OPTS,
                );
                const list = unwrapList(response);
                const upcoming = list.filter(isUpcoming);
                const sorted = sortByDateAsc(
                    upcoming,
                    (ev) => ev.date || ev.event_date,
                );
                if (active && mountedRef.current) setEvents(sorted.slice(0, 4));
            } catch (err) {
                if (active && mountedRef.current) {
                    setEvents([]);
                    setEventsError(err);
                }
            } finally {
                if (active && mountedRef.current) setEventsLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [refreshToken]);

    // ------------- Gallery -------------
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setGalleryLoading(true);
                setGalleryError(null);
                const response = await axiosConfig.get(
                    PUBLIC_ENDPOINTS.gallery,
                    { ...REQUEST_OPTS, params: { per_page: 8 } },
                );
                const list = unwrapList(response);
                const sorted = sortByDateDesc(list, (g) => g.created_at);
                if (active && mountedRef.current) setGallery(sorted.slice(0, 8));
            } catch (err) {
                if (active && mountedRef.current) {
                    setGallery([]);
                    setGalleryError(err);
                }
            } finally {
                if (active && mountedRef.current) setGalleryLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [refreshToken]);

    // ------------- Job posts -------------
    // `status: "approved"` is sent for clarity/readability, but the real
    // enforcement now happens server-side: the /public/job-posts route in
    // api.php overwrites this param before it reaches the controller, so
    // it can't be tampered with client-side.
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setJobsLoading(true);
                setJobsError(null);
                const response = await axiosConfig.get(PUBLIC_ENDPOINTS.jobs, {
                    ...REQUEST_OPTS,
                    params: { status: "approved" },
                });
                const list = unwrapList(response);
                const active_jobs = list.filter(isActiveJob);
                const sorted = sortByDateDesc(active_jobs, (job) => job.created_at);
                if (active && mountedRef.current) setJobs(sorted.slice(0, 4));
            } catch (err) {
                if (active && mountedRef.current) {
                    setJobs([]);
                    setJobsError(err);
                }
            } finally {
                if (active && mountedRef.current) setJobsLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [refreshToken]);

    const refetch = useCallback(() => {
        setRefreshToken((t) => t + 1);
    }, []);

    return {
        events,
        eventsLoading,
        eventsError,

        gallery,
        galleryLoading,
        galleryError,

        jobs,
        jobsLoading,
        jobsError,

        refetch,
    };
}