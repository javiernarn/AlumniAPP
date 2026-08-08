import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const fetch = async () => {  
    const { data } = await axiosConfig.get(`/events`);
    return data || null;
};

export default function useEvents() {
    return useQuery(["events"], () => fetch(), {
        keepPreviousData: true,
    });
}

