import { useQuery } from "react-query";
import axiosConfig from "../utils/axiosConfig";
import dayjs from "dayjs";
const fetchData = async () => {  
    const { status, data } = await axiosConfig.get(`employees`);
    if (status !== 200) {
        throw new Error("Error found.");
    }
    return data || [];
};

function useEmployee() {
    return useQuery({
        queryKey: ["employees"],
        queryFn: () => fetchData(),
        keepPreviousData: true
    });
}

export default useEmployee;
