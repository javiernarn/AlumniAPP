import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const fetch = async (classId) => {
    const { data } = await axiosConfig.get(`realtime-notification`);
    return data || [];
};

export default function useRealtimeNotification() {
    return useQuery(["realtime-notications"], () => fetch(), {
        keepPreviousData: true,
        refetchInterval: 15000,
    });
}
