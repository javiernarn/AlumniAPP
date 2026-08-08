import Api from "../utils/api";
import { delay } from "~/utils/helper";

let ENDPOINT = "/api";

const createEmployeeAction = async ({ params }) => {
    await delay(1000);
    return axios
        .post(`${ENDPOINT}/employees`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const employeeList = async () => {
    await delay(1000);
    Api.fetchEmployeeApi(params)
        .then((result) => {
            return result?.data;
        })
        .catch((error) => {});
};

export { createEmployeeAction, employeeList };