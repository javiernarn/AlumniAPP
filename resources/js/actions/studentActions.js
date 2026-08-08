
import { delay } from "~/utils/helper";
import axiosConfig from "~/utils/axiosConfig";

const createStudentAction = async ({ params }) => {
    let formData = new FormData();
    formData.append("email", params?.email);
    formData.append("fname", params?.fname);
    formData.append("lname", params?.lname);
    formData.append("image", params?.image);
    formData.append("lname", params?.lname);
    formData.append("mname", params?.mname);
    formData.append("phone", params?.phone);
    formData.append("student_id", params?.student_id);
    formData.append("college_id", params?.college_id);
    formData.append("department_id", params?.department_id);
    formData.append("id", params?.id || '');
    formData.append("user_id", params?.user_id || '');
    await delay(1000);
    return axiosConfig
        .post(`/students`, formData)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error?.response ? error.response.data.message : ''};
        });
};

const searchStudents = async ({ params }) => {
    return axiosConfig
        .post(`/students`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error?.response ? error.response.data.message : ''};
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

const createThesisTitleAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/students/store-thesis-title`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error?.response ? error.response.data.message : ''};
        });
};



export { createStudentAction, studentList, searchStudents, createThesisTitleAction };
