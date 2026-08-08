import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const profile = async () => {
    const { data } = await axiosConfig.get(`/profile`);
    return data || [];
};

export default function useProfile() {
    return useQuery(["profile"], () => profile(), {
        keepPreviousData: true,
    });
}
