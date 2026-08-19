import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

// Fetches a paginated, filterable page of audit log entries.
// filters: { search, role, action, date_from, date_to, page, per_page }
export const useAuditLogs = (filters = {}) => {
    return useQuery(
        ["auditLogs", filters],
        async () => {
            const response = await axiosConfig.get("/audit-logs", {
                params: filters,
            });
            return response.data;
        },
        {
            keepPreviousData: true,
            staleTime: 15000,
            refetchOnWindowFocus: false,
        },
    );
};

export const useAuditLogSummary = () => {
    return useQuery(
        "auditLogSummary",
        async () => {
            const response = await axiosConfig.get("/audit-logs/summary");
            return response.data?.data || {};
        },
        {
            staleTime: 30000,
            refetchOnWindowFocus: false,
        },
    );
};
