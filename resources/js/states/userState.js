// ~/states/userState.js
import { create } from "zustand";
import secureLocalStorage from "react-secure-storage";

export const useUserStore = create((set) => ({
    name: secureLocalStorage.getItem("name") || "User Name",
    email: secureLocalStorage.getItem("email") || "",
    avatar: secureLocalStorage.getItem("avatar") || "",
    role: secureLocalStorage.getItem("userRole") || "user",
    setUser: (user) => {
        if (user.name) secureLocalStorage.setItem("name", user.name);
        if (user.email) secureLocalStorage.setItem("email", user.email);
        if (user.avatar) secureLocalStorage.setItem("avatar", user.avatar);
        if (user.role) secureLocalStorage.setItem("userRole", user.role);
        set({ ...user });
    },
}));
