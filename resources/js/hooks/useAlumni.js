import { useQuery } from "react-query";
import axiosConfig from "../utils/axiosConfig";

const fetch = async () => {  
    const { data } = await axiosConfig.get(`/alumni`);
    return data || null;
};

export default function useAlumni() {
    return useQuery(["alumini"], () => fetch(), {
        keepPreviousData: true,
    });
}
