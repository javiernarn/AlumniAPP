import { notification } from "antd";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { useLoadingStore } from "~/states/loadingState";
import { BASE_URL } from "./constant";

// =========================================
// AXIOS INSTANCE
// =========================================
const instance = axios.create({
    baseURL: BASE_URL + "api/",
    // Phase 6: browser now authenticates via an HttpOnly auth_token
    // cookie (set by the backend on login) instead of a bearer token
    // this JS ever reads or attaches itself — withCredentials makes
    // axios include that cookie automatically on every request.
    withCredentials: true,
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
// ERROR TOAST (antd notification)
// =========================================
// Every failed request that reaches this point is surfaced as a small,
// auto-dismissing toast in the corner of the screen instead of a blocking
// Modal.error() dialog. Each HTTP status gets its own clear title +
// description so alumni, admins, and department heads can tell at a
// glance *what* went wrong (permissions? bad input? server down?) rather
// than a bare "Error" with no context.
//
// A stable `key` per status code means if several requests fail with the
// same kind of error around the same time (e.g. a batch of polling calls
// during an outage), later failures update the existing toast in place
// instead of stacking duplicates on top of each other.
const showErrorToast = ({ key, message: title, description, statusCode }) => {
    notification.error({
        key,
        message: title,
        description,
        placement: "topRight",
        duration: statusCode && statusCode >= 500 ? 6 : 4.5,
        className: getThemeClass(
            "dark-theme-notification",
            "light-theme-notification"
        ),
    });
};

// Maps a status code (or connection failure) to a specific { title, description }
// pair. Falls back to the backend-provided message when we have one, since
// that's usually more precise than any generic copy we could write here.
const describeError = (error, statusCode) => {
    const backendMessage = error.response?.data?.message;

    if (error.code === "ECONNABORTED") {
        // A timeout fired — either a per-request `timeout` option set at
        // the call site, or the browser's own network timeout. Not
        // necessarily a sign the backend is down.
        return {
            title: "Request Timed Out",
            description:
                backendMessage ||
                "That took too long to respond. Please try again.",
        };
    }

    if (!error.response) {
        // Request never got a response at all (network drop, CORS block,
        // connection refused, etc.) — the only case where it's fair to
        // suggest the server itself might be unreachable.
        return {
            title: "Connection Problem",
            description:
                "Could not reach the server. Please check your internet connection and try again.",
        };
    }

    switch (statusCode) {
        case 400:
            return {
                title: "Invalid Request",
                description:
                    backendMessage ||
                    "That request couldn't be processed. Please check your input and try again.",
            };
        case 403:
            return {
                title: "Access Denied",
                description:
                    backendMessage ||
                    "You don't have permission to perform this action.",
            };
        case 404:
            return {
                title: "Not Found",
                description:
                    backendMessage ||
                    "The item you're looking for couldn't be found. It may have been moved or deleted.",
            };
        case 409:
            return {
                title: "Conflict",
                description:
                    backendMessage ||
                    "This action conflicts with existing data. Please refresh and try again.",
            };
        case 419:
            return {
                title: "Session Expired",
                description:
                    "Your session has expired for security reasons. Please refresh the page and try again.",
            };
        case 429:
            return {
                title: "Too Many Requests",
                description:
                    backendMessage ||
                    "You're doing that a bit too fast. Please wait a moment and try again.",
            };
        case 502:
        case 503:
        case 504:
            return {
                title: "Service Unavailable",
                description:
                    backendMessage ||
                    "The server is temporarily unavailable. Please try again in a few minutes.",
            };
        default:
            if (statusCode >= 500) {
                return {
                    title: "Server Error",
                    description:
                        backendMessage ||
                        "Something went wrong on our end. Please try again, and contact support if it keeps happening.",
                };
            }
            return {
                title: `Error${statusCode ? ` ${statusCode}` : ""}`,
                description:
                    backendMessage || "An unexpected error occurred.",
            };
    }
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
            let validationMessage = "Please check the highlighted fields and try again.";

            if (error.response?.data?.errors) {
                validationMessage = Object.values(
                    error.response.data.errors
                )
                    .flat()
                    .join("\n");
            } else if (error.response?.data?.message) {
                validationMessage = error.response.data.message;
            }

            if (!error.config?.suppressGenericModal) {
                showErrorToast({
                    key: "http-error-422",
                    message: "Please Check Your Input",
                    description: validationMessage,
                    statusCode,
                });
            }

            return Promise.reject(error);
        }

        // =========================================
        // OTHER ERRORS
        // =========================================
        // `suppressGenericModal` lets a call site that already shows its
        // own specific, contextual toast (naming exactly what failed, a
        // graceful timeout recovery, etc.) opt out of this generic toast
        // so the user isn't shown two different error messages for the
        // same failure. Unlike `silent`, this still goes through the
        // 401/422 handling above — it only skips the generic catch-all
        // below.
        if (error.config?.suppressGenericModal) {
            return Promise.reject(error);
        }

        const { title, description } = describeError(error, statusCode);

        showErrorToast({
            key: `http-error-${statusCode || "network"}`,
            message: title,
            description,
            statusCode,
        });

        return Promise.reject(error);
    }
);

// =========================================
// AUTH TOKEN HANDLER
// =========================================
// Phase 6: the browser no longer stores or attaches the bearer token at
// all — it's an HttpOnly cookie the browser sends automatically (see
// `withCredentials: true` above) and JavaScript can never read. This
// used to read secureLocalStorage["access_token"] and manually build an
// `Authorization: Bearer <token>` header; both functions are now no-ops
// kept only so any remaining call sites (if a rebuild/deploy step
// missed one) fail safely instead of throwing on an undefined import.
const updateAuthToken = () => {};

// initialize token
updateAuthToken();

// =========================================
// REFRESH TOKEN EXPORT
// =========================================
// Deprecated no-op — the concept of a client-visible token to "refresh"
// no longer applies. Kept as a stub for backward compatibility with any
// call site not yet updated; does nothing.
export const refreshAuthToken = () => {};

// =========================================
// EXPORT INSTANCE
// =========================================
export default instance;