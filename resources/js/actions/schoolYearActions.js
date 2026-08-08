import axiosConfig from "~/utils/axiosConfig";
import { delay } from "~/utils/helper";

const createSYAction = async ({ params }) => {
    await delay(1000);
    const res = await axiosConfig
        .post(`/college/store-SY`, params)
        .catch((error) => {
            return { error: true, message: error };
        });
    return res;
};

export { createSYAction };
