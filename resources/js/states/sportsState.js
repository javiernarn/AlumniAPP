import { create } from "zustand";
import { delay } from "~/utils/helper";
import axiosConfig from "~/utils/axiosConfig";

const useSportsStore = create((set) => ({
    isSubmit: false,
    isClear: false,
    visible: false,
    isClear: false,
    shouldClearForm: false,
    students: [],
    editData: null,
    addSY: false,
    page: 0,
    search: "",
    setField: (key, value) => set(() => ({ [key]: value })),
    createNewSports: async (params) => {
        await delay(1000);
        let formData = new FormData();
        formData.append("name", params?.name);
        formData.append("id", params?.id || null);
        return axiosConfig
            .post("store-sports", formData)
            .then((result) => result)
            .catch((error) => ({
                error: true,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Unknown  error",
            }));
    },
    approveCoach: async (params) => {
        await delay(1000);
        return axiosConfig
            .post("update-coach-status", params)
            .then((result) => result)
            .catch((error) => ({
                error: true,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Unknown error",
            }));
    },
    releasedPayment: async (params) => {
        return axiosConfig
            .post("release-payment", params)
            .then((result) => result)
            .catch((error) => ({
                error: true,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Unknown error",
            }));
    },
    updateBookingStatus: async (params) => {
        return axiosConfig
            .post("update-booking-status", params)
            .then((result) => result)
            .catch((error) => ({
                error: true,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Unknown error",
            }));
    },
}));

export default useSportsStore;
