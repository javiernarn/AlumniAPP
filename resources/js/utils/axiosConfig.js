// import { message, Modal } from "antd";
// import axios from "axios";
// import secureLocalStorage from "react-secure-storage";
// import { useLoadingStore } from "~/states/loadingState";
// import { BASE_URL } from "./constant";

// const instance = axios.create({
//     baseURL: BASE_URL + "api/",
// });

// // Track if a modal is already open
// let isModalOpen = false;
// let currentModal = null;

// // // Add request interceptor for loading effects
// // instance.interceptors.request.use(
// //     (config) => {
// //         const loadingStore = useLoadingStore.getState();
// //         // Prevent crash if function doesn't exist
// //         loadingStore?.showLoading?.();
// //         return config;
// //     },
// //     (error) => {
// //         const loadingStore = useLoadingStore.getState();
// //         loadingStore?.hideLoading?.();
// //         return Promise.reject(error);
// //     }
// // );
// // =========================================
// // GET CURRENT THEME
// // =========================================
// const getThemeClass = (darkClass, lightClass) => {
//     const currentTheme =
//         secureLocalStorage.getItem("app-theme") || "white";

//     return currentTheme === "black"
//         ? darkClass
//         : lightClass;
// };

// // =========================================
// // RESPONSE INTERCEPTOR
// // =========================================
// instance.interceptors.response.use(
//     (response) => {
//         const loadingStore = useLoadingStore.getState();

//         // 🔕 SILENT REQUEST → NO LOADING
//         if (!response.config?.silent) {
//             loadingStore?.hideLoading?.();
//         }

//         return response;
//     },

//     (error) => {
//         const loadingStore = useLoadingStore.getState();

//         // 🔕 SILENT REQUEST → NO LOADING
//         if (!error.config?.silent) {
//             loadingStore?.hideLoading?.();
//         }

//         const statusCode =
//             error.response?.status || null;

//         // =========================================
//         // SESSION EXPIRED
//         // =========================================
//         if (statusCode === 401) {
//             window.location.href =
//                 `/login?type=session-expired&link=${window.location.href}`;

//             return Promise.reject(error);
//         }

//         // =========================================
//         // SILENT REQUEST
//         // =========================================
//         if (error.config?.silent) {
//             return Promise.reject(error);
//         }

//         // =========================================
//         // VALIDATION ERRORS (422)
//         // =========================================
//         if (statusCode === 422) {
//             let validationMessage =
//                 "Validation error.";

//             if (error.response?.data?.errors) {
//                 validationMessage = Object.values(
//                     error.response.data.errors
//                 )
//                     .flat()
//                     .join("\n");
//             }

//             message.error({
//                 content: validationMessage,
//                 duration: 5,

//                 className: getThemeClass(
//                     "dark-theme-message",
//                     "light-theme-message"
//                 ),
//             });

//             return Promise.reject(error);
//         }

//         // =========================================
//         // OTHER BACKEND ERRORS
//         // =========================================
//      let errorMessage = "Your Laravel isn't running.";

// if (error.response?.data?.message) {
//     errorMessage = error.response.data.message;
// }

// message.error({
//     content: errorMessage,
//     duration: 5,
//     className: getThemeClass(
//         "dark-theme-message",
//         "light-theme-message"
//     ),
// });
//         // =========================================
//         // SINGLE MODAL INSTANCE
//         // =========================================
//         if (isModalOpen && currentModal) {
//             currentModal.update({
//                 title: `Error: ${statusCode}`,
//                 content: errorMessage,
//             });
//         } else {
//             currentModal = Modal.error({
//                 title: `Error: ${statusCode}`,
//                 content: errorMessage,

//                 className: getThemeClass(
//                     "dark-theme-modal",
//                     "light-theme-modal"
//                 ),

//                 onOk: () => {
//                     isModalOpen = false;
//                     currentModal = null;
//                 },

//                 onCancel: () => {
//                     isModalOpen = false;
//                     currentModal = null;
//                 },
//             });

//             isModalOpen = true;
//         }

//         return Promise.reject(error);
//     }
// );


// // Set auth token
// const updateAuthToken = () => {
//     const access_token = secureLocalStorage.getItem("access_token");

//     if (access_token) {
//         instance.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
//     }
// };

// // Initialize auth token
// updateAuthToken();

// // Optional: Add a method to refresh token when needed
// export const refreshAuthToken = (newToken) => {
//     secureLocalStorage.setItem("access_token", newToken);
//     updateAuthToken();
// };

// export default instance;
import { message, Modal } from "antd";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { useLoadingStore } from "~/states/loadingState";
import { BASE_URL } from "./constant";

// =========================================
// AXIOS INSTANCE
// =========================================
const instance = axios.create({
    baseURL: BASE_URL + "api/",

// fail fast instead of hanging behind slow/queued requests (e.g. concurrent image downloads)
    // timeout: 15000,
});

// =========================================
// THEME HELPER
// =========================================
// This module runs outside React (it's a plain axios instance), so it
// can't call the useAppTheme() hook directly. Previously it had its own
// mini implementation that read secureLocalStorage["app-theme"] and
// fell back to "default" — a value useAppTheme() never actually writes
// (it only ever writes "white" or "black"), so that fallback branch was
// dead logic and this could drift out of sync with the real theme.
//
// Mirrors useAppTheme.js's getInitialTheme() priority exactly instead,
// using the SAME keys/values it reads and writes:
//   1. atms-theme cookie   (fastest source, also used for SSR paint)
//   2. secureLocalStorage["app-theme"]
//   3. OS color-scheme preference
//   4. "white"
const THEME_STORAGE_KEY = "app-theme";
const THEME_COOKIE_KEY = "atms-theme";

const readThemeCookie = () => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(
        new RegExp("(?:^|; )" + THEME_COOKIE_KEY + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
};

const getCurrentTheme = () => {
    const fromCookie = readThemeCookie();
    if (fromCookie === "black" || fromCookie === "white") return fromCookie;

    try {
        const fromSecure = secureLocalStorage.getItem(THEME_STORAGE_KEY);
        if (fromSecure === "black" || fromSecure === "white") {
            return fromSecure;
        }
    } catch (e) {
        // ignore transient decrypt errors, fall through to OS preference
    }

    if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
        return "black";
    }

    return "white";
};

const getThemeClass = (darkClass, lightClass) =>
    getCurrentTheme() === "black" ? darkClass : lightClass;

// =========================================
// SINGLE ERROR MODAL INSTANCE
// =========================================
// Prevents multiple Modal.error() dialogs from stacking on top of each
// other when several requests fail around the same time (e.g. a slow
// backend causing a batch of polling requests to time out together).
// Instead of opening a new modal per failure, later errors update the
// modal that's already open.
let activeErrorModal = null;

const showErrorModal = (title, content, className) => {
    if (activeErrorModal) {
        activeErrorModal.update({ title, content });
        return;
    }

    activeErrorModal = Modal.error({
        title,
        content,
        className,
        onOk: () => {
            activeErrorModal = null;
        },
        onCancel: () => {
            activeErrorModal = null;
        },
    });
};

// =========================================
// RESPONSE INTERCEPTOR
// =========================================
instance.interceptors.response.use(
    (response) => {
        const loadingStore = useLoadingStore.getState();

        if (!response.config?.silent) {
            loadingStore?.hideLoading?.();
        }

        return response;
    },

    (error) => {
        const loadingStore = useLoadingStore.getState();

        if (!error.config?.silent) {
            loadingStore?.hideLoading?.();
        }

        const statusCode = error.response?.status || null;

        // =========================================
        // SILENT REQUEST
        // =========================================
        // Checked BEFORE the 401 redirect below, since a silent request
        // (e.g. anonymous/public-page data fetches that may legitimately
        // get a 401 when there's no session) should never yank the user
        // to the login screen.
        if (error.config?.silent) {
            return Promise.reject(error);
        }

        // =========================================
        // SESSION EXPIRED (401)
        // =========================================
        // `skipAuthRedirect` lets public/unauthenticated pages (e.g.
        // PublicHomePage) call protected-looking endpoints without being
        // bounced to /login?type=session-expired when there was never a
        // real session to expire in the first place.
        if (statusCode === 401 && !error.config?.skipAuthRedirect) {
            window.location.href = `/login?type=session-expired&link=${window.location.href}`;
            return Promise.reject(error);
        }

        // =========================================
        // VALIDATION ERROR (422)
        // =========================================
        if (statusCode === 422) {
            let validationMessage = "Validation error.";

            if (error.response?.data?.errors) {
                validationMessage = Object.values(
                    error.response.data.errors
                )
                    .flat()
                    .join("\n");
            }

            showErrorModal(
                "Validation Error",
                validationMessage,
                getThemeClass("dark-theme-modal", "light-theme-modal")
            );

            return Promise.reject(error);
        }

        // =========================================
        // OTHER ERRORS
        // =========================================
        let errorMessage;

        if (error.code === "ECONNABORTED") {
            // Our own timeout fired (see `timeout: 15000` above) — the
            // request took too long, not necessarily that the backend is down.
            errorMessage = "The request timed out. Please try again.";
        } else if (!error.response) {
            // Request never got a response at all (network drop, CORS block,
            // connection refused, etc.) — this is the only case where it's
            // fair to suggest the backend itself might be unreachable.
            errorMessage =
                "Could not reach the server. Please check your connection and try again.";
        } else {
            errorMessage =
                error.response?.data?.message ||
                "An unexpected error occurred.";
        }

        showErrorModal(
            `Error ${statusCode || ""}`,
            errorMessage,
            getThemeClass("dark-theme-modal", "light-theme-modal")
        );

        return Promise.reject(error);
    }
);

// =========================================
// AUTH TOKEN HANDLER
// =========================================
const updateAuthToken = () => {
    const access_token = secureLocalStorage.getItem("access_token");

    if (access_token) {
        instance.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${access_token}`;
    }
};

// initialize token
updateAuthToken();

// =========================================
// REFRESH TOKEN EXPORT
// =========================================
export const refreshAuthToken = (newToken) => {
    secureLocalStorage.setItem("access_token", newToken);
    updateAuthToken();
};

// =========================================
// EXPORT INSTANCE
// =========================================
export default instance;