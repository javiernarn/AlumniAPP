import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";
import { delay } from "../utils/helper";

const fetch = async (class_id) => {  
    await delay(1000);
    const { data } = await axiosConfig.get(`faculties/classroom-topics/${class_id}`);
    return data || [];
};

export default function useTopics(class_id) {
    return useQuery(["classroom-topic-list",class_id], () => fetch(class_id), {
        keepPreviousData: true,
    });
}
