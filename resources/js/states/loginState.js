import create from "zustand";
import { checkLogin } from "~/actions/loginActions";

export const useLoginStore = create((set, get) => ({
    isSubmit: false,
    error: null,
    setError: (value) => set((state) => ({ error: value })),
    setSubmit: (value) => set((state) => ({ isSubmit: value })),
    checkLogin: (params) => {
        checkLogin({ params, set, get });
    },
}));
