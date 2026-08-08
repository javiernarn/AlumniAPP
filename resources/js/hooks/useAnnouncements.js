import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const fetch = async () => {
    const { data } = await axiosConfig.get(`/announcements`);
    return data || null;
};

export default function useAnnouncements() {
    return useQuery(["announcements"], () => fetch(), {
        keepPreviousData: true,
    });
}