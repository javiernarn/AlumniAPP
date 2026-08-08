// src/hooks/usePublicAnnouncementsData.js
//
// ============================================================
// PUBLIC ANNOUNCEMENTS DATA HOOK
// ============================================================
// Powers BOTH:
//   1. The homepage teaser (usePublicHomeData-style): latest 6
//      active announcements across every category.
//   2. The dedicated /public-announcements page: the full active
//      list, grouped by category so the page can render one
//      section per category (General, Academic, Event, Career,
//      Urgent, Maintenance, Other) — same "one hook, one shape"
//      idea as usePublicEventsData.js does for Upcoming/Ongoing/
//      Completed/Featured.
//
// WHY A SEPARATE HOOK INSTEAD OF EXTENDING usePublicHomeData
// ------------------------------------------------------------
// Same reasoning as usePublicEventsData.js: the homepage only ever
// needs "latest 6", the full page needs everything grouped by
// category — keeping them in one hook means the homepage teaser
// can't break if the full page's needs change later, and vice versa.
//
// BACKEND
// -------
// GET /public/announcements  -> AnnouncementController@publicIndex
// Already scoped server-side to Announcement::active() (published +
// inside the publish/expiry window), so nothing "draft" or expired
// ever reaches an anonymous visitor. Optional ?category=xxx is
// supported but this hook always fetches the full active list once
// and does the grouping client-side, since the page needs every
// category's cards available at once anyway (for the jump-to
// dropdown to work without a re-fetch per click).
//
// USAGE
// -----
//   const {
//     categories,       // [{ value, label, color, items: [...] }, ...]
//     latest,           // latest 6 across all categories, for the homepage
//     loading, error, refetch,
//   } = usePublicAnnouncementsData();
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import axiosConfig from "~/utils/axiosConfig";

const PUBLIC_ANNOUNCEMENTS_ENDPOINT = "/public/announcements";

const REQUEST_OPTS = {
    silent: true, // don't trigger the global error modal for anon visitors
    skipAuthRedirect: true, // never bounce anonymous visitors to /login
};

// Kept value-for-value in sync with CATEGORY_OPTIONS in the admin
// AnnouncementsPage.js so a "maintenance" announcement reads
// "Maintenance" here too, and so every category always gets its own
// section on the public page even when it currently has 0 posts.
export const ANNOUNCEMENT_CATEGORIES = [
    { value: "general", label: "General" },
    { value: "academic", label: "Academic" },
    { value: "event", label: "Event" },
    { value: "career", label: "Career" },
    { value: "urgent", label: "Urgent" },
    { value: "maintenance", label: "Maintenance" },
    { value: "other", label: "Other" },
];

export const categoryLabel = (value) =>
    ANNOUNCEMENT_CATEGORIES.find((c) => c.value === value)?.label || "General";

// Same "unwrap whatever shape Laravel gives us" helper used by
// usePublicHomeData.js / usePublicEventsData.js. publicIndex() here
// returns a plain get() array (no pagination wrapper), but this stays
// defensive in case that ever changes.
const unwrapList = (response) => {
    const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data ||
        [];
    return Array.isArray(raw) ? raw : [];
};

const getSortDate = (a) => a.publish_date || a.created_at;

const sortPinnedThenLatest = (list) =>
    [...list].sort((a, b) => {
        if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
        return new Date(getSortDate(b) || 0) - new Date(getSortDate(a) || 0);
    });

export default function usePublicAnnouncementsData() {
    const [allAnnouncements, setAllAnnouncements] = useState([]);
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
                const response = await axiosConfig.get(
                    PUBLIC_ANNOUNCEMENTS_ENDPOINT,
                    REQUEST_OPTS,
                );
                const list = unwrapList(response);
                if (active && mountedRef.current) setAllAnnouncements(list);
            } catch (err) {
                if (active && mountedRef.current) {
                    setAllAnnouncements([]);
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

    const sorted = sortPinnedThenLatest(allAnnouncements);

    // One entry per known category, even when it currently has zero
    // announcements — so the public page can always render an "empty"
    // state under that category's heading instead of the whole
    // section disappearing.
    const categories = ANNOUNCEMENT_CATEGORIES.map((c) => ({
        ...c,
        items: sorted.filter((a) => (a.category || "general") === c.value),
    }));

    // Homepage teaser: latest 6 across every category, pinned first.
    const latest = sorted.slice(0, 6);

    const refetch = useCallback(() => {
        setRefreshToken((t) => t + 1);
    }, []);

    return {
        categories,
        latest,
        all: sorted,
        loading,
        error,
        refetch,
    };
}