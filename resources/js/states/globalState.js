import { create } from "zustand";

const useGlobalStore = create((set) => ({
  studentProfile: false,
  setField: (key, value) => set(() => ({ [key]: value })),
}));

export default useGlobalStore;
