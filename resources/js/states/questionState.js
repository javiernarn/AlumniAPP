import create from "zustand";
import { PER_PAGE } from "~/utils/constant";
import { delay } from "~/utils/helper";
import axiosConfig from "~/utils/axiosConfig";

const useQuestionStore = create((set) => ({
    isSubmit: false,
    perPage: PER_PAGE,
    page: 0,
    setPage: (value) => set((state) => ({ page: value })),
    setField: (key, value) => set(() => ({ [key]: value })),
}));

export default useQuestionStore;
