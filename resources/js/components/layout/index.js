"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    GroupOutlined,
    UserOutlined,
    CalendarOutlined,
    DashboardOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    TeamOutlined,
    BellOutlined,
    EyeInvisibleOutlined,
    MailOutlined,
    QuestionCircleOutlined,
    DeleteOutlined,
    CheckOutlined,
    SettingOutlined,
    SoundOutlined,
    ReloadOutlined,
    EyeOutlined,
    EditOutlined,
    ArrowLeftOutlined,
    CloseOutlined,
    UploadOutlined,
    PaperClipOutlined,
    LoginOutlined,
    SafetyCertificateOutlined,
    FormOutlined,
    WarningOutlined,
    AppstoreOutlined,
    UserAddOutlined,
    IdcardOutlined,
    MessageOutlined,
    MoonOutlined,
    SunOutlined,
    SolutionOutlined,
    InfoCircleOutlined,
    CommentOutlined,
    CustomerServiceOutlined,
    WechatOutlined,
    BookOutlined,
    IssuesCloseOutlined,
    ExclamationOutlined,
    BoxPlotOutlined,
    BugOutlined,
    HomeOutlined,
    DownOutlined,
    NotificationOutlined,
    ReadOutlined,
    FileSearchOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    StopOutlined,
    BulbOutlined,
} from "@ant-design/icons";
import {
    Layout,
    Menu,
    Tooltip,
    Avatar,
    Dropdown,
    Row,
    Col,
    Drawer,
    Button,
    List,
    Badge,
    Spin,
    Typography,
    Space,
    message,
    Modal,
    Switch,
    Pagination,
    Empty,
    Popconfirm,
    Image,
    Tag,
    Select,
    Input,
    Upload,
} from "antd";
import { Link, useLocation } from "react-router-dom";
import logoMini from "../../assets/images/site-logo.png";
import { setCookie } from "~/utils/helper";
import secureLocalStorage from "react-secure-storage";
import { useAppTheme } from "~/hooks/useAppTheme";
import { useQueryClient } from "react-query";
import useProfile from "~/hooks/useProfile";
import { useHistory } from "react-router-dom";
import axiosConfig from "~/utils/axiosConfig";
import { BASE_URL } from "~/utils/constant";
import { useSubmitAtmsFeedback } from "~/hooks/useAtmsFeedback";
import "./index.css";
import { AlumniDetails } from "~/components";
import avatarGuidance from "~/assets/images/avatar_guidance.png";
import avatarBSIT from "~/assets/images/bsit-logo.jpg";
import avatarBSED from "~/assets/images/educ-logo.png";
import avatarBEED from "~/assets/images/beed-logo.png";
import avatarBSBA from "~/assets/images/bsba-logo.png";
import LegalModals from "./LegalModals";

const { Header, Sider, Content, Footer } = Layout;
const { Text, Title } = Typography;

const MENU_ADMIN = [
    {
    key: 10,
    url: "/home",
    label: "Home",
    icon: <HomeOutlined className="menu-icon" />,
},
    {
        key: 15,
        url: "/admin-dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined className="menu-icon" />,
    },
    {
        key: 120,
        url: "/alumni",
        label: "Alumni",
        icon: <TeamOutlined className="menu-icon" />,
    },
    {
        key: 121,
        url: "/events",
        label: "Events",
        icon: <CalendarOutlined className="menu-icon" />,
    },
     {
        key: 122,
        url: "/announcements",
        label: "Announcements",
        icon: <NotificationOutlined className="menu-icon" />,
    },
    //  {
    //     key: 123,
    //     url: "/402",
    //     label: "E-Newsletter",
    //     icon: <ReadOutlined className="menu-icon" />,
    // },
    {
        key: 124,
        url: "/questions",
        label: "Questions",
        icon: <QuestionCircleOutlined className="menu-icon" />,
    },
    {
        key: 125,
        url: "/department-heads",
        label: "Create D.H.A",
        icon: <UserAddOutlined className="menu-icon" />,
    },
    {
        key: 126,
        url: "/messages",
        label: "Messages",
        icon: <MessageOutlined className="menu-icon" />,
    },
    {
        key: 127,
        url: "/job-posts",
        label: "Job Posts",
        icon: <SolutionOutlined className="menu-icon" />,
    },
    {
        key: 128,
        url: "/audit-logs",
        label: "Audit Log",
        icon: <FileSearchOutlined className="menu-icon" />,
    },
    {
        key: 129,
        url: "/feedback-reports",
        label: "Feedback Reports",
        icon: <CommentOutlined className="menu-icon" />,
    },
];

const MENU_ALUMNI = [
      {
    key: 10,
    url: "/home",
    label: "Home",
    icon: <HomeOutlined className="menu-icon" />,
},
        {
        key: 120,
        url: "/alumni",
        label: "Alumni",
        icon: <GroupOutlined className="menu-icon" />,
    },
    {
        key: 121,
        url: "/events",
        label: "Events",
        icon: <CalendarOutlined className="menu-icon" />,
    },
     {
        key: 122,
        url: "/announcements",
        label: "Announcements",
        icon: <NotificationOutlined className="menu-icon" />,
    },
    //   {
    //     key: 123,
    //     url: "/402",
    //     label: "E-Newsletter",
    //     icon: <ReadOutlined className="menu-icon" />,
    // },
    {
        key: 124,
        url: "/messages",
        label: "Messages",
        icon: <MessageOutlined className="menu-icon" />,
    },
    {
        key: 125,
        url: "/job-posts",
        label: "Job Posts",
        icon: <SolutionOutlined className="menu-icon" />,
    },
];

const MENU_DEPARTMENT_HEAD = [
    {
        key: 15,
        url: "/department-dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined className="menu-icon" />,
    },
];

const NOTIFICATION_CATEGORIES = {
    all: {
        label: "All",
        icon: <AppstoreOutlined />,
        color: "#1890ff",
        types: [],
    },
    event_registration: {
        label: "Event Registered",
        icon: <CalendarOutlined />,
        color: "#52c41a",
        // "event_registration_success" is the copy sent back to the
        // alumni who just registered (EventController@register) — same
        // category as the admin-facing "event_registration" notice.
        types: ["event_registration", "new_event", "event_registration_success"],
    },
    profile_update: {
        label: "Profile Updates",
        icon: <EditOutlined />,
        color: "#722ed1",
        types: ["profile_update"],
    },
    account_login: {
        label: "Login Activity",
        icon: <LoginOutlined />,
        color: "#13c2c2",
        types: ["login", "login_success", "account_login"],
    },
    account_approved: {
        label: "Account Approved",
        icon: <SafetyCertificateOutlined />,
        color: "#faad14",
        types: ["account_approved", "approved", "approval"],
    },
    quiz_submission: {
        label: "Quiz Submissions",
        icon: <FormOutlined />,
        color: "#eb2f96",
        // "quiz_completed" is the copy sent back to the alumni who just
        // finished a quiz (QuizController@submit) — same category as the
        // admin-facing "quiz_submission" notice.
        types: ["quiz_submission", "rating_quiz", "abcd_quiz", "quiz", "quiz_completed"],
    },
    login_attempt: {
        label: "Login Attempts",
        icon: <WarningOutlined />,
        color: "#ff4d4f",
        // "pending_alumni_login" (AuthController::notifyAdminsAboutPendingAlumniLogin)
        // is the real type; it doesn't reach this list via notifiable_type
        // though — see the TYPE_TO_CATEGORY lookup below for why.
        types: ["login_attempt", "failed_login", "suspicious_login", "pending_alumni_login"],
    },
    department_head_login: {
        label: "Dept. Head Login",
        icon: <IdcardOutlined />,
        color: "#9254de",
        types: ["department_head_login"],
    },
    announcement: {
        label: "Announcements",
        icon: <SoundOutlined />,
        color: "#fa8c16",
        types: ["announcement", "new_announcement"],
    },
    feedback: {
        label: "Feedback",
        icon: <CommentOutlined />,
        color: "#ef4444",
        types: ["new_feedback_report", "feedback_report_update"],
    },
    messages: {
        label: "Messages",
        icon: <MessageOutlined />,
        color: "#2563eb",
        // Alumni-facing only: unread count of one admin's messages to
        // THIS specific alumni. Kept as its own category (not merged
        // with alumni_messages below) so the icon/label stay accurate —
        // this is a single 1-to-1 conversation, not a many-people inbox.
        types: ["admin_message"],
    },
    alumni_messages: {
        label: "Alumni Messages",
        icon: <TeamOutlined />,
        color: "#2563eb",
        // Admin-facing only: combined unread count across EVERY alumni
        // conversation (see MessagingController::notifyAdminsOfAlumniMessages).
        // TeamOutlined (many-people icon) instead of MessageOutlined on
        // purpose — it's an aggregate of many alumni, not one thread.
        types: ["alumni_message"],
    },
};

// Reverse lookup built from NOTIFICATION_CATEGORIES above: exact type
// token -> category key. Keeps every known type listed in exactly one
// place (each category's `types` array) instead of duplicating it again
// in getNotificationCategory's switch logic.
const TYPE_TO_CATEGORY = Object.entries(NOTIFICATION_CATEGORIES).reduce(
    (acc, [key, meta]) => {
        (meta.types || []).forEach((t) => {
            acc[t] = key;
        });
        return acc;
    },
    {},
);

// ============ ROLE-BASED NOTIFICATION VISIBILITY ============
// Not every role cares about every notification category. Alumni, for
// example, only need their own event registrations, login activity, and
// quiz submissions — security/admin-facing categories like login attempts
// or department-head logins are just noise for them.
//
// Alumni & department-head login/logout activity now lives in the
// dedicated Audit Log page (see AuditLogController + AuthController's
// logAudit()) instead of being pushed here as Notification rows, since
// with hundreds of alumni logging in the "account_login" /
// "department_head_login" categories drowned out every other
// notification in the bell — including for admins, who previously fell
// back to seeing every category since they weren't listed here. Admin
// is now listed explicitly, excluding those two noisy categories; any
// older rows of that type still in the database simply won't render
// (see getVisibleNotificationCategoryKeys) rather than falling back to
// "all".
const ROLE_NOTIFICATION_CATEGORIES = {
    alumni: [
        "event_registration",
        "account_login",
        "quiz_submission",
        "announcement",
        "feedback",
        "messages",
    ],
    department_head: [
        "account_login",
        "event_registration",
    ],
    admin: [
        "event_registration",
        "profile_update",
        "account_approved",
        "quiz_submission",
        "login_attempt",
        "announcement",
        "feedback",
        "alumni_messages",
    ],
};

const getVisibleNotificationCategoryKeys = (userRole) => {
    const restricted = ROLE_NOTIFICATION_CATEGORIES[userRole];
    if (!restricted) {
        // Unlisted roles (admin, etc.) see every category.
        return Object.keys(NOTIFICATION_CATEGORIES).filter(
            (key) => key !== "all",
        );
    }
    return restricted;
};

const withImageCacheBuster = (imageUrl, version) => {
    if (
        !imageUrl ||
        imageUrl.startsWith("blob:") ||
        imageUrl.startsWith("data:")
    ) {
        return imageUrl;
    }

    const cleanUrl = imageUrl.replace(
        /([?&])v=\d+(&?)/,
        (match, prefix, suffix) => (suffix ? prefix : ""),
    );

    // No explicit version means the caller doesn't actually know the
    // image changed — this is just a normal render of an existing
    // avatar. Return the plain URL so the browser can serve it from
    // cache instead of treating it as a brand-new resource every time
    // this runs (previously defaulted to Date.now(), which minted a
    // new "unique" URL on every single re-render and forced a fresh
    // network request for the same image, easily blowing through the
    // profile-image rate limit when many notifications render at once).
    if (!version) {
        return cleanUrl;
    }

    return `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}v=${version}`;
};

// Formats a 24-hour time string ("HH:mm" or "HH:mm:ss") into a readable
// 12-hour display string, e.g. "16:40:00" -> "04:40 PM".
const formatEventTime = (value) => {
    if (!value) return "";
    const match = String(value).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return value;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
};

const MainLayout = ({ children, breadcrumb }) => {
    const queryClient = useQueryClient();
    const { data: profile, loading, refetch } = useProfile();
    const { pathname } = useLocation();
    const history = useHistory();
    const basePath = "/" + pathname.split("/").filter(Boolean)[0];
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [accountDropdownVisible, setAccountDropdownVisible] = useState(false);
    const [helpSupportExpanded, setHelpSupportExpanded] = useState(false);
    useEffect(() => {
        if (!accountDropdownVisible) setHelpSupportExpanded(false);
    }, [accountDropdownVisible]);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [alumniQuizzes, setQuizzes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [animateBell, setAnimateBell] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [allNotifications, setAllNotifications] = useState([]);
    const [filterUnread, setFilterUnread] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [allNotificationsModalVisible, setAllNotificationsModalVisible] =
        useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalNotifications, setTotalNotifications] = useState(0);
    const [perPage] = useState(10);
    const [modalPerPage] = useState(50); // For modal - show more per page
    const [loadingMore, setLoadingMore] = useState(false);
    const [alumniDetailsVisible, setAlumniDetailsVisible] = useState(false);
    const [alumniPreviewData, setAlumniPreviewData] = useState(null);
    const [alumniDetailsLoading, setAlumniDetailsLoading] = useState(false);
    const [eventRegistrationsModalVisible, setEventRegistrationsModalVisible] =
        useState(false);
    const [selectedEventForRegistrations, setSelectedEventForRegistrations] =
        useState(null);
    const [eventRegistrations, setEventRegistrations] = useState([]);
    const [eventRegistrationsLoading, setEventRegistrationsLoading] =
        useState(false);
    const [eventDetailsModalVisible, setEventDetailsModalVisible] =
        useState(false);
    const [selectedEventDetails, setSelectedEventDetails] = useState(null);
    const [eventDetailsLoading, setEventDetailsLoading] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [discardModalOpen, setDiscardModalOpen] = useState(false);
    // "View admin note" modal, opened from a resolved/dismissed feedback
    // notification in the bell.
    const [feedbackDetailModalVisible, setFeedbackDetailModalVisible] =
        useState(false);
    const [selectedFeedbackReport, setSelectedFeedbackReport] =
        useState(null);
    const [feedbackDetailLoading, setFeedbackDetailLoading] = useState(false);
    // Feedback flow state
    const [feedbackStep2Open, setFeedbackStep2Open] = useState(false);
    const [feedbackStep3Open, setFeedbackStep3Open] = useState(false);
    const [feedbackOption, setFeedbackOption] = useState(null); // "improve" | "wrong"
    const [feedbackArea, setFeedbackArea] = useState(undefined);
    const [feedbackDetails, setFeedbackDetails] = useState("");
    const [feedbackScreenshots, setFeedbackScreenshots] = useState([]);
    const submitAtmsFeedback = useSubmitAtmsFeedback();

    useEffect(() => {
    const pageTitles = {
        "/home": "Home",
        "/gallery": "Photo Library",
        "/profile": "Profile Settings",
        "/admin-dashboard": "Admin Dashboard",
        "/department-dashboard": "Department Dashboard",
        "/alumni": "Alumni List",
        "/events": "Alumni Events",
        "/messages": "Messages",
        "/job-posts": "Job Posts",
        "/faq": "Help Center",
        "/about": "About Us",
        "/questions": "Questions",
        "/department-heads": "Department Accounts",
        "/feedback-reports": "Feedback Reports",
        "/announcements": "Announcements",
        "/402": "Maintenance",
        "/audit-logs": "Audit Logs",
        

    };

    const pageTitle = pageTitles[pathname] || "ATMS";

    document.title = `${pageTitle} | ATMS - Opol Community College`;
}, [pathname]);

    //  Prevent Right-Click and Developer Tools///
    //   useEffect(() => {
    //   const disableContextMenu = (e) => {
    //     e.preventDefault();
    //   };

    //   document.addEventListener("contextmenu", disableContextMenu);

    //   return () => {
    //     document.removeEventListener("contextmenu", disableContextMenu);
    //   };
    // }, []);

    // useEffect(() => {
    //   const handleKeyDown = (e) => {
    //     if (
    //       e.key === "F12" ||
    //       (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
    //       (e.ctrlKey && e.key === "u")
    //     ) {
    //       e.preventDefault();
    //       return false;
    //     }
    //   };

    //   document.addEventListener("keydown", handleKeyDown);

    //   return () => {
    //     document.removeEventListener("keydown", handleKeyDown);
    //   };
    // }, []);

    const FEEDBACK_AREAS = [
        { value: "gallery", label: "Photo Library" },
        { value: "dashboard", label: "Dashboard" },
        { value: "alumni", label: "Alumni List" },
        { value: "events", label: "Events" },
        { value: "questions", label: "Questions" },
        { value: "create-dha", label: "Create D.H.A" },
        { value: "messages", label: "Messages" },
        { value: "job-posts", label: "Job Posts" },
        { value: "faq", label: "FAQs" },
        { value: "about", label: "About" },
        { value: "profile", label: "Profile" },
        { value: "notifications", label: "Notifications" },
        { value: "login", label: "Login / Authentication" },
        { value: "image-quiz", label: "Image Quiz" },
        { value: "rating-quiz", label: "Rating Quiz" },
        { value: "registration", label: "Registration" },
        { value: "other", label: "Other" },
    ];

    const resetFeedbackForm = () => {
        setFeedbackArea(undefined);
        setFeedbackDetails("");
        setFeedbackScreenshots([]);
        setFeedbackOption(null);
    };

    const closeAllFeedback = () => {
        setFeedbackStep3Open(false);
        setFeedbackStep2Open(false);
        setFeedbackModalOpen(false);
        resetFeedbackForm();
    };

    // ============ THEME SYSTEM (shared with FormLogin) ============
    // Was previously its own local implementation using "default"/"black"
    // as the stored values — incompatible with useAppTheme's "white"/"black"
    // convention. Any time someone picked "Light" here, it silently wrote
    // "default" into the very same secureLocalStorage["app-theme"] key the
    // rest of the app reads, which useAppTheme() doesn't recognize as a
    // valid theme — so it fell back to the OS dark-mode preference on every
    // other page. Using the shared hook here closes that gap for good.
    const { theme: currentTheme, setTheme: handleThemeChange } =
        useAppTheme();

    const themeOptions = [
        { value: "white", label: "Light" },
        { value: "black", label: "Dark" },
    ];
    // ============ END THEME SYSTEM ============

    const logout = async () => {
        try {
            // Call backend logout endpoint to set user offline
            await axiosConfig.post(BASE_URL + "api/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Clear all local storage items (Phase 6: access_token is no
            // longer stored here — it's an HttpOnly cookie; the /logout
            // call above already revoked it and cleared the cookie
            // server-side).
            secureLocalStorage.removeItem("faculty_id");
            secureLocalStorage.removeItem("userID");
            secureLocalStorage.removeItem("userRole");
            secureLocalStorage.removeItem("email");
            secureLocalStorage.removeItem("name");
            secureLocalStorage.removeItem("courseId");

            // Redirect to login page
            setCookie(["userLogin", ""]);
            window.location = "/login";
        }
    };

    const getDepartmentHeadAvatar = () => {
        const courseId = secureLocalStorage.getItem("courseId");
        switch (courseId) {
            case 1:
            case "1":
                return avatarBSIT;
            case 2:
            case "2":
                return avatarBSED;
            case 3:
            case "3":
                return avatarBEED;
            case 4:
            case "4":
                return avatarBSBA;
            default:
                return avatarGuidance;
        }
    };

    const [userData, setUserData] = useState(() => {
        const role = secureLocalStorage.getItem("userRole");
        return {
            name: secureLocalStorage.getItem("name") || "User Name",
            email: secureLocalStorage.getItem("email") || "",
            avatar:
                role === "department_head"
                    ? getDepartmentHeadAvatar()
                    : avatarGuidance,
            role: role || "user",
        };
    });

    useEffect(() => {
        if (profile?.alumni) {
            const fullName = `${profile.alumni.first_name || "User"} ${profile.alumni.last_name || "Name"}`;

            setUserData((prev) => ({
                ...prev,
                name: fullName,
                email: profile.alumni.email || prev.email,
                avatar: profile.alumni.profile_image_url || prev.avatar,
            }));

            secureLocalStorage.setItem("name", fullName);
            secureLocalStorage.setItem("email", profile.alumni.email || "");
        }
    }, [profile]);

    useEffect(() => {
        const role = secureLocalStorage.getItem("userRole");
        if (role === "department_head") {
            setUserData((prev) => ({
                ...prev,
                avatar: getDepartmentHeadAvatar(),
            }));
        }
    }, []);

    // Maps the frontend's camelCase settings state to the backend's
    // snake_case preference keys (see NotificationPreferencesController).
    // "darkMode" is intentionally left out — theme is a separate, purely
    // client-side concern (currentTheme elsewhere in this file), not a
    // notification channel, so it isn't sent to the server.
    const SETTINGS_KEY_MAP = {
        emailNotifications: "email_notifications",
        soundEnabled: "sound_enabled",
        pushNotifications: "push_notifications",
    };

    // Mirrors User::DEFAULT_NOTIFICATION_PREFERENCES on the backend —
    // used purely for display, to show a "Default" tag next to whichever
    // toggles the user hasn't actively changed yet, so it's obvious at a
    // glance which settings are still on their out-of-the-box value vs.
    // which ones they've deliberately switched.
    const DEFAULT_SETTINGS = {
        emailNotifications: true,
        soundEnabled: false,
        pushNotifications: true,
    };

    const [settings, setSettings] = useState({
        ...DEFAULT_SETTINGS,
        darkMode: false,
    });
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Tracks unread notification ids across polls so sound/push only
    // fire for notifications that are genuinely new since the last
    // check — without this every 30s poll would re-fire them for every
    // still-unread notification, not just newly arrived ones.
    const seenUnreadIdsRef = useRef(null);

    // While the tab/window is hidden (e.g. the user Alt-Tabs to another
    // app or switches to a different browser tab), the 30s polling
    // interval keeps running in the background but browsers throttle
    // background timers — so by the time the user switches back, the
    // next fetch can land right away and "catch up" on everything that
    // arrived while they were away. Without this flag, that catch-up
    // poll treated every one of those as newly arrived and fired the
    // notification sound the instant the window regained focus, even
    // though nothing changed while the user was actually looking at
    // this window. Set true when the tab goes hidden; the next
    // fetchNotifications() call after becoming visible again silently
    // resyncs (updates what's "seen" without playing sound/push), then
    // clears the flag so normal live notifications behave as before.
    const suppressSoundOnNextFetchRef = useRef(false);
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "hidden") {
                suppressSoundOnNextFetchRef.current = true;
            } else if (document.visibilityState === "visible") {
                // Resync right away rather than waiting for the next
                // throttled interval tick, so the unread badge is
                // accurate immediately — this resync itself is silent
                // because the flag above is still true at this point.
                fetchNotifications();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () =>
            document.removeEventListener(
                "visibilitychange",
                handleVisibility,
            );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mirrors `settings` for the polling interval below. The interval is
    // registered once (empty-deps useEffect, further down) and reuses
    // the SAME fetchNotifications closure for every 30s tick. Reading
    // `settings.soundEnabled` directly inside that closure meant it was
    // permanently frozen at whatever "settings" was on the very first
    // render (soundEnabled: false, before the saved preference even
    // finished loading from the server) — so toggling sound on in the
    // Settings modal never had any effect on the polling loop; the sound
    // toggle looked "on" but no sound ever played. Reading from this ref
    // instead always sees the live value without needing to tear down
    // and recreate the interval on every settings change.
    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // Cache of <audio> elements per role so we don't re-create/re-fetch
    // the file on every single notification — created lazily the first
    // time each role's sound is needed.
    const notificationAudioCacheRef = useRef({});

    // Chrome/Firefox/Safari all block audio playback that isn't tied to
    // a user gesture (click/tap/keypress) until the page has been
    // "unlocked" once. playNotificationSound() is only ever called from
    // the 30s polling setInterval — never from a click — so without
    // this, audio.play() silently rejects (NotAllowedError, swallowed
    // by the existing .catch()), producing no audible sound even
    // though nothing visibly errors. This is why sound can appear
    // completely silent for every user regardless of the
    // sound_enabled toggle: the toggle was never the only gate.
    //
    // Fix: the first time the user clicks/taps/presses a key anywhere
    // on the page, prime every cached notification sound and resume
    // the shared AudioContext, once per browser session.
    const audioUnlockedRef = useRef(false);
    useEffect(() => {
        if (audioUnlockedRef.current) return;

        const unlock = () => {
            if (audioUnlockedRef.current) return;
            audioUnlockedRef.current = true;

            // Prime each role's <audio> element with a muted play/pause
            // cycle. This is what actually satisfies Safari's stricter
            // per-element gesture requirement (unlocking one <audio>
            // doesn't unlock another created later, so all four are
            // primed up front here rather than lazily in
            // playNotificationSound).
            Object.entries(NOTIFICATION_SOUND_FILES).forEach(
                ([roleKey, src]) => {
                    try {
                        let audio = notificationAudioCacheRef.current[roleKey];
                        if (!audio) {
                            audio = new Audio(src);
                            audio.preload = "auto";
                            audio.volume = 0.6;
                            notificationAudioCacheRef.current[roleKey] = audio;
                        }
                        const wasMuted = audio.muted;
                        audio.muted = true;
                        const p = audio.play();
                        if (p && typeof p.then === "function") {
                            p.then(() => {
                                audio.pause();
                                audio.currentTime = 0;
                                audio.muted = wasMuted;
                            }).catch(() => {
                                audio.muted = wasMuted;
                            });
                        } else {
                            audio.pause();
                            audio.currentTime = 0;
                            audio.muted = wasMuted;
                        }
                    } catch (e) {
                        console.error(
                            `Failed to prime notification audio for ${roleKey}:`,
                            e,
                        );
                    }
                },
            );

            document.removeEventListener("click", unlock);
            document.removeEventListener("keydown", unlock);
            document.removeEventListener("touchstart", unlock);
        };

        document.addEventListener("click", unlock);
        document.addEventListener("keydown", unlock);
        document.addEventListener("touchstart", unlock);

        return () => {
            document.removeEventListener("click", unlock);
            document.removeEventListener("keydown", unlock);
            document.removeEventListener("touchstart", unlock);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Actual sound file per role, served as static assets from
    // public/sounds/notifications/. admin/alumni/default use the
    // ElevenLabs-generated chimes the user supplied (see below); drop
    // replacement files in that folder (same filenames) to change the
    // sound again — no code change needed after that.
    //   admin    -> "Airy social media chime, modern app alert"
    //   alumni   -> "Soft chime new message notification, single bright tone"
    //   default  -> "Subtle bell calendar reminder alert, gentle two-note"
    const NOTIFICATION_SOUND_FILES = {
        admin: "/sounds/notifications/admin.mp3",
        alumni: "/sounds/notifications/alumni.mp3",
        department_head: "/sounds/notifications/department_head.wav",
        default: "/sounds/notifications/default.mp3",
    };

    // Plays ONLY the org's own sound file for the role — no synthesized
    // fallback tone. Previously a WebAudio "bell" tone would play
    // whenever the mp3 failed or errored, and that generated tone could
    // start milliseconds apart from (or on top of) the real mp3,
    // producing the "overlap"/phased sound that wasn't the org's actual
    // chime. If the mp3 can't play for some reason, we simply log it —
    // no substitute sound is generated.
    const playNotificationSound = (forRole) => {
        const activeRole = forRole || secureLocalStorage.getItem("userRole");
        const src =
            NOTIFICATION_SOUND_FILES[activeRole] ||
            NOTIFICATION_SOUND_FILES.default;

        try {
            let audio = notificationAudioCacheRef.current[activeRole];
            if (!audio) {
                audio = new Audio(src);
                audio.preload = "auto";
                audio.volume = 0.6;
                notificationAudioCacheRef.current[activeRole] = audio;
            } else {
                // Restart from the beginning if a previous play is still
                // finishing up (e.g. two notifications arrive close
                // together).
                audio.currentTime = 0;
            }

            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch((e) => {
                    console.error(
                        "Failed to play notification sound file:",
                        e,
                    );
                });
            }
        } catch (e) {
            console.error("Failed to play notification sound:", e);
        }
    };

    const showBrowserPushNotification = (notif) => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return;
        }
        if (window.Notification.permission !== "granted") return;

        try {
            const title = notif.title || "New notification";
            const body = notif.message || "";
            const pushNotif = new window.Notification(title, {
                body,
                tag: `notification-${notif.id}`,
                // playNotificationSound() above already plays the
                // org's own role-specific chime (admin.mp3/alumni.mp3/
                // etc.) for this same event. Without `silent: true`
                // here, the OS/browser also plays its own generic
                // default notification sound on top of it — that's the
                // "overlap" sound that isn't the org's sound. Muting
                // the native sound leaves only the one intentional
                // chime.
                silent: true,
            });
            pushNotif.onclick = () => {
                window.focus();
                pushNotif.close();
            };
        } catch (e) {
            console.error("Failed to show browser push notification:", e);
        }
    };

    // Fetches the user's saved preferences from the backend so they're
    // consistent across devices/browsers, using the localStorage copy
    // only as an instant-paint fallback while that request is in flight.
    useEffect(() => {
        const cached = secureLocalStorage.getItem("notificationSettings");
        if (cached) {
            try {
                setSettings((prev) => ({ ...prev, ...JSON.parse(cached) }));
            } catch (e) {
                console.error("Failed to parse cached notification settings");
            }
        }

        (async () => {
            try {
                const { data } = await axiosConfig.get(
                    "/notification-settings",
                    { suppressGenericModal: true },
                );
                if (data?.success && data.data) {
                    const fromServer = {
                        emailNotifications: data.data.email_notifications,
                        soundEnabled: data.data.sound_enabled,
                        pushNotifications: data.data.push_notifications,
                    };
                    setSettings((prev) => ({ ...prev, ...fromServer }));
                    secureLocalStorage.setItem(
                        "notificationSettings",
                        JSON.stringify(fromServer),
                    );
                }
            } catch (e) {
                // Not fatal — the localStorage cache (or the in-state
                // defaults) is still a usable fallback.
                console.error("Failed to load notification settings:", e);
            } finally {
                setSettingsLoaded(true);
            }
        })();
    }, []);

    const handleSettingsChange = async (key, value) => {
        setSettings((prev) => {
            const updated = { ...prev, [key]: value };
            secureLocalStorage.setItem(
                "notificationSettings",
                JSON.stringify(updated),
            );
            return updated;
        });

        // Turning push notifications on requires the browser's own
        // permission prompt — ask right when the user opts in, not
        // silently, so they understand why the prompt appeared.
        if (
            key === "pushNotifications" &&
            value &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            window.Notification.permission === "default"
        ) {
            try {
                const permission = await window.Notification.requestPermission();
                if (permission !== "granted") {
                    message.warning(
                        "Browser permission was not granted, so push notifications won't show.",
                    );
                }
            } catch (e) {
                console.error("Failed to request notification permission:", e);
            }
        }

        const backendKey = SETTINGS_KEY_MAP[key];
        if (backendKey) {
            try {
                await axiosConfig.put("/notification-settings", {
                    [backendKey]: value,
                });
                message.success("Setting updated successfully");
            } catch (e) {
                console.error("Failed to save notification setting:", e);
                message.error(
                    "Setting saved on this device, but failed to sync — try again later.",
                );
            }
        } else {
            message.success("Setting updated successfully");
        }
    };

    let menus = [];
    const role = secureLocalStorage.getItem("userRole");
    if (role === "admin") {
        menus = MENU_ADMIN;
    } else if (role === "alumni") {
        menus = MENU_ALUMNI;
    } else if (role === "department_head") {
        menus = MENU_DEPARTMENT_HEAD;
    } else if (role === "faculty") {
        // menus = MENU_FACULTY;
    }

    // Category keys this role is permitted to see in the notification
    // bell dropdown / "All Notifications" modal, plus the derived lookup
    // table used to render the category filter buttons. Notifications
    // that don't match any known category fall back to "all" in
    // getNotificationCategory(), so they stay visible to every role
    // instead of silently disappearing for restricted ones.
    const allowedNotificationCategoryKeys =
        getVisibleNotificationCategoryKeys(role);
    const visibleNotificationCategories = Object.fromEntries(
        Object.entries(NOTIFICATION_CATEGORIES).filter(
            ([key]) =>
                key === "all" ||
                allowedNotificationCategoryKeys.includes(key),
        ),
    );

    const [collapsed, setCollapsed] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const getNotificationData = (notification) => {
        if (!notification.data) return {};
        if (typeof notification.data === "string") {
            try {
                return JSON.parse(notification.data);
            } catch (e) {
                console.error("Failed to parse notification data:", e);
                return {};
            }
        }
        return notification.data;
    };

    const patchNotificationAvatar = (
        notification,
        imageUrl,
        version = Date.now(),
    ) => {
        const notificationData = getNotificationData(notification);
        const bustedImageUrl = withImageCacheBuster(imageUrl, version);
        const nextData = {
            ...notificationData,
            alumni_profile_image: bustedImageUrl,
            profile_image_url: bustedImageUrl,
        };

        return {
            ...notification,
            data:
                typeof notification.data === "string"
                    ? JSON.stringify(nextData)
                    : nextData,
            sender: notification.sender
                ? { ...notification.sender, avatar: bustedImageUrl }
                : notification.sender,
        };
    };

    const matchesNotificationAlumni = (notification, alumniId, userId) => {
        const data = getNotificationData(notification);
        return (
            (alumniId &&
                [data?.alumni_id, data?.id, data?.alumni?.id]
                    .filter(Boolean)
                    .some((id) => String(id) === String(alumniId))) ||
            (userId &&
                [data?.user_id, data?.alumni?.user_id]
                    .filter(Boolean)
                    .some((id) => String(id) === String(userId)))
        );
    };

    const syncNotificationsWithFreshAlumniImages = async (
        notificationsList,
    ) => {
        const alumniIds = [
            ...new Set(
                notificationsList
                    .map(
                        (notification) =>
                            getNotificationData(notification)?.alumni_id,
                    )
                    .filter(Boolean),
            ),
        ];

        if (!alumniIds.length) return notificationsList;

        const alumniById = new Map();
        await Promise.all(
            alumniIds.map(async (alumniId) => {
                try {
                    const response = await axiosConfig.get(
                        `/alumni/${alumniId}`,
                    );
                    const alumni = response.data?.data || response.data;
                    if (alumni?.profile_image_url) {
                        alumniById.set(
                            String(alumniId),
                            alumni.profile_image_url,
                        );
                    }
                } catch (_error) {
                    // Keep the notification's embedded image if this alumni fetch fails.
                }
            }),
        );

        const version = Date.now();
        return notificationsList.map((notification) => {
            const alumniId = getNotificationData(notification)?.alumni_id;
            const freshImage = alumniById.get(String(alumniId));
            return freshImage
                ? patchNotificationAvatar(notification, freshImage, version)
                : notification;
        });
    };

    const getNotificationCategory = (notification) => {
        const notificationData = getNotificationData(notification);
        // Kept separate rather than collapsed with `||`: some backend
        // notifications set notifiable_type to a specific token
        // ("new_feedback_report"), but others set it to a generic
        // Eloquent class name ("App\Models\Alumni") and put the real,
        // specific type in data.type instead (e.g. "profile_update",
        // "pending_alumni_login" — see AuthController /
        // AlumniRegistrationController). Collapsing the two with `||`
        // would let the generic notifiable_type permanently shadow the
        // specific data.type whenever it happened to be truthy, silently
        // losing the more useful value.
        const rawType = notification.notifiable_type || "";
        const dataType = notificationData?.type || "";
        const notificationMessage = (
            notification.message ||
            notificationData?.message ||
            ""
        ).toLowerCase();
        const title = (
            notification.title ||
            notificationData?.title ||
            ""
        ).toLowerCase();

        // Pass 1: trust an explicit, recognized type token from the
        // backend — it's authoritative and MUST run before any of the
        // keyword-based fallbacks below. Otherwise a message that simply
        // *mentions* another category's keyword gets miscategorized —
        // e.g. an ATMS feedback report submitted about the "Events" area
        // reads "...submitted feedback: events", and a naive
        // event-keyword check (`message.includes("event")`) would match
        // that before a feedback check ever ran, showing an
        // "Event Registered" badge instead of "Feedback". Check both
        // fields — whichever one is a known token wins; notifiable_type
        // first since it's the more common home for it.
        if (TYPE_TO_CATEGORY[rawType]) return TYPE_TO_CATEGORY[rawType];
        if (TYPE_TO_CATEGORY[dataType]) return TYPE_TO_CATEGORY[dataType];

        // Pass 2: keyword-based fallback, only for legacy/unrecognized
        // notifications that don't carry a known type in either field.
        // Feedback is checked before event/profile/etc. here too, since a
        // feedback message can legitimately contain any of those words as
        // the name of the area it was submitted about.
        if (
            notificationMessage.includes("department head") ||
            title.includes("department head")
        ) {
            return "department_head_login";
        }

        if (
            notificationMessage.includes("feedback") ||
            title.includes("feedback")
        ) {
            return "feedback";
        }

        if (
            notificationMessage.includes("event") ||
            notificationMessage.includes("registered for") ||
            title.includes("event")
        ) {
            return "event_registration";
        }

        if (
            notificationMessage.includes("profile") ||
            notificationMessage.includes("updated") ||
            title.includes("profile")
        ) {
            return "profile_update";
        }

        if (
            notificationMessage.includes("attempt") ||
            notificationMessage.includes("failed login") ||
            notificationMessage.includes("suspicious") ||
            title.includes("attempt")
        ) {
            return "login_attempt";
        }

        if (
            notificationMessage.includes("logged in") ||
            notificationMessage.includes("login") ||
            title.includes("login")
        ) {
            return "account_login";
        }

        if (
            notificationMessage.includes("approved") ||
            notificationMessage.includes("verified") ||
            title.includes("approved")
        ) {
            return "account_approved";
        }

        if (
            notificationMessage.includes("quiz") ||
            notificationMessage.includes("rating") ||
            notificationMessage.includes("assessment") ||
            title.includes("quiz")
        ) {
            return "quiz_submission";
        }

        if (
            notificationMessage.includes("announcement") ||
            title.includes("announcement")
        ) {
            return "announcement";
        }

        // Belt-and-suspenders: the two message notifications above should
        // always carry rawType "admin_message"/"alumni_message" and get
        // caught by Pass 1, but if an older row is ever missing that
        // token, don't let it silently fall back to the generic "All"
        // bucket — match on the title text instead. Admin's aggregate
        // title ("Alumni Messages") is checked first since it also
        // contains the word "message".
        if (title.includes("alumni messages")) {
            return "alumni_messages";
        }
        if (
            notificationMessage.includes("message") ||
            title.includes("message")
        ) {
            return "messages";
        }

        return "all";
    };

    const getCategoryInfo = (notification) => {
        const category = getNotificationCategory(notification);
        return NOTIFICATION_CATEGORIES[category] || NOTIFICATION_CATEGORIES.all;
    };

    const filterNotificationsByCategory = (notificationsList) => {
        let filtered = notificationsList.filter((n) => {
            const cat = getNotificationCategory(n);
            return (
                cat === "all" || allowedNotificationCategoryKeys.includes(cat)
            );
        });

        if (filterUnread) {
            filtered = filtered.filter((n) => !n.read);
        }

        if (activeCategory !== "all") {
            filtered = filtered.filter(
                (n) => getNotificationCategory(n) === activeCategory,
            );
        }

        return filtered;
    };

    const getCategoryCounts = (notificationsList) => {
        const roleVisible = notificationsList.filter((n) => {
            const cat = getNotificationCategory(n);
            return (
                cat === "all" || allowedNotificationCategoryKeys.includes(cat)
            );
        });
        const counts = { all: roleVisible.length };
        Object.keys(NOTIFICATION_CATEGORIES).forEach((key) => {
            if (key !== "all") {
                counts[key] = roleVisible.filter(
                    (n) => getNotificationCategory(n) === key,
                ).length;
            }
        });
        return counts;
    };

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await axiosConfig.get(
                `/notifications?page=1&per_page=${perPage}`,
                {
                    // This polls every 30s in the background (see the
                    // interval below) regardless of what page the admin
                    // is on — it must never pop the generic error modal
                    // for a routine timeout/slow-network hiccup that has
                    // nothing to do with whatever they're actually doing.
                    suppressGenericModal: true,
                },
            );

            if (response.data) {
                const notificationsData =
                    await syncNotificationsWithFreshAlumniImages(
                        response.data.data || [],
                    );
                setNotifications(notificationsData);
                if (response.data.pagination) {
                    setTotalNotifications(response.data.pagination.total);
                }

                // Sound/push alerts for whatever is unread on THIS poll
                // that wasn't already unread on the previous one — i.e.
                // genuinely new arrivals, not every still-unread item
                // re-firing each 30s cycle. The first poll after mount
                // only seeds the "seen" set (nothing should alert just
                // because the page loaded with existing unread items).
                //
                // IMPORTANT: this must only consider notifications whose
                // category is actually visible to this role in the bell
                // (allowedNotificationCategoryKeys — same filter used by
                // getFilteredNotifications below). Without this, a
                // notification hidden from the bell for this role (e.g.
                // "account_approved" isn't in ROLE_NOTIFICATION_CATEGORIES.alumni,
                // even though notifyAlumniAboutApproval() sends it
                // straight to that alumni's own user_id) still counted
                // toward "newlyArrived" and fired the sound/push with
                // nothing ever appearing in the bell to explain it —
                // exactly the "I hear a sound but there's no
                // notification" symptom. Filtering here makes what you
                // hear match what you can actually see.
                const isVisibleToRole = (n) => {
                    const cat = getNotificationCategory(n);
                    return (
                        cat === "all" ||
                        allowedNotificationCategoryKeys.includes(cat)
                    );
                };
                const visibleNotificationsData =
                    notificationsData.filter(isVisibleToRole);

                const currentUnreadIds = new Set(
                    visibleNotificationsData
                        .filter((n) => !n.read)
                        .map((n) => n.id),
                );
                if (seenUnreadIdsRef.current === null) {
                    seenUnreadIdsRef.current = currentUnreadIds;
                } else {
                    const newlyArrived = visibleNotificationsData.filter(
                        (n) =>
                            !n.read &&
                            !seenUnreadIdsRef.current.has(n.id),
                    );
                    // If the tab was hidden since the last poll (see
                    // suppressSoundOnNextFetchRef above), this fetch is a
                    // silent resync: anything that arrived while the user
                    // was away gets marked as "seen" below without
                    // announcing it, so switching back to this window
                    // never plays a sound for notifications that weren't
                    // actually new to this check-in.
                    const shouldSuppress = suppressSoundOnNextFetchRef.current;
                    suppressSoundOnNextFetchRef.current = false;

                    if (newlyArrived.length > 0 && !shouldSuppress) {
                        // Read via the ref (see settingsRef above), not the
                        // closed-over `settings` state — this function is
                        // called from a setInterval closure created once on
                        // mount, so `settings` here would otherwise always
                        // reflect the very first render's defaults.
                        if (settingsRef.current.soundEnabled) {
                            playNotificationSound(role);
                        }
                        if (settingsRef.current.pushNotifications) {
                            newlyArrived.forEach(showBrowserPushNotification);
                        }
                    }
                    seenUnreadIdsRef.current = currentUnreadIds;
                }
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllNotifications = async (page = 1) => {
        try {
            setLoadingMore(true);
            // Use larger per_page to get more notifications
            const response = await axiosConfig.get(
                `/notifications?page=${page}&per_page=${modalPerPage}`,
            );

            if (response.data) {
                const notificationsData =
                    await syncNotificationsWithFreshAlumniImages(
                        response.data.data || [],
                    );
                setAllNotifications(notificationsData);
                if (response.data.pagination) {
                    setTotalNotifications(response.data.pagination.total);
                    setCurrentPage(response.data.pagination.current_page);
                }
            }
        } catch (error) {
            console.error("Failed to fetch all notifications:", error);
            message.error("Failed to load notifications");
        } finally {
            setLoadingMore(false);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            await axiosConfig.delete(`/notifications/${notificationId}`);
            // Remove from dropdown notifications
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId),
            );
            // Remove from all notifications (modal)
            setAllNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId),
            );
            // Update total count
            setTotalNotifications((prev) => Math.max(0, prev - 1));
            message.success("Notification deleted");
        } catch (error) {
            console.error("Failed to delete notification:", error);
            message.error("Failed to delete notification");
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await axiosConfig.post(
                `/notifications/${notificationId}/mark-read`,
            );
            const updateRead = (prev) =>
                prev.map((n) =>
                    n.id === notificationId
                        ? {
                              ...n,
                              read: true,
                              read_at: new Date().toISOString(),
                          }
                        : n,
                );
            setNotifications(updateRead);
            setAllNotifications(updateRead);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const response = await axiosConfig.post(
                "/notifications/mark-all-read",
            );

            if (response.data?.success) {
                const markAllRead = (prev) =>
                    prev.map((n) => ({
                        ...n,
                        read: true,
                        read_at: new Date().toISOString(),
                    }));
                setNotifications(markAllRead);
                setAllNotifications(markAllRead);
                message.success("All notifications marked as read");
            }
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
            message.error("Failed to mark notifications as read");
        }
    };

    // Flags <html>/<body> with a class only while THIS admin shell is
    // mounted, so the mobile "lock the page, only #content scrolls"
    // CSS rule (index.css) can be scoped to it instead of applying to
    // every route. Without this, that lock was being applied
    // site-wide, including on the public pages (PublicHomePage,
    // PublicEventsPage, etc.) that rely on normal document scrolling
    // and don't use this shell at all - which is why those pages
    // stopped being able to scroll on phones. Removed again on
    // unmount so navigating to a public page restores normal scroll.
    useEffect(() => {
        document.documentElement.classList.add("app-shell-active");
        document.body.classList.add("app-shell-active");
        return () => {
            document.documentElement.classList.remove("app-shell-active");
            document.body.classList.remove("app-shell-active");
        };
    }, []);

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleAlumniImageUpdated = (event) => {
            const { alumniId, userId, newImageUrl } = event.detail || {};
            if (!newImageUrl) return;

            const version = Date.now();
            const patchList = (list) =>
                list.map((notification) =>
                    matchesNotificationAlumni(notification, alumniId, userId)
                        ? patchNotificationAvatar(
                              notification,
                              newImageUrl,
                              version,
                          )
                        : notification,
                );

            setNotifications(patchList);
            setAllNotifications(patchList);
            setAlumniPreviewData((prev) =>
                prev && String(prev.id) === String(alumniId)
                    ? {
                          ...prev,
                          profileImage: withImageCacheBuster(
                              newImageUrl,
                              version,
                          ),
                      }
                    : prev,
            );
            queryClient.invalidateQueries(["alumini"]);
            queryClient.invalidateQueries(["profile"]);
        };

        window.addEventListener(
            "alumni-profile-image-updated",
            handleAlumniImageUpdated,
        );
        return () =>
            window.removeEventListener(
                "alumni-profile-image-updated",
                handleAlumniImageUpdated,
            );
    }, [queryClient]);

    useEffect(() => {
        const unread = notifications.filter((n) => !n.read).length;
        if (unread > 0) {
            setAnimateBell(true);
            const timeout = setTimeout(() => setAnimateBell(false), 1000);
            return () => clearTimeout(timeout);
        }
    }, [notifications]);

    useEffect(() => {
        // window.innerWidth alone misses phones running in "Request Desktop
        // Site" mode — the browser reports a wide layout viewport there
        // (often 980–1280px), so a plain `< 768` check stays false even
        // though the device is still a small, touch-only phone screen.
        //
        // We can't just OR in "has touch", though — that would also catch
        // touch-capable laptops/desktops/all-in-ones at full 1920px width
        // and incorrectly force the mobile layout on them. Instead we use
        // window.screen.width (the device's actual physical screen size,
        // which "Request Desktop Site" does NOT change) together with
        // touch capability: only flag as mobile when the device both has
        // touch AND its real screen is phone-sized.
        //
        // IMPORTANT: all of this must be recomputed on every resize, not
        // just once when the effect mounts. window.screen.width and
        // navigator.maxTouchPoints can both change at runtime — e.g. when
        // Chrome DevTools device emulation (or any window resize) is
        // toggled on/off. If these are read once and captured in the
        // handleResize closure, the device's "is this a phone" verdict
        // gets stuck at whatever it was on mount and never updates again
        // (which is what was locking the sidebar into mobile/drawer mode
        // even after returning to a normal desktop-sized window).
        //
        // ORIENTATION: Math.min(screen.width, screen.height) is intentionally
        // rotation-invariant (stays e.g. 414 whether the phone is portrait
        // or landscape) so "is this device a phone" doesn't flip-flop as you
        // rotate. But that alone would force the mobile <Drawer> in landscape
        // too — and all of the Drawer/menu CSS (sizing, font, padding) only
        // targets `max-width: 768px`, which a landscape phone's actual width
        // (often 700–950px) does NOT satisfy. The Drawer would then render
        // with antd's bare defaults and clipped labels, while unrelated
        // `min-width: 769px` desktop CSS rules apply on top of it — exactly
        // the "collapses like desktop" symptom. The old, stable version
        // sidestepped this entirely by only ever checking window.innerWidth,
        // so a landscape phone (wide viewport) always fell back to the
        // normal desktop Sider. To match that proven behavior, we keep the
        // phone-sized-touch-device override for portrait (where width alone
        // would wrongly say "desktop" under Request Desktop Site), but let
        // landscape fall back to window.innerWidth like the old version —
        // i.e. only treat it as mobile in landscape if it's ALSO narrow by
        // viewport width.
        const handleResize = () => {
            const hasTouch =
                typeof window !== "undefined" &&
                ("ontouchstart" in window ||
                    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0));

            const physicalScreenWidth =
                typeof window !== "undefined" && window.screen
                    ? Math.min(window.screen.width, window.screen.height)
                    : window.innerWidth;

            const isPortrait =
                typeof window !== "undefined"
                    ? window.innerHeight >= window.innerWidth
                    : true;

            // Only apply the "Request Desktop Site" phone override in
            // portrait. In landscape, behave like the old stable code and
            // trust window.innerWidth alone, so a rotated phone gets the
            // normal desktop sidebar instead of the narrow mobile Drawer.
            const isPhoneSizedTouchDevice =
                hasTouch && physicalScreenWidth < 768 && isPortrait;

            setIsMobile(window.innerWidth < 768 || isPhoneSizedTouchDevice);

            // Deliberately NOT gated by isPortrait/orientation — a touch
            // screen is a touch screen whichever way the phone is held.
            setIsTouchDevice(Boolean(hasTouch));
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []);

    // ============ GLOBAL HEARTBEAT & ONLINE-STATUS TRACKING ============
    // Lives in MainLayout so it runs on EVERY page, not just AlumniList.
    // Rules:
    //  • Logged in + browsing any page   → is_online = true  (heartbeat every 2 min)
    //  • Tab becomes visible again        → immediate heartbeat
    //  • Network reconnects               → immediate heartbeat
    //  • Browser tab / window closes      → set-offline via keepalive fetch (fires
    //                                        even while the page is unloading)
    //  • Explicit logout                  → is_online = false via /api/logout
    useEffect(() => {
        // Phase 6: the bearer token is no longer readable by JS at all
        // (HttpOnly cookie) — userID is just cached, non-secret profile
        // display data, so it's a safe stand-in for "is someone logged
        // in" here. It carries no authentication weight of its own; the
        // actual heartbeat/set-offline requests below authenticate via
        // the auth_token cookie, which the browser attaches
        // automatically.
        const userID = secureLocalStorage.getItem("userID");
        if (!userID) return; // Guest / unauthenticated — nothing to track

        const sendHeartbeat = async () => {
            try {
                await axiosConfig.post(BASE_URL + "api/heartbeat");
            } catch (_err) {
                // Silently ignore — could be a transient network blip.
                // The next scheduled tick will retry automatically.
            }
        };

        // Uses fetch keepalive so the request completes even after the JS
        // context is torn down (tab close, browser close, navigation away).
        // `credentials: "include"` sends the HttpOnly auth_token cookie
        // automatically — this used to manually attach a bearer token
        // read from secureLocalStorage, which no longer exists there.
        const markOfflineOnUnload = () => {
            fetch(BASE_URL + "api/set-offline", {
                method: "POST",
                keepalive: true, // ← survives page unload
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }).catch(() => {});
        };

        // Re-establish online status when the user switches back to this tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                sendHeartbeat();
            }
            // We do NOT set offline on "hidden" — user may just Alt-Tab to
            // another app or open DevTools; they are still in the system.
        };

        // Re-establish online status after a network reconnect
        const handleNetworkOnline = () => sendHeartbeat();

        // --- Start ---
        sendHeartbeat(); // Immediate heartbeat on mount
        const heartbeatInterval = setInterval(sendHeartbeat, 2 * 60 * 1000); // Every 2 min

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("online", handleNetworkOnline);
        window.addEventListener("beforeunload", markOfflineOnUnload);

        return () => {
            clearInterval(heartbeatInterval);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            window.removeEventListener("online", handleNetworkOnline);
            window.removeEventListener("beforeunload", markOfflineOnUnload);
        };
    }, []); // Empty deps — one heartbeat loop for the entire logged-in session
    // ============ END GLOBAL HEARTBEAT ============

    const toggleDrawer = () => {
        setDrawerVisible(!drawerVisible);
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleViewEventRegistrations = async (eventId, alumniId) => {
        if (!eventId) {
            message.error("Event ID not found");
            return;
        }
        try {
            setEventRegistrationsLoading(true);
            const response = await axiosConfig.get(
                `/events/${eventId}/registrations`,
            );
            if (response.data.success) {
                setEventRegistrations(response.data.data);
                setSelectedEventForRegistrations(response.data.event);
                setEventRegistrations((prev) =>
                    prev.map((reg) => ({
                        ...reg,
                        isHighlighted: reg.alumni_id === alumniId,
                    })),
                );
                setEventRegistrationsModalVisible(true);
            }
        } catch (error) {
            console.error("Failed to fetch event registrations:", error);
            message.error("Failed to load event registrations");
        } finally {
            setEventRegistrationsLoading(false);
        }
    };

    const handleViewEventDetails = async (eventId) => {
        if (!eventId) {
            message.error("Event ID not found");
            return;
        }
        try {
            setEventDetailsLoading(true);
            const response = await axiosConfig.get(`/events/${eventId}`);
            if (response.data) {
                setSelectedEventDetails(response.data);
                setEventDetailsModalVisible(true);
            }
        } catch (error) {
            console.error("Failed to fetch event details:", error);
            message.error("Failed to load event details");
        } finally {
            setEventDetailsLoading(false);
        }
    };

    const handleViewAnnouncement = (announcementId) => {
        history.push(
            announcementId
                ? `/announcements?id=${announcementId}`
                : "/announcements",
        );
    };

    // Opens the "view admin note" modal for a resolved/dismissed feedback
    // report. Fetches the live report so status/notes are current even
    // if they've changed since the notification was created; falls back
    // to whatever was snapshotted on the notification itself if the
    // report was since deleted.
    const handleViewFeedbackReport = async (feedbackReportId, fallback) => {
        if (!feedbackReportId) return;
        try {
            setFeedbackDetailLoading(true);
            setFeedbackDetailModalVisible(true);
            const response = await axiosConfig.get(
                `/atms-feedback/${feedbackReportId}`,
                // The report may have since been deleted by an admin (404) —
                // that's an expected, gracefully-handled case here (we fall
                // back to the snapshot baked into the notification below),
                // not a surprise failure, so skip the generic axios error
                // modal that would otherwise pop up the raw Laravel
                // "No query results for model [...]" message.
                { suppressGenericModal: true },
            );
            setSelectedFeedbackReport(response.data?.data || fallback || null);
        } catch (error) {
            console.error("Failed to fetch feedback report:", error);
            if (fallback) {
                setSelectedFeedbackReport(fallback);
                if (error?.response?.status === 404) {
                    message.info(
                        "This feedback report has since been deleted. Showing the details from your notification.",
                    );
                }
            } else {
                message.error("Failed to load this feedback report");
                setFeedbackDetailModalVisible(false);
            }
        } finally {
            setFeedbackDetailLoading(false);
        }
    };

    const handleViewAlumniProfile = async (alumniId) => {
        try {
            setAlumniDetailsLoading(true);
            const response = await axiosConfig.get(`/alumni/${alumniId}`);
            const values = response.data?.data || response.data;
            const previewData = {
                id: values.id,
                first_name: values.first_name,
                last_name: values.last_name,
                middle_name: values.middle_name,
                suffix: values.suffix,
                email: values.email,
                phone: values.phone,
                address: values.address,
                birth_date: values.birth_date,
                gender: values.gender,
                bio: values.bio,
                course_id: values.course_id,
                student_id: values.student_id,
                graduation_year: values.graduation_year,
                enrollment_year: values.enrollment_year,
                honors:
                    typeof values.honors === "string" &&
                    values.honors.trim() !== ""
                        ? JSON.parse(values.honors)
                        : Array.isArray(values.honors)
                          ? values.honors
                          : [],
                thesis_title: values.thesis_title,
                academic_achievements: values.academic_achievements,
                extracurricular: values.extracurricular,
                continue_education: values.continue_education,
                employment_status_id: values.employment_status_id,
                current_company: values.current_company,
                job_title: values.job_title,
                industry: values.industry,
                years_experience: values.years_experience,
                salary_range: values.salary_range,
                work_location: values.work_location,
                career_goals: values.career_goals,
                previous_companies: values.previous_companies,
                linkedin: values.linkedin,
                github: values.github,
                portfolio: values.portfolio,
                twitter: values.twitter,
                newsletter: values.newsletter,
                contactPermission: values.contactPermission,
                agreement: values.agreement,
                profileImage: values?.profile_image_url,
                idDocuments: values?.documents || [],
            };
            setAlumniPreviewData(previewData);
            setAlumniDetailsVisible(true);
        } catch (error) {
            // console.error("Failed to fetch alumni details:", error)
            message.error("Failed to load alumni profile");
        } finally {
            setAlumniDetailsLoading(false);
        }
    };

    const NotificationItem = ({ notification }) => {
        const notificationData = getNotificationData(notification);
        const categoryInfo = getCategoryInfo(notification);
        const isDark = currentTheme === "black";

        const getPriorityColor = (priority) => {
            switch (priority) {
                case "high":
                    return "#ff4d4f";
                case "medium":
                    return "#faad14";
                case "low":
                    return "#52c41a";
                default:
                    return "#1890ff";
            }
        };

        const formatTime = (timestamp) => {
            if (!timestamp) return "Just now";
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return "Just now";
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        };

        const handleNotificationClick = () => {
            if (!notification.read) {
                handleMarkAsRead(notification.id);
            }

            if (
                notificationData?.type === "profile_update" &&
                notificationData?.alumni_id
            ) {
                setDropdownVisible(false);
                handleViewAlumniProfile(notificationData.alumni_id);
            }

            if (
                notification.notifiable_type === "event_registration" &&
                notificationData?.event_id
            ) {
                setDropdownVisible(false);
                handleViewEventRegistrations(
                    notificationData.event_id,
                    notificationData.alumni_id,
                );
            }

            if (
                notification.notifiable_type === "new_event" &&
                notificationData?.event_id
            ) {
                setDropdownVisible(false);
                handleViewEventDetails(notificationData.event_id);
            }

            if (
                notification.notifiable_type === "announcement" ||
                notification.notifiable_type === "new_announcement" ||
                notificationData?.type === "announcement"
            ) {
                setDropdownVisible(false);
                handleViewAnnouncement(notificationData?.announcement_id);
            }

            if (
                notification.notifiable_type === "feedback_report_update" &&
                notificationData?.feedback_report_id
            ) {
                setDropdownVisible(false);
                handleViewFeedbackReport(notificationData.feedback_report_id, {
                    id: notificationData.feedback_report_id,
                    status: notificationData.status,
                    admin_notes: notificationData.admin_notes,
                    type: notificationData.feedback_type,
                    area: notificationData.feedback_area,
                });
            }

            // Admin-facing: an alumni just submitted a new feedback report.
            // Deep-link straight into the admin Feedback Reports page with
            // ?id= so it can open that exact report (see
            // AtmsFeedbackReportsPage.js), same pattern as
            // handleViewAnnouncement above.
            if (
                notification.notifiable_type === "new_feedback_report" &&
                notificationData?.feedback_report_id
            ) {
                setDropdownVisible(false);
                history.push(
                    `/feedback-reports?id=${notificationData.feedback_report_id}`,
                );
            }

            // "admin_message" (alumni got a message from the admin) and
            // "alumni_message" (admin's combined unread-across-all-alumni
            // count) both just deep-link to the Messages feature itself
            // — same /messages route renders the right view for each
            // role (see routes/index.js). The admin variant intentionally
            // does NOT jump into one specific alumni's thread, so it
            // can't be mistaken for a per-alumni notification.
            if (
                notification.notifiable_type === "admin_message" ||
                notification.notifiable_type === "alumni_message" ||
                notificationData?.type === "admin_message" ||
                notificationData?.type === "alumni_message"
            ) {
                setDropdownVisible(false);
                history.push("/messages");
            }
        };

        const getAlumniAvatar = () => {
            if (
                notificationData?.type === "department_head_login" ||
                (notification.title &&
                    notification.title
                        .toLowerCase()
                        .includes("department head")) ||
                (notification.message &&
                    notification.message
                        .toLowerCase()
                        .includes("department head"))
            ) {
                const courseId = notificationData?.course_id;
                switch (courseId) {
                    case 1:
                    case "1":
                        return avatarBSIT;
                    case 2:
                    case "2":
                        return avatarBSED;
                    case 3:
                    case "3":
                        return avatarBEED;
                    case 4:
                    case "4":
                        return avatarBSBA;
                    default:
                        return avatarGuidance;
                }
            }

            if (notificationData?.alumni_profile_image) {
                return withImageCacheBuster(
                    notificationData.alumni_profile_image,
                );
            }
            if (notificationData?.profile_image_url) {
                return withImageCacheBuster(notificationData.profile_image_url);
            }
            if (notification.sender?.avatar) {
                return withImageCacheBuster(notification.sender.avatar);
            }
            return null;
        };

        const alumniAvatar = getAlumniAvatar();

        const getEventImage = () => {
            if (
                notification.notifiable_type === "new_event" &&
                notificationData?.event_images?.length > 0
            ) {
                return notificationData.event_images[0];
            }
            return null;
        };

        const eventImage = getEventImage();

        const isAnnouncementNotification =
            notification.notifiable_type === "announcement" ||
            notification.notifiable_type === "new_announcement" ||
            notificationData?.type === "announcement";

        // The API's top-level title/message for announcement notifications
        // is just the generic "New Announcement" wrapper text — the real
        // title lives in notificationData.announcement_title (backend also
        // duplicates it into data.message). Prefer that so we show
        // "Announcement: Homecoming 2026" instead of "Announcement: New
        // Announcement".
        const announcementTitle =
            notificationData?.announcement_title ||
            notification.message ||
            notificationData?.message ||
            "";

        const rawNotificationTitle =
            notification.title ||
            notificationData?.title ||
            "Guidance Counselor (Admin)";
        const notificationTitle = isAnnouncementNotification
            ? `Announcement: ${announcementTitle || rawNotificationTitle}`
            : rawNotificationTitle;
        const notificationMessage = isAnnouncementNotification
            ? notificationData?.announcement_excerpt ||
              notification.message ||
              notificationData?.message ||
              ""
            : notification.message || notificationData?.message || "";

        return (
            <List.Item
                className={notification.read ? "" : "unread"}
                style={{
                    padding: "12px 16px",
                    background: notification.read
                        ? isDark
                            ? "#0a0a0a"
                            : "#fff"
                        : isDark
                          ? "#1a1a2e"
                          : "#f0f7ff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderBottom: isDark
                        ? "1px solid #333"
                        : "1px solid #f0f0f0",
                    borderLeft: notification.read
                        ? "none"
                        : `3px solid ${getPriorityColor(notification.priority)}`,
                    borderRadius: "0",
                }}
                onClick={handleNotificationClick}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        width: "100%",
                    }}
                >
                    {notification.notifiable_type === "new_event" &&
                    eventImage ? (
                        <div style={{ marginRight: 12, flexShrink: 0 }}>
                            <Image
                                src={eventImage || "/placeholder.svg"}
                                alt="Event"
                                width={50}
                                height={50}
                                style={{ borderRadius: 8, objectFit: "cover" }}
                                preview={false}
                                fallback="/community-event.png"
                            />
                        </div>
                    ) : (
                        <Avatar
                            size={40}
                            src={
                                // "alumni_message" is the admin's combined
                                // inbox notification — it isn't about any
                                // one alumni, so there's no real profile
                                // photo to show. Previously this fell
                                // through to the generic default-person
                                // silhouette (alumniAvatar resolves to
                                // null here), which read as a placeholder
                                // photo rather than an icon. Force the
                                // TeamOutlined icon below instead.
                                notification.notifiable_type ===
                                "alumni_message"
                                    ? undefined
                                    : role === "alumni"
                                      ? avatarGuidance
                                      : alumniAvatar
                            }
                            icon={
                                notification.notifiable_type ===
                                "alumni_message" ? (
                                    <TeamOutlined />
                                ) : (
                                    !alumniAvatar &&
                                    role !== "alumni" && <UserOutlined />
                                )
                            }
                            style={{
                                marginRight: 12,
                                background:
                                    notification.notifiable_type ===
                                    "alumni_message"
                                        ? "#2563eb"
                                        : alumniAvatar
                                          ? "transparent"
                                          : notification.read
                                            ? "#d9d9d9"
                                            : "#1890ff",
                                border:
                                    notification.notifiable_type ===
                                    "alumni_message"
                                        ? "none"
                                        : alumniAvatar
                                          ? isDark
                                              ? "1px solid #333"
                                              : "1px solid #e8e8e8"
                                          : "none",
                            }}
                        />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 4,
                                flexWrap: "wrap",
                                gap: 4,
                            }}
                        >
                            <Text
                                strong
                                style={{
                                    fontSize: "13px",
                                    lineHeight: "1.3",
                                    color: isDark ? "#fff" : undefined,
                                }}
                            >
                                {notificationTitle}
                            </Text>
                            <Tag
                                color={categoryInfo.color}
                                style={{
                                    fontSize: "10px",
                                    padding: "0 6px",
                                    borderRadius: 10,
                                    lineHeight: "18px",
                                    margin: 0,
                                }}
                            >
                                {categoryInfo.icon} {categoryInfo.label}
                            </Tag>
                        </div>
                        <Text
                            style={{
                                fontSize: "12px",
                                color: isDark ? "#a0a0a0" : "#666",
                                lineHeight: "1.4",
                                display: "block",
                                marginBottom: 4,
                            }}
                        >
                            {notificationMessage}
                        </Text>
                        {notification.notifiable_type === "new_event" &&
                            notificationData?.event_title && (
                                <Text
                                    strong
                                    style={{
                                        fontSize: "12px",
                                        color: "#1890ff",
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    {notificationData.event_title}
                                </Text>
                            )}
                        {notification.notifiable_type === "new_event" &&
                            notificationData?.event_id && (
                                <Button
                                    type="link"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    style={{
                                        padding: 0,
                                        fontSize: "11px",
                                        height: "auto",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!notification.read) {
                                            handleMarkAsRead(notification.id);
                                        }
                                        setDropdownVisible(false);
                                        handleViewEventDetails(
                                            notificationData.event_id,
                                        );
                                    }}
                                >
                                    View Details
                                </Button>
                            )}
                        {notification.notifiable_type ===
                            "event_registration" &&
                            notificationData?.event_id && (
                                <Button
                                    type="link"
                                    size="small"
                                    icon={<TeamOutlined />}
                                    style={{
                                        padding: 0,
                                        fontSize: "11px",
                                        height: "auto",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!notification.read) {
                                            handleMarkAsRead(notification.id);
                                        }
                                        setDropdownVisible(false);
                                        handleViewEventRegistrations(
                                            notificationData.event_id,
                                            notificationData.alumni_id,
                                        );
                                    }}
                                >
                                    View Registrations
                                </Button>
                            )}
                        {isAnnouncementNotification && (
                            <Button
                                type="link"
                                size="small"
                                icon={<SoundOutlined />}
                                style={{
                                    padding: 0,
                                    fontSize: "11px",
                                    height: "auto",
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!notification.read) {
                                        handleMarkAsRead(notification.id);
                                    }
                                    setDropdownVisible(false);
                                    handleViewAnnouncement(
                                        notificationData?.announcement_id,
                                    );
                                }}
                            >
                                View Announcement
                            </Button>
                        )}
                        {notification.notifiable_type ===
                            "feedback_report_update" &&
                            notificationData?.feedback_report_id && (
                                <Button
                                    type="link"
                                    size="small"
                                    icon={<CommentOutlined />}
                                    style={{
                                        padding: 0,
                                        fontSize: "11px",
                                        height: "auto",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!notification.read) {
                                            handleMarkAsRead(notification.id);
                                        }
                                        setDropdownVisible(false);
                                        handleViewFeedbackReport(
                                            notificationData.feedback_report_id,
                                            {
                                                id: notificationData.feedback_report_id,
                                                status: notificationData.status,
                                                admin_notes:
                                                    notificationData.admin_notes,
                                                type: notificationData.feedback_type,
                                                area: notificationData.feedback_area,
                                            },
                                        );
                                    }}
                                >
                                    View Feedback
                                </Button>
                            )}
                        {notification.notifiable_type ===
                            "new_feedback_report" &&
                            notificationData?.feedback_report_id && (
                                <Button
                                    type="link"
                                    size="small"
                                    icon={<CommentOutlined />}
                                    style={{
                                        padding: 0,
                                        fontSize: "11px",
                                        height: "auto",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!notification.read) {
                                            handleMarkAsRead(notification.id);
                                        }
                                        setDropdownVisible(false);
                                        history.push(
                                            `/feedback-reports?id=${notificationData.feedback_report_id}`,
                                        );
                                    }}
                                >
                                    View Report
                                </Button>
                            )}
                        {(notification.notifiable_type === "admin_message" ||
                            notification.notifiable_type ===
                                "alumni_message" ||
                            notificationData?.type === "admin_message" ||
                            notificationData?.type === "alumni_message") && (
                            <Button
                                type="link"
                                size="small"
                                icon={<MessageOutlined />}
                                style={{
                                    padding: 0,
                                    fontSize: "11px",
                                    height: "auto",
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!notification.read) {
                                        handleMarkAsRead(notification.id);
                                    }
                                    setDropdownVisible(false);
                                    history.push("/messages");
                                }}
                            >
                                Open Messages
                            </Button>
                        )}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Space size="small">
                                <Text
                                    style={{
                                        fontSize: "11px",
                                        color: isDark ? "#a0a0a0" : "#999",
                                    }}
                                >
                                    {role === "alumni"
                                        ? "Guidance Counselor (Admin)"
                                        : notification.sender?.name ||
                                          notificationData?.created_by ||
                                          notificationData?.alumni_name ||
                                          ""}
                                </Text>
                                {!notification.read && (
                                    <Badge dot color="#1890ff" size="small" />
                                )}
                            </Space>
                            <Text
                                style={{
                                    fontSize: "10px",
                                    color: isDark ? "#a0a0a0" : "#999",
                                }}
                            >
                                {formatTime(notification.created_at)}
                            </Text>
                        </div>
                    </div>
                </div>
            </List.Item>
        );
    };

    const renderSettingsModal = () => (
        <Modal
            title={
                <Space>
                    <SettingOutlined />
                    <span>Notification Settings</span>
                </Space>
            }
            open={settingsModalVisible}
            onCancel={() => setSettingsModalVisible(false)}
            footer={[
                <Button
                    key="close"
                    onClick={() => setSettingsModalVisible(false)}
                >
                    Close
                </Button>,
            ]}
            width={450}
        >
            <div style={{ padding: "16px 0" }}>
                <Text
                    type="secondary"
                    style={{
                        display: "block",
                        fontSize: 12,
                        marginBottom: 12,
                    }}
                >
                    A "Default" tag means you haven't changed this setting
                    yet — it's using the standard on/off starting value.
                    Toggling it saves your own choice for your account.
                </Text>
                <List>
                    {/* Email Notifications toggle removed per request.
                        Original block kept here for reference:
                    <List.Item
                        actions={[
                            <Switch
                                key="email"
                                checked={settings.emailNotifications}
                                loading={!settingsLoaded}
                                onChange={(checked) =>
                                    handleSettingsChange(
                                        "emailNotifications",
                                        checked,
                                    )
                                }
                            />,
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <MailOutlined
                                    style={{ fontSize: 20, color: "#1890ff" }}
                                />
                            }
                            title={
                                <Space size={6}>
                                    <span>Email Notifications</span>
                                    {settingsLoaded &&
                                        settings.emailNotifications ===
                                            DEFAULT_SETTINGS.emailNotifications && (
                                            <Tag
                                                style={{
                                                    fontSize: 10,
                                                    lineHeight: "16px",
                                                    padding: "0 6px",
                                                    margin: 0,
                                                }}
                                            >
                                                Default:{" "}
                                                {DEFAULT_SETTINGS.emailNotifications
                                                    ? "On"
                                                    : "Off"}
                                            </Tag>
                                        )}
                                </Space>
                            }
                            description="Receive notifications via email"
                        />
                    </List.Item>
                    */}
                    <List.Item
                        actions={[
                            <Switch
                                key="sound"
                                checked={settings.soundEnabled}
                                loading={!settingsLoaded}
                                onChange={(checked) =>
                                    handleSettingsChange(
                                        "soundEnabled",
                                        checked,
                                    )
                                }
                            />,
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <SoundOutlined
                                    style={{ fontSize: 20, color: "#52c41a" }}
                                />
                            }
                            title={
                                <Space size={6}>
                                    <span>Sound Notifications</span>
                                    {settingsLoaded &&
                                        settings.soundEnabled ===
                                            DEFAULT_SETTINGS.soundEnabled && (
                                            <Tag
                                                style={{
                                                    fontSize: 10,
                                                    lineHeight: "16px",
                                                    padding: "0 6px",
                                                    margin: 0,
                                                }}
                                            >
                                                Default:{" "}
                                                {DEFAULT_SETTINGS.soundEnabled
                                                    ? "On"
                                                    : "Off"}
                                            </Tag>
                                        )}
                                </Space>
                            }
                            description="Play sound when new notification arrives"
                        />
                    </List.Item>
                    <List.Item
                        actions={[
                            <Switch
                                key="push"
                                checked={settings.pushNotifications !== false}
                                loading={!settingsLoaded}
                                onChange={(checked) =>
                                    handleSettingsChange(
                                        "pushNotifications",
                                        checked,
                                    )
                                }
                            />,
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <BellOutlined
                                    style={{ fontSize: 20, color: "#faad14" }}
                                />
                            }
                            title={
                                <Space size={6}>
                                    <span>Push Notifications</span>
                                    {settingsLoaded &&
                                        (settings.pushNotifications !==
                                            false) ===
                                            DEFAULT_SETTINGS.pushNotifications && (
                                            <Tag
                                                style={{
                                                    fontSize: 10,
                                                    lineHeight: "16px",
                                                    padding: "0 6px",
                                                    margin: 0,
                                                }}
                                            >
                                                Default:{" "}
                                                {DEFAULT_SETTINGS.pushNotifications
                                                    ? "On"
                                                    : "Off"}
                                            </Tag>
                                        )}
                                </Space>
                            }
                            description="Receive push notifications in browser"
                        />
                    </List.Item>
                </List>
            </div>
        </Modal>
    );

    const getNotificationAlumniAvatar = (notification) => {
        const currentRole = secureLocalStorage.getItem("userRole");
        if (currentRole === "alumni") {
            return avatarGuidance;
        }

        const notificationData = getNotificationData(notification);

        if (
            notificationData?.type === "department_head_login" ||
            (notification.title &&
                notification.title.toLowerCase().includes("department head")) ||
            (notification.message &&
                notification.message.toLowerCase().includes("department head"))
        ) {
            const courseId = notificationData?.course_id;
            switch (courseId) {
                case 1:
                case "1":
                    return avatarBSIT;
                case 2:
                case "2":
                    return avatarBSED;
                case 3:
                case "3":
                    return avatarBEED;
                case 4:
                case "4":
                    return avatarBSBA;
                default:
                    return avatarGuidance;
            }
        }

        if (notificationData?.alumni_profile_image) {
            return withImageCacheBuster(notificationData.alumni_profile_image);
        }
        if (notificationData?.profile_image_url) {
            return withImageCacheBuster(notificationData.profile_image_url);
        }
        if (notification.sender?.avatar) {
            return withImageCacheBuster(notification.sender.avatar);
        }
        return null;
    };

    const getNotificationEventImage = (notification) => {
        const notificationData = getNotificationData(notification);
        if (
            notification.notifiable_type === "new_event" &&
            notificationData?.event_images?.length > 0
        ) {
            return notificationData.event_images[0];
        }
        return null;
    };

    const renderAllNotificationsModal = () => {
        const filteredNotifications =
            filterNotificationsByCategory(allNotifications);
        const categoryCounts = getCategoryCounts(allNotifications);
        const isDark = currentTheme === "black";

        return (
            <Modal
                title={
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingRight: 24,
                        }}
                    >
                        <Space>
                            <BellOutlined />
                            <span>All Notifications</span>
                            <Badge
                                count={totalNotifications}
                                style={{ marginLeft: 8 }}
                                overflowCount={9999}
                            />
                        </Space>
                    </div>
                }
                open={allNotificationsModalVisible}
                onCancel={() => setAllNotificationsModalVisible(false)}
                footer={null}
                className="all-notifications-modal"
                width={isMobile ? "95%" : 800}
                style={{
                    top: isMobile ? 8 : undefined,
                    maxWidth: isMobile ? "95vw" : undefined,
                    paddingBottom: 0,
                }}
                styles={{ body: { padding: 0 } }}
            >
                <div
                    className="theme-card-bg"
                    style={{
                        padding: "12px 16px",
                        borderBottom: isDark
                            ? "1px solid #333"
                            : "1px solid #f0f0f0",
                    }}
                >
                    <div style={{ marginBottom: 12 }}>
                        <Text
                            strong
                            className="theme-text-secondary"
                            style={{
                                display: "block",
                                marginBottom: 8,
                                fontSize: 12,
                            }}
                        >
                            Filter by Category:
                        </Text>
                        <Space wrap size={[8, 8]}>
                            {Object.entries(visibleNotificationCategories).map(
                                ([key, category]) => (
                                    <Button
                                        key={key}
                                        size="small"
                                        type={
                                            activeCategory === key
                                                ? "primary"
                                                : "default"
                                        }
                                        icon={category.icon}
                                        onClick={() => setActiveCategory(key)}
                                        style={{
                                            borderColor:
                                                activeCategory === key
                                                    ? category.color
                                                    : undefined,
                                            background:
                                                activeCategory === key
                                                    ? category.color
                                                    : undefined,
                                        }}
                                    >
                                        {category.label}
                                        {categoryCounts[key] > 0 && (
                                            <Badge
                                                count={categoryCounts[key]}
                                                size="small"
                                                overflowCount={9999}
                                                style={{
                                                    marginLeft: 6,
                                                    backgroundColor:
                                                        activeCategory === key
                                                            ? "#fff"
                                                            : category.color,
                                                    color:
                                                        activeCategory === key
                                                            ? category.color
                                                            : "#fff",
                                                }}
                                            />
                                        )}
                                    </Button>
                                ),
                            )}
                        </Space>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            // Without wrap, this row was squeezed on narrow
                            // screens and the Refresh button's label got
                            // clipped down to just "Re". Wrapping lets the
                            // Refresh button drop to its own line instead.
                            flexWrap: "wrap",
                            gap: 8,
                        }}
                    >
                        <Space wrap>
                            <Button
                                size="small"
                                type={filterUnread ? "primary" : "default"}
                                onClick={() => setFilterUnread(!filterUnread)}
                            >
                                {filterUnread ? "Show All" : "Show Unread Only"}
                            </Button>
                            {unreadCount > 0 && (
                                <Button
                                    size="small"
                                    icon={<CheckOutlined />}
                                    onClick={handleMarkAllAsRead}
                                >
                                    Mark All as Read
                                </Button>
                            )}
                        </Space>
                        <Button
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={() => fetchAllNotifications(currentPage)}
                            loading={loadingMore}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>

                <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                    {loadingMore ? (
                        <div style={{ padding: 40, textAlign: "center" }}>
                            <Spin />
                            <div
                                className="theme-text-secondary"
                                style={{ marginTop: 10 }}
                            >
                                Loading notifications...
                            </div>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                activeCategory !== "all"
                                    ? `No ${NOTIFICATION_CATEGORIES[activeCategory].label.toLowerCase()} notifications`
                                    : filterUnread
                                      ? "No unread notifications"
                                      : "No notifications"
                            }
                            style={{ padding: 40 }}
                        />
                    ) : (
                        <List
                            dataSource={filteredNotifications}
                            renderItem={(notification) => {
                                const alumniAvatar =
                                    getNotificationAlumniAvatar(notification);
                                const eventImage =
                                    getNotificationEventImage(notification);
                                const notificationData =
                                    getNotificationData(notification);
                                const categoryInfo =
                                    getCategoryInfo(notification);

                                const isAnnouncementNotification =
                                    notification.notifiable_type ===
                                        "announcement" ||
                                    notification.notifiable_type ===
                                        "new_announcement" ||
                                    notificationData?.type === "announcement";
                                const announcementTitle =
                                    notificationData?.announcement_title ||
                                    notification.message ||
                                    notificationData?.message ||
                                    "";
                                const rawNotificationTitle =
                                    notification.title ||
                                    notificationData?.title ||
                                    "Guidance Counselor (Admin)";
                                const notificationTitle =
                                    isAnnouncementNotification
                                        ? `Announcement: ${announcementTitle || rawNotificationTitle}`
                                        : rawNotificationTitle;
                                const notificationMessage =
                                    isAnnouncementNotification
                                        ? notificationData?.announcement_excerpt ||
                                          notification.message ||
                                          notificationData?.message ||
                                          ""
                                        : notification.message ||
                                          notificationData?.message ||
                                          "";

                                return (
                                    <List.Item
                                        className={`notification-list-item ${notification.read ? "" : "unread"}`}
                                        style={{
                                            padding: "12px 16px",
                                            cursor: "pointer",
                                        }}
                                        actions={[
                                            !notification.read && (
                                                <Tooltip
                                                    title="Mark as read"
                                                    key="read"
                                                    trigger={
                                                        isMobile
                                                            ? []
                                                            : ["hover"]
                                                    }
                                                    open={
                                                        isMobile
                                                            ? false
                                                            : undefined
                                                    }
                                                >
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<CheckOutlined />}
                                                        aria-label="Mark as read"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(
                                                                notification.id,
                                                            );
                                                        }}
                                                    />
                                                </Tooltip>
                                            ),
                                            <Popconfirm
                                                key="delete"
                                                title="Delete this notification?"
                                                onConfirm={(e) => {
                                                    e?.stopPropagation();
                                                    handleDeleteNotification(
                                                        notification.id,
                                                    );
                                                }}
                                                okText="Yes"
                                                cancelText="No"
                                            >
                                                <Tooltip
                                                    title="Delete"
                                                    trigger={
                                                        isMobile
                                                            ? []
                                                            : ["hover"]
                                                    }
                                                    open={
                                                        isMobile
                                                            ? false
                                                            : undefined
                                                    }
                                                >
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={
                                                            <DeleteOutlined />
                                                        }
                                                        aria-label="Delete"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                </Tooltip>
                                            </Popconfirm>,
                                        ].filter(Boolean)}
                                        onClick={() => {
                                            if (!notification.read) {
                                                handleMarkAsRead(
                                                    notification.id,
                                                );
                                            }
                                            if (
                                                notificationData?.type ===
                                                    "profile_update" &&
                                                notificationData?.alumni_id
                                            ) {
                                                setAllNotificationsModalVisible(
                                                    false,
                                                );
                                                handleViewAlumniProfile(
                                                    notificationData.alumni_id,
                                                );
                                            }
                                            if (
                                                notification.notifiable_type ===
                                                    "event_registration" &&
                                                notificationData?.event_id
                                            ) {
                                                setAllNotificationsModalVisible(
                                                    false,
                                                );
                                                handleViewEventRegistrations(
                                                    notificationData.event_id,
                                                    notificationData.alumni_id,
                                                );
                                            }
                                            if (
                                                notification.notifiable_type ===
                                                    "new_event" &&
                                                notificationData?.event_id
                                            ) {
                                                setAllNotificationsModalVisible(
                                                    false,
                                                );
                                                handleViewEventDetails(
                                                    notificationData.event_id,
                                                );
                                            }
                                            if (
                                                notification.notifiable_type ===
                                                    "announcement" ||
                                                notification.notifiable_type ===
                                                    "new_announcement" ||
                                                notificationData?.type ===
                                                    "announcement"
                                            ) {
                                                setAllNotificationsModalVisible(
                                                    false,
                                                );
                                                handleViewAnnouncement(
                                                    notificationData?.announcement_id,
                                                );
                                            }
                                            if (
                                                notification.notifiable_type ===
                                                    "feedback_report_update" &&
                                                notificationData?.feedback_report_id
                                            ) {
                                                setAllNotificationsModalVisible(
                                                    false,
                                                );
                                                handleViewFeedbackReport(
                                                    notificationData.feedback_report_id,
                                                    {
                                                        id: notificationData.feedback_report_id,
                                                        status: notificationData.status,
                                                        admin_notes:
                                                            notificationData.admin_notes,
                                                        type: notificationData.feedback_type,
                                                        area: notificationData.feedback_area,
                                                    },
                                                );
                                            }
                                            if (
                                                notification.notifiable_type ===
                                                    "new_feedback_report" &&
                                                notificationData?.feedback_report_id
                                            ) {
                                                setAllNotificationsModalVisible(
                                                    false,
                                                );
                                                history.push(
                                                    `/feedback-reports?id=${notificationData.feedback_report_id}`,
                                                );
                                            }
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                width: "100%",
                                            }}
                                        >
                                            {notification.notifiable_type ===
                                                "new_event" && eventImage ? (
                                                <div
                                                    style={{
                                                        marginRight: 12,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Image
                                                        src={
                                                            eventImage ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt="Event"
                                                        width={50}
                                                        height={50}
                                                        style={{
                                                            borderRadius: 8,
                                                            objectFit: "cover",
                                                        }}
                                                        preview={false}
                                                        fallback="/community-event.png"
                                                    />
                                                </div>
                                            ) : (
                                                <Avatar
                                                    size={40}
                                                    src={
                                                        notification.notifiable_type ===
                                                        "alumni_message"
                                                            ? undefined
                                                            : alumniAvatar
                                                    }
                                                    icon={
                                                        notification.notifiable_type ===
                                                        "alumni_message" ? (
                                                            <TeamOutlined />
                                                        ) : (
                                                            !alumniAvatar && (
                                                                <UserOutlined />
                                                            )
                                                        )
                                                    }
                                                    className="theme-avatar-border"
                                                    style={{
                                                        marginRight: 12,
                                                        background:
                                                            notification.notifiable_type ===
                                                            "alumni_message"
                                                                ? "#2563eb"
                                                                : alumniAvatar
                                                                  ? "transparent"
                                                                  : notification.read
                                                                    ? "#d9d9d9"
                                                                    : "#1890ff",
                                                    }}
                                                />
                                            )}
                                            <div
                                                style={{ flex: 1, minWidth: 0 }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems:
                                                            "flex-start",
                                                        marginBottom: 4,
                                                        flexWrap: "wrap",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <Text
                                                        strong
                                                        style={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {notificationTitle}
                                                    </Text>
                                                    <Tag
                                                        color={
                                                            categoryInfo.color
                                                        }
                                                        style={{
                                                            fontSize: "10px",
                                                            padding: "0 6px",
                                                            borderRadius: 10,
                                                            lineHeight: "18px",
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {categoryInfo.icon}{" "}
                                                        {categoryInfo.label}
                                                    </Tag>
                                                </div>
                                                <Text
                                                    className="theme-text-secondary"
                                                    style={{
                                                        fontSize: "12px",
                                                        display: "block",
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    {notificationMessage}
                                                </Text>
                                                {notification.notifiable_type ===
                                                    "new_event" &&
                                                    notificationData?.event_title && (
                                                        <Text
                                                            strong
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#1890ff",
                                                                display:
                                                                    "block",
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            {
                                                                notificationData.event_title
                                                            }
                                                        </Text>
                                                    )}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Space size="small">
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                            }}
                                                        >
                                                            {notification.sender
                                                                ?.name ||
                                                                notificationData?.created_by ||
                                                                notificationData?.alumni_name ||
                                                                ""}
                                                        </Text>
                                                        {!notification.read && (
                                                            <Badge
                                                                dot
                                                                color="#1890ff"
                                                                size="small"
                                                            />
                                                        )}
                                                    </Space>
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: "10px",
                                                        }}
                                                    >
                                                        {notification.created_at
                                                            ? (() => {
                                                                  const date =
                                                                      new Date(
                                                                          notification.created_at,
                                                                      );
                                                                  const now =
                                                                      new Date();
                                                                  const diffMs =
                                                                      now -
                                                                      date;
                                                                  const diffMins =
                                                                      Math.floor(
                                                                          diffMs /
                                                                              60000,
                                                                      );
                                                                  const diffHours =
                                                                      Math.floor(
                                                                          diffMs /
                                                                              3600000,
                                                                      );
                                                                  const diffDays =
                                                                      Math.floor(
                                                                          diffMs /
                                                                              86400000,
                                                                      );
                                                                  if (
                                                                      diffMins <
                                                                      1
                                                                  )
                                                                      return "Just now";
                                                                  if (
                                                                      diffMins <
                                                                      60
                                                                  )
                                                                      return `${diffMins}m ago`;
                                                                  if (
                                                                      diffHours <
                                                                      24
                                                                  )
                                                                      return `${diffHours}h ago`;
                                                                  if (
                                                                      diffDays <
                                                                      7
                                                                  )
                                                                      return `${diffDays}d ago`;
                                                                  return date.toLocaleDateString();
                                                              })()
                                                            : "Just now"}
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    )}
                </div>

                {totalNotifications > modalPerPage && (
                    <div
                        className="theme-footer-bg"
                        style={{
                            borderTop: isDark
                                ? "1px solid #333"
                                : "1px solid #f0f0f0",
                            padding: "16px",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <Pagination
                            current={currentPage}
                            total={totalNotifications}
                            pageSize={modalPerPage}
                            onChange={(page) => {
                                fetchAllNotifications(page);
                            }}
                            showSizeChanger={false}
                            showTotal={(total, range) =>
                                `${range[0]}-${range[1]} of ${total} notifications`
                            }
                        />
                    </div>
                )}
            </Modal>
        );
    };

    const renderEventRegistrationsModal = () => {
        const isDark = currentTheme === "black";
        return (
            <Modal
                title={
                    <Space>
                        <TeamOutlined style={{ color: "#1890ff" }} />
                        <span>
                            Event Registrations:{" "}
                            {selectedEventForRegistrations?.title}
                        </span>
                    </Space>
                }
                open={eventRegistrationsModalVisible}
                onCancel={() => {
                    setEventRegistrationsModalVisible(false);
                    setSelectedEventForRegistrations(null);
                    setEventRegistrations([]);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setEventRegistrationsModalVisible(false);
                            setSelectedEventForRegistrations(null);
                            setEventRegistrations([]);
                        }}
                    >
                        Close
                    </Button>,
                    <Button
                        key="viewAll"
                        type="primary"
                        onClick={() => {
                            setEventRegistrationsModalVisible(false);
                            history.push("/events");
                        }}
                    >
                        Go to Events Page
                    </Button>,
                ]}
                width={900}
            >
                <Spin spinning={eventRegistrationsLoading}>
                    {selectedEventForRegistrations && (
                        <div
                            className="theme-card-bg"
                            style={{
                                marginBottom: 16,
                                padding: 16,
                                borderRadius: 8,
                            }}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Text className="theme-text-secondary">
                                        Event Date:
                                    </Text>
                                    <Text strong style={{ display: "block" }}>
                                        {new Date(
                                            selectedEventForRegistrations.date,
                                        ).toLocaleDateString()}
                                    </Text>
                                </Col>
                                <Col span={12}>
                                    <Text className="theme-text-secondary">
                                        Location:
                                    </Text>
                                    <Text strong style={{ display: "block" }}>
                                        {selectedEventForRegistrations.location}
                                    </Text>
                                </Col>
                            </Row>
                        </div>
                    )}
                    <List
                        dataSource={eventRegistrations}
                        locale={{ emptyText: "No registrations yet" }}
                        renderItem={(registration, index) => (
                            <List.Item
                                className={`registration-list-item ${registration.isHighlighted ? "highlighted" : ""}`}
                                style={{
                                    padding: "12px 16px",
                                }}
                            >
                                <List.Item.Meta
                                    title={
                                        <Space>
                                            <Text strong>
                                                {registration.alumni?.name ||
                                                    "N/A"}
                                            </Text>
                                            {registration.isHighlighted && (
                                                <Badge
                                                    color="#1890ff"
                                                    text="Just Registered"
                                                    style={{ fontSize: 11 }}
                                                />
                                            )}
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size={0}>
                                            <Text
                                                className="theme-text-secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Email:{" "}
                                                {registration.alumni?.email ||
                                                    "N/A"}
                                            </Text>
                                            <Text
                                                className="theme-text-secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Contact:{" "}
                                                {registration.alumni
                                                    ?.contact_number || "N/A"}
                                            </Text>
                                            <Text
                                                className="theme-text-secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Batch Year:{" "}
                                                {registration.alumni
                                                    ?.batch_year || "N/A"}
                                            </Text>
                                        </Space>
                                    }
                                />
                                <div>
                                    <Text
                                        className="theme-text-secondary"
                                        style={{ fontSize: 11 }}
                                    >
                                        Registered:{" "}
                                        {registration.registration_date
                                            ? new Date(
                                                  registration.registration_date,
                                              ).toLocaleString()
                                            : new Date(
                                                  registration.created_at,
                                              ).toLocaleString()}
                                    </Text>
                                </div>
                            </List.Item>
                        )}
                    />
                </Spin>
            </Modal>
        );
    };

    const renderEventDetailsModal = () => {
        if (!selectedEventDetails) return null;
        const isDark = currentTheme === "black";

        return (
            <Modal
                title={
                    <Space>
                        <CalendarOutlined style={{ color: "#1890ff" }} />
                        <span>{selectedEventDetails.title}</span>
                    </Space>
                }
                open={eventDetailsModalVisible}
                onCancel={() => {
                    setEventDetailsModalVisible(false);
                    setSelectedEventDetails(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setEventDetailsModalVisible(false);
                            setSelectedEventDetails(null);
                        }}
                    >
                        Close
                    </Button>,
                    <Button
                        key="viewAll"
                        type="primary"
                        onClick={() => {
                            setEventDetailsModalVisible(false);
                            history.push("/events");
                        }}
                    >
                        Go to Events Page
                    </Button>,
                ]}
                width={700}
            >
                <Spin spinning={eventDetailsLoading}>
                    {selectedEventDetails && (
                        <div>
                            {selectedEventDetails.image_urls &&
                                selectedEventDetails.image_urls.length > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                        <Image
                                            src={
                                                selectedEventDetails
                                                    .image_urls[0] ||
                                                "/placeholder.svg"
                                            }
                                            alt={selectedEventDetails.title}
                                            style={{
                                                width: "100%",
                                                maxHeight: 300,
                                                objectFit: "cover",
                                                borderRadius: 8,
                                            }}
                                            fallback="/community-event.png"
                                        />
                                    </div>
                                )}

                            <div
                                className="theme-card-bg"
                                style={{
                                    padding: 16,
                                    borderRadius: 8,
                                    marginBottom: 16,
                                }}
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Space>
                                            <CalendarOutlined
                                                style={{ color: "#1890ff" }}
                                            />
                                            <div>
                                                <Text
                                                    className="theme-text-secondary"
                                                    style={{
                                                        display: "block",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Date
                                                </Text>
                                                <Text strong>
                                                    {new Date(
                                                        selectedEventDetails.date,
                                                    ).toLocaleDateString()}
                                                </Text>
                                            </div>
                                        </Space>
                                    </Col>
                                    <Col span={12}>
                                        <Space>
                                            <span style={{ fontSize: 16 }}>
                                                🕐
                                            </span>
                                            <div>
                                                <Text
                                                    className="theme-text-secondary"
                                                    style={{
                                                        display: "block",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Time
                                                </Text>
                                                <Text strong>
                                                    {formatEventTime(
                                                        selectedEventDetails.start_time,
                                                    )}{" "}
                                                    -{" "}
                                                    {formatEventTime(
                                                        selectedEventDetails.end_time,
                                                    )}
                                                </Text>
                                            </div>
                                        </Space>
                                    </Col>
                                    <Col span={12}>
                                        <Space>
                                            <span style={{ fontSize: 16 }}>
                                                📍
                                            </span>
                                            <div>
                                                <Text
                                                    className="theme-text-secondary"
                                                    style={{
                                                        display: "block",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Location
                                                </Text>
                                                <Text strong>
                                                    {
                                                        selectedEventDetails.location
                                                    }
                                                </Text>
                                            </div>
                                        </Space>
                                    </Col>
                                    <Col span={12}>
                                        <Space>
                                            <TeamOutlined
                                                style={{ color: "#52c41a" }}
                                            />
                                            <div>
                                                <Text
                                                    className="theme-text-secondary"
                                                    style={{
                                                        display: "block",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Capacity
                                                </Text>
                                                <Text strong>
                                                    {selectedEventDetails.registered_count ||
                                                        0}{" "}
                                                    /{" "}
                                                    {
                                                        selectedEventDetails.capacity
                                                    }
                                                </Text>
                                            </div>
                                        </Space>
                                    </Col>
                                </Row>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <Title level={5}>Description</Title>
                                <Text>{selectedEventDetails.description}</Text>
                            </div>

                            <div>
                                <Text className="theme-text-secondary">
                                    Organized by:{" "}
                                </Text>
                                <Text strong>
                                    {selectedEventDetails.organizer}
                                </Text>
                            </div>
                        </div>
                    )}
                </Spin>
            </Modal>
        );
    };

    // "Your feedback was reviewed" notification -> shows the admin's note
    // and the report's current status. Opened from handleViewFeedbackReport.
    const FEEDBACK_TYPE_META = {
        improve: { label: "Help us improve", color: "blue", icon: <BulbOutlined /> },
        wrong: { label: "Something went wrong", color: "orange", icon: <ExclamationOutlined /> },
    };
    const FEEDBACK_STATUS_META = {
        pending: { label: "Pending", color: "gold", icon: <ClockCircleOutlined /> },
        in_review: { label: "In Review", color: "processing", icon: <EyeOutlined /> },
        resolved: { label: "Resolved", color: "success", icon: <CheckCircleOutlined /> },
        dismissed: { label: "Dismissed", color: "default", icon: <StopOutlined /> },
    };
    const FEEDBACK_AREA_LABELS = {
        gallery: "Photo Library",
        dashboard: "Dashboard",
        alumni: "Alumni List",
        events: "Events",
        questions: "Questions",
        "create-dha": "Create D.H.A",
        messages: "Messages",
        "job-posts": "Job Posts",
        faq: "FAQs",
        about: "About",
        profile: "Profile",
        notifications: "Notifications",
        login: "Login / Authentication",
        "image-quiz": "Image Quiz",
        "rating-quiz": "Rating Quiz",
        registration: "Registration",
        other: "Other",
    };

    const renderFeedbackDetailModal = () => {
        const isDark = currentTheme === "black";
        const report = selectedFeedbackReport;
        const typeMeta = report?.type
            ? FEEDBACK_TYPE_META[report.type]
            : null;
        const statusMeta = report?.status
            ? FEEDBACK_STATUS_META[report.status] || {
                  label: report.status,
                  color: "default",
              }
            : null;
        const areaLabel = report
            ? report.area_label ||
              FEEDBACK_AREA_LABELS[report.area] ||
              report.area
            : null;

        return (
            <Modal
                title={
                    <Space>
                        <CommentOutlined style={{ color: "#ef4444" }} />
                        <span>Your Feedback</span>
                    </Space>
                }
                open={feedbackDetailModalVisible}
                onCancel={() => {
                    setFeedbackDetailModalVisible(false);
                    setSelectedFeedbackReport(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setFeedbackDetailModalVisible(false);
                            setSelectedFeedbackReport(null);
                        }}
                    >
                        Close
                    </Button>,
                ]}
                width={480}
                centered
            >
                <Spin spinning={feedbackDetailLoading}>
                    {report ? (
                        <div>
                            <Space wrap style={{ marginBottom: 16 }}>
                                {typeMeta && (
                                    <Tag color={typeMeta.color} icon={typeMeta.icon}>
                                        {typeMeta.label}
                                    </Tag>
                                )}
                                {areaLabel && <Tag>{areaLabel}</Tag>}
                                {statusMeta && (
                                    <Tag color={statusMeta.color} icon={statusMeta.icon}>
                                        {statusMeta.label}
                                    </Tag>
                                )}
                            </Space>

                            {report.details && (
                                <div style={{ marginBottom: 16 }}>
                                    <Text
                                        className="theme-text-secondary"
                                        style={{
                                            display: "block",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            letterSpacing: "0.05em",
                                            textTransform: "uppercase",
                                            marginBottom: 6,
                                        }}
                                    >
                                        What you reported
                                    </Text>
                                    <div
                                        className="theme-card-bg"
                                        style={{
                                            padding: "12px 14px",
                                            borderRadius: 10,
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {report.details}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Text
                                    className="theme-text-secondary"
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                        marginBottom: 6,
                                    }}
                                >
                                    Note from admin
                                </Text>
                                {report.admin_notes ? (
                                    <div
                                        style={{
                                            padding: "12px 14px",
                                            borderRadius: 10,
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.6,
                                            background: isDark
                                                ? "#1a1a2e"
                                                : "#f0f7ff",
                                            border: isDark
                                                ? "1px solid #333"
                                                : "1px solid #d6e8ff",
                                        }}
                                    >
                                        {report.admin_notes}
                                    </div>
                                ) : (
                                    <Text className="theme-text-secondary">
                                        The admin didn't leave a note with
                                        this update.
                                    </Text>
                                )}
                            </div>

                            {report.resolved_by?.name && (
                                <div style={{ marginTop: 16 }}>
                                    <Text
                                        className="theme-text-secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Reviewed by{" "}
                                        <Text strong>
                                            {report.resolved_by.name}
                                        </Text>
                                        {report.resolved_at &&
                                            ` on ${new Date(
                                                report.resolved_at,
                                            ).toLocaleString()}`}
                                    </Text>
                                </div>
                            )}
                        </div>
                    ) : (
                        !feedbackDetailLoading && (
                            <Empty description="This feedback report is no longer available" />
                        )
                    )}
                </Spin>
            </Modal>
        );
    };

    const renderNotificationsDropdown = () => {
        const filteredNotifications =
            filterNotificationsByCategory(notifications);
        const categoryCounts = getCategoryCounts(notifications);
        const isDark = currentTheme === "black";

        return (
            <div
                className="notification-dropdown-container"
                style={{
                    background: isDark ? "#0a0a0a" : "#fff",
                    borderRadius: 12,
                    boxShadow: isDark
                        ? "0 8px 24px rgba(0,0,0,0.4)"
                        : "0 8px 24px rgba(0,0,0,0.15)",
                    width: isMobile ? "calc(100vw - 32px)" : 450,
                    maxWidth: isMobile ? 340 : 450,
                    // Capped against the viewport height (not just a vh
                    // percentage) so short landscape-phone screens never
                    // push the footer ("View All Notifications") past the
                    // visible area. The header/category/actions rows below
                    // are pinned (flexShrink: 0) and only the notification
                    // list itself scrolls, so the footer stays reachable.
                    maxHeight: isMobile
                        ? "calc(100vh - 80px)"
                        : "min(550px, calc(100vh - 80px))",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: isDark ? "1px solid #333" : "1px solid #f0f0f0",
                }}
            >
                <div
                    className="notification-header"
                    style={{
                        flexShrink: 0,
                        padding: isMobile ? "12px" : "16px",
                        borderBottom: isDark
                            ? "1px solid #333"
                            : "1px solid #f0f0f0",
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: isMobile ? "wrap" : "nowrap",
                            gap: isMobile ? 8 : 0,
                        }}
                    >
                        <div>
                            <Title
                                level={5}
                                style={{
                                    color: "white",
                                    margin: 0,
                                    fontSize: isMobile ? 14 : 16,
                                }}
                            >
                                Notifications
                            </Title>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    fontSize: isMobile ? "11px" : "12px",
                                }}
                            >
                                {unreadCount} unread{" "}
                                {unreadCount === 1 ? "message" : "messages"}
                            </Text>
                        </div>
                        <Space>
                            <Button
                                size="small"
                                type={filterUnread ? "primary" : "default"}
                                onClick={() => setFilterUnread(!filterUnread)}
                                style={{
                                    background: filterUnread
                                        ? "rgba(255,255,255,0.2)"
                                        : "transparent",
                                    border: "1px solid rgba(255,255,255,0.3)",
                                    color: "white",
                                    fontSize: isMobile ? 11 : 14,
                                }}
                            >
                                {filterUnread ? "Show All" : "Show Unread"}
                            </Button>
                        </Space>
                    </div>
                </div>

                <div
                    className="notification-category-bar"
                    style={{
                        flexShrink: 0,
                        padding: isMobile ? "6px 8px" : "8px 12px",
                        borderBottom: isDark
                            ? "1px solid #333"
                            : "1px solid #f0f0f0",
                        background: isDark ? "#1a1a1a" : "#f8f9fa",
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                    }}
                >
                    <Space size={4}>
                        {Object.entries(visibleNotificationCategories).map(
                            ([key, category]) => (
                                <Tooltip
                                    key={key}
                                    title={category.label}
                                    // On touch devices, hover never reliably
                                    // fires mouseleave, so these tooltips
                                    // would stack up and stay stuck open.
                                    // Uses isTouchDevice (not isMobile) so
                                    // this stays correct in landscape too —
                                    // isMobile is intentionally false there
                                    // for unrelated sidebar-layout reasons,
                                    // but the device is still a touchscreen.
                                    trigger={isTouchDevice ? [] : ["hover"]}
                                    open={isTouchDevice ? false : undefined}
                                >
                                    <Button
                                        size="small"
                                        type={
                                            activeCategory === key
                                                ? "primary"
                                                : "text"
                                        }
                                        icon={category.icon}
                                        aria-label={category.label}
                                        onClick={() => setActiveCategory(key)}
                                        style={{
                                            borderColor:
                                                activeCategory === key
                                                    ? category.color
                                                    : "transparent",
                                            background:
                                                activeCategory === key
                                                    ? category.color
                                                    : "transparent",
                                            color:
                                                activeCategory === key
                                                    ? "#fff"
                                                    : category.color,
                                            minWidth: isMobile ? 28 : 32,
                                            padding: isMobile
                                                ? "0 4px"
                                                : "0 8px",
                                            fontSize: isMobile ? 10 : 14,
                                        }}
                                    >
                                        {categoryCounts[key] > 0 && (
                                            <span
                                                style={{
                                                    marginLeft: 4,
                                                    fontSize: isMobile ? 9 : 10,
                                                }}
                                            >
                                                {categoryCounts[key]}
                                            </span>
                                        )}
                                    </Button>
                                </Tooltip>
                            ),
                        )}
                    </Space>
                </div>

                <div
                    className="notification-actions-bar"
                    style={{
                        flexShrink: 0,
                        padding: isMobile ? "6px 12px" : "8px 16px",
                        borderBottom: isDark
                            ? "1px solid #333"
                            : "1px solid #f0f0f0",
                        background: isDark ? "#0a0a0a" : "#fafafa",
                    }}
                >
                    <Space>
                        {unreadCount > 0 && (
                            <Button
                                size="small"
                                type="link"
                                onClick={handleMarkAllAsRead}
                                loading={false}
                                icon={<EyeInvisibleOutlined />}
                                style={{
                                    padding: 0,
                                    fontSize: isMobile ? "11px" : "12px",
                                    color: isDark ? "#60a5fa" : undefined,
                                }}
                            >
                                Mark all as read
                            </Button>
                        )}
                        <Button
                            size="small"
                            type="link"
                            icon={<SettingOutlined />}
                            style={{
                                padding: 0,
                                fontSize: isMobile ? "11px" : "12px",
                                color: isDark ? "#60a5fa" : undefined,
                            }}
                            onClick={() => {
                                setDropdownVisible(false);
                                setSettingsModalVisible(true);
                            }}
                        >
                            Notification settings
                        </Button>
                    </Space>
                </div>

                <div
                    className="notification-list-scroll"
                    style={{
                        // Was a fixed maxHeight (180/250) that, combined with
                        // the outer container's overflow:hidden, simply
                        // clipped the footer off-screen on short landscape
                        // viewports. flex:1 + minHeight:0 lets this region
                        // take whatever space remains between the pinned
                        // header/category/actions bars above and the pinned
                        // footer below, scrolling internally when needed.
                        flex: "1 1 auto",
                        minHeight: 0,
                        overflowY: "auto",
                        background: isDark ? "#0a0a0a" : "#fff",
                    }}
                >
                    {isLoading ? (
                        <div style={{ padding: 40, textAlign: "center" }}>
                            <Spin />
                            <div
                                style={{
                                    marginTop: 10,
                                    color: isDark ? "#a0a0a0" : "#666",
                                }}
                            >
                                Loading notifications...
                            </div>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div
                            style={{
                                padding: isMobile ? 20 : 40,
                                textAlign: "center",
                                color: isDark ? "#a0a0a0" : "#999",
                            }}
                        >
                            <BellOutlined
                                style={{
                                    fontSize: isMobile ? 28 : 32,
                                    marginBottom: 16,
                                    color: isDark ? "#555" : "#d9d9d9",
                                }}
                            />
                            <div
                                style={{
                                    fontSize: isMobile ? "13px" : "14px",
                                    color: isDark ? "#fff" : undefined,
                                }}
                            >
                                {activeCategory !== "all"
                                    ? `No ${NOTIFICATION_CATEGORIES[activeCategory].label.toLowerCase()}`
                                    : filterUnread
                                      ? "No unread notifications"
                                      : "No notifications yet"}
                            </div>
                            <Text
                                style={{
                                    fontSize: isMobile ? "10px" : "12px",
                                    color: isDark ? "#a0a0a0" : "#999",
                                }}
                            >
                                We'll notify you when something arrives
                            </Text>
                        </div>
                    ) : (
                        <List
                            dataSource={filteredNotifications.slice(0, 5)}
                            renderItem={(item) => (
                                <NotificationItem notification={item} />
                            )}
                        />
                    )}
                </div>

                {notifications.length > 0 && (
                    <div
                        className="notification-footer"
                        style={{
                            flexShrink: 0,
                            borderTop: isDark
                                ? "1px solid #333"
                                : "1px solid #f0f0f0",
                            padding: "12px 16px",
                            textAlign: "center",
                            background: isDark ? "#0a0a0a" : "#fafafa",
                        }}
                    >
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                                setDropdownVisible(false);
                                setAllNotificationsModalVisible(true);
                                fetchAllNotifications(1);
                            }}
                            style={{ borderRadius: 6 }}
                        >
                            View All Notifications ({totalNotifications})
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    const accountItems = [
        // {
        //   label: (
        //     <div style={{ padding: "8px 0" }}>
        //       <div style={{ fontWeight: "bold", fontSize: "16px", color: currentTheme === "black" ? "#fff" : undefined }}>{userData.name}</div>
        //       <div style={{ color: currentTheme === "black" ? "#a0a0a0" : "#666", fontSize: "12px" }}>{userData.email}</div>
        //     </div>
        //   ),
        //   key: "profile-header",
        //   disabled: true,
        // },
        {
            type: "divider",
        },
        {
            label: (
                <span
                    style={{
                        color: currentTheme === "black" ? "#ff6b6b" : undefined,
                    }}
                >
                    Sign out
                </span>
            ),
            key: "logout",
            icon: (
                <LogoutOutlined
                    style={{
                        color: currentTheme === "black" ? "#ff6b6b" : undefined,
                    }}
                />
            ),
            danger: true,
        },
    ];

    const handleAccountItemClick = (e) => {
        switch (e.key) {
            case "view-profile":
                history.push("/profile");
                break;
            case "account-settings":
                history.push("/settings");
                break;
            case "logout":
                logout();
                break;
            default:
                break;
        }
    };

    const renderAccountDropdown = () => {
        const isDark = currentTheme === "black";
        return (
            <div
                className="account-dropdown-container"
                style={{
                    background: isDark ? "#0a0a0a" : "#fff",
                    borderRadius: 12,
                    boxShadow: isDark
                        ? "0 8px 24px rgba(0,0,0,0.4)"
                        : "0 8px 24px rgba(0,0,0,0.15)",
                    // Fixed 280px overflowed narrow viewports (especially
                    // phones in "Request Desktop Site" mode) and pushed the
                    // panel off the left edge. Clamping to the viewport
                    // width keeps it fully visible and centered under the
                    // trigger on every screen size.
                    width: 280,
                    maxWidth: "calc(100vw - 24px)",
                    // The panel used to have no height limit at all, so on
                    // short landscape-phone screens it simply ran off the
                    // bottom of the viewport with nothing below "Theme"
                    // reachable (no scroll, no way to get to Sign out).
                    // Capping against the actual viewport height and
                    // turning this into a flex column lets the profile
                    // header stay fixed while the section below it scrolls.
                    maxHeight: isMobile
                        ? "calc(100vh - 80px)"
                        : "min(640px, calc(100vh - 80px))",
                    display: "flex",
                    flexDirection: "column",
                    padding: "8px 0",
                    border: isDark ? "1px solid #333" : "none",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: "16px",
                        textAlign: "center",
                        borderBottom: isDark
                            ? "1px solid #333"
                            : "1px solid #f0f0f0",
                    }}
                >
                    <Avatar
                        size={64}
                        src={userData.avatar}
                        style={{
                            marginBottom: 12,
                            border: "3px solid #1890ff",
                        }}
                    />
                    <Title
                        level={5}
                        style={{
                            margin: 0,
                            marginBottom: 4,
                            color: isDark ? "#fff" : undefined,
                        }}
                    >
                        {userData.name}
                    </Title>
                    <Text
                        style={{
                            fontSize: "12px",
                            color: isDark ? "#a0a0a0" : "#666",
                        }}
                    >
                        {userData.email}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                        <Badge
                            status="success"
                            text={
                                <span
                                    style={{
                                        color: isDark ? "#fff" : undefined,
                                    }}
                                >
                                    {userData.role.charAt(0).toUpperCase() +
                                        userData.role
                                            .slice(1)
                                            .replace("_", " ")}
                                </span>
                            }
                            style={{ fontSize: "11px" }}
                        />
                    </div>
                </div>

{role === "alumni" && (
    <Link
        to="/profile"
        style={{ textDecoration: "none" }}
        onClick={() => setAccountDropdownVisible(false)}
    >
        <div
            style={{
                flexShrink: 0,
                padding: "12px 16px",
                borderBottom: isDark
                    ? "1px solid #333"
                    : "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
            }}
        >
            <Space>
                <TeamOutlined style={{ color: "#52c41a" }} />
                <Text style={{ color: isDark ? "#fff" : undefined }}>
                    Profile
                </Text>
            </Space>
        </div>
    </Link>
)}

                {/* ============ SCROLLABLE SECTION: Theme → Sign out ============ */}
                {/* Everything from "Theme" through the "Sign out" menu item
                    lives inside this scrollable region, while the avatar /
                    name / email / Profile link above stay fixed in place. */}
                <div
                    className="account-dropdown-scroll"
                    style={{
                        flex: "1 1 auto",
                        minHeight: 0,
                        overflowY: "auto",
                        background: isDark ? "#0a0a0a" : "#fff",
                    }}
                >
                {/* ============ THEME DROPDOWN ============ */}
                <div
                    className="account-dropdown-theme-row"
                    style={{
                        padding: "12px 16px",
                        borderBottom: isDark
                            ? "1px solid #333"
                            : "1px solid #f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Space>
                        {isDark ? (
                            <MoonOutlined style={{ color: "#60a5fa" }} />
                        ) : (
                            <SunOutlined style={{ color: "#faad14" }} />
                        )}
                        <Text style={{ color: isDark ? "#fff" : undefined }}>
                            Theme
                        </Text>
                    </Space>
                    {/* <Space>
            {isDark ? <CustomerServiceOutlined  style={{ color: "#60a5fa" }} /> : <SunOutlined style={{ color: "#faad14" }} />}
            <Text style={{ color: isDark ? "#fff" : undefined }}>Give feedback</Text>
          </Space> */}
                    <Select
                        value={currentTheme}
                        onChange={handleThemeChange}
                        size="small"
                        style={{ width: 100 }}
                        options={themeOptions}
                    />
                </div>
                <div
                    style={{
                        padding: "12px 16px",
                        borderBottom: isDark
                            ? "1px solid #333"
                            : "1px solid #f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                    }}
                    onClick={() =>
                        setHelpSupportExpanded((prev) => !prev)
                    }
                >
                    <Space>
                        {isDark ? (
                            <BoxPlotOutlined style={{ color: "#60a5fa" }} />
                        ) : (
                            <BookOutlined style={{ color: "#faad14" }} />
                        )}

                        <Text
                            style={{ color: isDark ? "#fff" : undefined }}
                        >
                            Help & Support
                        </Text>
                    </Space>
                    <DownOutlined
                        style={{
                            fontSize: 11,
                            color: isDark ? "#8a8a8a" : "#8a8d91",
                            transition: "transform 0.2s ease",
                            transform: helpSupportExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                        }}
                    />
                </div>

                {helpSupportExpanded && (
                    <div className="help-support-submenu">
                        <div
                            style={{
                                padding: "10px 16px 10px 40px",
                                borderBottom: isDark
                                    ? "1px solid #333"
                                    : "1px solid #f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                background: isDark ? "#111" : "#fafafa",
                            }}
                            onClick={() => {
                                setAccountDropdownVisible(false);
                                setFeedbackModalOpen(true);
                            }}
                        >
                            <Space>
                                {isDark ? (
                                    <IssuesCloseOutlined
                                        style={{ color: "#60a5fa" }}
                                    />
                                ) : (
                                    <IssuesCloseOutlined
                                        style={{ color: "#faad14" }}
                                    />
                                )}
                                <Text
                                    style={{
                                        color: isDark ? "#fff" : undefined,
                                        fontSize: 13,
                                    }}
                                >
                                    Give feedback
                                </Text>
                            </Space>
                        </div>

                        <Link
                            to="/faq"
                            style={{ textDecoration: "none" }}
                            onClick={() => setAccountDropdownVisible(false)}
                        >
                            <div
                                style={{
                                    padding: "10px 16px 10px 40px",
                                    borderBottom: isDark
                                        ? "1px solid #333"
                                        : "1px solid #f0f0f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    cursor: "pointer",
                                    background: isDark ? "#111" : "#fafafa",
                                }}
                            >
                                <Space>
                                    <CommentOutlined
                                        style={{ color: "#1890ff" }}
                                    />
                                    <Text
                                        style={{
                                            color: isDark
                                                ? "#fff"
                                                : undefined,
                                            fontSize: 13,
                                        }}
                                    >
                                        FAQs
                                    </Text>
                                </Space>
                            </div>
                        </Link>

                        <Link
                            to="/about"
                            style={{ textDecoration: "none" }}
                            onClick={() => setAccountDropdownVisible(false)}
                        >
                            <div
                                style={{
                                    padding: "10px 16px 10px 40px",
                                    borderBottom: isDark
                                        ? "1px solid #333"
                                        : "1px solid #f0f0f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    cursor: "pointer",
                                    background: isDark ? "#111" : "#fafafa",
                                }}
                            >
                                <Space>
                                    <InfoCircleOutlined
                                        style={{ color: "#1890ff" }}
                                    />
                                    <Text
                                        style={{
                                            color: isDark
                                                ? "#fff"
                                                : undefined,
                                            fontSize: 13,
                                        }}
                                    >
                                        About
                                    </Text>
                                </Space>
                            </div>
                        </Link>
                    </div>
                )}

{/* {role === "admin" && (
    <Link
        to="/402"
        style={{ textDecoration: "none" }}
        onClick={() => setAccountDropdownVisible(false)}
    >
        <div
            style={{
                padding: "12px 16px",
                borderBottom: isDark
                    ? "1px solid #333"
                    : "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
            }}
        >
            <Space>
                <BugOutlined style={{ color: "#ff4d4f" }} />
                <Text style={{ color: isDark ? "#fff" : undefined }}>
                    System Reports
                </Text>
            </Space>
        </div>
    </Link>
)} */}

                {/* ============ END THEME DROPDOWN ============ */}

                <Menu
                    onClick={handleAccountItemClick}
                    items={accountItems}
                    style={{
                        border: "none",
                        background: isDark ? "#0a0a0a" : "#fff",
                    }}
                />

                {/* ============ PRIVACY POLICY & TERMS OF SERVICE FOOTER ============ */}
                <div
                    style={{
                        padding: "10px 16px 14px",
                        textAlign: "center",
                    }}
                >
                    <Text
                        className="legal-footer-link"
                        style={{
                            fontSize: "12px",
                            color: isDark ? "#8a8a8a" : "#8a8d91",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            setAccountDropdownVisible(false);
                            setIsPrivacyModalOpen(true);
                        }}
                    >
                        Privacy Policy
                    </Text>
                    <Text
                        style={{
                            fontSize: "12px",
                            color: isDark ? "#555" : "#ccc",
                            margin: "0 6px",
                        }}
                    >
                        ·
                    </Text>
                    <Text
                        className="legal-footer-link"
                        style={{
                            fontSize: "12px",
                            color: isDark ? "#8a8a8a" : "#8a8d91",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            setAccountDropdownVisible(false);
                            setIsTermsModalOpen(true);
                        }}
                    >
                        Terms of Service
                    </Text>
                </div>
                </div>
                {/* ============ END SCROLLABLE SECTION ============ */}
            </div>
            
        );
    };

    const renderMenu = () => (
        <Menu theme="light" mode="inline">
            {menus.map((menu, i) => (
                <React.Fragment key={i}>
                    {!menu.subMenu && (
                        <Tooltip
                            title={isMobile ? null : menu.label}
                            placement="right"
                            trigger={isMobile ? [] : ["hover"]}
                            open={isMobile ? false : undefined}
                            className={
                                basePath === menu.url ||
                                basePath === menu.subUrl1 ||
                                basePath === menu.subUrl2
                                    ? "active-menu"
                                    : ""
                            }
                        >
                            <Menu.Item key={menu.key}>
                                {menu.icon}
                                <Link to={menu.url}>
                                    {isMobile ? menu.label : null}
                                </Link>
                            </Menu.Item>
                        </Tooltip>
                    )}
                    {menu.subMenu && (
                        <Menu.SubMenu
                            key={menu.key}
                            title={isMobile ? menu.label : null}
                            icon={menu.icon}
                        >
                            <Menu.ItemGroup key={menu.key}>
                                {menu.submenu.map((sub) => (
                                    <Menu.Item key={sub.key}>
                                        <Link to={sub.path}>{sub?.label}</Link>
                                    </Menu.Item>
                                ))}
                            </Menu.ItemGroup>
                        </Menu.SubMenu>
                    )}
                </React.Fragment>
            ))}
        </Menu>
    );

    useEffect(() => {
        if (
            Array.isArray(profile?.alumni_quizzes) &&
            profile?.alumni_quizzes?.length !== 2
        ) {
            setQuizzes(profile?.alumni_quizzes);
            setModalVisible(true);
        }
    }, [profile]);

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {isMobile ? (
                <Drawer
                    title={
                        <Link
                            to="/gallery"
                            style={{ textDecoration: "none" }}
                            onClick={() => setDrawerVisible(false)}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    cursor: "pointer",
                                }}
                            >
                                <img
                                    src={logoMini || "/placeholder.svg"}
                                    alt="Logo"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        objectFit: "contain",
                                    }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "6px",
                                    }}
                                >
                                    <span
                                        className="theme-text-secondary"
                                        style={{
                                            fontWeight: 700,
                                            fontSize: 14,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        ATMS | ALUMNI-ASOCC
                                    </span>

                                    <span
                                        className="theme-text-secondary"
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700, // bold
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        <ArrowLeftOutlined /> Photo Library
                                    </span>
                                </div>
                            </div>
                        </Link>
                    }
                    placement="left"
                    closable={false}
                    onClose={toggleDrawer}
                    visible={drawerVisible}
                    width={isMobile ? "55%" : 280}
                    bodyStyle={{ padding: 0 }}
                >
                    {renderMenu()}
                </Drawer>
            ) : (
                <div id={`sidebar-wrapper`} style={{ width: 80 }}>
                    <Sider
                        trigger={null}
                        collapsible
                        collapsed={!isMobile && collapsed}
                    >
                        <div className="logo">
                            <Link to="/gallery">
                                <img
                                    src={logoMini || "/placeholder.svg"}
                                    style={{ width: 80, cursor: "pointer" }}
                                    alt="Logo"
                                />
                            </Link>
                        </div>
                        {renderMenu()}
                    </Sider>
                </div>
            )}

            <Layout className="site-layout">
                <Header id="header">
                    <Row
                        style={{ flex: 1, height: "100%" }}
                        className="row-header"
                        justify="space-between"
                        align="middle"
                    >
                        <Col
                            className="first"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                flex: isMobile ? 1 : "auto",
                                justifyContent: isMobile
                                    ? "center"
                                    : "flex-start",
                                position: "relative",
                            }}
                        >
                            {isMobile && (
                                <Button
                                    type="text"
                                    icon={
                                        drawerVisible ? (
                                            <MenuUnfoldOutlined />
                                        ) : (
                                            <MenuFoldOutlined />
                                        )
                                    }
                                    onClick={toggleDrawer}
                                    className="burger-menu"
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        zIndex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                />
                            )}

                            <Text
                                strong
                                style={{
                                    fontSize: isMobile ? 15 : 22,
                                    fontWeight: 800,
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1.2,
                                    maxWidth: isMobile
                                        ? "calc(100vw - 180px)"
                                        : "auto",
                                    textAlign: isMobile ? "center" : "left",
                                    paddingLeft: isMobile ? 40 : 0,
                                    paddingRight: isMobile ? 40 : 0,
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    history.push("/");
                                }}
                            >
                                <span
                                    style={{
                                        color: "#003366",
                                        fontWeight: 900,
                                    }}
                                >
                                    ATMS |
                                </span>{" "}
                                <span
                                    style={{
                                        color: "#FFD700",
                                        fontWeight: 900,
                                    }}
                                >
                                    ALUMNI
                                </span>{" "}
                                <span
                                    style={{
                                        color: "#CC0000",
                                        fontWeight: 900,
                                    }}
                                >
                                    ASSOCIATION
                                </span>{" "}
                                <span
                                    style={{
                                        color: "#003366",
                                        fontWeight: 900,
                                    }}
                                >
                                    - OCC
                                </span>
                            </Text>
                        </Col>
                        <Col
                            flex={isMobile ? "auto" : "280px"}
                            className="second"
                            style={{
                                position: isMobile ? "absolute" : "relative",
                                right: isMobile ? 8 : 0,
                            }}
                        >
                            <Space size={isMobile ? 8 : 16}>
                                {role !== "department_head" && (
                                    <Dropdown
                                        placement="bottomRight"
                                        trigger={["click"]}
                                        dropdownRender={
                                            renderNotificationsDropdown
                                        }
                                        overlayStyle={{ padding: 0 }}
                                        visible={dropdownVisible}
                                        onVisibleChange={setDropdownVisible}
                                        // Anchoring the popup to the header
                                        // (instead of the default document.body)
                                        // keeps its positioning tied to a
                                        // predictable, bounded container. This
                                        // matters most on mobile browsers in
                                        // "Request Desktop Site" mode, where
                                        // body-relative absolute positioning
                                        // can otherwise miscalculate against
                                        // the wrong viewport and push the
                                        // panel off-screen or to the left edge.
                                        getPopupContainer={() =>
                                            document.getElementById(
                                                "header",
                                            ) || document.body
                                        }
                                    >
                                        <Badge
                                            count={unreadCount}
                                            offset={[0, 0]}
                                            size="small"
                                            style={{
                                                boxShadow: "0 0 0 2px #fff",
                                                zIndex: 1000,
                                            }}
                                        >
                                            <Button
                                                shape="circle"
                                                icon={<BellOutlined />}
                                                type="text"
                                                className={`btn-notification ${animateBell ? "bell-animate" : ""}`}
                                                loading={isLoading}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    minWidth: 40,
                                                    minHeight: 40,
                                                    borderRadius: "50%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "1px solid #f0f0f0",
                                                    padding: 0,
                                                }}
                                            />
                                        </Badge>
                                    </Dropdown>
                                )}

                                <Dropdown
                                    placement="bottomRight"
                                    trigger={["click"]}
                                    dropdownRender={renderAccountDropdown}
                                    open={accountDropdownVisible}
                                    onOpenChange={setAccountDropdownVisible}
                                    getPopupContainer={() =>
                                        document.getElementById("header") ||
                                        document.body
                                    }
                                >
                                    <Button
                                        type="text"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            height: 40,
                                            padding: isMobile
                                                ? "0 8px"
                                                : "0 12px",
                                            border: "1px solid rgb(102 126 234)",
                                            borderRadius: 20,
                                            background: "#667eea40",
                                        }}
                                    >
                                        <Avatar
                                            size={24}
                                            src={userData.avatar}
                                            style={{
                                                marginRight: isMobile ? 0 : 8,
                                            }}
                                        />
                                        {!isMobile && (
                                            <Text
                                                strong
                                                style={{ fontSize: "14px" }}
                                            >
                                                {userData.name.split(" ")[0]}
                                            </Text>
                                        )}
                                    </Button>
                                </Dropdown>
                            </Space>
                        </Col>
                    </Row>
                </Header>
                <Content id="content">{children}</Content>

                {/* Compact Horizontal Footer */}
                <Footer
                    className="app-footer"
                    style={{
                        textAlign: "center",
                        background:
                            currentTheme === "black" ? "#0a0a0a" : "#f8f9fa",
                        borderTop:
                            currentTheme === "black"
                                ? "1px solid #333"
                                : "1px solid #dee2e6",
                        marginTop: "auto",
                    }}
                >
                    <div className="app-footer-inner">
                        <Text
                            className="app-footer-credits"
                            style={{
                                color:
                                    currentTheme === "black"
                                        ? "#888"
                                        : "#6c757d",
                            }}
                        >
                            {" </> "}Developed by{" "}
                            <a
                                href="https://www.facebook.com/EphemeralKun/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontWeight: 600,
                                    background:
                                        "linear-gradient(90deg, #667eea, #764ba2)",
                                    WebkitBackgroundClip: "text",
                                    color: "transparent",
                                    textDecoration: "none",
                                }}
                                onMouseEnter={(e) =>
                                    (e.target.style.textDecoration =
                                        "underline")
                                }
                                onMouseLeave={(e) =>
                                    (e.target.style.textDecoration = "none")
                                }
                            >
                                {" </> "}Antiquina, Jonee John R.
                            </a>
                        </Text>

                        <span
                            className="app-footer-sep"
                            style={{
                                color:
                                    currentTheme === "black" ? "#444" : "#ccc",
                            }}
                        >
                            |
                        </span>

                        <div className="app-footer-links">
                            <Text
                                style={{
                                    color:
                                        currentTheme === "black"
                                            ? "#888"
                                            : "#6c757d",
                                }}
                            >
                                <SafetyCertificateOutlined
                                    style={{ marginRight: 3 }}
                                />
                                Secure
                            </Text>
                            <span
                                className="app-footer-dot"
                                style={{
                                    color:
                                        currentTheme === "black"
                                            ? "#444"
                                            : "#ccc",
                                }}
                            >
                                •
                            </span>
                            <Text
                                style={{
                                    color:
                                        currentTheme === "black"
                                            ? "#888"
                                            : "#6c757d",
                                }}
                            >
                                <TeamOutlined style={{ marginRight: 3 }} />
                                Alumni Association
                            </Text>
                            <span
                                className="app-footer-dot"
                                style={{
                                    color:
                                        currentTheme === "black"
                                            ? "#444"
                                            : "#ccc",
                                }}
                            >
                                •
                            </span>
                            <Text
                                style={{
                                    color:
                                        currentTheme === "black"
                                            ? "#888"
                                            : "#6c757d",
                                }}
                            >
                                <CalendarOutlined style={{ marginRight: 3 }} />
                                Events
                            </Text>
                        </div>

                        <span
                            className="app-footer-sep"
                            style={{
                                color:
                                    currentTheme === "black" ? "#444" : "#ccc",
                            }}
                        >
                            |
                        </span>

                        <Text
                            className="app-footer-copy"
                            style={{
                                color:
                                    currentTheme === "black"
                                        ? "#666"
                                        : "#868e96",
                            }}
                        >
                            © {"2025"} ATMS • Built with ❤️
                        </Text>
                    </div>
                </Footer>
            </Layout>

            {renderSettingsModal()}
            {renderAllNotificationsModal()}
            {renderEventRegistrationsModal()}
            {renderEventDetailsModal()}
            {renderFeedbackDetailModal()}

            <AlumniDetails
                visible={alumniDetailsVisible}
                onCancel={() => {
                    setAlumniDetailsVisible(false);
                    setAlumniPreviewData(null);
                }}
                onSubmit={() => {}}
                previewData={alumniPreviewData}
                viewOnly={true}
                loading={alumniDetailsLoading}
                refetchAlumni={async () => {
                    // 1. Refresh the bell-notification list
                    await fetchNotifications();

                    // 2. Refresh the admin's own profile query (useProfile)
                    if (refetch) refetch();

                    // 3. Re-fetch the ALUMNI record being viewed right now and
                    //    push the fresh data (including the new profile image)
                    //    back into alumniPreviewData so the drawer updates
                    //    immediately — no logout/login required.
                    const currentAlumniId =
                        alumniPreviewData?.id ??
                        alumniPreviewData?.alumni_id ??
                        alumniPreviewData?.alumni?.id;

                    if (currentAlumniId) {
                        try {
                            const response = await axiosConfig.get(
                                `/alumni/${currentAlumniId}`,
                            );
                            const values = response.data?.data || response.data;

                            setAlumniPreviewData((prev) => ({
                                ...prev,
                                // Update every field that could have changed
                                profileImage:
                                    values?.profile_image_url ||
                                    prev?.profileImage,
                                idDocuments:
                                    values?.documents ||
                                    prev?.idDocuments ||
                                    [],
                                first_name:
                                    values?.first_name ?? prev?.first_name,
                                last_name: values?.last_name ?? prev?.last_name,
                                middle_name:
                                    values?.middle_name ?? prev?.middle_name,
                                email: values?.email ?? prev?.email,
                                phone: values?.phone ?? prev?.phone,
                                address: values?.address ?? prev?.address,
                                bio: values?.bio ?? prev?.bio,
                                current_company:
                                    values?.current_company ??
                                    prev?.current_company,
                                job_title: values?.job_title ?? prev?.job_title,
                                employment_status_id:
                                    values?.employment_status_id ??
                                    prev?.employment_status_id,
                            }));
                        } catch (_err) {
                            // Fail silently — the local optimistic update in
                            // AlumniDetails already shows the new image.
                        }
                    }
                }}
            />
            {/* ===== FEEDBACK MODALS (responsive + dark/light theme) ===== */}
            {(() => {
                const isDark = currentTheme === "black";

                const fbBg = isDark ? "#0a0a0a" : "#ffffff";
                const fbText = isDark ? "#ffffff" : "#1a1a1a";
                const fbMuted = isDark ? "#a0a0a0" : "#666666";
                const fbSubtle = isDark ? "#7a7a7a" : "#888888";
                const fbBorder = isDark
                    ? "1px solid #2a2a2a"
                    : "1px solid #eaeaea";
                const fbCardBg = isDark ? "#141414" : "#fafafa";
                const fbCardHover = isDark ? "#1c1c1c" : "#f0f0f0";
                const fbIcon = isDark ? "#cfcfcf" : "#555555";
                const fbLink = isDark ? "#60a5fa" : "#1677ff";

                const modalProps = {
                    centered: true,
                    width: isMobile ? "94vw" : 520,
                    style: { top: isMobile ? 20 : undefined, padding: 0 },
                    bodyStyle: {
                        background: fbBg,
                        color: fbText,
                        padding: isMobile ? 16 : 20,
                        borderRadius: 8,
                    },
                    className: `feedback-modal ${isDark ? "feedback-modal-dark" : "feedback-modal-light"}`,
                };

                return (
                    <>
                        {/* ===== Discard Confirmation Modal ===== */}
                        <Modal
                            {...modalProps}
                            open={discardModalOpen}
                            title={
                                <span
                                    style={{ color: fbText, fontWeight: 700 }}
                                >
                                    Discard feedback?
                                </span>
                            }
                            onCancel={() => setDiscardModalOpen(false)}
                            footer={
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: isMobile
                                            ? "column"
                                            : "row",
                                        justifyContent: "flex-end",
                                        gap: 8,
                                    }}
                                >
                                    <Button
                                        block={isMobile}
                                        onClick={() =>
                                            setDiscardModalOpen(false)
                                        }
                                    >
                                        Continue editing
                                    </Button>
                                    <Button
                                        block={isMobile}
                                        danger
                                        type="primary"
                                        onClick={() => {
                                            setDiscardModalOpen(false);
                                            closeAllFeedback();
                                        }}
                                    >
                                        Discard
                                    </Button>
                                </div>
                            }
                        >
                            <p
                                className="ant-typography"
                                style={{ color: fbMuted, margin: 0 }}
                            >
                                If you discard now, you won't share any feedback
                                with us.
                            </p>
                        </Modal>

                        {/* ===== STEP 1: Choose option ===== */}
                        <Modal
                            {...modalProps}
                            open={feedbackModalOpen}
                            footer={null}
                            closable
                            onCancel={() => setFeedbackModalOpen(false)}
                            title={
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        color: "#ef4444",
                                        fontWeight: 700,
                                        fontSize: isMobile ? 15 : 16,
                                    }}
                                >
                                    <SafetyCertificateOutlined />
                                    Give Feedback to ATMS
                                </span>
                            }
                        >
                            {/* Option 1 */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFeedbackOption("improve");
                                    setFeedbackStep2Open(true);
                                }}
                                style={{
                                    width: "100%",
                                    background: fbCardBg,
                                    border: fbBorder,
                                    color: fbText,
                                    borderRadius: 10,
                                    padding: isMobile ? 12 : 16,
                                    marginBottom: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                    textAlign: "left",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                        fbCardHover)
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                        fbCardBg)
                                }
                            >
                                <img
                                    src={logoMini}
                                    alt="ATMS"
                                    style={{
                                        width: isMobile ? 36 : 42,
                                        height: isMobile ? 36 : 42,
                                        objectFit: "contain",
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: isMobile ? 14 : 15,
                                            color: fbText,
                                        }}
                                    >
                                        Help us improve ATMS
                                    </div>
                                    <div
                                        style={{
                                            fontSize: isMobile ? 12 : 13,
                                            color: fbSubtle,
                                        }}
                                    >
                                        Give feedback about your ATMS experience
                                    </div>
                                </div>
                            </button>

                            {/* Option 2 */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFeedbackOption("wrong");
                                    setFeedbackStep2Open(true);
                                }}
                                style={{
                                    width: "100%",
                                    background: fbCardBg,
                                    border: fbBorder,
                                    color: fbText,
                                    borderRadius: 10,
                                    padding: isMobile ? 12 : 16,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                    textAlign: "left",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                        fbCardHover)
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                        fbCardBg)
                                }
                            >
                                <ExclamationOutlined
                                    style={{
                                        fontSize: isMobile ? 20 : 22,
                                        color: "#faad14",
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: isMobile ? 14 : 15,
                                            color: fbText,
                                        }}
                                    >
                                        Something went wrong
                                    </div>
                                    <div
                                        style={{
                                            fontSize: isMobile ? 12 : 13,
                                            color: fbSubtle,
                                        }}
                                    >
                                        Let us know about broken feature
                                    </div>
                                </div>
                            </button>
                        </Modal>

                        {/* ===== STEP 2: Logs & Diagnostics ===== */}
                        <Modal
                            {...modalProps}
                            open={feedbackStep2Open}
                            footer={null}
                            closable={false}
                            onCancel={() => setDiscardModalOpen(true)}
                            title={
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                    }}
                                >
                                    <Button
                                        type="text"
                                        icon={
                                            <ArrowLeftOutlined
                                                style={{ color: fbIcon }}
                                            />
                                        }
                                        onClick={() =>
                                            setFeedbackStep2Open(false)
                                        }
                                    />
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            color: fbText,
                                            fontSize: isMobile ? 14 : 16,
                                            flex: 1,
                                            textAlign: "center",
                                        }}
                                    >
                                        Give Feedback to ATMS
                                    </span>
                                    <Button
                                        type="text"
                                        icon={
                                            <CloseOutlined
                                                style={{ color: fbIcon }}
                                            />
                                        }
                                        onClick={() =>
                                            setDiscardModalOpen(true)
                                        }
                                    />
                                </div>
                            }
                        >
                            <p
                                className="ant-typography"
                                style={{
                                    fontWeight: 600,
                                    marginTop: 4,
                                    color: fbText,
                                    fontSize: isMobile ? 14 : 15,
                                }}
                            >
                                Include complete logs and diagnostics in your
                                report?
                            </p>
                            <p
                                className="ant-typography"
                                style={{
                                    fontSize: isMobile ? 12 : 13,
                                    color: fbMuted,
                                    lineHeight: 1.55,
                                }}
                            >
                                Information about your device, account and this
                                app related to the issue that you are reporting
                                will be automatically included in this report in
                                order to help us understand and resolve the
                                issue.
                            </p>
                            <p
                                className="ant-typography"
                                style={{
                                    fontSize: isMobile ? 12 : 13,
                                    color: fbMuted,
                                    lineHeight: 1.55,
                                }}
                            >
                                You can further help us fix this problem by
                                sending complete logs and diagnostics. This may
                                include information such as user activity logs,
                                network logs, crash logs and memory dumps
                                associated with ATMS. We will not use the
                                information contained in this report for other
                                purposes.{" "}
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    style={{ color: fbLink }}
                                >
                                    Learn more
                                </a>
                            </p>

                            <div
                                style={{
                                    marginTop: 20,
                                    display: "flex",
                                    flexDirection: isMobile ? "column" : "row",
                                    justifyContent: "flex-end",
                                    gap: 8,
                                }}
                            >
                                <Button
                                    block={isMobile}
                                    type="primary"
                                    onClick={() => {
                                        setFeedbackStep2Open(false);
                                        setFeedbackStep3Open(true);
                                    }}
                                >
                                    Report
                                </Button>
                            </div>
                        </Modal>

                        {/* ===== STEP 3: Report Form ===== */}
                        <Modal
                            {...modalProps}
                            width={isMobile ? "94vw" : 560}
                            open={feedbackStep3Open}
                            footer={null}
                            closable={false}
                            onCancel={() => setDiscardModalOpen(true)}
                            title={
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                    }}
                                >
                                    <Button
                                        type="text"
                                        icon={
                                            <ArrowLeftOutlined
                                                style={{ color: fbIcon }}
                                            />
                                        }
                                        onClick={() => {
                                            setFeedbackStep3Open(false);
                                            setFeedbackStep2Open(true);
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            color: fbText,
                                            fontSize: isMobile ? 14 : 16,
                                            flex: 1,
                                            textAlign: "center",
                                        }}
                                    >
                                        {feedbackOption === "wrong"
                                            ? "Something went wrong"
                                            : "Help us improve ATMS"}
                                    </span>
                                    <Button
                                        type="text"
                                        icon={
                                            <CloseOutlined
                                                style={{ color: fbIcon }}
                                            />
                                        }
                                        onClick={() =>
                                            setDiscardModalOpen(true)
                                        }
                                    />
                                </div>
                            }
                        >
                            <p
                                className="ant-typography"
                                style={{
                                    fontWeight: 600,
                                    marginBottom: 12,
                                    color: fbText,
                                    fontSize: isMobile ? 14 : 15,
                                }}
                            >
                                How can we improve?
                            </p>

                            <div style={{ marginBottom: 14 }}>
                                <Text
                                    style={{
                                        display: "block",
                                        marginBottom: 6,
                                        color: fbText,
                                        fontSize: 13,
                                    }}
                                >
                                    Choose an area
                                </Text>
                                <Select
                                    placeholder="Select a feature"
                                    style={{ width: "100%" }}
                                    value={feedbackArea}
                                    onChange={(v) => setFeedbackArea(v)}
                                    options={FEEDBACK_AREAS}
                                />
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <Text
                                    style={{
                                        display: "block",
                                        marginBottom: 6,
                                        color: fbText,
                                        fontSize: 13,
                                    }}
                                >
                                    Details
                                </Text>
                                <Input.TextArea
                                    rows={isMobile ? 3 : 4}
                                    placeholder="Describe what happened or what could be better..."
                                    value={feedbackDetails}
                                    onChange={(e) =>
                                        setFeedbackDetails(e.target.value)
                                    }
                                />
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <Text
                                    style={{
                                        display: "block",
                                        marginBottom: 6,
                                        color: fbText,
                                        fontSize: 13,
                                    }}
                                >
                                    Screenshot{" "}
                                    <span style={{ color: "#ef4444" }}>
                                        (required)
                                    </span>
                                </Text>
                                <Upload
                                    listType="picture"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    beforeUpload={() => false}
                                    fileList={feedbackScreenshots}
                                    onChange={({ fileList }) =>
                                        setFeedbackScreenshots(
                                            fileList.slice(0, 5),
                                        )
                                    }
                                    onRemove={(file) =>
                                        setFeedbackScreenshots((prev) =>
                                            prev.filter(
                                                (f) => f.uid !== file.uid,
                                            ),
                                        )
                                    }
                                    multiple
                                    maxCount={5}
                                >
                                    <Button
                                        icon={
                                            <UploadOutlined
                                                style={{ color: fbIcon }}
                                            />
                                        }
                                        block={isMobile}
                                    >
                                        Add screenshot (required)
                                    </Button>
                                </Upload>
                                <p
                                    className="ant-typography"
                                    style={{
                                        fontSize: 11,
                                        color: fbSubtle,
                                        marginTop: 6,
                                        marginBottom: 0,
                                    }}
                                >
                                    At least one screenshot of the issue is
                                    required (JPG, PNG or WEBP, max 5MB
                                    each, up to 5 files).
                                </p>
                            </div>

                            <p
                                className="ant-typography"
                                style={{
                                    fontSize: 12,
                                    color: fbSubtle,
                                    lineHeight: 1.55,
                                }}
                            >
                                Let us know if you have ideas that can help make
                                our products better. If you need help solving a
                                specific problem, please visit the Help Center.
                            </p>

                            <div
                                style={{
                                    marginTop: 20,
                                    display: "flex",
                                    flexDirection: isMobile
                                        ? "column-reverse"
                                        : "row",
                                    justifyContent: "flex-end",
                                    gap: 8,
                                }}
                            >
                                <Button
                                    block={isMobile}
                                    onClick={() => setDiscardModalOpen(true)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    block={isMobile}
                                    type="primary"
                                    loading={submitAtmsFeedback.isLoading}
                                    disabled={
                                        !feedbackArea ||
                                        !feedbackDetails.trim() ||
                                        feedbackScreenshots.length === 0
                                    }
                                    onClick={async () => {
                                        try {
                                            const formData = new FormData();
                                            formData.append(
                                                "type",
                                                feedbackOption === "wrong"
                                                    ? "wrong"
                                                    : "improve",
                                            );
                                            formData.append(
                                                "area",
                                                feedbackArea,
                                            );
                                            formData.append(
                                                "details",
                                                feedbackDetails,
                                            );
                                            formData.append(
                                                "page_url",
                                                window.location.href,
                                            );
                                            formData.append(
                                                "theme",
                                                currentTheme,
                                            );
                                            feedbackScreenshots.forEach(
                                                (file) => {
                                                    const raw =
                                                        file.originFileObj ||
                                                        file;
                                                    if (raw) {
                                                        formData.append(
                                                            "screenshots[]",
                                                            raw,
                                                        );
                                                    }
                                                },
                                            );

                                            await submitAtmsFeedback.mutateAsync(
                                                formData,
                                            );

                                            message.success(
                                                "Thanks! Your feedback has been submitted.",
                                            );
                                            closeAllFeedback();
                                        } catch (err) {
                                            message.error(
                                                err?.response?.data
                                                    ?.message ||
                                                    "Failed to submit feedback. Please try again.",
                                            );
                                        }
                                    }}
                                >
                                    Submit
                                </Button>
                            </div>
                        </Modal>
                    </>
                );
            })()}

            <Modal
                title="Select Quiz Type"
                open={modalVisible}
                onCancel={() => setModalVisible(true)}
                footer={null}
                closable={false}
                maskClosable={false}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        className="theme-warning-box"
                        style={{
                            border: "1px solid #ffbb96",
                            borderRadius: 6,
                            padding: 16,
                            marginBottom: 20,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span
                                style={{
                                    color: "#fa541c",
                                    fontSize: 18,
                                    marginRight: 8,
                                }}
                            >
                                ⚠
                            </span>
                            <span
                                style={{
                                    color: "#fa541c",
                                    fontWeight: "bold",
                                    fontSize: 14,
                                }}
                            >
                                Required: Complete a quiz to continue using
                                Device
                            </span>
                        </div>
                    </div>

                    {Array.isArray(alumniQuizzes) &&
                        !alumniQuizzes.find(
                            (item) => item.type === "rating",
                        ) && (
                            <Button
                                type="dashed"
                                size="large"
                                style={{ width: "100%", marginBottom: 16 }}
                                onClick={() =>
                                    (window.location.href = "answer-question")
                                }
                            >
                                Program Experience Rating ✅
                            </Button>
                        )}

                    {Array.isArray(alumniQuizzes) &&
                        !alumniQuizzes.find((item) => item.type === "abcd") && (
                            <Button
                                type="dashed"
                                size="large"
                                style={{ width: "100%", marginBottom: 16 }}
                                onClick={() =>
                                    (window.location.href = "image-quiz")
                                }
                            >
                                Behavioral Assessment Questions ✅
                            </Button>
                        )}

                    <Button
                        style={{
                            width: "100%",
                            marginTop: 10,
                            backgroundColor: "#fff",
                            borderColor: "#ff4d4f",
                            color: "#ff4d4f",
                        }}
                        icon={<LogoutOutlined />}
                        onClick={logout}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fa8c16";
                            e.currentTarget.style.color = "#fff";
                            e.currentTarget.style.borderColor = "#fa8c16";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff";
                            e.currentTarget.style.color = "#ff4d4f";
                            e.currentTarget.style.borderColor = "#ff4d4f";
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor = "#ff4d4f";
                            e.currentTarget.style.color = "#fff";
                            e.currentTarget.style.borderColor = "#ff4d4f";
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = "#fa8c16";
                            e.currentTarget.style.color = "#fff";
                            e.currentTarget.style.borderColor = "#fa8c16";
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </Modal>

            <LegalModals
                isPrivacyModalOpen={isPrivacyModalOpen}
                setIsPrivacyModalOpen={setIsPrivacyModalOpen}
                isTermsModalOpen={isTermsModalOpen}
                setIsTermsModalOpen={setIsTermsModalOpen}
            />
        </Layout>
    );
};

export default MainLayout;