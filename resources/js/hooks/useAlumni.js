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
        // GET /alumni is role:admin-gated on the backend. Callers that
        // render for both admins and alumni (e.g. the shared /home page)
        // must pass { enabled: isAdmin } or every alumni visiting that
        // page will fire this request and get a 403.
        enabled: options.enabled ?? true,
        ...options,
    });
}