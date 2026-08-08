import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const collegeList = async () => {
    const { data } = await axiosConfig.get(`/college/college-list`);
    return data?.colleges || [];
};

export default function useCollegeList() {
    return useQuery(["use-college-list"], () => collegeList(), {
        keepPreviousData: true,
    });
}
