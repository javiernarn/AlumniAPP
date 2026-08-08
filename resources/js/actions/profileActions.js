import axiosConfig from "~/utils/axiosConfig";
import { delay } from "~/utils/helper";

let ENDPOINT = "/api";

const editPersonalDetailsAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/edit-personal-details`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const editSkillsAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/edit-skills`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};
const updateProfileAction = async ({ params }) => {
    await delay(1000);
    let formData = new FormData();
    formData.append("image", params?.image);
    return axiosConfig
        .post(`/update-profile`, formData)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const editPrimaryDetailsAction = async ({ params }) => {
    await delay(1000);
    let formData = new FormData();
    formData.append("image", params?.image);
    formData.append("id", params?.id);
    formData.append("user_id", params?.user_id);
    return axiosConfig
        .post(`/update-profile`, formData)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const editAboutAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/edit-about`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

const editPasswordAction = async ({ params }) => {
    await delay(1000);
    return axiosConfig
        .post(`/edit-password`, params)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return {'error' : true, 'message' : error};
        });
};

export { editPersonalDetailsAction, editSkillsAction,updateProfileAction, editPrimaryDetailsAction, editAboutAction, editPasswordAction };


// let formData = new FormData();
// formData.append("profile", params?.document);
// formData.append("id", params?.id);
// formData.append("notes", params?.notes);
// formData.append("isSchedule", params?.isSchedule);
// return axiosConfig
//     .post(`/students/update-thesis-doc`, formData)
//     .then((result) => {
//         return result;
//     })
//     .catch((error) => {
//         return {'error' : true, 'message' : error};
//     });