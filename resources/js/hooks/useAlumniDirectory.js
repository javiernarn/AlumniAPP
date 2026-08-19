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
        enabled: options.enabled ?? true,
        ...options,
    });
}
