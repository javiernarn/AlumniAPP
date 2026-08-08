import axiosConfig from "~/utils/axiosConfig";
import { delay } from "~/utils/helper";

const createDepartmentAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/department/store-department`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};


export {  createDepartmentAction };


 