import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";


const fetch = async (class_id) => {
    const { data } = await axiosConfig.get(`quizzes/`);
    return data || [];
};

export default function useQuiz() {
    return useQuery(["quiz-list"], () => fetch(), {
        keepPreviousData: true,
    });
}
