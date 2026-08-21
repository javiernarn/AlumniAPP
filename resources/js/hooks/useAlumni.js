import { useQuery } from "react-query";
import axiosConfig from "../utils/axiosConfig";

const fetch = async () => {
    const { data } = await axiosConfig.get(`/alumni`);
    // Phase 5 hardening changed GET /alumni to a paginated,
    // resource-wrapped response: { data: [...], links, meta }
    // instead of a bare array. Unwrap it here so consumers of
    // this hook keep getting a plain array as before.
    return data?.data ?? [];
};

export default function useAlumni(options = {}) {
    return useQuery(["alumini"], () => fetch(), {
        keepPreviousData: true,
        // Phase 4 (audit §2/§3): explicit staleTime instead of silently
        // relying on the 5-minute global default in Main.js — makes the
        // intent visible here and stops this from quietly changing
        // behavior if someone bumps the global default later. 30s
        // matches the plan's suggested 30-60s range for hot admin/alumni
        // list queries; this is also the query the Phase 1 online-status
        // poll merges live is_online/last_active deltas into via
        // queryClient.setQueryData (AlumniList.js), so a fairly short
        // staleTime keeps the rest of the row data reasonably fresh too.
        staleTime: 30000,
        // GET /alumni is role:admin-gated on the backend. Callers that
        // render for both admins and alumni (e.g. the shared /home page)
        // must pass { enabled: isAdmin } or every alumni visiting that
        // page will fire this request and get a 403.
        enabled: options.enabled ?? true,
        ...options,
    });
}