import axios from "axios";
import { getCookie } from "./helper";

let Api = "/api/";

export default class API {
    static login(parameters = {}) {
        let email = parameters.email;
        let password = parameters.password;
        return axios({
            method: "post",
            url: Api + "login",
            data: {
                email: email,
                password: password,
            },
        });
    }

    static createStudentApi(parameters = {}) {
        return axios({
            method: "post",
            url: Api + "students",
            data: parameters,
            headers: {
                Authorization: `Bearer  ${access_token}`,
            },
        });
    }

    static fetchStudentApi(parameters = {}) {
        return axios({
            method: "get",
            url: Api + "students",
            headers: {
                Authorization: `Bearer  ${access_token}`,
            },
        });
    }
}
