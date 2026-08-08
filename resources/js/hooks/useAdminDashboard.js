import { useQuery } from "react-query";
import axiosConfig from "../utils/axiosConfig";

const fetch = async (year) => {  
    const { data } = await axiosConfig.get(`/admin-dashboard?year=${year}`);
    return data || null;
};

export default function useAdminDashboard(year) {
    
    return useQuery(["admin-dashboard",year], () => fetch(year), {
        keepPreviousData: true,
    });
}
