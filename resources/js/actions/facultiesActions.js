import axiosConfig from "~/utils/axiosConfig";
import { delay } from "~/utils/helper";

let ENDPOINT = "/api";


const createFacultiesAction = async ({ params }) => {
    let formData = new FormData();
    formData.append("email", params?.email);
    formData.append("fname", params?.fname);
    formData.append("lname", params?.lname);
    formData.append("image", params?.image);
    formData.append("lname", params?.lname);
    formData.append("mname", params?.mname);
    formData.append("phone", params?.phone);
    formData.append("password", params?.password);
    // formData.append("college_id", params?.college_id);
    // formData.append("department_id", params?.department_id);
    formData.append("id", params?.id || '');
    formData.append("user_id", params?.user_id || '');
    await delay(1000);
    return axiosConfig
        .post(`/faculties`, formData)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error?.response ? error.response.data.message : ''};
        });
};

const uploadFileAction = async ({ params }) => {
    await delay(1000);
    let formData = new FormData();
    formData.append("document", params?.document);
    formData.append("id", params?.id);
    return axiosConfig
        .post(`/faculties/update-thesis-doc`, formData)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const updateGroupAction = async ({ params }) => {
    await delay(1000);
    return axios
        .post(`${ENDPOINT}/faculties/update-group`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const storeCommentsAction = async ( {params} ) => {
    await delay(1000);
   // let formData = new FormData();
    // formData.append("document", params?.document);
    // formData.append("sy_id", params?.sy_id);
    // formData.append("sem_id", params?.sem_id);
    // formData.append("thesis_name", params?.thesis_name);
    return axiosConfig
        .post(`/faculties/store-comments`, params )
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const storeCommentsHiglightsActions = async ({ comment }) => {
    await delay(1000);
    return axiosConfig
        .get(`/faculties/store-comments?comment=` + comment )
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const addRatingConceptPaperAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/faculties/store-concept-paper-rating`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error?.response ? error.response.data.message : ''};
        });
};

export { createFacultiesAction, uploadFileAction, updateGroupAction ,storeCommentsAction,storeCommentsHiglightsActions,addRatingConceptPaperAction};
