// src/hooks/usePublicJobPostsData.js
//
// ============================================================
// PUBLIC JOB POSTS PAGE DATA HOOK
// ============================================================
// Powers the full, dedicated /public-job-posts page (Full-time /
// Part-time / Contract), as opposed to usePublicHomeData which only
// ever needs the latest 4 active job posts for the homepage teaser.
//
// WHY A SEPARATE HOOK INSTEAD OF EXTENDING usePublicHomeData
// ------------------------------------------------------------
// usePublicHomeData intentionally filters to "active, capped at 4"
// for the homepage widget. The job posts page needs the FULL list
// (every approved post, uncapped) so it can render all three
// Type sections. Reusing the same endpoint but keeping the
// fetch/shape logic separate means the homepage teaser can't
// accidentally break if this page's needs change later, and vice
// versa — same pattern as usePublicEventsData vs. usePublicHomeData.
//
// ENDPOINT
// --------
// GET /public/job-posts (JobPostController::publicIndex) — already
// forces status=approved server-side, so this hook never needs to
// (and can't) request pending/rejected posts. Pass per_page=200 so
// this page isn't silently capped at the endpoint's normal
// 10-per-page default (see the per_page note in the controller).
//
// TYPE GROUPING
// ------------------------------------------------------------
// job_type comes back as "Full-time" / "Part-time" / "Contract"
// (see jobTypeOptions in AdminAlumniJobPostPage.js). normalizeJobType
// below is tolerant of casing/spacing/underscore variants so a post
// still lands in the right bucket even if it was saved slightly
// differently.
//
// USAGE
// -----
//   const {
//     fullTime, partTime, contract,
//     loading, error, refetch,
//   } = usePublicJobPostsData();
//
//   import { sortJobs } from "~/hooks/usePublicJobPostsData";
//   const sorted = sortJobs(fullTime, "date-desc");
// ============================================================

// Phase 3 (audit §3 frontend): migrated onto react-query — see the
// header comment in usePublicEventsData.js for why (de-duplication +
// real staleTime instead of "always refetch on mount").
import { useMemo } from "react";
import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const PUBLIC_JOB_POSTS_ENDPOINT = "/public/job-posts";
const PUBLIC_JOB_POSTS_QUERY_KEY = ["public-job-posts", "full"];

const REQUEST_OPTS = {
    silent: true, // don't trigger the global error modal for anon visitors
    skipAuthRedirect: true, // never bounce anonymous visitors to /login
};

// Same "unwrap whatever shape Laravel gives us" helper used by
// usePublicHomeData.js / usePublicEventsData.js — kept local so this
// hook has no hidden coupling to those files.
const unwrapList = (response) => {
    const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data ||
        [];
    return Array.isArray(raw) ? raw : [];
};

// "Full-time" / "full time" / "FULL_TIME" / "full-time" all normalize
// to the same bucket key.
export const normalizeJobType = (type) => {
    const t = String(type || "")
        .toLowerCase()
        .replace(/[\s_]+/g, "-");
    if (t.includes("full")) return "full-time";
    if (t.includes("part")) return "part-time";
    if (t.includes("contract")) return "contract";
    return "other";
};

const parseDateMs = (value) => {
    const ms = new Date(value || 0).getTime();
    return Number.isNaN(ms) ? 0 : ms;
};

// Shared sort helper — also used directly by PublicJobPostsPage.js so
// the "Jump to" section and the "Sort by" control both operate on the
// exact same ordering rules.
//   "date-desc" -> newest posted first (default)
//   "date-asc"  -> oldest posted first
//   "title-asc" -> Title A to Z
export const sortJobs = (list, sortBy = "date-desc") => {
    const arr = Array.isArray(list) ? [...list] : [];
    switch (sortBy) {
        case "date-asc":
            return arr.sort((a, b) => parseDateMs(a.created_at) - parseDateMs(b.created_at));
        case "title-asc":
            return arr.sort((a, b) =>
                String(a.title || "").localeCompare(String(b.title || ""), undefined, {
                    sensitivity: "base",
                }),
            );
        case "date-desc":
        default:
            return arr.sort((a, b) => parseDateMs(b.created_at) - parseDateMs(a.created_at));
    }
};

export default function usePublicJobPostsData() {
    const {
        data: allJobs = [],
        isLoading: loading,
        error,
        refetch,
    } = useQuery(
        PUBLIC_JOB_POSTS_QUERY_KEY,
        async () => {
            const response = await axiosConfig.get(PUBLIC_JOB_POSTS_ENDPOINT, {
                ...REQUEST_OPTS,
                params: { per_page: 200 },
            });
            return unwrapList(response).map((job) => ({
                ...job,
                _typeKey: normalizeJobType(job.job_type),
            }));
        },
        {
            staleTime: 60000,
            refetchOnWindowFocus: false,
        },
    );

    // Recomputed only when the raw list actually changes, not on every
    // render.
    const { fullTime, partTime, contract, other } = useMemo(() => {
        return {
            fullTime: allJobs.filter((j) => j._typeKey === "full-time"),
            partTime: allJobs.filter((j) => j._typeKey === "part-time"),
            contract: allJobs.filter((j) => j._typeKey === "contract"),
            other: allJobs.filter((j) => j._typeKey === "other"),
        };
    }, [allJobs]);

    return {
        fullTime,
        partTime,
        contract,
        other,
        allJobs,
        loading,
        error,
        refetch,
    };
}