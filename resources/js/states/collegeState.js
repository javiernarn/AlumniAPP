import create from "zustand";
import { createCollegeAction, createDepartmentAction, createThesisAction } from "~/actions/collegeActions";
import { PER_PAGE } from '~/utils/constant'

export const useCollegeStore = create((set, get) => ({
    isSubmit: false,
    visible: false,
    visibleDepartment: false,
    visibleThesis: false,
    isClear: false,
    perPage: PER_PAGE,
    students: [],
    editData: null,
    addSY: false,
    page: 0,
    setPage: (value) => set((state) => ({ page: value })),
    setClear: (value) => set((state) => ({ isClear: value })),
    setSubmit: (value) => set((state) => ({ isSubmit: value })),
    setEdit: (value) => set((state) => ({ editData: value })),
    setVisible: (value) => set((state) => ({ visible: value })),
    setVisibleDepartment: (value) => set((state) => ({ visibleDepartment: value })),
    setVisibleThesis: (value) => set((state) => ({ visibleThesis: value })),
    setAddSY: (value) => set((state) => ({ addSY: value })),
    search: '',
    setSearch: (value) => set((state) => ({ search: value })),
    createNewCollege: async (params) => {
        return  await createCollegeAction({ params });
    },
    createNewDepartment: async (params) => {
        return  await createDepartmentAction({ params });
    },
    createNewThesis: async (params) => {
        return  await createThesisAction({ params });
    },
   
}));
