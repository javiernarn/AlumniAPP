// src/hooks/usePublicEventsData.js
//
// ============================================================
// PUBLIC EVENTS PAGE DATA HOOK
// ============================================================
// Powers the full, dedicated /public-events page (Upcoming /
// Ongoing / Completed / Featured), as opposed to usePublicHomeData
// which only ever needs the first 4 upcoming events for the
// homepage teaser.
//
// WHY A SEPARATE HOOK INSTEAD OF EXTENDING usePublicHomeData
// ------------------------------------------------------------
// usePublicHomeData intentionally filters to "upcoming only,
// capped at 4" for the homepage widget. The events page needs the
// FULL list (all statuses, uncapped) so it can render all four
// sections. Reusing the same endpoint but keeping the fetch/shape
// logic separate means the homepage teaser can't accidentally
// break if this page's needs change later, and vice versa.
//
// STATUS RULE (mirrors computeEventStatus in AlumniEvents.js)
// ------------------------------------------------------------
// - If the backend already sends a `status` field, trust it.
// - Otherwise derive it from date + start_time/end_time:
//     now < start           -> upcoming
//     start <= now <= end   -> ongoing ("Live Now")
//     now > end             -> completed
//
// USAGE
// -----
//   const {
//     upcoming, ongoing, completed, featured,
//     loading, error, refetch,
//   } = usePublicEventsData();
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import axiosConfig from "~/utils/axiosConfig";

const PUBLIC_EVENTS_ENDPOINT = "/public/events";

const REQUEST_OPTS = {
    silent: true, // don't trigger the global error modal for anon visitors
    skipAuthRedirect: true, // never bounce anonymous visitors to /login
};

// Same "unwrap whatever shape Laravel gives us" helper as
// usePublicHomeData.js — kept local so this hook has no hidden
// coupling to that file.
const unwrapList = (response) => {
    const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data ||
        [];
    return Array.isArray(raw) ? raw : [];
};

// Accepts "HH:mm", "HH:mm:ss", "h:mm A" style strings and returns a
// normalized "HH:mm" 24-hour string, or null if it can't be parsed.
const normalizeTime = (t) => {
    if (!t) return null;
    const str = String(t).trim();

    // 24-hour "HH:mm" or "HH:mm:ss"
    let m = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m) {
        const h = Number(m[1]);
        const min = Number(m[2]);
        if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
            return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        }
    }

    // 12-hour "h:mm AM/PM"
    m = str.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (m) {
        let h = Number(m[1]) % 12;
        const min = Number(m[2]);
        if (/pm/i.test(m[3])) h += 12;
        return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }

    return null;
};

// Human-friendly 12-hour display, e.g. "09:30" -> "9:30 AM".
export const formatTimeDisplay = (t) => {
    const normalized = normalizeTime(t);
    if (!normalized) return "";
    const [hStr, minStr] = normalized.split(":");
    let h = Number(hStr);
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${minStr} ${period}`;
};

const computeEventStatus = (event) => {
    // Trust an explicit backend-provided status first.
    if (event?.status && ["upcoming", "ongoing", "completed", "cancelled"].includes(event.status)) {
        return event.status;
    }

    const rawDate = event?.date || event?.event_date;
    if (!rawDate) return "upcoming";

    const eventDay = new Date(rawDate);
    if (Number.isNaN(eventDay.getTime())) return "upcoming";

    const startTime = normalizeTime(event.start_time || event.startTime);
    const endTime = normalizeTime(event.end_time || event.endTime);

    // No time-of-day info — fall back to whole-day comparison.
    if (!startTime || !endTime) {
        const dayStart = new Date(eventDay);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(eventDay);
        dayEnd.setHours(23, 59, 59, 999);
        const now = Date.now();
        if (now < dayStart.getTime()) return "upcoming";
        if (now > dayEnd.getTime()) return "completed";
        return "ongoing";
    }

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const start = new Date(eventDay);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(eventDay);
    end.setHours(eh, em, 0, 0);

    const now = Date.now();
    if (now < start.getTime()) return "upcoming";
    if (now > end.getTime()) return "completed";
    return "ongoing";
};

const isFeatured = (event) => Boolean(event?.featured ?? event?.is_featured);

const sortByDateAsc = (list, getDate) =>
    [...list].sort((a, b) => new Date(getDate(a) || 0) - new Date(getDate(b) || 0));

const sortByDateDesc = (list, getDate) =>
    [...list].sort((a, b) => new Date(getDate(b) || 0) - new Date(getDate(a) || 0));

export default function usePublicEventsData() {
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshToken, setRefreshToken] = useState(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axiosConfig.get(PUBLIC_EVENTS_ENDPOINT, {
                    ...REQUEST_OPTS,
                    params: { per_page: 200 },
                });
                const list = unwrapList(response).map((ev) => ({
                    ...ev,
                    _computedStatus: computeEventStatus(ev),
                }));
                if (active && mountedRef.current) setAllEvents(list);
            } catch (err) {
                if (active && mountedRef.current) {
                    setAllEvents([]);
                    setError(err);
                }
            } finally {
                if (active && mountedRef.current) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [refreshToken]);

    const getDate = (ev) => ev.date || ev.event_date;

    const upcoming = sortByDateAsc(
        allEvents.filter((ev) => ev._computedStatus === "upcoming"),
        getDate,
    );
    const ongoing = sortByDateAsc(
        allEvents.filter((ev) => ev._computedStatus === "ongoing"),
        getDate,
    );
    const completed = sortByDateDesc(
        allEvents.filter((ev) => ev._computedStatus === "completed"),
        getDate,
    );
    const featured = sortByDateAsc(allEvents.filter(isFeatured), getDate);

    const refetch = useCallback(() => {
        setRefreshToken((t) => t + 1);
    }, []);

    return {
        upcoming,
        ongoing,
        completed,
        featured,
        loading,
        error,
        refetch,
    };
}