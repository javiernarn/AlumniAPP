import axiosConfig from "~/utils/axiosConfig";
import { delay } from "~/utils/helper";

let ENDPOINT = "/api";

const createCollegeAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/college`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const studentList = async () => {
    await delay(1000);
    Api.fetchStudentApi(params)
        .then((result) => {
            return result?.data;
        })
        .catch((error) => {});
};

const createDepartmentAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/college/store-department`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const createThesisAction = async ({ params }) => {
    await delay(1000);
   // let formData = new FormData();
    // formData.append("document", params?.document);
    // formData.append("sy_id", params?.sy_id);
    // formData.append("sem_id", params?.sem_id);
    // formData.append("thesis_name", params?.thesis_name);
    return axiosConfig
        .post(`/college/store-thesis`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};






export { createCollegeAction, studentList, createDepartmentAction, createThesisAction };


 