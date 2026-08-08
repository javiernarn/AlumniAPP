import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const fetch = async () => {  
    const { data } = await axiosConfig.get(`/get-employee-status`);
    return data || null;
};

export default function useEmployeeStatus() {
    return useQuery(["employee-statuses"], () => fetch(), {
        keepPreviousData: true,
    });
}
