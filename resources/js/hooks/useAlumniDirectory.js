import { useQuery } from "react-query";
import axiosConfig from "../utils/axiosConfig";

const fetch = async () => {
    const { data } = await axiosConfig.get(`/alumni/directory`);
    // Paginated, resource-wrapped response: { data: [...], links, meta }.
    // Unwrap it here so consumers get a plain array, same as useAlumni.
    return data?.data ?? [];
};

// GET /alumni/directory is the alumni-facing counterpart to useAlumni()'s
// GET /alumni: any authenticated user can call it, and it returns a
// minimized, public-safe subset of approved alumni (see
// AlumniDirectoryResource on the backend) instead of the full admin
// record set.
export default function useAlumniDirectory(options = {}) {
    return useQuery(["alumni-directory"], () => fetch(), {
        keepPreviousData: true,
        // Phase 4 (audit §2/§3): see useAlumni.js for the reasoning —
        // same explicit staleTime instead of relying on the global
        // 5-minute default, and this is the other query key the Phase 1
        // online-status poll merges deltas into (the alumni-facing
        // directory view in AlumniList.js).
        staleTime: 30000,
        enabled: options.enabled ?? true,
        ...options,
    });
}
