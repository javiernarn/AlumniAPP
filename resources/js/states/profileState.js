import create from "zustand";
import { editPersonalDetailsAction, editSkillsAction, editPrimaryDetailsAction,editAboutAction, editPasswordAction} from "~/actions/profileActions";
import { PER_PAGE } from '~/utils/constant'

export const useProfileStore = create((set, get) => ({
    visiblePersonalDetails: false,
    setVisiblePersonalDetails: (value) => set((state) => ({ visiblePersonalDetails: value })),
    visibleSkills: false,
    setVisibleSkills: (value) => set((state) => ({ visibleSkills: value })),
    editData:null,
    setEdit: (value) => set((state) => ({editData: value })),
    isClear: false,
    setClear: (value) => set((state) => ({ isClear: value })),
    isClear2: false,
    setClear2: (value) => set((state) => ({ isClear: value })),
    isSubmit: false,
    setSubmit: (value) => set((state) => ({ isSubmit: value })),
    isSubmit2: false,
    setSubmit2: (value) => set((state) => ({ isSubmit2: value })),
    visibleAbout: false,
    setVisibleAbout: (value) => set((state) => ({ visibleAbout: value })),
    visiblePrimaryDetails: false,
    setVisiblePrimaryDetails: (value) => set((state) => ({ visiblePrimaryDetails: value })),
    image:null,
    visiblePassword:false,
    setVisiblePassword: (value) => set((state) => ({ visiblePassword: value })),
    setImage: (value) => set((state) => ({ image: value })),
    editPersonalDetails: async (params) => {
        return  await editPersonalDetailsAction({ params });
    },
    editSkills: async (params) => {
        return  await editSkillsAction({ params });
    },
    editPrimaryDetails: async (params) => {
        return  await editPrimaryDetailsAction({ params });
    },
    editAbout: async (params) => {
        return  await editAboutAction({ params });
    },
    editPassword: async (params) => {
        return  await editPasswordAction({ params });
    },
    // createNewDepartment: async (params) => {
    //     return  await createDepartmentAction({ params });
    // },
    // createNewThesis: async (params) => {
    //     return  await createThesisAction({ params });
    // },
   
}));
