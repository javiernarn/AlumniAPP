import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";


const fetch = async (class_id) => {
    const { data } = await axiosConfig.get(`quizzes-result/`);
    return data || [];
};

export default function useQuizResult() {
    return useQuery(["quiz-list-result"], () => fetch(), {
        keepPreviousData: true,
    });
}
