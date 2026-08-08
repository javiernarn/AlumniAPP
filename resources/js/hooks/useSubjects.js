import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";
import { delay } from "../utils/helper";

const fetch = async () => {  
    await delay(1000);
    const { data } = await axiosConfig.get(`subjects`);
    return data || [];
};

export default function useSubjects() {
    return useQuery(["subject-list"], () => fetch(), {
        keepPreviousData: true,
    });
}
