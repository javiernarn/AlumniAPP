import axiosConfig from "~/utils/axiosConfig";
import { delay } from "~/utils/helper";

const createGroupAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/groups`, params)
        .then((result) => {  console.log(result?.data)
            return result;
        })
        .catch((error) => {
            return {
                error: true,
                message: error?.response ? error.response.data.message : "",
            };
        });
};

const createGroupAccountAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/groups/create-account`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {
                error: true,
                message: error?.response ? error.response.data.message : "",
            };
        });
};

export { createGroupAction, createGroupAccountAction };
