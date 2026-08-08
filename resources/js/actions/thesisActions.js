
import { delay } from "~/utils/helper";
import axiosConfig from "~/utils/axiosConfig";

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

const createSYAction = async ({ params }) => {
    await delay(1000);
   // let formData = new FormData();
    // formData.append("document", params?.document);
    // formData.append("sy_id", params?.sy_id);
    // formData.append("sem_id", params?.sem_id);
    // formData.append("thesis_name", params?.thesis_name);
    return axiosConfig
        .post(`}/college/store-SY`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
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

const uploadFileAction = async ({ params }) => {
    await delay(1000);
    let formData = new FormData();
    formData.append("document", params?.document);
    formData.append("id", params?.id);
    formData.append("notes", params?.notes);
    formData.append("isSchedule", params?.isSchedule);
    return axiosConfig
        .post(`/students/update-thesis-doc`, formData)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const createScheduleAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/schedule/create`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const updatePanelAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/faculties/update-panel`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const updateThesisGroupAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/update-thesis-group`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const saveInlineComment = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/thesis/save-inline-comment`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const deleteInlineComment = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/thesis/delete-inline-comment`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const saveScreenRecord = async ({ params }) => { 
    await delay(1000);
    let formData = new FormData();
    formData.append("file", params);
    return axiosConfig
        .post(`/thesis/save-screen-record`, formData)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

export { createThesisAction, createSYAction, createThesisTitleAction, uploadFileAction, createScheduleAction, updatePanelAction, updateThesisGroupAction, saveInlineComment, deleteInlineComment, saveScreenRecord };