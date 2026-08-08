import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const fetch = async () => {  
    const { data } = await axiosConfig.get(`/get-courses`);
    return data || null;
};

export default function useCourses() {
    return useQuery(["courses"], () => fetch(), {
        keepPreviousData: true,
    });
}
