import { useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

const getData = async () => {
    const { data } = await axiosConfig.get("/get-booking-");
    return data;
};

export default function useWithdrawal() {
    return useQuery(["withdrawal"], () => getData(), {
        keepPreviousData: true,
    });
}
