import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";


const fetch = async (type) => {
    const { data } = await axiosConfig.get(`answer-quizzes?type=${type}`);
    return data || [];
};

export default function useTakeQuiz(type) {
    return useQuery(["quiz-list",type], () => fetch(type), {
        keepPreviousData: true,
    });
}
