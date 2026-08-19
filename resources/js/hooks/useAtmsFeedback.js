import { useMutation, useQuery, useQueryClient } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

// ============================================================
// ALUMNI-FACING
// ============================================================

/**
 * Submits a "Give Feedback to ATMS" report. Expects a FormData instance
 * built by the caller (see components/layout/index.js) containing:
 *   type, area, details, page_url, theme, screenshots[] (required, 1-5 files)
 */
export const useSubmitAtmsFeedback = () => {
    const queryClient = useQueryClient();

    return useMutation(
        async (formData) => {
            const { data } = await axiosConfig.post(
                "/atms-feedback",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );
            return data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries("atmsFeedbackReports");
                queryClient.invalidateQueries("atmsFeedbackStatistics");
                queryClient.invalidateQueries("myAtmsFeedbackReports");
            },
        },
    );
};

/** An alumni's own past feedback reports (status tracking). */
export const useMyAtmsFeedbackReports = (filters = {}) => {
    return useQuery(
        ["myAtmsFeedbackReports", filters],
        async () => {
            const { data } = await axiosConfig.get("/atms-feedback/my-reports", {
                params: filters,
            });
            return data;
        },
        { keepPreviousData: true, staleTime: 15000, refetchOnWindowFocus: false },
    );
};

/**
 * A single report the current alumni submitted — used by the "view
 * admin note" modal opened from the notification bell so it shows the
 * live status/note instead of the snapshot baked into the notification.
 */
export const useMyAtmsFeedbackReport = (id) => {
    return useQuery(
        ["myAtmsFeedbackReport", id],
        async () => {
            const { data } = await axiosConfig.get(`/atms-feedback/${id}`);
            return data;
        },
        { enabled: !!id, staleTime: 10000, refetchOnWindowFocus: false },
    );
};

// ============================================================
// ADMIN-FACING
// ============================================================

/** Paginated, filterable list of every alumni feedback report. */
export const useAtmsFeedbackReports = (filters = {}) => {
    return useQuery(
        ["atmsFeedbackReports", filters],
        async () => {
            const { data } = await axiosConfig.get("/admin/atms-feedback", {
                params: filters,
            });
            return data;
        },
        { keepPreviousData: true, staleTime: 10000, refetchOnWindowFocus: false },
    );
};

/** Summary counters for the hero stat tiles on the admin page. */
export const useAtmsFeedbackStatistics = () => {
    return useQuery(
        "atmsFeedbackStatistics",
        async () => {
            const { data } = await axiosConfig.get("/admin/atms-feedback/statistics");
            return data?.data || {};
        },
        { staleTime: 15000, refetchOnWindowFocus: false },
    );
};

/** Admin: change a report's status and/or leave an internal note. */
export const useUpdateAtmsFeedbackStatus = () => {
    const queryClient = useQueryClient();

    return useMutation(
        async ({ id, status, admin_notes }) => {
            const { data } = await axiosConfig.patch(
                `/admin/atms-feedback/${id}/status`,
                { status, admin_notes },
            );
            return data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries("atmsFeedbackReports");
                queryClient.invalidateQueries("atmsFeedbackStatistics");
            },
        },
    );
};

/** Admin: permanently delete a feedback report (and its screenshots). */
export const useDeleteAtmsFeedback = () => {
    const queryClient = useQueryClient();

    return useMutation(
        async (id) => {
            const { data } = await axiosConfig.delete(`/admin/atms-feedback/${id}`);
            return data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries("atmsFeedbackReports");
                queryClient.invalidateQueries("atmsFeedbackStatistics");
            },
        },
    );
};
