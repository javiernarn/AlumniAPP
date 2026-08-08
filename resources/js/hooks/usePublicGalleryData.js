// src/hooks/usePublicGalleryData.js
//
// ============================================================
// PUBLIC GALLERY PAGE DATA HOOK
// ============================================================
// Powers the full, dedicated /public-gallery page — a chronological
// timeline of every published photo album, grouped by Year then Month,
// as opposed to usePublicHomeData which only ever needs the 8
// most-recently-uploaded galleries for the homepage teaser grid.
//
// WHY YEAR -> MONTH INSTEAD OF AN EVENT-STATUS BUCKET
// ------------------------------------------------------------
// A gallery album documents an event that already happened (or is
// happening) — it isn't itself something with a live/upcoming state,
// and there's nothing to "register" for on a photo. So instead of
// borrowing the Events page's Upcoming/Ongoing/Completed framing (which
// doesn't fit a photo library), this hook mirrors the *year/month*
// filters GalleryController::index() and ::publicIndex() already
// support server-side (?year=, ?month=) and groups client-side the
// same way, keyed off event_date — the date of the event pictured.
//
// USAGE
// -----
//   const {
//     years,       // [{ year, count, months: [{ month, monthLabel, galleries: [...] }] }]
//     yearList,    // [2026, 2025, ...] descending, for the jump-to dropdown
//     loading, error, refetch,
//   } = usePublicGalleryData();
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axiosConfig from "~/utils/axiosConfig";

const PUBLIC_GALLERY_ENDPOINT = "/public/galleries";

const REQUEST_OPTS = {
    silent: true, // don't trigger the global error modal for anon visitors
    skipAuthRedirect: true, // never bounce anonymous visitors to /login
};

// Same "unwrap whatever shape Laravel gives us" helper as
// usePublicHomeData.js / the rest of the app.
const unwrapList = (response) => {
    const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data ||
        [];
    return Array.isArray(raw) ? raw : [];
};

const MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// Falls back to created_at (upload date) only if an album somehow has
// no event_date at all, so nothing silently disappears from the
// timeline.
const getGroupingDate = (gallery) => {
    const raw = gallery?.event_date || gallery?.date || gallery?.created_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
};

const sortByDateDesc = (list, getDate) =>
    [...list].sort((a, b) => new Date(getDate(b) || 0) - new Date(getDate(a) || 0));

export default function usePublicGalleryData() {
    const [allGalleries, setAllGalleries] = useState([]);
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
                const response = await axiosConfig.get(PUBLIC_GALLERY_ENDPOINT, {
                    ...REQUEST_OPTS,
                    params: { per_page: 500 },
                });
                const list = unwrapList(response);
                if (active && mountedRef.current) setAllGalleries(list);
            } catch (err) {
                if (active && mountedRef.current) {
                    setAllGalleries([]);
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

    // Build the Year -> Month timeline. Recomputed only when the raw
    // list changes, not on every render.
    const years = useMemo(() => {
        const byYear = new Map();

        allGalleries.forEach((gallery) => {
            const d = getGroupingDate(gallery);
            const year = d ? d.getFullYear() : "Undated";
            const monthIndex = d ? d.getMonth() : null;

            if (!byYear.has(year)) byYear.set(year, new Map());
            const byMonth = byYear.get(year);

            const monthKey = monthIndex === null ? "undated" : monthIndex;
            if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
            byMonth.get(monthKey).push(gallery);
        });

        const yearEntries = Array.from(byYear.entries())
            // "Undated" sinks to the bottom; real years sort newest-first.
            .sort((a, b) => {
                if (a[0] === "Undated") return 1;
                if (b[0] === "Undated") return -1;
                return b[0] - a[0];
            })
            .map(([year, byMonth]) => {
                const monthEntries = Array.from(byMonth.entries())
                    .sort((a, b) => {
                        if (a[0] === "undated") return 1;
                        if (b[0] === "undated") return -1;
                        return b[0] - a[0];
                    })
                    .map(([monthKey, galleries]) => ({
                        month: monthKey,
                        monthLabel: monthKey === "undated" ? "Undated" : MONTH_LABELS[monthKey],
                        galleries: sortByDateDesc(galleries, getGroupingDate),
                    }));

                const count = monthEntries.reduce((sum, m) => sum + m.galleries.length, 0);

                return { year, count, months: monthEntries };
            });

        return yearEntries;
    }, [allGalleries]);

    const yearList = useMemo(
        () => years.map((y) => y.year).filter((y) => y !== "Undated"),
        [years],
    );

    const refetch = useCallback(() => {
        setRefreshToken((t) => t + 1);
    }, []);

    return {
        years,
        yearList,
        loading,
        error,
        refetch,
    };
}