"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    Tabs,
    Button,
    Spin,
    Table,
    Modal,
    Form,
    Input,
    Space,
    Card,
    Statistic,
    Row,
    Col,
    Tag,
    Upload,
    message,
    Badge,
    Select,
    Empty,
    Drawer,
    Divider,
    Avatar,
    Typography,
    Tooltip,
    Image,
    InputNumber,
    Progress,
    Result,
    Alert,
    Descriptions,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FileOutlined,
    EyeOutlined,
    SendOutlined,
    UserOutlined,
    MailOutlined,
    CalendarOutlined,
    DollarOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    CheckOutlined,
    CloseOutlined,
    SearchOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined,
    BankOutlined,
    IdcardOutlined,
    PictureOutlined,
    StopOutlined,
    WarningOutlined,
    PhoneOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    QuestionCircleOutlined,
    MessageOutlined,
    LoadingOutlined,
    CameraOutlined,
    ReloadOutlined,
    LeftOutlined,
    RightOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    RotateLeftOutlined,
    RotateRightOutlined,
    SwapOutlined,
    UndoOutlined,
    DownloadOutlined,
    FullscreenOutlined,
    FileWordOutlined,
    FileTextOutlined,
    LinkOutlined,
} from "@ant-design/icons";
import "./AdminAlumniJobPostPage.css";
import { Layout } from "~/components";
import secureLocalStorage from "react-secure-storage";
import moment from "moment";
import avatarGuidance from "~/assets/images/avatar_guidance.png";
import logo from "~/assets/images/OCC_LOGO.png";
import axios from "~/utils/axiosConfig";
import { BASE_URL } from "~/utils/constant";
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// On touch devices (phones/tablets, portrait or landscape), antd Tooltip
// has no real "hover" to leave, so tapping an icon leaves the tooltip
// popup stuck open on top of the page — it never gets a mouseleave to
// close it. Same fix already used in index.js / AlumniList.js: detect
// touch capability and force the tooltip off (trigger=[] / open=false)
// instead of relying on hover, since these devices don't need hover
// tooltips anyway.
const useIsTouchDevice = () => {
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        const hasTouch =
            typeof window !== "undefined" &&
            ("ontouchstart" in window ||
                (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0));
        setIsTouchDevice(!!hasTouch);
    }, []);

    return isTouchDevice;
};

// ============================================================
// ============ ENHANCEMENT: Draft Auto-Save Config ============
// ============================================================
const JOB_DRAFT_STORAGE_KEY = "admin-jobpost-draft";

const saveJobPostDraft = (draft) => {
    try {
        secureLocalStorage.setItem(JOB_DRAFT_STORAGE_KEY, {
            ...draft,
            _savedAt: new Date().toISOString(),
        });
        return true;
    } catch (e) {
        console.warn("Failed to save job post draft:", e);
        return false;
    }
};

const loadJobPostDraft = () => {
    try {
        return secureLocalStorage.getItem(JOB_DRAFT_STORAGE_KEY) || null;
    } catch (e) {
        console.warn("Failed to load job post draft:", e);
        return null;
    }
};

const clearJobPostDraft = () => {
    try {
        secureLocalStorage.removeItem(JOB_DRAFT_STORAGE_KEY);
    } catch (e) {
        console.warn("Failed to clear job post draft:", e);
    }
};

// ============================================================
// ====== ENHANCEMENT: Application Draft Auto-Save Helpers ======
// ============================================================
// Per-(job, user) storage key so each alumni's draft is isolated.
const buildApplicationDraftKey = (jobId, userId) =>
    `job_application_draft_${jobId || "unknown"}_${userId || "anon"}`;

const saveApplicationDraft = (jobId, userId, draft) => {
    try {
        if (!jobId || !userId) return false;
        secureLocalStorage.setItem(buildApplicationDraftKey(jobId, userId), {
            ...draft,
            _savedAt: new Date().toISOString(),
        });
        return true;
    } catch (e) {
        console.warn("Failed to save application draft:", e);
        return false;
    }
};

const loadApplicationDraft = (jobId, userId) => {
    try {
        if (!jobId || !userId) return null;
        return (
            secureLocalStorage.getItem(
                buildApplicationDraftKey(jobId, userId),
            ) || null
        );
    } catch (e) {
        console.warn("Failed to load application draft:", e);
        return null;
    }
};

const clearApplicationDraft = (jobId, userId) => {
    try {
        if (!jobId || !userId) return;
        secureLocalStorage.removeItem(buildApplicationDraftKey(jobId, userId));
    } catch (e) {
        console.warn("Failed to clear application draft:", e);
    }
};

const isValidHttpUrl = (value) => {
    if (!value || typeof value !== "string") return false;
    try {
        const u = new URL(value.trim());
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
};

// Accepted/legitimate job reference sources shown to admins/alumni
const REFERENCE_SOURCE_OPTIONS = [
    { value: "facebook", label: "Facebook Job Post" },
    { value: "company_website", label: "Company Website" },
    { value: "linkedin", label: "LinkedIn Job Post" },
    { value: "jobstreet", label: "JobStreet" },
    { value: "indeed", label: "Indeed" },
    { value: "kalibrr", label: "Kalibrr" },
    { value: "official_portal", label: "Official Recruitment Portal" },
    { value: "other", label: "Other" },
];

const LEGITIMATE_JOB_SOURCES = [
    { name: "LinkedIn", url: "https://www.linkedin.com/jobs" },
    { name: "JobStreet", url: "https://www.jobstreet.com.ph" },
    { name: "Indeed", url: "https://ph.indeed.com" },
    { name: "Kalibrr", url: "https://www.kalibrr.com" },
    { name: "Facebook Jobs", url: "https://www.facebook.com" },
    { name: "DOLE Jobs", url: "https://jobs.dole.gov.ph" },
    { name: "Government Careers", url: "https://csc.gov.ph/career" },
];

// Configure axios base URL

// Helper function to get auth token
const getAuthToken = () => {
    try {
        return secureLocalStorage.getItem("access_token");
    } catch (error) {
        console.error("Error getting auth token:", error);
        return null;
    }
};

// Helper function to get auth headers
const getAuthHeaders = () => {
    try {
        const token = getAuthToken();
        if (!token) {
            console.warn("No authentication token found");
            return {};
        }
        return { Authorization: `Bearer ${token}` };
    } catch (error) {
        console.error("Error getting auth headers:", error);
        return {};
    }
};

const getCurrentUser = () => {
    try {
        // Try to get user object first
        const userObj = secureLocalStorage.getItem("user");

        // Get ID from multiple possible storage keys for compatibility
        const userId =
            userObj?.id ||
            secureLocalStorage.getItem("userId") ||
            secureLocalStorage.getItem("userID") || // <-- This is the key your login uses
            secureLocalStorage.getItem("user_id") ||
            secureLocalStorage.getItem("id");

        return {
            id: userId,
            name:
                userObj?.name ||
                secureLocalStorage.getItem("userName") ||
                secureLocalStorage.getItem("name"),
            email:
                userObj?.email ||
                secureLocalStorage.getItem("userEmail") ||
                secureLocalStorage.getItem("email"),
            profile_image:
                userObj?.profile_image ||
                secureLocalStorage.getItem("userProfileImage"),
            phone: userObj?.phone || secureLocalStorage.getItem("userPhone"),
        };
    } catch (error) {
        console.error("Error getting current user:", error);
        return {
            id: null,
            name: null,
            email: null,
            profile_image: null,
            phone: null,
        };
    }
};

const buildImageUrl = (imagePath) => {
    try {
        if (!imagePath) return null;

        const base = BASE_URL.replace(/\/$/, "");

        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
        ) {
            return imagePath;
        }

        if (imagePath.startsWith("data:")) {
            return imagePath;
        }

        const raw = String(imagePath);
        const noLeading = raw.replace(/^\/+/, "");

        if (raw.startsWith("/storage/")) {
            return `${base}${raw}`;
        }

        if (noLeading.startsWith("storage/")) {
            return `${base}/${noLeading}`;
        }

        return `${base}/storage/${noLeading}`;
    } catch (error) {
        console.error("Error building image URL:", error);
        return null;
    }
};

// ============ STABLE IMAGE COMPONENT TO PREVENT FLICKERING ============
const StableImage = ({ src, alt, className, style, fallbackIcon }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const imgRef = useRef(null);
    const previousSrc = useRef(src);

    // Only reset loading state if src actually changed
    useEffect(() => {
        if (previousSrc.current !== src) {
            setImageLoaded(false);
            setImageError(false);
            previousSrc.current = src;
        }
    }, [src]);

    const handleLoad = useCallback(() => {
        setImageLoaded(true);
        setImageError(false);
    }, []);

    const handleError = useCallback(() => {
        setImageError(true);
        setImageLoaded(true); // Mark as loaded to remove skeleton
    }, []);

    if (!src || imageError) {
        return (
            <div
                className={`job-card-image-placeholder ${className || ""}`}
                style={style}
            >
                {fallbackIcon || (
                    <BankOutlined style={{ fontSize: 36, color: "#bfbfbf" }} />
                )}
            </div>
        );
    }

    return (
        <div style={{ position: "relative", ...style }}>
            {!imageLoaded && (
                <div
                    className={`job-card-image-placeholder ${className || ""}`}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f5f5f5",
                    }}
                >
                    <Spin size="small" />
                </div>
            )}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                className={className}
                style={{
                    ...style,
                    opacity: imageLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out",
                }}
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
};

// ============ VALID ID TYPES LIST ============
const VALID_ID_TYPES = [
    {
        value: "philid",
        label: "Philippine National ID (PhilID/ePhilID)",
        icon: <IdcardOutlined />,
    },
    {
        value: "umid",
        label: "UMID (Unified Multi-Purpose ID)",
        icon: <IdcardOutlined />,
    },
    { value: "passport", label: "Passport", icon: <IdcardOutlined /> },
    {
        value: "drivers_license",
        label: "Driver's License",
        icon: <IdcardOutlined />,
    },
    { value: "sss", label: "SSS ID", icon: <IdcardOutlined /> },
    { value: "philhealth", label: "PhilHealth ID", icon: <IdcardOutlined /> },
    { value: "pagibig", label: "Pag-IBIG ID", icon: <IdcardOutlined /> },
    { value: "prc", label: "PRC ID", icon: <IdcardOutlined /> },
    { value: "nbi", label: "NBI Clearance", icon: <IdcardOutlined /> },
    { value: "voters", label: "Voter's ID", icon: <IdcardOutlined /> },
];

// ============ ACCEPTED FILE FORMATS (BASED ON BACKEND VALIDATION) ============
const ACCEPTED_FORMATS = {
    BANNER_IMAGE: {
        accept: ".jpeg,.jpg,.png,.gif,.webp",
        hint: "Accepted formats: JPEG, JPG, PNG, GIF, WEBP (Max: 5MB)",
    },
    RESUME: {
        accept: ".pdf,.doc,.docx",
        hint: "Accepted formats: PDF, DOC, DOCX (Max: 5MB)",
    },
    ID_DOCUMENT: {
        accept: ".jpg,.jpeg",
        hint: "Accepted formats: JPG, JPEG (Max: 5MB)",
    },
    OTHER_DOCUMENT: {
        accept: ".jpg,.jpeg,.pdf,.doc,.docx",
        hint: "Accepted formats: JPG, JPEG, PDF, DOC, DOCX (Max: 5MB)",
    },
};

// Job Type Options with colors and icons
const jobTypeOptions = [
    {
        value: "all",
        label: "All Types",
        color: "default",
        icon: <TeamOutlined />,
    },
    {
        value: "Full-time",
        label: "Full-time",
        color: "green",
        icon: <CheckCircleOutlined />,
    },
    {
        value: "Part-time",
        label: "Part-time",
        color: "blue",
        icon: <ClockCircleOutlined />,
    },
    {
        value: "Contract",
        label: "Contract",
        color: "orange",
        icon: <FileOutlined />,
    },
];

// Status Options
const statusOptions = [
    { value: "all", label: "All Status", color: "default" },
    { value: "pending", label: "Pending Review", color: "orange" },
    { value: "approved", label: "Approved", color: "green" },
    { value: "rejected", label: "Rejected", color: "red" },
];

// Sort Options
const sortOptions = [
    { value: "date-desc", label: "Date: Latest First" },
    { value: "date-asc", label: "Date: Oldest First" },
    { value: "salary-desc", label: "Salary: High to Low" },
    { value: "salary-asc", label: "Salary: Low to High" },
    { value: "title-asc", label: "Title: A to Z" },
    { value: "title-desc", label: "Title: Z to A" },
];

// Expiration Days Options
const expirationOptions = [
    { value: null, label: "No Expiration" },
    { value: 7, label: "1 Week" },
    { value: 14, label: "2 Weeks" },
    { value: 21, label: "3 Weeks" },
    { value: 30, label: "1 Month" },
    { value: 60, label: "2 Months" },
    { value: 90, label: "3 Months" },
    { value: 180, label: "6 Months" },
    { value: 365, label: "1 Year" },
];

// Helper: Get status tag config
const getStatusTag = (status) => {
    try {
        const config = {
            approved: {
                color: "green",
                text: "Approved",
                icon: <CheckCircleOutlined />,
            },
            pending: {
                color: "orange",
                text: "Pending",
                icon: <ClockCircleOutlined />,
            },
            rejected: {
                color: "red",
                text: "Rejected",
                icon: <CloseCircleOutlined />,
            },
        };
        const statusConfig = config[status] || {
            color: "default",
            text: status || "Unknown",
        };
        return (
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {statusConfig.text}
            </Tag>
        );
    } catch (error) {
        console.error("Error getting status tag:", error);
        return <Tag color="default">Unknown</Tag>;
    }
};

// Helper: Get job type tag
const getJobTypeTag = (type) => {
    try {
        const option = jobTypeOptions.find((opt) => opt.value === type);
        if (!option) return <Tag>{type || "Unknown"}</Tag>;
        return (
            <Tag color={option.color} icon={option.icon}>
                {option.label}
            </Tag>
        );
    } catch (error) {
        console.error("Error getting job type tag:", error);
        return <Tag>Unknown</Tag>;
    }
};

// Helper: Get creator role badge
const getCreatorRoleBadge = (creator) => {
    try {
        if (!creator) return null;
        const isAdmin = creator.role === "admin" || creator.is_admin;
        return (
            <Tag
                color={isAdmin ? "gold" : "geekblue"}
                icon={
                    isAdmin ? <SafetyCertificateOutlined /> : <UserOutlined />
                }
                style={{ fontSize: "10px", padding: "0 6px" }}
            >
                {isAdmin ? "Admin" : "Alumni"}
            </Tag>
        );
    } catch (error) {
        console.error("Error getting creator role badge:", error);
        return null;
    }
};

// Helper: Get default avatar based on role
const getDefaultAvatar = (creator) => {
    try {
        if (!creator) return null;
        const isAdmin = creator.role === "admin" || creator.is_admin;
        if (isAdmin) {
            return avatarGuidance;
        }
        return null;
    } catch (error) {
        console.error("Error getting default avatar:", error);
        return null;
    }
};

// Helper: Check if job is full or expired
const isJobFullOrExpired = (job) => {
    try {
        return job?.is_full || job?.is_expired;
    } catch (error) {
        console.error("Error checking job status:", error);
        return false;
    }
};

// Helper: Get Full/Expired Tag
const getFullExpiredTag = (job) => {
    try {
        if (!job) return null;
        if (job.is_expired) {
            return (
                <Tag color="red" icon={<ClockCircleOutlined />}>
                    Expired
                </Tag>
            );
        }
        if (job.is_full) {
            return (
                <Tag color="volcano" icon={<StopOutlined />}>
                    Full
                </Tag>
            );
        }
        return null;
    } catch (error) {
        console.error("Error getting full/expired tag:", error);
        return null;
    }
};

// Helper: Get Capacity Progress - UPDATED with color indicator (green→yellow→red)
const getCapacityProgress = (job) => {
    try {
        if (!job?.capacity) return null;
        const percent = Math.round(
            ((job.applications_count || 0) / job.capacity) * 100,
        );

        // Color indicator: green (low) → yellow (medium) → red (high/full)
        let strokeColor;
        if (percent <= 50) {
            strokeColor = "#52c41a"; // Green - low capacity used
        } else if (percent <= 80) {
            strokeColor = "#faad14"; // Yellow/Orange - medium capacity
        } else {
            strokeColor = "#ff4d4f"; // Red - high/full capacity
        }

        const status =
            percent >= 100 ? "exception" : percent >= 80 ? "active" : "normal";
        return (
            <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Applications: {job.applications_count || 0} / {job.capacity}
                </Text>
                <Progress
                    percent={percent}
                    size="small"
                    status={status}
                    strokeColor={strokeColor}
                />
            </div>
        );
    } catch (error) {
        console.error("Error getting capacity progress:", error);
        return null;
    }
};

// Helper: Get ID Type Label
const getIdTypeLabel = (idType) => {
    try {
        const found = VALID_ID_TYPES.find((item) => item.value === idType);
        return found ? found.label : idType || "Unknown";
    } catch (error) {
        console.error("Error getting ID type label:", error);
        return idType || "Unknown";
    }
};

const CreatorInfo = ({ creator, size = "default" }) => {
    if (!creator) {
        return (
            <div className="creator-info-container">
                <Avatar
                    size={size === "large" ? 56 : 48}
                    icon={<UserOutlined />}
                />
                <div className="creator-details">
                    <Text className="creator-name">Unknown User</Text>
                </div>
            </div>
        );
    }

    const isTouchDevice = useIsTouchDevice();
    try {
        const isAdmin = creator.role === "admin" || creator.is_admin;
        const avatarSize = size === "large" ? 56 : 48;

        // Use profile image or fallback to default avatar - memoize the URL
        const profileImageUrl = useMemo(
            () =>
                buildImageUrl(
                    creator.profile_image ||
                        creator.profile_image_url ||
                        creator.avatar,
                ),
            [creator.profile_image, creator.profile_image_url, creator.avatar],
        );
        const defaultAvatarUrl = getDefaultAvatar(creator);
        const displayAvatarUrl = profileImageUrl || defaultAvatarUrl;

        return (
            <div
                className={`creator-info-container ${size === "large" ? "creator-info-large" : ""}`}
            >
                <Tooltip
                    title={isAdmin ? "Posted by Admin" : "Posted by Alumni"}
                    trigger={isTouchDevice ? [] : ["hover"]}
                    open={isTouchDevice ? false : undefined}
                >
                    <Avatar
                        size={avatarSize}
                        src={displayAvatarUrl}
                        icon={!displayAvatarUrl && <UserOutlined />}
                        className={`creator-avatar ${isAdmin ? "admin-avatar" : "alumni-avatar"}`}
                        style={{
                            border: isAdmin
                                ? "3px solid #faad14"
                                : "3px solid #667eea",
                            backgroundColor: !displayAvatarUrl
                                ? isAdmin
                                    ? "#fffbe6"
                                    : "#f0f5ff"
                                : undefined,
                            color: !displayAvatarUrl
                                ? isAdmin
                                    ? "#faad14"
                                    : "#667eea"
                                : undefined,
                        }}
                    />
                </Tooltip>
                <div className="creator-details">
                    <div className="creator-name-row">
                        <Text strong className="creator-name">
                            {creator.name || creator.first_name || "Unknown"}
                        </Text>
                        {getCreatorRoleBadge(creator)}
                    </div>
                    {creator.email && (
                        <Text type="secondary" className="creator-email">
                            <MailOutlined
                                style={{ marginRight: 4, fontSize: 11 }}
                            />
                            {creator.email}
                        </Text>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error rendering CreatorInfo:", error);
        return (
            <div className="creator-info-container">
                <Avatar
                    size={size === "large" ? 56 : 48}
                    icon={<UserOutlined />}
                />
                <div className="creator-details">
                    <Text className="creator-name">Unknown User</Text>
                </div>
            </div>
        );
    }
};

// ============ APPLICANT INFO COMPONENT ============
const ApplicantInfo = ({ applicant, size = "default" }) => {
    if (!applicant) {
        return (
            <div className="applicant-info-container">
                <Avatar
                    size={size === "large" ? 56 : 48}
                    icon={<UserOutlined />}
                />
                <div className="applicant-details">
                    <Text className="applicant-name">Unknown Applicant</Text>
                </div>
            </div>
        );
    }

    try {
        const avatarSize = size === "large" ? 56 : 48;
        const profileImageUrl = useMemo(
            () =>
                buildImageUrl(
                    applicant.profile_image ||
                        applicant.profile_image_url ||
                        applicant.avatar ||
                        applicant.image,
                ),
            [
                applicant.profile_image,
                applicant.profile_image_url,
                applicant.avatar,
                applicant.image,
            ],
        );

        return (
            <div
                className={`applicant-info-container ${size === "large" ? "applicant-info-large" : ""}`}
            >
                <Avatar
                    size={avatarSize}
                    src={profileImageUrl}
                    icon={!profileImageUrl && <UserOutlined />}
                    className="applicant-avatar"
                    style={{
                        border: "3px solid #52c41a",
                        backgroundColor: !profileImageUrl
                            ? "#f6ffed"
                            : undefined,
                        color: !profileImageUrl ? "#52c41a" : undefined,
                    }}
                />
                <div className="applicant-details">
                    <div className="applicant-name-row">
                        <Text strong className="applicant-name">
                            {applicant.name ||
                                applicant.first_name ||
                                "Unknown"}
                        </Text>
                        <Tag
                            color="geekblue"
                            icon={<UserOutlined />}
                            style={{ fontSize: "10px", padding: "0 6px" }}
                        >
                            Alumni
                        </Tag>
                    </div>
                    {applicant.email && (
                        <Text type="secondary" className="applicant-email">
                            <MailOutlined
                                style={{ marginRight: 4, fontSize: 11 }}
                            />
                            {applicant.email}
                        </Text>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error rendering ApplicantInfo:", error);
        return (
            <div className="applicant-info-container">
                <Avatar
                    size={size === "large" ? 56 : 48}
                    icon={<UserOutlined />}
                />
                <div className="applicant-details">
                    <Text className="applicant-name">Unknown Applicant</Text>
                </div>
            </div>
        );
    }
};

// ============ STABLE CONTROLS SECTION (PREVENTS INPUT FLICKER) ============
const ControlsSection = ({
    searchText,
    setSearchText,
    filterJobType,
    setFilterJobType,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    userRole,
    form,
    setEditingPost,
    setFileList,
    setIsModalVisible,
}) => (
    <Card className="controls-card">
        <div className="controls-section">
            <div className="controls-left">
                <Input
                    placeholder="Search jobs, companies, locations..."
                    prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    style={{ width: 300 }}
                />
                <Select
                    value={filterJobType}
                    onChange={setFilterJobType}
                    style={{ width: 180 }}
                    options={jobTypeOptions}
                />
                {userRole === "admin" && (
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        style={{ width: 160 }}
                        options={statusOptions}
                    />
                )}
            </div>

            <div className="controls-right">
                <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 200 }}
                    options={sortOptions}
                />
                {userRole === "admin" && (
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingPost(null);
                            form.resetFields();
                            setFileList([]);
                            setIsModalVisible(true);
                        }}
                    >
                        Create Job Post
                    </Button>
                )}
            </div>
        </div>
    </Card>
);

// ============================================================
// ======= GALLERY-STYLE PHOTO LIGHTBOX (like galleryPage.js) =
// ============================================================
const GalleryPhotoLightbox = ({ images = [], visible, currentIndex = 0, onClose, onChange, title = "" }) => {
    const isTouchDevice = useIsTouchDevice();
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flipX, setFlipX] = useState(false);
    const [flipY, setFlipY] = useState(false);
    const [idx, setIdx] = useState(currentIndex);

    useEffect(() => {
        setIdx(currentIndex);
        setScale(1);
        setRotation(0);
        setFlipX(false);
        setFlipY(false);
    }, [currentIndex, visible]);

    if (!visible || images.length === 0) return null;

    const handlePrev = () => {
        const newIdx = (idx - 1 + images.length) % images.length;
        setIdx(newIdx);
        setScale(1); setRotation(0); setFlipX(false); setFlipY(false);
        onChange?.(newIdx);
    };
    const handleNext = () => {
        const newIdx = (idx + 1) % images.length;
        setIdx(newIdx);
        setScale(1); setRotation(0); setFlipX(false); setFlipY(false);
        onChange?.(newIdx);
    };
    const handleDownload = () => {
        const url = images[idx];
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.download = `photo_${idx + 1}.jpg`;
        a.target = "_blank";
        a.click();
    };

    const imgTransform = [
        `scale(${scale})`,
        `rotate(${rotation}deg)`,
        `scaleX(${flipX ? -1 : 1})`,
        `scaleY(${flipY ? -1 : 1})`,
    ].join(" ");

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(2, 6, 23, 0.92)",
                backdropFilter: "blur(10px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            {/* Close */}
            <button
                onClick={onClose}
                style={{
                    position: "absolute", top: 16, right: 16, zIndex: 10,
                    background: "rgba(255,255,255,0.12)", border: "none",
                    borderRadius: "50%", width: 40, height: 40, cursor: "pointer",
                    color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                }}
            >✕</button>

            {/* Caption top */}
            <div style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 12, textAlign: "center", opacity: 0.85 }}>
                {title && <span style={{ fontWeight: 600 }}>{title}</span>}
                {images.length > 1 && <span style={{ marginLeft: 8, opacity: 0.65 }}>{idx + 1} / {images.length}</span>}
            </div>

            {/* Image area */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", flex: 1 }}>
                {images.length > 1 && (
                    <button onClick={handlePrev} style={{
                        position: "absolute", left: 16, zIndex: 5,
                        background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
                        width: 44, height: 44, cursor: "pointer", color: "#fff", fontSize: 18,
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
                    }}>‹</button>
                )}
                <img
                    src={images[idx]}
                    alt={`Photo ${idx + 1}`}
                    style={{
                        maxWidth: "80vw", maxHeight: "65vh",
                        objectFit: "contain", borderRadius: 8,
                        transform: imgTransform,
                        transition: "transform 0.25s ease",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
                    }}
                    onError={(e) => { e.target.style.opacity = 0.4; }}
                />
                {images.length > 1 && (
                    <button onClick={handleNext} style={{
                        position: "absolute", right: 16, zIndex: 5,
                        background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
                        width: 44, height: 44, cursor: "pointer", color: "#fff", fontSize: 18,
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
                    }}>›</button>
                )}
            </div>

            {/* Toolbar */}
            <div style={{
                marginTop: 16, padding: "8px 16px", borderRadius: 999,
                background: "rgba(2,6,23,0.55)", backdropFilter: "blur(10px)",
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
                maxWidth: "96vw", overflowX: "auto",
            }}>
                {[
                    { title: "Zoom Out", icon: "−", onClick: () => setScale(s => Math.max(0.5, s - 0.25)), disabled: scale <= 0.5 },
                    { title: "Zoom In", icon: "+", onClick: () => setScale(s => Math.min(5, s + 0.25)), disabled: scale >= 5 },
                    { title: "Rotate Left", icon: "↺", onClick: () => setRotation(r => r - 90) },
                    { title: "Rotate Right", icon: "↻", onClick: () => setRotation(r => r + 90) },
                    { title: "Flip X", icon: "⇔", onClick: () => setFlipX(f => !f) },
                    { title: "Flip Y", icon: "⇕", onClick: () => setFlipY(f => !f) },
                    { title: "Reset", icon: "⟳", onClick: () => { setScale(1); setRotation(0); setFlipX(false); setFlipY(false); } },
                ].map((btn) => (
                    <Tooltip
                        key={btn.title}
                        title={btn.title}
                        trigger={isTouchDevice ? [] : ["hover"]}
                        open={isTouchDevice ? false : undefined}
                    >
                        <button
                            onClick={btn.onClick}
                            disabled={btn.disabled}
                            style={{
                                background: btn.disabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
                                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
                                color: btn.disabled ? "rgba(255,255,255,0.3)" : "#e2e8f0",
                                width: 36, height: 36, cursor: btn.disabled ? "not-allowed" : "pointer",
                                fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center",
                            }}
                        >{btn.icon}</button>
                    </Tooltip>
                ))}
                <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />
                <Tooltip
                    title="Download this photo"
                    trigger={isTouchDevice ? [] : ["hover"]}
                    open={isTouchDevice ? false : undefined}
                >
                    <button onClick={handleDownload} style={{
                        background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                        border: "none", borderRadius: 8, color: "#fff",
                        padding: "0 14px", height: 36, cursor: "pointer", fontWeight: 600, fontSize: 13,
                        display: "inline-flex", alignItems: "center", gap: 6,
                    }}>⬇ Download</button>
                </Tooltip>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
                <div style={{
                    display: "flex", gap: 8, marginTop: 14, padding: "4px 8px",
                    overflowX: "auto", maxWidth: "90vw",
                }}>
                    {images.map((src, i) => (
                        <div
                            key={i}
                            onClick={() => { setIdx(i); setScale(1); setRotation(0); setFlipX(false); setFlipY(false); onChange?.(i); }}
                            style={{
                                width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: "hidden",
                                border: i === idx ? "2px solid #818cf8" : "2px solid rgba(255,255,255,0.15)",
                                cursor: "pointer", opacity: i === idx ? 1 : 0.6, transition: "all 0.2s",
                            }}
                        >
                            <img src={src} alt={`thumb ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ============================================================
// ======= INLINE DOCUMENT VIEWER (PDF / DOC / DOCX) ==========
// ============================================================
const DocumentViewerModal = ({ visible, onClose, fileUrl, fileName = "Resume" }) => {
    // ✅ ALL hooks before any early return
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (visible) { setLoading(true); setError(false); }
    }, [visible, fileUrl]);

    // Derive metadata safely — even when fileUrl is empty/null
    const safeUrl = fileUrl || "";
    const ext = (safeUrl.split("?")[0].split(".").pop() || "").toLowerCase();
    const isPdf = ext === "pdf";
    const isDoc = ext === "doc" || ext === "docx";
    const viewerUrl = safeUrl
        ? `https://docs.google.com/gview?url=${encodeURIComponent(safeUrl)}&embedded=true`
        : "";

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={
                <Space>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        href={fileUrl}
                        target="_blank"
                        download
                    >
                        Download {fileName}
                    </Button>
                    <Button
                        icon={<LinkOutlined />}
                        href={fileUrl}
                        target="_blank"
                    >
                        Open in New Tab
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </Space>
            }
            title={
                <Space>
                    {isPdf ? <FilePdfOutlined style={{ color: "#ff4d4f" }} /> :
                     isDoc ? <FileWordOutlined style={{ color: "#1890ff" }} /> :
                     <FileOutlined style={{ color: "#52c41a" }} />}
                    <span>{fileName}</span>
                </Space>
            }
            width="80vw"
            style={{ top: 20, maxWidth: 1100 }}
            bodyStyle={{ padding: 0, height: "75vh", overflow: "hidden", position: "relative" }}
            destroyOnClose
        >
            {loading && (
                <div style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: "#f8fafc", zIndex: 2, flexDirection: "column", gap: 12,
                }}>
                    <Spin size="large" />
                    <Text type="secondary">Loading document...</Text>
                </div>
            )}
            {error ? (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", height: "100%", gap: 16, padding: 32,
                }}>
                    <FilePdfOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
                    <Text strong>Unable to preview this document</Text>
                    <Text type="secondary" style={{ textAlign: "center" }}>
                        The document could not be loaded in the viewer. You can download it or open it in a new tab.
                    </Text>
                    <Space>
                        <Button type="primary" icon={<DownloadOutlined />} href={fileUrl} target="_blank" download>
                            Download
                        </Button>
                        <Button icon={<LinkOutlined />} href={fileUrl} target="_blank">
                            Open in New Tab
                        </Button>
                    </Space>
                </div>
            ) : (
                <iframe
                    src={viewerUrl}
                    style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                    title={fileName}
                    onLoad={() => setLoading(false)}
                    onError={() => { setLoading(false); setError(true); }}
                    allow="fullscreen"
                />
            )}
        </Modal>
    );
};

// ============================================================
// ======= APPLICANT PHOTO GRID (Gallery-style thumbnails) ====
// ============================================================
const ApplicantPhotoGrid = ({ photos = [], applicantName = "Applicant" }) => {
    const [lightboxVisible, setLightboxVisible] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    if (!photos || photos.length === 0) return null;

    const photoUrls = photos.map(p =>
        buildImageUrl(p.file_path || p.file_url || p.path || p.url || p)
    ).filter(Boolean);

    if (photoUrls.length === 0) return null;

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxVisible(true);
    };

    const MAX_VISIBLE = 4;
    const visiblePhotos = photoUrls.slice(0, MAX_VISIBLE);
    const remaining = photoUrls.length - MAX_VISIBLE;

    return (
        <>
            <div style={{ marginBottom: 12 }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                    <PictureOutlined style={{ marginRight: 6, color: "#667eea" }} />
                    Photos ({photoUrls.length})
                </Text>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {visiblePhotos.map((src, i) => (
                        <div
                            key={i}
                            onClick={() => openLightbox(i)}
                            style={{
                                width: 88, height: 88, borderRadius: 10, overflow: "hidden",
                                cursor: "pointer", position: "relative",
                                border: "2px solid #e5e7eb",
                                transition: "all 0.2s",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.border = "2px solid #667eea";
                                e.currentTarget.style.transform = "scale(1.04)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.border = "2px solid #e5e7eb";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            <img
                                src={src}
                                alt={`${applicantName} photo ${i + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                onError={e => { e.target.style.opacity = 0.3; }}
                            />
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "rgba(0,0,0,0)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.2s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.25)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0)"; }}
                            >
                                <EyeOutlined style={{ color: "#fff", fontSize: 18, opacity: 0, transition: "opacity 0.2s" }} />
                            </div>
                        </div>
                    ))}
                    {remaining > 0 && (
                        <div
                            onClick={() => openLightbox(MAX_VISIBLE)}
                            style={{
                                width: 88, height: 88, borderRadius: 10,
                                background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 16,
                                boxShadow: "0 2px 8px rgba(79,70,229,0.25)",
                                transition: "transform 0.2s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                            <span>+{remaining}</span>
                            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>more</span>
                        </div>
                    )}
                </div>
                <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => openLightbox(0)}
                    style={{ padding: 0, marginTop: 4 }}
                >
                    View all photos
                </Button>
            </div>

            <GalleryPhotoLightbox
                images={photoUrls}
                visible={lightboxVisible}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxVisible(false)}
                onChange={setLightboxIndex}
                title={`${applicantName} — Photos`}
            />
        </>
    );
};

// ============================================================
// ======= RESUME / DOCUMENT VIEWER BUTTON ====================
// ============================================================
const ResumeViewer = ({ fileUrl, fileName = "Resume" }) => {
    // ✅ ALL hooks MUST come before any early return (Rules of Hooks)
    const [modalVisible, setModalVisible] = useState(false);
    const isTouchDevice = useIsTouchDevice();

    // Derive file metadata — safe even when fileUrl is empty or has UUID-like paths
    const ext = fileUrl
        ? (() => {
              const clean = fileUrl.split("?")[0];          // strip query strings
              const parts = clean.split(".");
              const last = (parts[parts.length - 1] || ""); // last segment
              // Only treat as extension if short (max 5 chars) — avoids treating UUIDs as ext
              return last.length <= 5 ? last.toLowerCase() : "";
          })()
        : "";
    const isPdf = ext === "pdf";
    const isDoc = ext === "doc" || ext === "docx";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

    // Early return AFTER hooks
    if (!fileUrl) return null;

    const iconEl = isPdf ? <FilePdfOutlined style={{ color: "#ff4d4f" }} /> :
                   isDoc ? <FileWordOutlined style={{ color: "#1890ff" }} /> :
                   isImage ? <FileImageOutlined style={{ color: "#52c41a" }} /> :
                   <FileOutlined />;

    const extLabel = ext ? ext.toUpperCase() + " File" : "Document";

    return (
        <>
            <div className="resume-viewer-card">
                <div className={`resume-viewer-icon-bg resume-viewer-icon-bg--${isPdf ? "pdf" : isDoc ? "doc" : isImage ? "image" : "default"}`}>
                    {iconEl}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ display: "block", fontSize: 13 }}>{fileName}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{extLabel}</Text>
                </div>
                <Space>
                    {(isPdf || isDoc) && (
                        <Tooltip
                            title="View document in-page"
                            trigger={isTouchDevice ? [] : ["hover"]}
                            open={isTouchDevice ? false : undefined}
                        >
                            <Button
                                type="primary"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => setModalVisible(true)}
                                style={{ borderRadius: 6 }}
                            >
                                Preview
                            </Button>
                        </Tooltip>
                    )}
                    {isImage && (
                        <Tooltip
                            title="View image"
                            trigger={isTouchDevice ? [] : ["hover"]}
                            open={isTouchDevice ? false : undefined}
                        >
                            <Button
                                type="primary"
                                size="small"
                                icon={<EyeOutlined />}
                                href={fileUrl}
                                target="_blank"
                                style={{ borderRadius: 6 }}
                            >
                                View
                            </Button>
                        </Tooltip>
                    )}
                    {/* Always show Download — covers unknown extensions too */}
                    <Tooltip
                        title="Download file"
                        trigger={isTouchDevice ? [] : ["hover"]}
                        open={isTouchDevice ? false : undefined}
                    >
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ borderRadius: 6 }}
                        >
                            Download
                        </Button>
                    </Tooltip>
                </Space>
            </div>

            <DocumentViewerModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                fileUrl={fileUrl}
                fileName={fileName}
            />
        </>
    );
};

// ============================================================
// ======= ID DOCUMENT CARD with gallery-style image view =====
// ============================================================
const IdDocumentCard = ({ doc, index }) => {
    const [lightboxVisible, setLightboxVisible] = useState(false);
    const fileUrl = buildImageUrl(doc.file_path || doc.file_url || doc.path);
    if (!fileUrl) return null;

    const ext = (fileUrl.split("?")[0].split(".").pop() || "").toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    const isPdf = ext === "pdf";

    return (
        <>
            <Card
                size="small"
                className="id-doc-card"
                style={{ borderRadius: 10, overflow: "hidden" }}
                bodyStyle={{ padding: 0 }}
            >
                {/* Image thumbnail if it's a JPG/PNG */}
                {isImage && (
                    <div
                        style={{
                            width: "100%", height: 100, overflow: "hidden",
                            cursor: "pointer", position: "relative",
                            background: "#f0f0f0",
                        }}
                        onClick={() => setLightboxVisible(true)}
                    >
                        <img
                            src={fileUrl}
                            alt={`ID ${index + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            onError={e => { e.target.style.opacity = 0.3; }}
                        />
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "rgba(0,0,0,0.0)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background 0.2s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.28)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0)"; }}
                        >
                            <EyeOutlined style={{ color: "#fff", fontSize: 22 }} />
                        </div>
                    </div>
                )}
                {/* PDF thumbnail placeholder */}
                {isPdf && (
                    <div style={{
                        width: "100%", height: 80,
                        background: "linear-gradient(135deg,#fff1f0,#ffe4e1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                    }}
                        onClick={() => setLightboxVisible(true)}
                    >
                        <FilePdfOutlined style={{ fontSize: 36, color: "#ff4d4f" }} />
                    </div>
                )}
                <div style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <IdcardOutlined style={{ color: "#667eea" }} />
                        <Text strong style={{ fontSize: 12 }}>
                            {getIdTypeLabel(doc.type)}
                        </Text>
                    </div>
                    <Space size={4}>
                        <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => setLightboxVisible(true)}
                            style={{ borderRadius: 6, fontSize: 11 }}
                        >
                            View
                        </Button>
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            href={fileUrl}
                            target="_blank"
                            download
                            style={{ borderRadius: 6, fontSize: 11 }}
                        >
                            Save
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Lightbox for image IDs, DocumentViewer for PDF IDs */}
            {isImage && (
                <GalleryPhotoLightbox
                    images={[fileUrl]}
                    visible={lightboxVisible}
                    currentIndex={0}
                    onClose={() => setLightboxVisible(false)}
                    title={`ID Document — ${getIdTypeLabel(doc.type)}`}
                />
            )}
            {isPdf && (
                <DocumentViewerModal
                    visible={lightboxVisible}
                    onClose={() => setLightboxVisible(false)}
                    fileUrl={fileUrl}
                    fileName={`ID — ${getIdTypeLabel(doc.type)}`}
                />
            )}
        </>
    );
};

function AdminAlumniJobPostPage() {
    const isTouchDevice = useIsTouchDevice();
    const [userRole, setUserRole] = useState("alumni");
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState("browse");
    const [jobPosts, setJobPosts] = useState([]);
    const [pendingPosts, setPendingPosts] = useState([]);
    const [fullOrExpiredPosts, setFullOrExpiredPosts] = useState([]);
    const [myPostings, setMyPostings] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    // ============ NEW: STATE FOR SUBMIT WARNING MODAL ============
    const [submitWarningModalVisible, setSubmitWarningModalVisible] =
        useState(false);
    const [pendingFormValues, setPendingFormValues] = useState(null);
    const [isApplicationModalVisible, setIsApplicationModalVisible] =
        useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobDetailsVisible, setJobDetailsVisible] = useState(false);
    const [applicationsVisible, setApplicationsVisible] = useState(false);
    const [jobApplications, setJobApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [form] = Form.useForm();
    const [appForm] = Form.useForm();
    const [statsData, setStatsData] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        fullOrExpired: 0,
    });
    const [initialLoading, setInitialLoading] = useState(true);
    // ============ NEW: MOBILE RESPONSIVE STATE ============
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < 768 : false,
    );
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const [applicantSearchText, setApplicantSearchText] = useState("");
    // Keeps the latest banner fileList instantly (prevents stale state on fast submit)
    const bannerFileListRef = useRef([]);

    // ============ NEW: STATE FOR REJECTION MODALS ============
    const [rejectJobPostModalVisible, setRejectJobPostModalVisible] =
        useState(false);
    const [rejectJobPostId, setRejectJobPostId] = useState(null);
    const [rejectJobPostNotes, setRejectJobPostNotes] = useState("");
    const [rejectJobPostLoading, setRejectJobPostLoading] = useState(false);

    const [rejectApplicationModalVisible, setRejectApplicationModalVisible] =
        useState(false);
    const [rejectApplicationId, setRejectApplicationId] = useState(null);
    const [rejectApplicationNotes, setRejectApplicationNotes] = useState("");
    const [rejectApplicationLoading, setRejectApplicationLoading] =
        useState(false);

    // ============ IMAGE UPLOAD STATE (SAME AS AlumniEvents.js) ============
    const [fileList, setFileList] = useState([]);

    // ============ NEW: STATE FOR CURRENT ALUMNI PROFILE ============
    const [currentAlumniProfile, setCurrentAlumniProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // ============ NEW: STATE FOR ID DOCUMENTS UPLOAD ============
    const [idDocuments, setIdDocuments] = useState([]);
    // { type: string, fileList: UploadFile[] }[]
    const [otherDocuments, setOtherDocuments] = useState([]); // For any other documents

    // ============ NEW: STATE FOR SUCCESS MODAL ============
    const [applicationSuccessModalVisible, setApplicationSuccessModalVisible] =
        useState(false);

    // ============ NEW: LOADING STATES FOR BUTTONS ============
    const [submitWarningLoading, setSubmitWarningLoading] = useState(false);
    const [jobPostSubmitLoading, setJobPostSubmitLoading] = useState(false);
    const [applicationActionLoading, setApplicationActionLoading] = useState(
        {},
    );
    const [withdrawLoading, setWithdrawLoading] = useState({});
    const [submitApplicationLoading, setSubmitApplicationLoading] =
        useState(false);

    // Filters State
    const [searchText, setSearchText] = useState("");
    const [filterJobType, setFilterJobType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("date-desc");

    // ============ REF TO TRACK PREVIOUS DATA FOR SMOOTH UPDATES ============
    const prevJobPostsRef = useRef([]);
    const prevPendingPostsRef = useRef([]);
    const prevFullOrExpiredPostsRef = useRef([]);
    const prevMyPostingsRef = useRef([]);
    const prevMyApplicationsRef = useRef([]);

    // ✅ FIX: tracks whether the component is still mounted so that
    // in-flight polling/fetch requests don't call setState after unmount
    // (fixes "Can't perform a React state update on an unmounted component").
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // ============================================================
    // ============ ENHANCEMENT: Draft + UX state ============
    // ============================================================
    const [draftLastSaved, setDraftLastSaved] = useState(null);
    const [draftRestoreModalVisible, setDraftRestoreModalVisible] =
        useState(false);
    const [pendingDraft, setPendingDraft] = useState(null);
    const [discardConfirmVisible, setDiscardConfirmVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [lastCreatedJob, setLastCreatedJob] = useState(null);
    const [referenceUrlValid, setReferenceUrlValid] = useState(null); // null | true | false
    const draftSaveTimerRef = useRef(null);

    // ============================================================
    // ENHANCEMENT: Application Draft / Unsaved-Changes state
    // ============================================================
    const [applicationFormDirty, setApplicationFormDirty] = useState(false);
    const [
        applicationDiscardConfirmVisible,
        setApplicationDiscardConfirmVisible,
    ] = useState(false);
    const [applicationDraftRestoreVisible, setApplicationDraftRestoreVisible] =
        useState(false);
    const [pendingApplicationDraft, setPendingApplicationDraft] =
        useState(null);
    const [applicationDraftLastSaved, setApplicationDraftLastSaved] =
        useState(null);
    const applicationDraftTimerRef = useRef(null);
    // Snapshot of selected job + user used for the current draft key so we can
    // still persist/clear correctly even after state changes during submit.
    const applicationDraftCtxRef = useRef({ jobId: null, userId: null });

    // ============================================================
    // ENHANCEMENT: Helpers for draft / smart close / form snapshot
    // ============================================================
    const getCurrentFormSnapshot = useCallback(() => {
        try {
            const values = form.getFieldsValue() || {};
            return {
                ...values,
                // capture banner preview info (we cannot persist a File object reliably,
                // but we keep filename + url so the user knows to re-upload if it was new)
                _banner: (bannerFileListRef.current || []).map((f) => ({
                    uid: f.uid,
                    name: f.name,
                    url: f.url || f.thumbUrl || null,
                    status: f.status,
                })),
            };
        } catch {
            return {};
        }
    }, [form]);

    const hasAnyFormValue = useCallback(() => {
        const snap = getCurrentFormSnapshot();
        const banner = snap._banner || [];
        delete snap._banner;
        const hasValues = Object.values(snap).some(
            (v) =>
                v !== undefined &&
                v !== null &&
                v !== "" &&
                !(Array.isArray(v) && v.length === 0),
        );
        return hasValues || banner.length > 0;
    }, [getCurrentFormSnapshot]);

    const persistDraftNow = useCallback(() => {
        // Never auto-save when editing an existing post — drafts are for NEW posts.
        if (editingPost) return;
        if (!isModalVisible) return;
        if (!hasAnyFormValue()) return;
        const snap = getCurrentFormSnapshot();
        const ok = saveJobPostDraft(snap);
        if (ok) setDraftLastSaved(new Date());
    }, [editingPost, isModalVisible, hasAnyFormValue, getCurrentFormSnapshot]);

    // Debounced auto-save on any form change
    const handleFormValuesChange = useCallback(() => {
        if (editingPost) return;
        if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = setTimeout(persistDraftNow, 400);
    }, [editingPost, persistDraftNow]);

    // Restore draft values into the form
    const applyDraftToForm = useCallback(
        (draft) => {
            if (!draft) return;
            try {
                const { _banner, _savedAt, ...values } = draft;
                form.setFieldsValue(values);
                // Restore reference URL validity indicator
                if (values.reference_url) {
                    setReferenceUrlValid(isValidHttpUrl(values.reference_url));
                }
                // Restore banner placeholders (URL-only items survive; freshly uploaded
                // File blobs cannot be persisted by localStorage and must be re-attached)
                if (Array.isArray(_banner) && _banner.length > 0) {
                    const restored = _banner
                        .filter((b) => b.url)
                        .map((b) => ({
                            uid: b.uid || `draft-${Date.now()}`,
                            name: b.name || "banner",
                            status: "done",
                            url: b.url,
                        }));
                    if (restored.length > 0) {
                        setFileList(restored);
                        bannerFileListRef.current = restored;
                    }
                }
                setDraftLastSaved(_savedAt ? new Date(_savedAt) : new Date());
            } catch (e) {
                console.warn("applyDraftToForm failed:", e);
            }
        },
        [form],
    );

    // When the create modal opens for a NEW post, offer to restore an existing draft.
    useEffect(() => {
        if (!isModalVisible) return;
        if (editingPost) return;
        const draft = loadJobPostDraft();
        if (
            draft &&
            Object.keys(draft).some((k) => k !== "_savedAt" && k !== "_banner")
        ) {
            setPendingDraft(draft);
            setDraftRestoreModalVisible(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalVisible, editingPost]);

    // Smart close: confirm if there is unsaved data, otherwise close immediately.
    const requestCloseCreateModal = useCallback(() => {
        if (editingPost) {
            // Preserve original edit-close behavior (no draft system for edits)
            setIsModalVisible(false);
            setEditingPost(null);
            form.resetFields();
            setFileList([]);
            bannerFileListRef.current = [];
            return;
        }
        if (hasAnyFormValue()) {
            setDiscardConfirmVisible(true);
        } else {
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
            bannerFileListRef.current = [];
        }
    }, [editingPost, hasAnyFormValue, form]);

    const confirmDiscardChanges = useCallback(() => {
        clearJobPostDraft();
        setDraftLastSaved(null);
        setDiscardConfirmVisible(false);
        setIsModalVisible(false);
        setEditingPost(null);
        form.resetFields();
        setFileList([]);
        bannerFileListRef.current = [];
    }, [form]);

    // Browser unsaved-changes warning
    useEffect(() => {
        const handler = (e) => {
            if (isModalVisible && !editingPost && hasAnyFormValue()) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes.";
                return "You have unsaved changes.";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isModalVisible, editingPost, hasAnyFormValue]);

 

    // Detect user role from auth or context
    useEffect(() => {
        try {
            const role = secureLocalStorage.getItem("userRole") || "alumni";
            setUserRole(role);
            setCurrentUser(getCurrentUser());
            // ✅ ADD THIS LINE: Set default activeTab based on role
            setActiveTab(role === "admin" ? "all-posts" : "browse");
            setInitialLoading(false);
        } catch (error) {
            console.error("Error detecting user role:", error);
            setUserRole("alumni");
            setActiveTab("browse");
            setInitialLoading(false);
        }
    }, []);

    // ============ INITIAL DATA FETCH FOR BADGE COUNTS ============
    // Fetch all data on mount to display badge counts immediately
    useEffect(() => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error(
                    "No token available, skipping initial data fetch",
                );
                return;
            }

            // Fetch all data for badge counts regardless of active tab
            if (userRole === "admin") {
                fetchJobPosts();
                fetchPendingPosts();
                fetchFullOrExpiredPosts();
            } else {
                // Alumni: Fetch all data for badges on initial load
                fetchApprovedJobs();
                fetchMyApplications();
                fetchMyPostings();
                fetchFullOrExpiredPosts();
            }
        } catch (error) {
            console.error("Error in initial data fetch:", error);
        }
    }, [userRole]); // Only run on mount and when userRole changes

    // Polling mechanism for real-time updates - continues to update active tab
    useEffect(() => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("No token available, skipping data fetch");
                return;
            }

            // ✅ FIX: guard against overlapping poll cycles. Without this,
            // if the backend is slow and a batch of requests takes longer
            // than the 10s interval to resolve, every tick queues ANOTHER
            // batch on top of the ones still in flight — the number of
            // concurrent requests grows without bound the longer the
            // backend stays slow, which is what was freezing/crashing the tab.
            let isFetching = false;
            let cancelled = false;

            const fetchData = async () => {
                if (isFetching || cancelled) return;
                isFetching = true;
                try {
                    if (userRole === "admin") {
                        // Always fetch all data for badge counts
                        await Promise.allSettled([
                            fetchJobPosts(),
                            fetchPendingPosts(),
                            fetchFullOrExpiredPosts(),
                        ]);
                    } else {
                        // Alumni: Always fetch all data for badge counts
                        await Promise.allSettled([
                            fetchApprovedJobs(),
                            fetchMyApplications(),
                            fetchMyPostings(),
                            fetchFullOrExpiredPosts(),
                        ]);
                    }
                } catch (error) {
                    console.error("Error in fetchData:", error);
                } finally {
                    isFetching = false;
                }
            };

            // Set up polling interval (less frequent since we fetch all data)
            const interval = setInterval(fetchData, 10000); // 10 seconds instead of 5
            return () => {
                cancelled = true;
                clearInterval(interval);
            };
        } catch (error) {
            console.error("Error setting up polling:", error);
        }
    }, [userRole]);

    // Centralized error handler
    const handleApiError = useCallback((error, defaultMessage) => {
        try {
            console.error(defaultMessage, error);
            if (error.response) {
                if (error.response.status === 401) {
                    message.error("Session expired. Please login again.");
                } else if (error.response.status === 403) {
                    message.error(
                        "You don't have permission to access this resource",
                    );
                } else {
                    message.error(
                        error.response.data?.message || defaultMessage,
                    );
                }
            } else if (error.request) {
                message.error("Network error. Please check your connection.");
            } else {
                message.error(defaultMessage);
            }
        } catch (err) {
            console.error("Error in error handler:", err);
            message.error(defaultMessage);
        }
    }, []);

    // ✅ Safely extract array from ANY Laravel response
    const extractArray = useCallback((response) => {
        try {
            if (!response) return [];

            // Direct array
            if (Array.isArray(response)) return response;

            // Axios response object
            const data = response.data ?? response;

            // Laravel resource / pagination
            if (Array.isArray(data?.data)) return data.data;

            // Fallback
            return [];
        } catch (error) {
            console.error("Error extracting array:", error);
            return [];
        }
    }, []);

    // ============ SMART STATE UPDATE TO PREVENT FLICKERING ============
    const updateStateWithoutFlicker = useCallback(
        (setter, prevRef, newData) => {
            try {
                // Only update if data actually changed
                const prevDataStr = JSON.stringify(
                    prevRef.current.map((p) => p.id),
                );
                const newDataStr = JSON.stringify(newData.map((p) => p.id));

                if (prevDataStr !== newDataStr) {
                    prevRef.current = newData;
                    setter(newData);
                } else {
                    // Even if IDs are same, update the data in case other fields changed
                    // but do it without causing a re-render flash
                    setter((current) => {
                        const currentIds = current.map((p) => p.id).join(",");
                        const newIds = newData.map((p) => p.id).join(",");
                        if (currentIds === newIds) {
                            // Merge updates without changing order
                            return current.map((item) => {
                                const updated = newData.find(
                                    (n) => n.id === item.id,
                                );
                                return updated || item;
                            });
                        }
                        return newData;
                    });
                }
            } catch (error) {
                console.error("Error updating state:", error);
                setter(newData);
            }
        },
        [],
    );

    const fetchJobPosts = useCallback(async () => {
        try {
            // silent: true — this runs on every poll tick (every 10s) in the
            // background. It must never pop a blocking error modal; a slow
            // or briefly-down backend would otherwise spam the whole screen.
            const response = await axios.get("/job-posts", {
                headers: getAuthHeaders(),
                silent: true,
            });

            if (!isMountedRef.current) return;
            const posts = extractArray(response);
            updateStateWithoutFlicker(setJobPosts, prevJobPostsRef, posts);
            updateStats(posts);
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error fetching job posts:", error);
            if (prevJobPostsRef.current.length === 0) {
                setJobPosts([]);
            }
        }
    }, [extractArray, updateStateWithoutFlicker]);

    const fetchPendingPosts = useCallback(async () => {
        try {
            const response = await axios.get("/job-posts/admin/pending", {
                headers: getAuthHeaders(),
                silent: true,
            });

            if (!isMountedRef.current) return;
            const pending = extractArray(response);
            updateStateWithoutFlicker(
                setPendingPosts,
                prevPendingPostsRef,
                pending,
            );
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error fetching pending posts:", error);
            if (prevPendingPostsRef.current.length === 0) {
                setPendingPosts([]);
            }
        }
    }, [extractArray, updateStateWithoutFlicker]);

    const fetchFullOrExpiredPosts = useCallback(async () => {
        try {
            const response = await axios.get("/job-posts/full-or-expired", {
                headers: getAuthHeaders(),
                silent: true,
            });

            if (!isMountedRef.current) return;
            const posts = extractArray(response);
            updateStateWithoutFlicker(
                setFullOrExpiredPosts,
                prevFullOrExpiredPostsRef,
                posts,
            );

            // Update stats with full/expired count
            setStatsData((prev) => ({ ...prev, fullOrExpired: posts.length }));
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error fetching full/expired posts:", error);
            if (prevFullOrExpiredPostsRef.current.length === 0) {
                setFullOrExpiredPosts([]);
            }
        }
    }, [extractArray, updateStateWithoutFlicker]);

    // Alumni: Fetch approved jobs - FIXED: Now updates stats for alumni
    const fetchApprovedJobs = useCallback(async () => {
        try {
            // silent: true — background polling call, see fetchJobPosts above.
            const response = await axios.get("/job-posts?status=approved", {
                headers: getAuthHeaders(),
                silent: true,
            });
            if (!isMountedRef.current) return;
            const data = response.data.data || response.data;
            const jobs = Array.isArray(data) ? data : [];
            updateStateWithoutFlicker(setJobPosts, prevJobPostsRef, jobs);

            // ✅ FIX: Update stats for alumni with approved jobs count
            setStatsData((prev) => ({
                ...prev,
                total: jobs.filter((job) => !job.is_full && !job.is_expired)
                    .length,
            }));
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error fetching jobs:", error);
        }
    }, [updateStateWithoutFlicker]);

    // Alumni: Fetch my postings
    const fetchMyPostings = useCallback(async () => {
        try {
            const response = await axios.get("/job-posts/my-postings", {
                headers: getAuthHeaders(),
                silent: true,
            });
            if (!isMountedRef.current) return;
            const data = response.data.data || response.data;
            const postings = Array.isArray(data) ? data : [];
            updateStateWithoutFlicker(
                setMyPostings,
                prevMyPostingsRef,
                postings,
            );
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error fetching your postings:", error);
        }
    }, [updateStateWithoutFlicker]);

    // Alumni: Fetch my applications
    const fetchMyApplications = useCallback(async () => {
        try {
            const response = await axios.get(
                "/job-applications/my-applications",
                {
                    headers: getAuthHeaders(),
                    silent: true,
                },
            );

            if (!isMountedRef.current) return;
            // ✅ SAFELY extract array
            const applications = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.data)
                  ? response.data.data
                  : [];

            updateStateWithoutFlicker(
                setMyApplications,
                prevMyApplicationsRef,
                applications,
            );
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error fetching your applications:", error);
        }
    }, [updateStateWithoutFlicker]);

    // Fetch applications for a job post (for review)
    const fetchJobApplications = useCallback(
        async (jobPostId) => {
            try {
                setApplicationsLoading(true);
                setApplicationsVisible(true);

                const response = await axios.get(
                    `/job-applications/job-post/${jobPostId}`,
                    { headers: getAuthHeaders() },
                );

                // ✅ SAFELY extract array
                const applications = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                      ? response.data.data
                      : [];

                setJobApplications(applications);
            } catch (error) {
                handleApiError(error, "Error fetching applications");
                setJobApplications([]); // safety
            } finally {
                setApplicationsLoading(false);
            }
        },
        [handleApiError],
    );

    // ============ NEW: FETCH CURRENT ALUMNI PROFILE FOR APPLICATION MODAL ============
    const fetchCurrentAlumniProfile = useCallback(async () => {
        try {
            setProfileLoading(true);
            const response = await axios.get("/profile", {
                headers: getAuthHeaders(),
            });
            const profileData =
                response.data?.alumni ||
                response.data?.data?.alumni ||
                response.data;
            setCurrentAlumniProfile(profileData);
        } catch (error) {
            console.error("Error fetching profile:", error);
            setCurrentAlumniProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const updateStats = useCallback((posts) => {
        try {
            const total = posts.length;
            const pending = posts.filter((p) => p.status === "pending").length;
            const approved = posts.filter(
                (p) => p.status === "approved",
            ).length;
            const fullOrExpired = posts.filter(
                (p) => p.is_full || p.is_expired,
            ).length;
            setStatsData({ total, pending, approved, fullOrExpired });
        } catch (error) {
            console.error("Error updating stats:", error);
        }
    }, []);

    // Filter and sort jobs (exclude full/expired from browse)
    const filteredAndSortedJobs = useMemo(() => {
        try {
            let result = [...jobPosts];

            // Exclude full or expired jobs from browse tab
            if (activeTab === "browse") {
                result = result.filter(
                    (job) => !job.is_full && !job.is_expired,
                );
            }

            // Filter by search text
            if (searchText) {
                const search = searchText.toLowerCase();
                result = result.filter(
                    (job) =>
                        job.title?.toLowerCase().includes(search) ||
                        job.company?.toLowerCase().includes(search) ||
                        job.location?.toLowerCase().includes(search),
                );
            }

            // Filter by job type
            if (filterJobType !== "all") {
                result = result.filter((job) => job.job_type === filterJobType);
            }

            // Filter by status (admin only)
            if (filterStatus !== "all") {
                result = result.filter((job) => job.status === filterStatus);
            }

            // Sort
            result.sort((a, b) => {
                switch (sortBy) {
                    case "date-desc":
                        return new Date(b.created_at) - new Date(a.created_at);
                    case "date-asc":
                        return new Date(a.created_at) - new Date(b.created_at);
                    case "salary-desc":
                        return (b.salary_min || 0) - (a.salary_min || 0);
                    case "salary-asc":
                        return (a.salary_min || 0) - (b.salary_min || 0);
                    case "title-asc":
                        return (a.title || "").localeCompare(b.title || "");
                    case "title-desc":
                        return (b.title || "").localeCompare(a.title || "");
                    default:
                        return 0;
                }
            });

            return result;
        } catch (error) {
            console.error("Error filtering/sorting jobs:", error);
            return jobPosts;
        }
    }, [jobPosts, searchText, filterJobType, filterStatus, sortBy, activeTab]);

    // ============ IMAGE UPLOAD HANDLERS (SAME AS AlumniEvents.js) ============
    const handleUploadChange = useCallback(
        ({ fileList: newFileList }) => {
            bannerFileListRef.current = newFileList;
            setFileList(newFileList);
            // ENHANCEMENT: persist draft when banner changes (new posts only)
            if (!editingPost) {
                if (draftSaveTimerRef.current)
                    clearTimeout(draftSaveTimerRef.current);
                draftSaveTimerRef.current = setTimeout(
                    () => persistDraftNow(),
                    400,
                );
            }
        },
        [editingPost, persistDraftNow],
    );

    const handleBeforeUpload = useCallback((file) => {
        try {
            const isImage = file.type.startsWith("image/");
            if (!isImage) {
                message.error("You can only upload image files!");
                return Upload.LIST_IGNORE;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error("Image must be smaller than 5MB!");
                return Upload.LIST_IGNORE;
            }
            return false;
        } catch (error) {
            console.error("Error in beforeUpload:", error);
            return Upload.LIST_IGNORE;
        }
    }, []);

    // ============ ID DOCUMENT UPLOAD HANDLERS ============
    const handleIdDocumentAdd = useCallback(() => {
        setIdDocuments((prev) => [...prev, { type: "", fileList: [] }]);
    }, []);

    const handleIdDocumentRemove = useCallback((index) => {
        setIdDocuments((prev) => {
            const newDocs = [...prev];
            newDocs.splice(index, 1);
            return newDocs;
        });
    }, []);

    const handleIdDocumentTypeChange = useCallback((index, value) => {
        setIdDocuments((prev) => {
            const newDocs = [...prev];
            newDocs[index] = { ...newDocs[index], type: value };
            return newDocs;
        });
    }, []);

    const handleIdDocumentFileChange = useCallback((index, { fileList }) => {
        setIdDocuments((prev) => {
            const newDocs = [...prev];
            newDocs[index] = { ...newDocs[index], fileList };
            return newDocs;
        });
    }, []);

    const handleOtherDocumentsChange = useCallback(({ fileList }) => {
        setOtherDocuments(fileList);
    }, []);

    // Validate ID documents - at least 2 required
    const validateIdDocuments = useCallback(() => {
        try {
            const validDocs = idDocuments.filter(
                (doc) => doc.type && doc.fileList.length > 0,
            );
            return validDocs.length >= 2;
        } catch (error) {
            console.error("Error validating ID documents:", error);
            return false;
        }
    }, [idDocuments]);

    // Get available ID types (exclude already selected ones)
    const getAvailableIdTypes = useCallback(
        (currentIndex) => {
            try {
                const selectedTypes = idDocuments
                    .filter((_, idx) => idx !== currentIndex)
                    .map((doc) => doc.type)
                    .filter(Boolean);
                return VALID_ID_TYPES.filter(
                    (type) => !selectedTypes.includes(type.value),
                );
            } catch (error) {
                console.error("Error getting available ID types:", error);
                return VALID_ID_TYPES;
            }
        },
        [idDocuments],
    );

    // ============ FORM SUBMIT WITH IMAGE - WITH WARNING MODAL FOR ALUMNI ============
    const handleFormSubmit = useCallback(
        async (values) => {
            // If alumni is creating a NEW post (not editing), show warning modal first
            if (userRole !== "admin" && !editingPost) {
                setPendingFormValues(values);
                setSubmitWarningModalVisible(true);
                return;
            }

            // Continue with actual submission
            await performFormSubmit(values);
        },
        [userRole, editingPost],
    );

    // ============ FIX: Actual form submission logic - Updated to properly handle image and refresh ============
    const performFormSubmit = useCallback(
        async (values) => {
            setJobPostSubmitLoading(true);
            try {
                const formData = new FormData();

                formData.append("title", values.title);
                formData.append("description", values.description);
                formData.append("company", values.company);
                formData.append("requirements", values.requirements);
                formData.append("job_type", values.job_type);
                formData.append("location", values.location || "");
                formData.append("salary_min", values.salary_min || "");
                formData.append("salary_max", values.salary_max || "");

                // Handle capacity
                if (values.capacity) {
                    formData.append("capacity", values.capacity);
                }

                // Handle expiration days
                if (values.expiration_days) {
                    formData.append("expiration_days", values.expiration_days);
                }

                formData.append(
                    "reference_source_type",
                    values.reference_source_type ?? "",
                );
                formData.append("reference_url", values.reference_url ?? "");
                formData.append(
                    "verification_notes",
                    values.verification_notes ?? "",
                );


                const currentBannerList = bannerFileListRef.current || [];
                const firstItem = currentBannerList[0];

                // antd Upload stores the real File here
                const bannerFile = firstItem?.originFileObj;

                if (bannerFile instanceof File) {
                    formData.append(
                        "banner_image",
                        bannerFile,
                        bannerFile.name,
                    );
                }
                // If editing and only URL exists (no originFileObj), do nothing (keeps old image)
                // ===============================================================

                let response;
                if (editingPost) {
                    // Update existing post
                    response = await axios.post(
                        `/job-posts/${editingPost.id}?_method=PUT`,
                        formData,
                        {
                            headers: {
                                ...getAuthHeaders(),
                            },
                        },
                    );
                } else {
                    // Create new post
                    response = await axios.post("/job-posts", formData, {
                        headers: {
                            ...getAuthHeaders(),
                        },
                    });
                }

                message.success(
                    userRole === "admin"
                        ? "Job post saved!"
                        : "Job post submitted for approval!",
                );

                // ENHANCEMENT: capture created job + clear draft + show success modal (new posts only)
                const createdJob =
                    response?.data?.data || response?.data || null;
                const wasCreating = !editingPost;
                if (wasCreating) {
                    clearJobPostDraft();
                    setDraftLastSaved(null);
                }

                setIsModalVisible(false);
                setEditingPost(null);
                form.resetFields();
                setFileList([]);
                bannerFileListRef.current = [];

                if (wasCreating && createdJob) {
                    setLastCreatedJob(createdJob);
                    setSuccessModalVisible(true);
                }

                // ============ FIX: Add newly created/updated post immediately ============
                if (response.data) {
                    const newPost = response.data.data || response.data;

                    // Ensure banner_image_url exists for immediate UI rendering
                    if (newPost.banner_image && !newPost.banner_image_url) {
                        newPost.banner_image_url = buildImageUrl(
                            newPost.banner_image,
                        );
                    }

                    if (userRole === "admin") {
                        if (editingPost) {
                            setJobPosts((prev) =>
                                prev.map((p) =>
                                    p.id === newPost.id ? newPost : p,
                                ),
                            );
                        } else {
                            setJobPosts((prev) => [newPost, ...prev]);
                        }

                        // Sync with backend
                        setTimeout(() => {
                            fetchJobPosts();
                        }, 500);
                    } else {
                        if (editingPost) {
                            setMyPostings((prev) =>
                                prev.map((p) =>
                                    p.id === newPost.id ? newPost : p,
                                ),
                            );
                        } else {
                            setMyPostings((prev) => [newPost, ...prev]);
                        }

                        setTimeout(() => {
                            fetchMyPostings();
                        }, 500);
                    }
                } else {
                    // Fallback
                    if (userRole === "admin") {
                        fetchJobPosts();
                    } else {
                        fetchMyPostings();
                    }
                }
            } catch (error) {
                handleApiError(error, "Error saving job post");
            } finally {
                setJobPostSubmitLoading(false);
            }
        },
        [
            editingPost,
            fileList,
            form,
            userRole,
            fetchJobPosts,
            fetchMyPostings,
            handleApiError,
        ],
    );

    // Delete job post
    const handleDeletePost = useCallback(
        (postId) => {
            Modal.confirm({
                title: "Delete Job Post",
                content: "Are you sure you want to delete this job post?",
                okText: "Yes",
                cancelText: "No",
                onOk: async () => {
                    try {
                        await axios.delete(`/job-posts/${postId}`, {
                            headers: getAuthHeaders(),
                        });
                        message.success("Job post deleted!");
                        if (userRole === "admin") {
                            fetchJobPosts();
                            fetchFullOrExpiredPosts();
                        } else {
                            fetchMyPostings();
                            fetchFullOrExpiredPosts();
                        }
                    } catch (error) {
                        handleApiError(error, "Error deleting job post");
                    }
                },
            });
        },
        [
            userRole,
            fetchJobPosts,
            fetchFullOrExpiredPosts,
            fetchMyPostings,
            handleApiError,
        ],
    );

    // Admin: Approve job post - UPDATED: Now sends email notification
    const handleApprovePost = useCallback(
        (postId) => {
            Modal.confirm({
                title: "Approve Job Post",
                content:
                    "Are you sure you want to approve this job post? An email notification will be sent to the alumni who created it.",
                onOk: async () => {
                    try {
                        await axios.post(
                            `/job-posts/${postId}/approve`,
                            {},
                            {
                                headers: getAuthHeaders(),
                            },
                        );
                        message.success(
                            "Job post approved! Email notification sent to the creator.",
                        );
                        fetchPendingPosts();
                        fetchJobPosts();
                    } catch (error) {
                        handleApiError(error, "Error approving job post");
                    }
                },
            });
        },
        [fetchPendingPosts, fetchJobPosts, handleApiError],
    );

    // ============ NEW: Admin: Reject job post - Opens modal for notes ============
    const handleRejectPost = useCallback((postId) => {
        setRejectJobPostId(postId);
        setRejectJobPostNotes("");
        setRejectJobPostModalVisible(true);
    }, []);

    // ============ NEW: Confirm rejection with notes ============
    const confirmRejectJobPost = useCallback(async () => {
        if (!rejectJobPostNotes.trim()) {
            message.error("Please provide a reason for rejection");
            return;
        }
        if (rejectJobPostNotes.trim().length < 10) {
            message.error("Rejection notes must be at least 10 characters");
            return;
        }

        try {
            setRejectJobPostLoading(true);
            await axios.post(
                `/job-posts/${rejectJobPostId}/reject`,
                { admin_notes: rejectJobPostNotes },
                {
                    headers: getAuthHeaders(),
                },
            );
            message.success(
                "Job post rejected! Email notification sent to the creator.",
            );
            setRejectJobPostModalVisible(false);
            setRejectJobPostId(null);
            setRejectJobPostNotes("");
            fetchPendingPosts();
            fetchJobPosts();
        } catch (error) {
            handleApiError(error, "Error rejecting job post");
        } finally {
            setRejectJobPostLoading(false);
        }
    }, [
        rejectJobPostId,
        rejectJobPostNotes,
        fetchPendingPosts,
        fetchJobPosts,
        handleApiError,
    ]);

    // ============ UPDATED: Alumni: Apply for job - Now fetches profile ============
    const handleApplyClick = useCallback(
        (job) => {
            try {
                // Check if job is full or expired before allowing application
                if (job.is_expired) {
                    message.error(
                        "This job post has expired and is no longer accepting applications",
                    );
                    return;
                }
                if (job.is_full) {
                    message.error(
                        "This job post has reached its application capacity limit",
                    );
                    return;
                }
                setSelectedJob(job);
                fetchCurrentAlumniProfile(); // ✅ NEW: Fetch profile when opening modal
                // Reset ID documents state
                setIdDocuments([
                    { type: "", fileList: [] },
                    { type: "", fileList: [] },
                ]); // Start with 2 empty slots
                setOtherDocuments([]);
                setIsApplicationModalVisible(true);
                // ============ ENHANCEMENT: Application Draft Restore ============
                // Track context for auto-save and look for an existing draft.
                try {
                    const uid = currentUser?.id;
                    applicationDraftCtxRef.current = {
                        jobId: job?.id || null,
                        userId: uid || null,
                    };
                    setApplicationFormDirty(false);
                    setApplicationDraftLastSaved(null);
                    const existing = loadApplicationDraft(job?.id, uid);
                    if (
                        existing &&
                        (existing.cover_letter ||
                            (existing._idDocuments &&
                                existing._idDocuments.length) ||
                            (existing._otherDocuments &&
                                existing._otherDocuments.length) ||
                            existing._resume)
                    ) {
                        setPendingApplicationDraft(existing);
                        setApplicationDraftRestoreVisible(true);
                    } else {
                        // Make sure form starts fresh
                        try {
                            appForm.resetFields();
                        } catch {}
                    }
                } catch (draftErr) {
                    console.warn(
                        "Application draft restore check failed:",
                        draftErr,
                    );
                }
            } catch (error) {
                console.error("Error handling apply click:", error);
                message.error("Error opening application form");
            }
        },
        [fetchCurrentAlumniProfile, currentUser, appForm],
    );

    const handleViewDetails = useCallback((job) => {
        setSelectedJob(job);
        setJobDetailsVisible(true);
    }, []);

    const handleReviewApplications = useCallback(
        (job) => {
            setSelectedJob(job);
            fetchJobApplications(job.id);
        },
        [fetchJobApplications],
    );

    // ============ UPDATED: Handle application status update - Now opens modal for rejection ============
    const handleUpdateApplicationStatus = useCallback(
        async (applicationId, status) => {
            if (status === "rejected") {
                // Open rejection modal instead of directly rejecting
                setRejectApplicationId(applicationId);
                setRejectApplicationNotes("");
                setRejectApplicationModalVisible(true);
                return;
            }

            try {
                setApplicationActionLoading((prev) => ({
                    ...prev,
                    [applicationId]: status,
                }));
                await axios.put(
                    `/job-applications/${applicationId}/status`,
                    { status },
                    { headers: getAuthHeaders() },
                );
                message.success(`Application ${status}!`);
                if (selectedJob) {
                    fetchJobApplications(selectedJob.id);
                }
            } catch (error) {
                handleApiError(error, "Error updating application");
            } finally {
                setApplicationActionLoading((prev) => ({
                    ...prev,
                    [applicationId]: null,
                }));
            }
        },
        [selectedJob, fetchJobApplications, handleApiError],
    );

    // ============ NEW: Confirm application rejection with notes ============
    const confirmRejectApplication = useCallback(async () => {
        if (!rejectApplicationNotes.trim()) {
            message.error("Please provide feedback for the applicant");
            return;
        }
        if (rejectApplicationNotes.trim().length < 10) {
            message.error("Feedback must be at least 10 characters");
            return;
        }

        try {
            setRejectApplicationLoading(true);
            await axios.put(
                `/job-applications/${rejectApplicationId}/status`,
                { status: "rejected", admin_feedback: rejectApplicationNotes },
                { headers: getAuthHeaders() },
            );
            message.success(
                "Application rejected! Email notification sent to the applicant.",
            );
            setRejectApplicationModalVisible(false);
            setRejectApplicationId(null);
            setRejectApplicationNotes("");
            if (selectedJob) {
                fetchJobApplications(selectedJob.id);
            }
        } catch (error) {
            handleApiError(error, "Error rejecting application");
        } finally {
            setRejectApplicationLoading(false);
        }
    }, [
        rejectApplicationId,
        rejectApplicationNotes,
        selectedJob,
        fetchJobApplications,
        handleApiError,
    ]);

    // ============ UPDATED: Application Submit with ID Documents ============
    const handleApplicationSubmit = useCallback(
        async (values) => {
            const validationErrors = [];

            // Validate Resume
            if (!values.resume || values.resume.length === 0) {
                validationErrors.push(
                    "Resume is required. Please upload your resume file.",
                );
            }

            // Validate Cover Letter
            if (!values.cover_letter || values.cover_letter.trim() === "") {
                validationErrors.push(
                    "Cover letter is required. Please write a brief introduction about yourself.",
                );
            } else if (values.cover_letter.trim().length < 50) {
                validationErrors.push(
                    "Cover letter must be at least 50 characters long.",
                );
            }

            // Validate ID Documents
            const validDocs = idDocuments.filter(
                (doc) => doc.type && doc.fileList.length > 0,
            );

            if (validDocs.length < 2) {
                validationErrors.push(
                    "At least 2 valid ID documents are required.",
                );
            }

            // Check each ID document
            idDocuments.forEach((doc, index) => {
                const docNum = index + 1;
                if (doc.type && (!doc.fileList || doc.fileList.length === 0)) {
                    validationErrors.push(
                        `ID Document ${docNum}: Please upload the file for "${getIdTypeLabel(doc.type)}".`,
                    );
                }
                if (!doc.type && doc.fileList && doc.fileList.length > 0) {
                    validationErrors.push(
                        `ID Document ${docNum}: Please select an ID type for the uploaded file.`,
                    );
                }
            });

            // Check for duplicate ID types
            const usedTypes = idDocuments
                .filter((d) => d.type)
                .map((d) => d.type);
            const duplicates = usedTypes.filter(
                (type, index) => usedTypes.indexOf(type) !== index,
            );
            if (duplicates.length > 0) {
                validationErrors.push(
                    "Each ID document must be of a different type. You have duplicate ID types selected.",
                );
            }

            // If there are validation errors, show them all in a modal
            if (validationErrors.length > 0) {
                Modal.error({
                    title: "Please fix the following errors before submitting:",
                    content: (
                        <div style={{ maxHeight: 300, overflowY: "auto" }}>
                            <ul style={{ paddingLeft: 20, margin: 0 }}>
                                {validationErrors.map((error, index) => (
                                    <li
                                        key={index}
                                        style={{
                                            marginBottom: 8,
                                            color: "#ff4d4f",
                                        }}
                                    >
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ),
                    okText: "OK",
                    width: 500,
                });
                return;
            }

            // Validate ID documents
            if (!validateIdDocuments()) {
                message.error("Please upload at least 2 valid ID documents");
                return;
            }

            setSubmitApplicationLoading(true);
            try {
                const formData = new FormData();

                if (values.resume?.[0]) {
                    formData.append("resume", values.resume[0].originFileObj);
                }

                formData.append("cover_letter", values.cover_letter || "");

                // Append ID documents with proper file naming for Laravel validation
                let docCounter = 0;
                idDocuments.forEach((doc) => {
                    if (
                        doc.type &&
                        doc.fileList.length > 0 &&
                        doc.fileList[0].originFileObj
                    ) {
                        formData.append(
                            `id_documents[${docCounter}][type]`,
                            doc.type,
                        );
                        formData.append(
                            `id_documents[${docCounter}][file]`,
                            doc.fileList[0].originFileObj,
                            doc.fileList[0].name,
                        );
                        docCounter++;
                    }
                });

                // Append other documents with proper file naming for Laravel validation
                let otherCounter = 0;
                otherDocuments.forEach((file) => {
                    if (file.originFileObj) {
                        formData.append(
                            `other_documents[${otherCounter}]`,
                            file.originFileObj,
                            file.name,
                        );
                        otherCounter++;
                    }
                });

                await axios.post(
                    `/job-applications/${selectedJob.id}`,
                    formData,
                    {
                        headers: {
                            ...getAuthHeaders(),
                            "Content-Type": "multipart/form-data",
                        },
                    },
                );

                setIsApplicationModalVisible(false);
                appForm.resetFields();
                setIdDocuments([]);
                setOtherDocuments([]);

                // Show success modal
                setApplicationSuccessModalVisible(true);

                // ============ ENHANCEMENT: Clear application draft on success ============
                try {
                    const { jobId, userId } =
                        applicationDraftCtxRef.current || {};
                    clearApplicationDraft(jobId, userId);
                    setApplicationFormDirty(false);
                    setApplicationDraftLastSaved(null);
                    applicationDraftCtxRef.current = {
                        jobId: null,
                        userId: null,
                    };
                } catch (clearErr) {
                    console.warn(
                        "Failed to clear application draft after submit:",
                        clearErr,
                    );
                }

                fetchMyApplications();
            } catch (error) {
                handleApiError(error, "Error submitting application");
            } finally {
                setSubmitApplicationLoading(false);
            }
        },
        [
            selectedJob,
            idDocuments,
            otherDocuments,
            validateIdDocuments,
            appForm,
            fetchMyApplications,
            handleApiError,
        ],
    );

    // ============================================================
    // ENHANCEMENT: Application auto-save + unsaved-changes guard
    // ============================================================

    // Build a snapshot of the application form (values + file metadata).
    // File blobs cannot be persisted in localStorage, so we store metadata
    // only (name/type/size) and let the user know to re-attach if needed.
    const buildApplicationSnapshot = useCallback(() => {
        try {
            const values = appForm.getFieldsValue() || {};
            const resumeMeta = (values.resume || []).map((f) => ({
                uid: f.uid,
                name: f.name,
                size: f.size,
                type: f.type,
                status: f.status,
            }));
            const idDocsMeta = (idDocuments || []).map((d) => ({
                type: d.type || "",
                file:
                    d.fileList && d.fileList[0]
                        ? {
                              uid: d.fileList[0].uid,
                              name: d.fileList[0].name,
                              size: d.fileList[0].size,
                              type: d.fileList[0].type,
                          }
                        : null,
            }));
            const otherDocsMeta = (otherDocuments || []).map((f) => ({
                uid: f.uid,
                name: f.name,
                size: f.size,
                type: f.type,
            }));
            return {
                cover_letter: values.cover_letter || "",
                _resume: resumeMeta,
                _idDocuments: idDocsMeta,
                _otherDocuments: otherDocsMeta,
            };
        } catch {
            return {};
        }
    }, [appForm, idDocuments, otherDocuments]);

    // Determine if the user has modified at least one application field.
    const isApplicationFormModified = useCallback(() => {
        try {
            const snap = buildApplicationSnapshot();
            const hasCover = (snap.cover_letter || "").trim().length > 0;
            const hasResume = (snap._resume || []).length > 0;
            const hasIdFiles = (snap._idDocuments || []).some(
                (d) => d.type || d.file,
            );
            const hasOther = (snap._otherDocuments || []).length > 0;
            return hasCover || hasResume || hasIdFiles || hasOther;
        } catch {
            return false;
        }
    }, [buildApplicationSnapshot]);

    const persistApplicationDraftNow = useCallback(() => {
        const { jobId, userId } = applicationDraftCtxRef.current || {};
        if (!jobId || !userId) return;
        if (!isApplicationModalVisible) return;
        if (!isApplicationFormModified()) return;
        const snap = buildApplicationSnapshot();
        const ok = saveApplicationDraft(jobId, userId, snap);
        if (ok) {
            setApplicationDraftLastSaved(new Date());
            setApplicationFormDirty(true);
        }
    }, [
        isApplicationModalVisible,
        isApplicationFormModified,
        buildApplicationSnapshot,
    ]);

    // Debounced auto-save on any application form change
    const handleApplicationFormValuesChange = useCallback(() => {
        setApplicationFormDirty(true);
        if (applicationDraftTimerRef.current)
            clearTimeout(applicationDraftTimerRef.current);
        applicationDraftTimerRef.current = setTimeout(
            persistApplicationDraftNow,
            400,
        );
    }, [persistApplicationDraftNow]);

    // Trigger auto-save whenever upload state changes (uploads are not part of
    // the antd Form.onValuesChange pipeline so we listen explicitly).
    useEffect(() => {
        if (!isApplicationModalVisible) return;
        if (applicationDraftTimerRef.current)
            clearTimeout(applicationDraftTimerRef.current);
        applicationDraftTimerRef.current = setTimeout(
            persistApplicationDraftNow,
            400,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idDocuments, otherDocuments, isApplicationModalVisible]);

    // Restore a saved application draft into the form (text fields only;
    // file blobs must be re-attached by the user since they cannot be persisted).
    const restoreApplicationDraft = useCallback(
        (draft) => {
            if (!draft) return;
            try {
                appForm.setFieldsValue({
                    cover_letter: draft.cover_letter || "",
                });
                if (
                    Array.isArray(draft._idDocuments) &&
                    draft._idDocuments.length > 0
                ) {
                    setIdDocuments(
                        draft._idDocuments.map((d) => ({
                            type: d.type || "",
                            fileList: [],
                        })),
                    );
                }
                // Other docs metadata only — user re-uploads files.
                setOtherDocuments([]);
                setApplicationFormDirty(true);
                if (draft._resume && draft._resume.length > 0) {
                    message.info(
                        "Draft restored. Please re-attach your resume and ID files — uploaded files can't be saved locally for security.",
                    );
                } else {
                    message.success("Application draft restored.");
                }
            } catch (err) {
                console.warn("Failed to restore application draft:", err);
            }
        },
        [appForm],
    );

    // Smart-close: prompt before discarding unsaved application data.
    const attemptCloseApplicationModal = useCallback(() => {
        if (isApplicationFormModified()) {
            setApplicationDiscardConfirmVisible(true);
            return false;
        }
        setIsApplicationModalVisible(false);
        appForm.resetFields();
        setIdDocuments([]);
        setOtherDocuments([]);
        return true;
    }, [isApplicationFormModified, appForm]);

    const confirmDiscardApplicationChanges = useCallback(() => {
        try {
            const { jobId, userId } = applicationDraftCtxRef.current || {};
            clearApplicationDraft(jobId, userId);
        } catch {}
        setApplicationDiscardConfirmVisible(false);
        setIsApplicationModalVisible(false);
        appForm.resetFields();
        setIdDocuments([]);
        setOtherDocuments([]);
        setApplicationFormDirty(false);
        setApplicationDraftLastSaved(null);
        applicationDraftCtxRef.current = { jobId: null, userId: null };
    }, [appForm]);

    // FEATURE 3: Warn the user on refresh / tab close when there are unsaved
    // application changes. Cleared automatically on successful submit / discard.
    useEffect(() => {
        if (!isApplicationModalVisible) return;
        const handler = (e) => {
            if (isApplicationFormModified()) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isApplicationModalVisible, isApplicationFormModified]);

    // Intercept ESC key while the application modal is open so we can prompt
    // instead of closing immediately when there are unsaved changes.
    useEffect(() => {
        if (!isApplicationModalVisible) return;
        const onKey = (e) => {
            if (e.key === "Escape" && isApplicationFormModified()) {
                e.stopPropagation();
                e.preventDefault();
                setApplicationDiscardConfirmVisible(true);
            }
        };
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    }, [isApplicationModalVisible, isApplicationFormModified]);

    // Alumni: Withdraw application
    const handleWithdrawApplication = useCallback(
        async (applicationId) => {
            Modal.confirm({
                title: "Withdraw Application",
                content: "Are you sure you want to withdraw this application?",
                onOk: async () => {
                    try {
                        setWithdrawLoading((prev) => ({
                            ...prev,
                            [applicationId]: true,
                        }));
                        await axios.delete(
                            `/job-applications/${applicationId}`,
                            {
                                headers: getAuthHeaders(),
                            },
                        );
                        message.success("Application withdrawn!");
                        fetchMyApplications();
                    } catch (error) {
                        handleApiError(error, "Error withdrawing application");
                    } finally {
                        setWithdrawLoading((prev) => ({
                            ...prev,
                            [applicationId]: false,
                        }));
                    }
                },
            });
        },
        [fetchMyApplications, handleApiError],
    );

    // Check if current user is the creator of the job post
    const isJobCreator = useCallback(
        (job) => {
            try {
                // Validate currentUser exists and has an ID
                if (!currentUser || !currentUser.id) return false;
                if (!job) return false;

                const userId = Number(currentUser.id);
                const creatorId =
                    Number(job.created_by_user_id) || Number(job.user_id);

                // Validate both IDs are valid numbers and not 0
                if (!userId || isNaN(userId) || userId === 0) return false;
                if (!creatorId || isNaN(creatorId) || creatorId === 0)
                    return false;

                return userId === creatorId;
            } catch (error) {
                console.error("Error checking job creator:", error);
                return false;
            }
        },
        [currentUser],
    );

    // ============ HANDLE EDIT WITH PRE-LOADED IMAGE (SAME AS AlumniEvents.js) ============
    const handleEditPost = useCallback(
        (post) => {
            try {
                setEditingPost(post);

                // Pre-load existing banner image (same pattern as AlumniEvents.js)
                const existingImages = [];
                if (post.banner_image || post.banner_image_url) {
                    const imageUrl = buildImageUrl(
                        post.banner_image || post.banner_image_url,
                    );
                    existingImages.push({
                        uid: "existing-banner",
                        name: "Banner Image",
                        status: "done",
                        url: imageUrl,
                        thumbUrl: imageUrl,
                    });
                }
                setFileList(existingImages);
                bannerFileListRef.current = existingImages;

                // Calculate expiration days from expires_at if exists
                let expirationDays = null;
                if (post.expires_at) {
                    const expiresAt = moment(post.expires_at);
                    const now = moment();
                    if (expiresAt.isAfter(now)) {
                        expirationDays = expiresAt.diff(now, "days");
                        // Round to nearest option
                        const options = [7, 14, 21, 30, 60, 90, 180, 365];
                        expirationDays = options.reduce((prev, curr) =>
                            Math.abs(curr - expirationDays) <
                            Math.abs(prev - expirationDays)
                                ? curr
                                : prev,
                        );
                    }
                }

                form.setFieldsValue({
                    title: post.title,
                    description: post.description,
                    company: post.company,
                    requirements: post.requirements,
                    job_type: post.job_type,
                    location: post.location,
                    salary_min: post.salary_min,
                    salary_max: post.salary_max,
                    capacity: post.capacity,
                    expiration_days: expirationDays,
                    reference_source_type: post.reference_source_type,
                    reference_url: post.reference_url,
                    verification_notes: post.verification_notes,
                });

                setIsModalVisible(true);
            } catch (error) {
                console.error("Error editing post:", error);
                message.error("Error opening edit form");
            }
        },
        [form],
    );

    // // Controls Section Component
    // const ControlsSection = useCallback(() => (
    //   <Card className="controls-card">
    //     <div className="controls-section">
    //       <div className="controls-left">
    //         <Input
    //           placeholder="Search jobs, companies, locations..."
    //           prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
    //           value={searchText}
    //           onChange={(e) => setSearchText(e.target.value)}
    //           allowClear
    //           style={{ width: 300 }}
    //         />
    //         <Select value={filterJobType} onChange={setFilterJobType} style={{ width: 180 }} options={jobTypeOptions} />
    //         {userRole === "admin" && (
    //           <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 160 }} options={statusOptions} />
    //         )}
    //       </div>

    //       <div className="controls-right">
    //         <Select value={sortBy} onChange={setSortBy} style={{ width: 200 }} options={sortOptions} />
    //         {userRole === "admin" && (
    //           <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => {
    //             setEditingPost(null)
    //             form.resetFields()
    //             setFileList([])
    //             setIsModalVisible(true)
    //           }}>
    //             Create Job Post
    //           </Button>
    //         )}
    //       </div>
    //     </div>
    //   </Card>
    // ), [searchText, filterJobType, filterStatus, sortBy, userRole, form])
    // Admin Tabs Content - SILENT LOADING (removed Spin spinning={loading})
    const adminTabsItems = useMemo(
        () => [
            {
                key: "all-posts",
                label: (
                    <Space>
                        <TeamOutlined />
                        <span>All Posts</span>
                        <span
                            style={{
                                backgroundColor: "#1890ff",
                                color: "#fff",
                                borderRadius: "10px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                marginLeft: "4px",
                                display: "inline-block",
                                minWidth: "20px",
                                textAlign: "center",
                            }}
                        >
                            {statsData.total}
                        </span>
                    </Space>
                ),
                children: (
                    <>
                        <ControlsSection
                            searchText={searchText}
                            setSearchText={setSearchText}
                            filterJobType={filterJobType}
                            setFilterJobType={setFilterJobType}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            userRole={userRole}
                            form={form}
                            setEditingPost={setEditingPost}
                            setFileList={setFileList}
                            setIsModalVisible={setIsModalVisible}
                        />
                        <JobPostsGrid
                            posts={filteredAndSortedJobs}
                            isAdmin={true}
                            currentUser={currentUser}
                            onViewDetails={handleViewDetails}
                            onEdit={handleEditPost}
                            onDelete={handleDeletePost}
                            onReviewApplications={handleReviewApplications}
                        />
                    </>
                ),
            },
            {
                key: "pending",
                label: (
                    <Space>
                        <ClockCircleOutlined />
                        <span>Pending Approvals</span>
                        {statsData.pending > 0 && (
                            <span
                                style={{
                                    backgroundColor: "#fa8c16",
                                    color: "#fff",
                                    borderRadius: "10px",
                                    padding: "2px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    marginLeft: "4px",
                                    display: "inline-block",
                                    minWidth: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {statsData.pending}
                            </span>
                        )}
                    </Space>
                ),
                children: (
                    <PendingApprovalsTable
                        posts={pendingPosts}
                        currentUser={currentUser}
                        onApprove={handleApprovePost}
                        onReject={handleRejectPost}
                        onViewDetails={handleViewDetails}
                    />
                ),
            },
            {
                key: "full-expired",
                label: (
                    <Space>
                        <WarningOutlined />
                        <span>Full/Expired</span>
                        {statsData.fullOrExpired > 0 && (
                            <span
                                style={{
                                    backgroundColor: "#ff4d4f",
                                    color: "#fff",
                                    borderRadius: "10px",
                                    padding: "2px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    marginLeft: "4px",
                                    display: "inline-block",
                                    minWidth: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {statsData.fullOrExpired}
                            </span>
                        )}
                    </Space>
                ),
                children: (
                    <FullOrExpiredGrid
                        posts={fullOrExpiredPosts}
                        isAdmin={true}
                        currentUser={currentUser}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEditPost}
                        onDelete={handleDeletePost}
                        onReviewApplications={handleReviewApplications}
                    />
                ),
            },
        ],
        [
            statsData,
            filteredAndSortedJobs,
            currentUser,
            handleViewDetails,
            handleEditPost,
            handleDeletePost,
            handleReviewApplications,
            pendingPosts,
            handleApprovePost,
            handleRejectPost,
            fullOrExpiredPosts,
            searchText,
            filterJobType,
            filterStatus,
            sortBy,
            userRole,
            form,
        ],
    );

    // Alumni Tabs Content - SILENT LOADING (removed Spin spinning={loading})
    const alumniTabsItems = useMemo(
        () => [
            {
                key: "browse",
                label: (
                    <Space>
                        <SearchOutlined />
                        <span>Browse Jobs</span>
                        {statsData.total > 0 && (
                            <span
                                className="tab-count-inline"
                                style={{
                                    backgroundColor: "#1890ff",
                                    color: "#fff",
                                    borderRadius: "10px",
                                    padding: "2px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    marginLeft: "4px",
                                    display: "inline-block",
                                    minWidth: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {statsData.total}
                            </span>
                        )}
                    </Space>
                ),
                children: (
                    <>
                        <ControlsSection
                            searchText={searchText}
                            setSearchText={setSearchText}
                            filterJobType={filterJobType}
                            setFilterJobType={setFilterJobType}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            userRole={userRole}
                            form={form}
                            setEditingPost={setEditingPost}
                            setFileList={setFileList}
                            setIsModalVisible={setIsModalVisible}
                        />
                        <JobsGrid
                            jobs={filteredAndSortedJobs}
                            currentUser={currentUser}
                            onApply={handleApplyClick}
                            onViewDetails={handleViewDetails}
                            onReviewApplications={handleReviewApplications}
                            myApplications={myApplications}
                        />
                    </>
                ),
            },
            {
                key: "create",
                label: (
                    <Space>
                        <PlusOutlined />
                        <span>Post a Job</span>
                    </Space>
                ),
                children: (
                    <Card className="create-job-card">
                        <div className="create-job-content">
                            <div className="create-job-icon">
                                <BankOutlined
                                    style={{ fontSize: 48, color: "#667eea" }}
                                />
                            </div>
                            <Title level={4}>Share a Job Opportunity</Title>
                            <Paragraph type="secondary">
                                Post a job opening from your organization. Admin
                                approval is required before publishing.
                            </Paragraph>
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditingPost(null);
                                    form.resetFields();
                                    setFileList([]);
                                    setIsModalVisible(true);
                                }}
                            >
                                Create Job Post
                            </Button>
                        </div>
                    </Card>
                ),
            },
            {
                key: "my-postings",
                label: (
                    <Space>
                        <FileOutlined />
                        <span>My Postings</span>
                        {myPostings.length > 0 && (
                            <span
                                className="tab-count-inline"
                                style={{
                                    backgroundColor: "#52c41a",
                                    color: "#fff",
                                    borderRadius: "10px",
                                    padding: "2px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    marginLeft: "4px",
                                    display: "inline-block",
                                    minWidth: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {myPostings.length}
                            </span>
                        )}
                    </Space>
                ),
                children: (
                    <JobPostsGrid
                        posts={myPostings.filter(
                            (p) => !p.is_full && !p.is_expired,
                        )}
                        isAdmin={false}
                        currentUser={currentUser}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEditPost}
                        onDelete={handleDeletePost}
                        onReviewApplications={handleReviewApplications}
                        isMyPostings={true}
                    />
                ),
            },
            {
                key: "my-applications",
                label: (
                    <Space>
                        <SendOutlined />
                        <span>My Applications</span>
                        {myApplications.length > 0 && (
                            <span
                                className="tab-count-inline"
                                style={{
                                    backgroundColor: "#722ed1",
                                    color: "#fff",
                                    borderRadius: "10px",
                                    padding: "2px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    marginLeft: "4px",
                                    display: "inline-block",
                                    minWidth: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {myApplications.length}
                            </span>
                        )}
                    </Space>
                ),
                children: (
                    <ApplicationsTable
                        applications={myApplications}
                        currentUser={currentUser}
                        onWithdraw={handleWithdrawApplication}
                        withdrawLoading={withdrawLoading}
                    />
                ),
            },
            {
                key: "full-expired",
                label: (
                    <Space>
                        <WarningOutlined />
                        <span>Full/Expired</span>
                        {fullOrExpiredPosts.length > 0 && (
                            <span
                                className="tab-count-inline"
                                style={{
                                    backgroundColor: "#ff4d4f",
                                    color: "#fff",
                                    borderRadius: "10px",
                                    padding: "2px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    marginLeft: "4px",
                                    display: "inline-block",
                                    minWidth: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {fullOrExpiredPosts.length}
                            </span>
                        )}
                    </Space>
                ),
                children: (
                    <FullOrExpiredGrid
                        posts={fullOrExpiredPosts}
                        isAdmin={false}
                        currentUser={currentUser}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEditPost}
                        onDelete={handleDeletePost}
                        onReviewApplications={handleReviewApplications}
                    />
                ),
            },
        ],
        [
            filteredAndSortedJobs,
            currentUser,
            handleApplyClick,
            handleViewDetails,
            handleReviewApplications,
            myApplications,
            myPostings,
            handleEditPost,
            handleDeletePost,
            handleWithdrawApplication,
            fullOrExpiredPosts,
            form,
            statsData,
            withdrawLoading,
            searchText,
            filterJobType,
            filterStatus,
            sortBy,
            userRole,
        ],
    );

    const tabsItems = userRole === "admin" ? adminTabsItems : alumniTabsItems;

    return (
        <Layout>
            <div className="job-post-page-container">
                {/* Header Section — Modern Hero */}
                <section className="ae-hero">
                    <div className="ae-hero__bg" aria-hidden>
                        <span className="blob blob-1" />
                        <span className="blob blob-2" />
                        <span className="blob blob-3" />
                        <div className="dot-grid" />
                    </div>

                    <div className="ae-hero__content">
                        <div className="ae-hero__brand">
                            <img
                                src={logo}
                                alt="OCC Logo"
                                className="ae-hero__logo"
                            />
                            <div className="ae-hero__brand-meta">
                                <Tag
                                    className="ae-chip"
                                    icon={<BankOutlined />}
                                >
                                    JOB POSTS
                                </Tag>
                                <Text className="ae-hero__eyebrow">
                                    Alumni Tracing Management System
                                </Text>
                            </div>
                        </div>

                        <Title className="ae-hero__title">
                            Job Posts{" "}
                            <span className="grad-text">Management</span>
                        </Title>

                        <Paragraph className="ae-hero__lead">
                            {userRole === "admin"
                                ? "Manage job postings and approve alumni submissions across the platform."
                                : "Browse job opportunities, share career openings, and manage your applications within the alumni community."}
                        </Paragraph>

                        <div className="ae-hero__stats">
                            <div className="ae-stat">
                                <span className="ae-stat__icon">
                                    <TeamOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {statsData.total}
                                    </span>
                                    <span className="ae-stat__label">
                                        Total Posts
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--blue">
                                    <ClockCircleOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {statsData.pending}
                                    </span>
                                    <span className="ae-stat__label">
                                        Pending
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--green">
                                    <CheckCircleOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {statsData.approved}
                                    </span>
                                    <span className="ae-stat__label">
                                        Approved
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--gray">
                                    <WarningOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {statsData.fullOrExpired}
                                    </span>
                                    <span className="ae-stat__label">
                                        Full / Expired
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabs Card */}
                <Card className="tabs-card">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabsItems}
                        className="job-tabs"
                    />
                </Card>

                {/* ============ NEW: Job Post Rejection Modal ============ */}
                <Modal
                    title={
                        <Space>
                            <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                            <span>Reject Job Post</span>
                        </Space>
                    }
                    open={rejectJobPostModalVisible}
                    onCancel={() => {
                        setRejectJobPostModalVisible(false);
                        setRejectJobPostId(null);
                        setRejectJobPostNotes("");
                    }}
                    onOk={confirmRejectJobPost}
                    okText="Reject & Send Email"
                    okType="danger"
                    okButtonProps={{ loading: rejectJobPostLoading }}
                    cancelButtonProps={{ disabled: rejectJobPostLoading }}
                    width={isMobile ? "95%" : 600}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <Alert
                            message="Rejection Notification"
                            description="The alumni who created this job post will receive an email notification with your feedback explaining why their post was rejected."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Text strong>
                            Please provide a reason for rejection:
                        </Text>
                        <Text
                            type="secondary"
                            style={{ display: "block", marginBottom: 8 }}
                        >
                            This feedback will be sent to the alumni via email.
                        </Text>
                        <TextArea
                            rows={5}
                            value={rejectJobPostNotes}
                            onChange={(e) =>
                                setRejectJobPostNotes(e.target.value)
                            }
                            placeholder={`Example: Your job post was rejected because:
- The job description lacks specific requirements
- The salary range seems unrealistic
- Missing company information
- Please provide more details about the role responsibilities

Feel free to update your post and resubmit for review.`}
                            maxLength={1000}
                            showCount
                            style={{ marginTop: 8 }}
                        />
                    </div>
                </Modal>

                {/* ============ NEW: Application Rejection Modal ============ */}
                <Modal
                    title={
                        <Space>
                            <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                            <span>Reject Application</span>
                        </Space>
                    }
                    open={rejectApplicationModalVisible}
                    onCancel={() => {
                        setRejectApplicationModalVisible(false);
                        setRejectApplicationId(null);
                        setRejectApplicationNotes("");
                    }}
                    onOk={confirmRejectApplication}
                    okText="Reject & Send Email"
                    okType="danger"
                    okButtonProps={{ loading: rejectApplicationLoading }}
                    cancelButtonProps={{ disabled: rejectApplicationLoading }}
                    width={isMobile ? "95%" : 600}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <Alert
                            message="Rejection Notification"
                            description="The applicant will receive an email notification with your feedback explaining why their application was not successful."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Text strong>
                            Please provide feedback for the applicant:
                        </Text>
                        <Text
                            type="secondary"
                            style={{ display: "block", marginBottom: 8 }}
                        >
                            This feedback will help the applicant understand the
                            decision and improve for future applications.
                        </Text>
                        <TextArea
                            rows={5}
                            value={rejectApplicationNotes}
                            onChange={(e) =>
                                setRejectApplicationNotes(e.target.value)
                            }
                            placeholder={`Example: Thank you for your interest in this position. After careful review:
- We are looking for candidates with more experience in [specific skill]
- The role requires [specific qualification] which was not evident in your application
- We encourage you to apply for other positions that may be a better fit

We appreciate your interest and wish you success in your job search.`}
                            maxLength={1000}
                            showCount
                            style={{ marginTop: 8 }}
                        />
                    </div>
                </Modal>

                {/* Create/Edit Job Modal */}
                <Modal
                    title={
                        <Space size="middle" wrap>
                            <span>
                                {editingPost
                                    ? "Edit Job Post"
                                    : "Create Job Post"}
                            </span>
                            {!editingPost && draftLastSaved && (
                                <Tag
                                    icon={<CheckCircleOutlined />}
                                    color="green"
                                    style={{ margin: 0 }}
                                >
                                    Auto Saved ·{" "}
                                    {moment(draftLastSaved).format("HH:mm:ss")}
                                </Tag>
                            )}
                        </Space>
                    }
                    open={isModalVisible}
                    okText={editingPost ? "Update" : "Submit"}
                    onOk={() => {
                        // ✅ FIX: Validate fileList manually for banner_image since Upload doesn't work with Form validation
                        if (fileList.length === 0) {
                            message.error("Please upload a banner image");
                            return;
                        }
                        form.submit();
                    }}
                    onCancel={requestCloseCreateModal}
                    okButtonProps={{ loading: jobPostSubmitLoading }}
                    maskClosable={false}
                    width={isMobile ? "95%" : 760}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                    className="job-form-modal"
                >
                    <Form
                        form={form}
                        onFinish={handleFormSubmit}
                        layout="vertical"
                        onValuesChange={(changed, all) => {
                            handleFormValuesChange();
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    changed,
                                    "reference_url",
                                )
                            ) {
                                const v = all.reference_url;
                                if (!v) setReferenceUrlValid(null);
                                else setReferenceUrlValid(isValidHttpUrl(v));
                            }
                        }}
                    >
                        {/* ============ IMAGE UPLOAD (SAME AS AlumniEvents.js) ============ */}
                        <Form.Item
                            name="banner_image"
                            label="Job Post Banner Image"
                        >
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onChange={handleUploadChange}
                                beforeUpload={handleBeforeUpload}
                                maxCount={1}
                                accept={ACCEPTED_FORMATS.BANNER_IMAGE.accept}
                            >
                                {fileList.length < 1 && (
                                    <div>
                                        <PictureOutlined
                                            style={{
                                                fontSize: 24,
                                                color: "#667eea",
                                            }}
                                        />
                                        <div style={{ marginTop: 8 }}>
                                            Upload Banner
                                        </div>
                                    </div>
                                )}
                            </Upload>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Recommended size: 1200x630px.{" "}
                                {ACCEPTED_FORMATS.BANNER_IMAGE.hint}{" "}
                                <Text type="danger">*Required</Text>
                            </Text>
                        </Form.Item>

                        <Form.Item
                            name="title"
                            label="Job Title"
                            extra="Example: Software Developer"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter job title",
                                },
                                {
                                    min: 5,
                                    message:
                                        "Job title must be at least 5 characters",
                                },
                                { max: 120, message: "Job title is too long" },
                            ]}
                        >
                            <Input
                                placeholder="e.g., Senior Software Engineer"
                                size="large"
                                maxLength={120}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Job Description"
                            extra="Describe responsibilities, day-to-day work, and what success looks like."
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter job description",
                                },
                                {
                                    min: 50,
                                    message:
                                        "Description must be at least 50 characters",
                                },
                            ]}
                        >
                            <Input.TextArea
                                rows={5}
                                placeholder="Describe the job responsibilities..."
                                showCount
                                maxLength={5000}
                            />
                        </Form.Item>

                        <Form.Item
                            name="company"
                            label="Company Name"
                            extra="Example: Accenture Philippines"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter company name",
                                },
                                {
                                    max: 150,
                                    message: "Company name is too long",
                                },
                            ]}
                        >
                            <Input
                                placeholder="e.g., Tech Company Inc."
                                prefix={<BankOutlined />}
                                size="large"
                                maxLength={150}
                            />
                        </Form.Item>

                        <Form.Item
                            name="requirements"
                            label="Requirements"
                            extra="List required skills, qualifications, and certifications."
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter job requirements",
                                },
                            ]}
                        >
                            <Input.TextArea
                                rows={4}
                                placeholder="Enter required skills and qualifications"
                                showCount
                                maxLength={3000}
                            />
                        </Form.Item>

                        <Form.Item
                            name="job_type"
                            label="Job Type"
                            rules={[
                                {
                                    required: true,
                                    message: "Please select job type",
                                },
                            ]}
                        >
                            <Select placeholder="Select job type" size="large">
                                <Select.Option value="Full-time">
                                    Full-time
                                </Select.Option>
                                <Select.Option value="Part-time">
                                    Part-time
                                </Select.Option>
                                <Select.Option value="Contract">
                                    Contract
                                </Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="location"
                            label="Location"
                            extra="Example: Cagayan de Oro City"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter location",
                                },
                            ]}
                        >
                            <Input
                                placeholder="e.g., Manila, Philippines"
                                prefix={<EnvironmentOutlined />}
                                size="large"
                                maxLength={150}
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="salary_min"
                                    label="Salary Min (₱)"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please enter minimum salary",
                                        },
                                        {
                                            validator(_, value) {
                                                if (
                                                    value === undefined ||
                                                    value === null ||
                                                    value === ""
                                                )
                                                    return Promise.resolve();
                                                if (Number(value) < 0)
                                                    return Promise.reject(
                                                        new Error(
                                                            "Salary cannot be negative",
                                                        ),
                                                    );
                                                return Promise.resolve();
                                            },
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const max =
                                                    getFieldValue("salary_max");

                                                if (!value || !max) {
                                                    return Promise.resolve();
                                                }

                                                if (
                                                    Number(value) >= Number(max)
                                                ) {
                                                    return Promise.reject(
                                                        new Error(
                                                            "Minimum salary must be lower than maximum salary",
                                                        ),
                                                    );
                                                }

                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <Input
                                        prefix="₱"
                                        type="number"
                                        min={0}
                                        placeholder="Min salary"
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="salary_max"
                                    label="Salary Max (₱)"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please enter maximum salary",
                                        },
                                        {
                                            validator(_, value) {
                                                if (
                                                    value === undefined ||
                                                    value === null ||
                                                    value === ""
                                                )
                                                    return Promise.resolve();
                                                if (Number(value) < 0)
                                                    return Promise.reject(
                                                        new Error(
                                                            "Salary cannot be negative",
                                                        ),
                                                    );
                                                return Promise.resolve();
                                            },
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const min =
                                                    getFieldValue("salary_min");

                                                if (!value || !min) {
                                                    return Promise.resolve();
                                                }

                                                if (
                                                    Number(value) <= Number(min)
                                                ) {
                                                    return Promise.reject(
                                                        new Error(
                                                            "Maximum salary must be higher than minimum salary",
                                                        ),
                                                    );
                                                }

                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <Input
                                        prefix="₱"
                                        type="number"
                                        min={0}
                                        placeholder="Max salary"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* ============ CAPACITY AND EXPIRATION FIELDS - NOW REQUIRED ============ */}
                        <Divider>Application Limits</Divider>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="capacity"
                                    label={
                                        <Space>
                                            <TeamOutlined />
                                            <span>Application Capacity</span>
                                        </Space>
                                    }
                                    tooltip="Maximum number of applications allowed."
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please enter application capacity",
                                        },
                                        {
                                            validator(_, value) {
                                                if (
                                                    value === undefined ||
                                                    value === null ||
                                                    value === ""
                                                )
                                                    return Promise.resolve();
                                                if (Number(value) < 1)
                                                    return Promise.reject(
                                                        new Error(
                                                            "Capacity must be at least 1",
                                                        ),
                                                    );
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="e.g., 50"
                                        min={1}
                                        style={{ width: "100%" }}
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="expiration_days"
                                    label={
                                        <Space>
                                            <ClockCircleOutlined />
                                            <span>Expiration Period</span>
                                        </Space>
                                    }
                                    tooltip="How long this job post will be active."
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please select expiration period",
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Select duration"
                                        size="large"
                                        options={expirationOptions.filter(
                                            (opt) => opt.value !== null,
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* ============ ENHANCEMENT: Job Post Verification ============ */}
                        <Divider>
                            <Space>
                                <SafetyCertificateOutlined />
                                <span>Job Post Verification</span>
                            </Space>
                        </Divider>

                        <Alert
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message="Help applicants trust this job"
                            description={
                                <div>
                                    <div style={{ marginBottom: 6 }}>
                                        Provide a public link from a recognized
                                        source so applicants can verify this
                                        posting.
                                    </div>
                                    <Space size={[6, 6]} wrap>
                                        {LEGITIMATE_JOB_SOURCES.map((s) => (
                                            <Tag
                                                key={s.name}
                                                color="blue"
                                                style={{ cursor: "pointer" }}
                                            >
                                                <a
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {s.name}
                                                </a>
                                            </Tag>
                                        ))}
                                    </Space>
                                </div>
                            }
                        />

                        <Form.Item
                            name="reference_source_type"
                            label="Reference Source Type"
                            tooltip="Where this job post is originally published."
                        >
                            <Select
                                placeholder="Select reference source"
                                size="large"
                                allowClear
                                options={REFERENCE_SOURCE_OPTIONS}
                            />
                        </Form.Item>

                        <Form.Item
                            name="reference_url"
                            label={
                                <Space>
                                    <span>Reference URL</span>
                                    {referenceUrlValid === true && (
                                        <Tag color="green">Valid URL</Tag>
                                    )}
                                    {referenceUrlValid === false && (
                                        <Tag color="red">Invalid URL</Tag>
                                    )}
                                </Space>
                            }
                            extra="Example: https://www.linkedin.com/jobs/view/123456"
                            rules={[
                                {
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();
                                        return isValidHttpUrl(value)
                                            ? Promise.resolve()
                                            : Promise.reject(
                                                  new Error(
                                                      "Please enter a valid http(s) URL",
                                                  ),
                                              );
                                    },
                                },
                            ]}
                        >
                            <Input
                                placeholder="https://..."
                                size="large"
                                allowClear
                                addonAfter={
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<EyeOutlined />}
                                        disabled={!referenceUrlValid}
                                        onClick={() => {
                                            const url =
                                                form.getFieldValue(
                                                    "reference_url",
                                                );
                                            if (isValidHttpUrl(url)) {
                                                window.open(
                                                    url,
                                                    "_blank",
                                                    "noopener,noreferrer",
                                                );
                                            }
                                        }}
                                        style={{ padding: 0 }}
                                    >
                                        View Reference
                                    </Button>
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            name="verification_notes"
                            label="Verification Notes"
                            extra="Optional: add any context that helps verify this job is legitimate."
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="e.g., Posted on the official LinkedIn page of the company on Jan 5."
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>

                        <div style={{ marginTop: 8 }}>
                            {referenceUrlValid === true ? (
                                <Tag
                                    color="green"
                                    icon={<CheckCircleOutlined />}
                                >
                                    Verified Reference Provided
                                </Tag>
                            ) : (
                                <Tag color="orange" icon={<WarningOutlined />}>
                                    Reference Not Provided
                                </Tag>
                            )}
                        </div>
                    </Form>
                </Modal>

                {/* ENHANCEMENT: Discard Changes Confirmation */}
                <Modal
                    title="Discard Changes?"
                    open={discardConfirmVisible}
                    onCancel={() => setDiscardConfirmVisible(false)}
                    onOk={confirmDiscardChanges}
                    okText="Discard Changes"
                    cancelText="Continue Editing"
                    okButtonProps={{ danger: true }}
                    centered
                >
                    <p>
                        You have unsaved job post information. Are you sure you
                        want to discard your progress?
                    </p>
                </Modal>

                {/* ENHANCEMENT: Draft Restore Prompt */}
                <Modal
                    title="Unsaved Draft Found"
                    open={draftRestoreModalVisible}
                    onCancel={() => {
                        setDraftRestoreModalVisible(false);
                        setPendingDraft(null);
                    }}
                    footer={[
                        <Button
                            key="start-new"
                            onClick={() => {
                                clearJobPostDraft();
                                setDraftLastSaved(null);
                                setPendingDraft(null);
                                setDraftRestoreModalVisible(false);
                                form.resetFields();
                                setFileList([]);
                                bannerFileListRef.current = [];
                            }}
                        >
                            Start New
                        </Button>,
                        <Button
                            key="continue"
                            type="primary"
                            onClick={() => {
                                applyDraftToForm(pendingDraft);
                                setDraftRestoreModalVisible(false);
                                setPendingDraft(null);
                            }}
                        >
                            Continue Draft
                        </Button>,
                    ]}
                    centered
                >
                    <p>
                        We found a saved job post draft. Would you like to
                        continue where you left off?
                    </p>
                    {pendingDraft?._savedAt && (
                        <Text type="secondary">
                            Last saved:{" "}
                            {moment(pendingDraft._savedAt).format(
                                "MMM D, YYYY h:mm:ss A",
                            )}
                        </Text>
                    )}
                </Modal>

                {/* ENHANCEMENT: Success Modal */}
                <Modal
                    title={
                        <Space>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <span>Job Post Created Successfully</span>
                        </Space>
                    }
                    open={successModalVisible}
                    onCancel={() => setSuccessModalVisible(false)}
                    footer={[
                        <Button
                            key="another"
                            onClick={() => {
                                setSuccessModalVisible(false);
                                setLastCreatedJob(null);
                                setEditingPost(null);
                                form.resetFields();
                                setFileList([]);
                                bannerFileListRef.current = [];
                                setIsModalVisible(true);
                            }}
                        >
                            Create Another
                        </Button>,
                    ]}
                    centered
                >
                    {lastCreatedJob && (
                        <div>
                            <p>
                                <strong>Job Title:</strong>{" "}
                                {lastCreatedJob.title}
                            </p>
                            <p>
                                <strong>Company:</strong>{" "}
                                {lastCreatedJob.company}
                            </p>
                            <p>
                                <strong>Created:</strong>{" "}
                                {moment(
                                    lastCreatedJob.created_at || new Date(),
                                ).format("MMM D, YYYY h:mm A")}
                            </p>
                        </div>
                    )}
                </Modal>

                {/* Job Details Drawer */}
                <Drawer
                    title={
                        <Space>
                            <BankOutlined />
                            <span>Job Details</span>
                            {selectedJob && getStatusTag(selectedJob.status)}
                            {selectedJob && getFullExpiredTag(selectedJob)}
                        </Space>
                    }
                    placement="right"
                    onClose={() => {
                        setJobDetailsVisible(false);
                        setSelectedJob(null);
                    }}
                    open={jobDetailsVisible}
                    width={isMobile ? "95%" : 640}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                    className="job-details-drawer"
                >
                    {selectedJob && (
                        <div className="job-details-content">
                            {/* Banner Image */}
                            {(selectedJob.banner_image ||
                                selectedJob.banner_image_url) && (
                                <div className="job-details-banner">
                                    <Image
                                        src={
                                            buildImageUrl(
                                                selectedJob.banner_image ||
                                                    selectedJob.banner_image_url,
                                            ) || "/placeholder.svg"
                                        }
                                        alt={selectedJob.title}
                                        style={{
                                            width: "100%",
                                            borderRadius: 8,
                                        }}
                                    />
                                </div>
                            )}

                            {/* Title and Type */}
                            <div className="job-details-header">
                                <Title level={3} className="job-details-title">
                                    {selectedJob.title}
                                </Title>
                                <div className="job-details-badges">
                                    {getJobTypeTag(selectedJob.job_type)}
                                    {selectedJob.status === "approved" && (
                                        <Tag
                                            color="green"
                                            icon={<CheckCircleOutlined />}
                                        >
                                            Verified
                                        </Tag>
                                    )}
                                    {isValidHttpUrl(
                                        selectedJob.reference_url,
                                    ) ? (
                                        <Tooltip
                                            title="Reference URL provided"
                                            trigger={
                                                isTouchDevice ? [] : ["hover"]
                                            }
                                            open={
                                                isTouchDevice
                                                    ? false
                                                    : undefined
                                            }
                                        >
                                            <Tag
                                                color="green"
                                                icon={
                                                    <SafetyCertificateOutlined />
                                                }
                                            >
                                                <a
                                                    href={
                                                        selectedJob.reference_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: "inherit" }}
                                                >
                                                    Verified Reference Provided
                                                </a>
                                            </Tag>
                                        </Tooltip>
                                    ) : (
                                        <Tag
                                            color="orange"
                                            icon={<WarningOutlined />}
                                        >
                                            Reference Not Provided
                                        </Tag>
                                    )}
                                </div>
                            </div>

                            {/* ============ Job Verification Information ============ */}
                            {(selectedJob.reference_source_type ||
                                selectedJob.reference_url ||
                                selectedJob.verification_notes) && (
                                <Card
                                    size="small"
                                    style={{ marginBottom: 16 }}
                                    title={
                                        <Space>
                                            <SafetyCertificateOutlined
                                                style={{ color: "#52c41a" }}
                                            />
                                            <span>
                                                Job Verification Information
                                            </span>
                                        </Space>
                                    }
                                >
                                    <Row gutter={[16, 12]}>
                                        {selectedJob.reference_source_type && (
                                            <Col xs={24} sm={12}>
                                                <Text
                                                    type="secondary"
                                                    style={{ display: "block" }}
                                                >
                                                    Reference Source Type
                                                </Text>
                                                <Text strong>
                                                    {
                                                        selectedJob.reference_source_type
                                                    }
                                                </Text>
                                            </Col>
                                        )}
                                        {selectedJob.reference_url && (
                                            <Col xs={24} sm={12}>
                                                <Text
                                                    type="secondary"
                                                    style={{ display: "block" }}
                                                >
                                                    Reference URL
                                                </Text>
                                                {isValidHttpUrl(
                                                    selectedJob.reference_url,
                                                ) ? (
                                                    <a
                                                        href={
                                                            selectedJob.reference_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            wordBreak:
                                                                "break-all",
                                                        }}
                                                    >
                                                        {
                                                            selectedJob.reference_url
                                                        }
                                                    </a>
                                                ) : (
                                                    <Text
                                                        style={{
                                                            wordBreak:
                                                                "break-all",
                                                        }}
                                                    >
                                                        {
                                                            selectedJob.reference_url
                                                        }
                                                    </Text>
                                                )}
                                            </Col>
                                        )}
                                        {selectedJob.verification_notes && (
                                            <Col xs={24}>
                                                <Text
                                                    type="secondary"
                                                    style={{ display: "block" }}
                                                >
                                                    Verification Notes
                                                </Text>
                                                <Paragraph
                                                    style={{
                                                        marginBottom: 0,
                                                        whiteSpace: "pre-wrap",
                                                    }}
                                                >
                                                    {
                                                        selectedJob.verification_notes
                                                    }
                                                </Paragraph>
                                            </Col>
                                        )}
                                    </Row>
                                </Card>
                            )}

                            {/* Creator Info */}
                            <Card
                                size="small"
                                className="job-details-creator-card"
                                style={{ marginBottom: 16 }}
                            >
                                <CreatorInfo
                                    creator={selectedJob.creator}
                                    size="large"
                                />
                            </Card>

                            {/* Capacity and Expiration Info */}
                            {(selectedJob.capacity ||
                                selectedJob.expires_at) && (
                                <>
                                    <Card
                                        size="small"
                                        style={{
                                            marginBottom: 16,
                                            background: "#fafafa",
                                        }}
                                    >
                                        <Row gutter={16}>
                                            {selectedJob.capacity && (
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Applications"
                                                        value={
                                                            selectedJob.applications_count ||
                                                            0
                                                        }
                                                        suffix={`/ ${selectedJob.capacity}`}
                                                        valueStyle={{
                                                            color: selectedJob.is_full
                                                                ? "#ff4d4f"
                                                                : "#1890ff",
                                                            fontSize: 20,
                                                        }}
                                                    />
                                                    <Progress
                                                        percent={Math.round(
                                                            ((selectedJob.applications_count ||
                                                                0) /
                                                                selectedJob.capacity) *
                                                                100,
                                                        )}
                                                        size="small"
                                                        status={
                                                            selectedJob.is_full
                                                                ? "exception"
                                                                : "active"
                                                        }
                                                    />
                                                </Col>
                                            )}
                                            {selectedJob.expires_at && (
                                                <Col
                                                    span={
                                                        selectedJob.capacity
                                                            ? 12
                                                            : 24
                                                    }
                                                >
                                                    <Statistic
                                                        title="Time Remaining"
                                                        value={
                                                            selectedJob.is_expired
                                                                ? "Expired"
                                                                : selectedJob.expiration_display
                                                        }
                                                        valueStyle={{
                                                            color: selectedJob.is_expired
                                                                ? "#ff4d4f"
                                                                : "#52c41a",
                                                            fontSize: 20,
                                                        }}
                                                        prefix={
                                                            <ClockCircleOutlined />
                                                        }
                                                    />
                                                    <Text
                                                        type="secondary"
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        Expires:{" "}
                                                        {moment(
                                                            selectedJob.expires_at,
                                                        ).format(
                                                            "MMM D, YYYY h:mm A",
                                                        )}
                                                    </Text>
                                                </Col>
                                            )}
                                        </Row>
                                    </Card>
                                    <Divider />
                                </>
                            )}

                            {/* Job Info */}
                            <div className="job-details-info">
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <div className="info-item">
                                            <BankOutlined className="info-icon" />
                                            <div>
                                                <Text type="secondary">
                                                    Company:
                                                </Text>
                                                <Text
                                                    strong
                                                    className="info-value"
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {selectedJob.company}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="info-item">
                                            <EnvironmentOutlined className="info-icon" />
                                            <div>
                                                <Text type="secondary">
                                                    Location:
                                                </Text>
                                                <Text
                                                    strong
                                                    className="info-value"
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {selectedJob.location ||
                                                        "Remote"}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="info-item">
                                            <DollarOutlined className="info-icon" />
                                            <div>
                                                <Text type="secondary">
                                                    Salary Range:
                                                </Text>
                                                <Text
                                                    strong
                                                    className="info-value"
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {selectedJob.salary_min ||
                                                    selectedJob.salary_max
                                                        ? `₱${Number(selectedJob.salary_min || 0).toLocaleString()} - ₱${Number(selectedJob.salary_max || 0).toLocaleString()}`
                                                        : "Not specified"}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="info-item">
                                            <CalendarOutlined className="info-icon" />
                                            <div>
                                                <Text type="secondary">
                                                    Posted:
                                                </Text>
                                                <Text
                                                    strong
                                                    className="info-value"
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {moment(
                                                        selectedJob.created_at,
                                                    ).format("MMM D, YYYY")}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            <Divider />

                            {/* Description */}
                            <div className="job-details-section">
                                <Title level={5}>Job Description</Title>
                                <Paragraph style={{ whiteSpace: "pre-wrap" }}>
                                    {selectedJob.description}
                                </Paragraph>
                            </div>

                            <Divider />

                            {/* Requirements */}
                            <div className="job-details-section">
                                <Title level={5}>Requirements</Title>
                                <Paragraph style={{ whiteSpace: "pre-wrap" }}>
                                    {selectedJob.requirements}
                                </Paragraph>
                            </div>

                            {/* Action Button in Drawer */}
                            <div
                                className="job-details-actions"
                                style={{ marginTop: 24 }}
                            >
                                {isJobFullOrExpired(selectedJob) ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        disabled
                                        icon={
                                            selectedJob.is_expired ? (
                                                <ClockCircleOutlined />
                                            ) : (
                                                <StopOutlined />
                                            )
                                        }
                                    >
                                        {selectedJob.is_expired
                                            ? "Job Post Expired"
                                            : "Applications Full"}
                                    </Button>
                                ) : (
                                    (userRole === "admin" ||
                                        (isJobCreator(selectedJob) &&
                                            selectedJob.status ===
                                                "approved")) && (
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            icon={<TeamOutlined />}
                                            onClick={() => {
                                                setJobDetailsVisible(false);
                                                handleReviewApplications(
                                                    selectedJob,
                                                );
                                            }}
                                        >
                                            Review Applications
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </Drawer>

                {/* Applications Drawer - For Admin and Alumni Post Creators - WITH ID DOCUMENTS DISPLAY */}
                <Drawer
                    title={
                        <Space>
                            <TeamOutlined />
                            <span>Applications for: {selectedJob?.title}</span>
                            <Badge
                                count={jobApplications.length}
                                style={{ backgroundColor: "#1890ff" }}
                            />
                        </Space>
                    }
                    placement="right"
                    onClose={() => {
                        setApplicationsVisible(false);
                        setJobApplications([]);
                        setApplicantSearchText("");
                    }}
                    open={applicationsVisible}
                    width={isMobile ? "95%" : 800}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                    className="applications-drawer"
                >
                    <Spin spinning={applicationsLoading}>
                        {/* Applicant Name Search Filter */}
                        <div style={{ marginBottom: 16 }}>
                            <Input
                                placeholder="Search applicant by name..."
                                prefix={
                                    <SearchOutlined
                                        style={{ color: "#bfbfbf" }}
                                    />
                                }
                                value={applicantSearchText}
                                onChange={(e) =>
                                    setApplicantSearchText(e.target.value)
                                }
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </div>

                        {jobApplications.filter((application) => {
                            if (!applicantSearchText) return true;
                            const applicant =
                                application.alumni ||
                                application.user ||
                                application.applicant;
                            const fullName =
                                `${applicant?.first_name || ""} ${applicant?.last_name || ""} ${applicant?.name || ""}`.toLowerCase();
                            return fullName.includes(
                                applicantSearchText.toLowerCase(),
                            );
                        }).length > 0 ? (
                            <div className="applications-list">
                                {jobApplications
                                    .filter((application) => {
                                        if (!applicantSearchText) return true;
                                        const applicant =
                                            application.alumni ||
                                            application.user ||
                                            application.applicant;
                                        const fullName =
                                            `${applicant?.first_name || ""} ${applicant?.last_name || ""} ${applicant?.name || ""}`.toLowerCase();
                                        return fullName.includes(
                                            applicantSearchText.toLowerCase(),
                                        );
                                    })
                                    .map((application) => {
                                        const applicant =
                                            application.alumni ||
                                            application.user ||
                                            application.applicant;

                                        return (
                                            <Card
                                                key={application.id}
                                                className="application-card"
                                                style={{ marginBottom: 16 }}
                                            >
                                                {/* Applicant Info Header */}
                                                <div className="application-header">
                                                    <ApplicantInfo
                                                        applicant={applicant}
                                                        size="large"
                                                    />
                                                    <div className="application-status">
                                                        <Tag
                                                            color={
                                                                application.status ===
                                                                "accepted"
                                                                    ? "green"
                                                                    : application.status ===
                                                                        "rejected"
                                                                      ? "red"
                                                                      : "orange"
                                                            }
                                                        >
                                                            {application.status?.toUpperCase()}
                                                        </Tag>
                                                    </div>
                                                </div>

                                                <Divider
                                                    style={{ margin: "12px 0" }}
                                                />

                                                {/* ============ NEW: Applicant Contact & Career Information ============ */}
                                                <Row
                                                    gutter={[16, 12]}
                                                    style={{ marginBottom: 16 }}
                                                >
                                                    {/* Contact Information */}
                                                    <Col span={24}>
                                                        <Card
                                                            size="small"
                                                            className="applicant-contact-card"
                                                            title={
                                                                <Space>
                                                                    <PhoneOutlined />
                                                                    <span>
                                                                        Contact
                                                                        Information
                                                                    </span>
                                                                </Space>
                                                            }
                                                        >
                                                            <Row
                                                                gutter={[16, 8]}
                                                            >
                                                                <Col span={12}>
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 8,
                                                                        }}
                                                                    >
                                                                        <MailOutlined
                                                                            style={{
                                                                                color: "#1890ff",
                                                                            }}
                                                                        />
                                                                        <div>
                                                                            <Text
                                                                                type="secondary"
                                                                                style={{
                                                                                    fontSize: 12,
                                                                                    display:
                                                                                        "block",
                                                                                }}
                                                                            >
                                                                                Email
                                                                            </Text>
                                                                            <Text>
                                                                                {applicant?.email ||
                                                                                    "Not provided"}
                                                                            </Text>
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 8,
                                                                        }}
                                                                    >
                                                                        <PhoneOutlined
                                                                            style={{
                                                                                color: "#52c41a",
                                                                            }}
                                                                        />
                                                                        <div>
                                                                            <Text
                                                                                type="secondary"
                                                                                style={{
                                                                                    fontSize: 12,
                                                                                    display:
                                                                                        "block",
                                                                                }}
                                                                            >
                                                                                Phone
                                                                            </Text>
                                                                            <Text>
                                                                                {applicant?.phone ||
                                                                                    "Not provided"}
                                                                            </Text>
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                {applicant?.address && (
                                                                    <Col
                                                                        span={
                                                                            24
                                                                        }
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: 8,
                                                                            }}
                                                                        >
                                                                            <EnvironmentOutlined
                                                                                style={{
                                                                                    color: "#fa8c16",
                                                                                }}
                                                                            />
                                                                            <div>
                                                                                <Text
                                                                                    type="secondary"
                                                                                    style={{
                                                                                        fontSize: 12,
                                                                                        display:
                                                                                            "block",
                                                                                    }}
                                                                                >
                                                                                    Address
                                                                                </Text>
                                                                                <Text>
                                                                                    {
                                                                                        applicant.address
                                                                                    }
                                                                                </Text>
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                )}
                                                            </Row>
                                                        </Card>
                                                    </Col>

                                                    {/* Career Information */}
                                                    {(applicant?.current_company ||
                                                        applicant?.job_title ||
                                                        applicant?.years_experience) && (
                                                        <Col span={24}>
                                                            <Card
                                                                size="small"
                                                                className="applicant-career-card"
                                                                title={
                                                                    <Space>
                                                                        <BankOutlined />
                                                                        <span>
                                                                            Career
                                                                            Information
                                                                        </span>
                                                                    </Space>
                                                                }
                                                            >
                                                                <Row
                                                                    gutter={[
                                                                        16, 8,
                                                                    ]}
                                                                >
                                                                    {applicant?.current_company && (
                                                                        <Col
                                                                            span={
                                                                                12
                                                                            }
                                                                        >
                                                                            <div>
                                                                                <Text
                                                                                    type="secondary"
                                                                                    style={{
                                                                                        fontSize: 12,
                                                                                        display:
                                                                                            "block",
                                                                                    }}
                                                                                >
                                                                                    Current
                                                                                    Company
                                                                                </Text>
                                                                                <Text
                                                                                    strong
                                                                                >
                                                                                    {
                                                                                        applicant.current_company
                                                                                    }
                                                                                </Text>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                    {applicant?.job_title && (
                                                                        <Col
                                                                            span={
                                                                                12
                                                                            }
                                                                        >
                                                                            <div>
                                                                                <Text
                                                                                    type="secondary"
                                                                                    style={{
                                                                                        fontSize: 12,
                                                                                        display:
                                                                                            "block",
                                                                                    }}
                                                                                >
                                                                                    Job
                                                                                    Title
                                                                                </Text>
                                                                                <Text
                                                                                    strong
                                                                                >
                                                                                    {
                                                                                        applicant.job_title
                                                                                    }
                                                                                </Text>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                    {applicant?.years_experience && (
                                                                        <Col
                                                                            span={
                                                                                12
                                                                            }
                                                                        >
                                                                            <div>
                                                                                <Text
                                                                                    type="secondary"
                                                                                    style={{
                                                                                        fontSize: 12,
                                                                                        display:
                                                                                            "block",
                                                                                    }}
                                                                                >
                                                                                    Years
                                                                                    of
                                                                                    Experience
                                                                                </Text>
                                                                                <Text
                                                                                    strong
                                                                                >
                                                                                    {
                                                                                        applicant.years_experience
                                                                                    }{" "}
                                                                                    years
                                                                                </Text>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                    {applicant?.industry && (
                                                                        <Col
                                                                            span={
                                                                                12
                                                                            }
                                                                        >
                                                                            <div>
                                                                                <Text
                                                                                    type="secondary"
                                                                                    style={{
                                                                                        fontSize: 12,
                                                                                        display:
                                                                                            "block",
                                                                                    }}
                                                                                >
                                                                                    Industry
                                                                                </Text>
                                                                                <Text
                                                                                    strong
                                                                                >
                                                                                    {
                                                                                        applicant.industry
                                                                                    }
                                                                                </Text>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                    {applicant?.previous_companies && (
                                                                        <Col
                                                                            span={
                                                                                24
                                                                            }
                                                                        >
                                                                            <div>
                                                                                <Text
                                                                                    type="secondary"
                                                                                    style={{
                                                                                        fontSize: 12,
                                                                                        display:
                                                                                            "block",
                                                                                    }}
                                                                                >
                                                                                    Previous
                                                                                    Companies
                                                                                </Text>
                                                                                <Text>
                                                                                    {
                                                                                        applicant.previous_companies
                                                                                    }
                                                                                </Text>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                </Row>
                                                            </Card>
                                                        </Col>
                                                    )}
                                                </Row>

                                                {/* ============ Submitted Photos — gallery-style lightbox ============ */}
                                                {(() => {
                                                    const photos =
                                                        application.photos ||
                                                        application.submitted_photos ||
                                                        application.images ||
                                                        application.applicant_photos ||
                                                        [];
                                                    return photos.length > 0 ? (
                                                        <ApplicantPhotoGrid
                                                            photos={photos}
                                                            applicantName={
                                                                applicant?.first_name ||
                                                                applicant?.name ||
                                                                "Applicant"
                                                            }
                                                        />
                                                    ) : null;
                                                })()}

                                                {/* Cover Letter */}
                                                <div
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    <Text strong>
                                                        Cover Letter:
                                                    </Text>
                                                    <Paragraph
                                                        style={{
                                                            marginTop: 4,
                                                            whiteSpace:
                                                                "pre-wrap",
                                                        }}
                                                        ellipsis={{
                                                            rows: 3,
                                                            expandable: true,
                                                        }}
                                                    >
                                                        {application.cover_letter ||
                                                            "No cover letter provided"}
                                                    </Paragraph>
                                                </div>

                                                {/* Resume — inline preview + download */}
                                                {/* Backend saves as resume_path (see JobApplicationController@apply) */}
                                                {(application.resume_path ||
                                                    application.resume ||
                                                    application.resume_url) && (
                                                    <div style={{ marginBottom: 12 }}>
                                                        <Text strong>
                                                            Resume:
                                                        </Text>
                                                        <ResumeViewer
                                                            fileUrl={buildImageUrl(
                                                                application.resume_path ||
                                                                    application.resume ||
                                                                    application.resume_url,
                                                            )}
                                                            fileName={`${
                                                                (applicant?.first_name || applicant?.name || "Applicant")
                                                            } — Resume`}
                                                        />
                                                    </div>
                                                )}

                                                {/* ============ ID Documents — gallery-style cards ============ */}
                                                {application.id_documents &&
                                                    application.id_documents
                                                        .length > 0 && (
                                                        <div style={{ marginBottom: 12 }}>
                                                            <Text strong style={{ display: "block", marginBottom: 8 }}>
                                                                <IdcardOutlined style={{ marginRight: 6, color: "#667eea" }} />
                                                                ID Documents ({application.id_documents.length}):
                                                            </Text>
                                                            <Row gutter={[10, 10]}>
                                                                {application.id_documents.map((doc, index) => (
                                                                    <Col span={12} key={index}>
                                                                        <IdDocumentCard doc={doc} index={index} />
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        </div>
                                                    )}

                                                {/* Other Documents — inline previewer */}
                                                {application.other_documents &&
                                                    application.other_documents
                                                        .length > 0 && (
                                                        <div style={{ marginBottom: 12 }}>
                                                            <Text strong style={{ display: "block", marginBottom: 6 }}>
                                                                <FileOutlined style={{ marginRight: 6, color: "#52c41a" }} />
                                                                Other Documents ({application.other_documents.length}):
                                                            </Text>
                                                            {application.other_documents.map((doc, index) => {
                                                                const docUrl = buildImageUrl(
                                                                    doc.file_path || doc.file_url || doc.path || doc,
                                                                );
                                                                return (
                                                                    <ResumeViewer
                                                                        key={index}
                                                                        fileUrl={docUrl}
                                                                        fileName={doc.name || doc.original_name || `Document ${index + 1}`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    )}


                                                {/* Applied Date */}
                                                <div
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    <Text type="secondary">
                                                        Applied:{" "}
                                                        {moment(
                                                            application.created_at,
                                                        ).format(
                                                            "MMM D, YYYY h:mm A",
                                                        )}
                                                    </Text>
                                                </div>

                                                {/* Action Buttons */}
                                                <Space>
                                                    <Button
                                                        type="primary"
                                                        icon={<CheckOutlined />}
                                                        onClick={() =>
                                                            handleUpdateApplicationStatus(
                                                                application.id,
                                                                "accepted",
                                                            )
                                                        }
                                                        disabled={
                                                            application.status ===
                                                            "accepted"
                                                        }
                                                        loading={
                                                            applicationActionLoading[
                                                                application.id
                                                            ] === "accepted"
                                                        }
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        danger
                                                        icon={<CloseOutlined />}
                                                        onClick={() =>
                                                            handleUpdateApplicationStatus(
                                                                application.id,
                                                                "rejected",
                                                            )
                                                        }
                                                        disabled={
                                                            application.status ===
                                                            "rejected"
                                                        }
                                                        loading={
                                                            applicationActionLoading[
                                                                application.id
                                                            ] === "rejected"
                                                        }
                                                    >
                                                        Reject
                                                    </Button>
                                                </Space>
                                            </Card>
                                        );
                                    })}
                            </div>
                        ) : (
                            <Empty
                                description={
                                    applicantSearchText
                                        ? "No applicants found matching your search"
                                        : "No applications yet"
                                }
                            />
                        )}
                    </Spin>
                </Drawer>

                {/* Application Modal - For Alumni */}
                <Modal
                    title={
                        <Space>
                            <SendOutlined />
                            <span>Apply for: {selectedJob?.title}</span>
                        </Space>
                    }
                    open={isApplicationModalVisible}
                    okText="Submit Application"
                    onOk={() => appForm.submit()}
                    confirmLoading={submitApplicationLoading}
                    okButtonProps={{ loading: submitApplicationLoading }}
                    onCancel={() => {
                        // FEATURE 1: prompt before discarding unsaved application data.
                        // Covers X button, Cancel button, mask click, and ESC key.
                        attemptCloseApplicationModal();
                    }}
                    maskClosable={false}
                    keyboard={false}
                    width={isMobile ? "95%" : 700}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                    className="application-modal"
                >
                    <Spin spinning={profileLoading}>
                        {/* Selected Job Info */}
                        {selectedJob && (
                            <Card
                                size="small"
                                style={{
                                    marginBottom: 16,
                                    background: "#f6ffed",
                                    borderColor: "#b7eb8f",
                                }}
                            >
                                <Row gutter={16}>
                                    <Col span={16}>
                                        <Title level={5} style={{ margin: 0 }}>
                                            {selectedJob.title}
                                        </Title>
                                        <Space style={{ marginTop: 4 }}>
                                            <Tag icon={<BankOutlined />}>
                                                {selectedJob.company}
                                            </Tag>
                                            {getJobTypeTag(
                                                selectedJob.job_type,
                                            )}
                                        </Space>
                                    </Col>
                                    <Col
                                        span={8}
                                        style={{ textAlign: "right" }}
                                    >
                                        <Text type="secondary">
                                            <EnvironmentOutlined />{" "}
                                            {selectedJob.location || "Remote"}
                                        </Text>
                                    </Col>
                                </Row>
                            </Card>
                        )}

                        {/* ============ NEW: Current Alumni Profile Summary ============ */}
                        {currentAlumniProfile && (
                            <Card
                                size="small"
                                title={
                                    <Space>
                                        <UserOutlined />
                                        <span>Your Profile Information</span>
                                    </Space>
                                }
                                style={{
                                    marginBottom: 16,
                                    background: "#e6f7ff",
                                    borderColor: "#91d5ff",
                                }}
                            >
                                <Row gutter={[16, 12]}>
                                    <Col span={24}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                            }}
                                        >
                                            <Avatar
                                                size={56}
                                                src={buildImageUrl(
                                                    currentAlumniProfile.profile_image ||
                                                        currentAlumniProfile.profile_image_url,
                                                )}
                                                icon={
                                                    !currentAlumniProfile.profile_image && (
                                                        <UserOutlined />
                                                    )
                                                }
                                                style={{
                                                    border: "2px solid #1890ff",
                                                }}
                                            />
                                            <div>
                                                <Text
                                                    strong
                                                    style={{
                                                        fontSize: 16,
                                                        display: "block",
                                                    }}
                                                >
                                                    {
                                                        currentAlumniProfile.first_name
                                                    }{" "}
                                                    {
                                                        currentAlumniProfile.last_name
                                                    }
                                                </Text>
                                                <Text type="secondary">
                                                    {currentAlumniProfile.email}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    {(currentAlumniProfile.phone ||
                                        currentAlumniProfile.contact_number) && (
                                        <Col span={12}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <PhoneOutlined
                                                    style={{ color: "#52c41a" }}
                                                />
                                                <div>
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: 12,
                                                            display: "block",
                                                        }}
                                                    >
                                                        Phone
                                                    </Text>
                                                    <Text>
                                                        {currentAlumniProfile.phone ||
                                                            currentAlumniProfile.contact_number}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Col>
                                    )}
                                    {currentAlumniProfile.address && (
                                        <Col span={12}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <EnvironmentOutlined
                                                    style={{ color: "#fa8c16" }}
                                                />
                                                <div>
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: 12,
                                                            display: "block",
                                                        }}
                                                    >
                                                        Address
                                                    </Text>
                                                    <Text>
                                                        {
                                                            currentAlumniProfile.address
                                                        }
                                                    </Text>
                                                </div>
                                            </div>
                                        </Col>
                                    )}
                                </Row>
                            </Card>
                        )}

                        {/* Job Creator Contact Info - For Clarification */}
                        {selectedJob?.creator &&
                            selectedJob.creator.role !== "admin" && (
                                <Card
                                    size="small"
                                    title={
                                        <Space>
                                            <TeamOutlined />
                                            <span>
                                                Job Posted By (Contact for
                                                Clarification)
                                            </span>
                                        </Space>
                                    }
                                    style={{
                                        marginBottom: 16,
                                        background: "#fff7e6",
                                        borderColor: "#ffd591",
                                    }}
                                >
                                    <Row gutter={[16, 12]}>
                                        <Col span={24}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 12,
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <Avatar
                                                    size={48}
                                                    src={buildImageUrl(
                                                        selectedJob.creator
                                                            .profile_image ||
                                                            selectedJob.creator
                                                                .profile_image_url,
                                                    )}
                                                    icon={
                                                        !selectedJob.creator
                                                            .profile_image && (
                                                            <UserOutlined />
                                                        )
                                                    }
                                                    style={{
                                                        border: "2px solid #faad14",
                                                    }}
                                                />
                                                <div>
                                                    <Text
                                                        strong
                                                        style={{ fontSize: 16 }}
                                                    >
                                                        {selectedJob.creator
                                                            .name ||
                                                            selectedJob.creator
                                                                .first_name ||
                                                            "Unknown"}
                                                    </Text>
                                                    <br />
                                                    <Tag
                                                        color="geekblue"
                                                        icon={<UserOutlined />}
                                                        style={{ marginTop: 4 }}
                                                    >
                                                        Alumni
                                                    </Tag>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <MailOutlined
                                                    style={{ color: "#fa8c16" }}
                                                />
                                                <div>
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: 12,
                                                            display: "block",
                                                        }}
                                                    >
                                                        Email
                                                    </Text>
                                                    <a
                                                        href={`mailto:${selectedJob.creator.email}`}
                                                    >
                                                        <Text
                                                            style={{
                                                                color: "#1890ff",
                                                            }}
                                                        >
                                                            {selectedJob.creator
                                                                .email ||
                                                                "Not provided"}
                                                        </Text>
                                                    </a>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <PhoneOutlined
                                                    style={{ color: "#fa8c16" }}
                                                />

                                                <div>
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: 12,
                                                            display: "block",
                                                        }}
                                                    >
                                                        Phone
                                                    </Text>

                                                    {selectedJob?.creator
                                                        ?.phone ? (
                                                        <a
                                                            href={`tel:${selectedJob.creator.phone}`}
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: "#1890ff",
                                                                }}
                                                            >
                                                                {
                                                                    selectedJob
                                                                        .creator
                                                                        .phone
                                                                }
                                                            </Text>
                                                        </a>
                                                    ) : (
                                                        <Text type="secondary">
                                                            Not provided
                                                        </Text>
                                                    )}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            )}

                        <Divider />

                        {/* ============ APPLICATION FORM ============ */}
                        <Form
                            form={appForm}
                            onFinish={handleApplicationSubmit}
                            onValuesChange={handleApplicationFormValuesChange}
                            layout="vertical"
                        >
                            <Form.Item
                                name="resume"
                                label={
                                    <>
                                        Resume{" "}
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 12,
                                                fontWeight: "normal",
                                            }}
                                        >
                                            ({ACCEPTED_FORMATS.RESUME.hint})
                                        </Text>
                                    </>
                                }
                                valuePropName="fileList"
                                getValueFromEvent={(e) =>
                                    Array.isArray(e) ? e : e?.fileList
                                }
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Resume is required. Please upload your resume file.",
                                    },
                                ]}
                            >
                                <Upload
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    accept={ACCEPTED_FORMATS.RESUME.accept}
                                >
                                    <Button icon={<FileOutlined />}>
                                        Upload Resume
                                    </Button>
                                </Upload>
                            </Form.Item>

                            <Form.Item
                                name="cover_letter"
                                label="Cover Letter"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Cover letter is required. Please write a brief introduction about yourself.",
                                    },
                                    {
                                        min: 50,
                                        message:
                                            "Cover letter must be at least 50 characters long.",
                                    },
                                    {
                                        max: 5000,
                                        message:
                                            "Cover letter cannot exceed 5000 characters.",
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    rows={6}
                                    placeholder="Write a cover letter introducing yourself and why you're a great fit for this role..."
                                    showCount
                                    maxLength={5000}
                                />
                            </Form.Item>


                            <Divider>
                                Valid ID Documents (At Least 2 Required)
                            </Divider>

                            {/* ID Documents Info Alert */}
                            <Alert
                                message="Required: Upload at least 2 valid government-issued IDs"
                                description="Accepted IDs: Philippine National ID (PhilID/ePhilID), UMID, Passport, Driver's License, SSS, PhilHealth, Pag-IBIG, PRC ID, NBI Clearance, Voter's ID"
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />

                            {/* ID Documents Upload Section */}
                            {idDocuments.map((doc, index) => (
                                <Card
                                    key={index}
                                    size="small"
                                    style={{
                                        marginBottom: 12,
                                        background: "#fafafa",
                                    }}
                                    title={
                                        <Space>
                                            <IdcardOutlined />
                                            <span>ID Document {index + 1}</span>
                                            {index >= 2 && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    onClick={() =>
                                                        handleIdDocumentRemove(
                                                            index,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Space>
                                    }
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="ID Type"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <Select
                                                    placeholder="Select ID type"
                                                    value={
                                                        doc.type || undefined
                                                    }
                                                    onChange={(value) =>
                                                        handleIdDocumentTypeChange(
                                                            index,
                                                            value,
                                                        )
                                                    }
                                                    options={getAvailableIdTypes(
                                                        index,
                                                    ).map((type) => ({
                                                        value: type.value,
                                                        label: type.label,
                                                    }))}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={12}>
                                            <Form.Item
                                                label="Upload ID"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <Upload
                                                    beforeUpload={() => false}
                                                    maxCount={1}
                                                    accept={
                                                        ACCEPTED_FORMATS
                                                            .ID_DOCUMENT.accept
                                                    }
                                                    fileList={doc.fileList}
                                                    onChange={(info) =>
                                                        handleIdDocumentFileChange(
                                                            index,
                                                            info,
                                                        )
                                                    }
                                                >
                                                    <Button
                                                        icon={
                                                            <FileImageOutlined />
                                                        }
                                                    >
                                                        Upload
                                                    </Button>
                                                </Upload>
                                                <Text
                                                    type="secondary"
                                                    style={{
                                                        fontSize: 11,
                                                        display: "block",
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    {
                                                        ACCEPTED_FORMATS
                                                            .ID_DOCUMENT.hint
                                                    }
                                                </Text>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}

                            {/* Add More ID Button */}
                            {idDocuments.length < 5 && (
                                <Button
                                    type="dashed"
                                    onClick={handleIdDocumentAdd}
                                    block
                                    icon={<PlusOutlined />}
                                    style={{ marginBottom: 16 }}
                                >
                                    Add Another ID Document
                                </Button>
                            )}

                            {/* Validation Status */}
                            {idDocuments.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    {validateIdDocuments() ? (
                                        <Tag
                                            color="green"
                                            icon={<CheckCircleOutlined />}
                                        >
                                            ✓ Minimum 2 valid IDs uploaded
                                        </Tag>
                                    ) : (
                                        <Tag
                                            color="orange"
                                            icon={<WarningOutlined />}
                                        >
                                            Please upload at least 2 valid ID
                                            documents
                                        </Tag>
                                    )}
                                </div>
                            )}

                            {/* <Divider>Any Other Documents to Upload (Optional)</Divider> */}

                            {/* Other Documents Upload */}
                            {/* <Form.Item label="Other Supporting Documents">
                <Upload
                  beforeUpload={() => false}
                  multiple
                  maxCount={5}
                  accept={ACCEPTED_FORMATS.OTHER_DOCUMENT.accept}
                  fileList={otherDocuments}
                  onChange={handleOtherDocumentsChange}
                >
                  <Button icon={<FileOutlined />}>Upload Additional Documents</Button>
                </Upload>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  You can upload up to 5 additional documents. {ACCEPTED_FORMATS.OTHER_DOCUMENT.hint}
                </Text>
              </Form.Item> */}
                        </Form>
                    </Spin>
                </Modal>

                {/* ============ ENHANCEMENT: Unsaved Application Confirmation ============
                 * FEATURE 1 — Shown when the user attempts to close the apply modal
                 * (X / Cancel / mask click / ESC) while at least one field is modified. */}
                <Modal
                    title={
                        <Space>
                            <WarningOutlined style={{ color: "#faad14" }} />
                            <span>Unsaved Application</span>
                        </Space>
                    }
                    open={applicationDiscardConfirmVisible}
                    onCancel={() => setApplicationDiscardConfirmVisible(false)}
                    centered
                    maskClosable={false}
                    keyboard={false}
                    className="application-discard-modal"
                    footer={[
                        <Button
                            key="continue"
                            type="primary"
                            onClick={() =>
                                setApplicationDiscardConfirmVisible(false)
                            }
                        >
                            Continue Editing
                        </Button>,
                        <Button
                            key="discard"
                            danger
                            onClick={confirmDiscardApplicationChanges}
                        >
                            Discard Changes
                        </Button>,
                    ]}
                >
                    <p>
                        You have unsaved application information. What would you
                        like to do?
                    </p>
                    {applicationDraftLastSaved && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Auto-saved:{" "}
                            {moment(applicationDraftLastSaved).format(
                                "MMM D, YYYY h:mm:ss A",
                            )}
                        </Text>
                    )}
                </Modal>

                {/* ============ ENHANCEMENT: Application Draft Restore Prompt ============
                 * FEATURE 2 — Surfaced on Apply Now when a previous draft is found
                 * in secureLocalStorage for this (job, user) pair. */}
                <Modal
                    title={
                        <Space>
                            <FileOutlined style={{ color: "#1890ff" }} />
                            <span>Application Draft Found</span>
                        </Space>
                    }
                    open={applicationDraftRestoreVisible}
                    onCancel={() => {
                        // Cancelling this modal just dismisses it; the draft stays in storage
                        // until the user explicitly chooses Restore or Start Fresh.
                        setApplicationDraftRestoreVisible(false);
                    }}
                    centered
                    maskClosable={false}
                    keyboard={false}
                    className="application-draft-restore-modal"
                    footer={[
                        <Button
                            key="fresh"
                            onClick={() => {
                                const { jobId, userId } =
                                    applicationDraftCtxRef.current || {};
                                clearApplicationDraft(jobId, userId);
                                setPendingApplicationDraft(null);
                                setApplicationDraftRestoreVisible(false);
                                try {
                                    appForm.resetFields();
                                } catch {}
                                setApplicationFormDirty(false);
                                setApplicationDraftLastSaved(null);
                            }}
                        >
                            Start Fresh
                        </Button>,
                        <Button
                            key="restore"
                            type="primary"
                            onClick={() => {
                                restoreApplicationDraft(
                                    pendingApplicationDraft,
                                );
                                setApplicationDraftRestoreVisible(false);
                                setPendingApplicationDraft(null);
                            }}
                        >
                            Restore Draft
                        </Button>,
                    ]}
                >
                    <p>
                        We found a previously saved application draft. Would you
                        like to restore it?
                    </p>
                    {pendingApplicationDraft?._savedAt && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Last saved:{" "}
                            {moment(pendingApplicationDraft._savedAt).format(
                                "MMM D, YYYY h:mm:ss A",
                            )}
                        </Text>
                    )}
                </Modal>

                {/* ============ NEW: Application Success Modal ============ */}
                <Modal
                    open={applicationSuccessModalVisible}
                    footer={null}
                    onCancel={() => setApplicationSuccessModalVisible(false)}
                    width={isMobile ? "95%" : 520}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                    centered
                    className="application-success-modal"
                >
                    <Result
                        status="success"
                        icon={
                            <ClockCircleOutlined
                                style={{ color: "#faad14", fontSize: 72 }}
                            />
                        }
                        title={
                            <Title
                                level={3}
                                style={{ color: "#1a1a2e", marginBottom: 8 }}
                            >
                                Application Submitted - Pending Review
                            </Title>
                        }
                        subTitle={
                            <div style={{ textAlign: "left", marginTop: 16 }}>
                                <Card
                                    style={{
                                        background: "#fffbe6",
                                        borderColor: "#ffe58f",
                                    }}
                                >
                                    <Space
                                        direction="vertical"
                                        size="middle"
                                        style={{ width: "100%" }}
                                    >
                                        <div>
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: 16,
                                                    display: "block",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <ClockCircleOutlined
                                                    style={{
                                                        marginRight: 8,
                                                        color: "#faad14",
                                                    }}
                                                />
                                                Response Time
                                            </Text>
                                            <Paragraph
                                                style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                }}
                                            >
                                                We typically respond within{" "}
                                                <Text strong>24-48 hours</Text>{" "}
                                                during business days. Please be
                                                patient while we review your
                                                application carefully.
                                            </Paragraph>
                                        </div>

                                        <Divider style={{ margin: "12px 0" }} />

                                        <div>
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: 16,
                                                    display: "block",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <SendOutlined
                                                    style={{
                                                        marginRight: 8,
                                                        color: "#1890ff",
                                                    }}
                                                />
                                                What's Next?
                                            </Text>
                                            <Paragraph
                                                style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                }}
                                            >
                                                Please go to{" "}
                                                <Text
                                                    strong
                                                    style={{ color: "#1890ff" }}
                                                >
                                                    "My Applications"
                                                </Text>{" "}
                                                tab to see the status of your
                                                application. You will be able to
                                                check if you are{" "}
                                                <Text type="success">
                                                    accepted
                                                </Text>{" "}
                                                or{" "}
                                                <Text type="danger">
                                                    rejected
                                                </Text>
                                                .
                                            </Paragraph>
                                        </div>

                                        <Divider style={{ margin: "12px 0" }} />

                                        <div>
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: 16,
                                                    display: "block",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <MailOutlined
                                                    style={{
                                                        marginRight: 8,
                                                        color: "#52c41a",
                                                    }}
                                                />
                                                Email Notification
                                            </Text>
                                            <Paragraph
                                                style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                }}
                                            >
                                                If you are{" "}
                                                <Text type="success" strong>
                                                    accepted
                                                </Text>
                                                , you will receive an email
                                                notification with further
                                                details about the interview
                                                schedule and next steps. Please
                                                check your email regularly!
                                            </Paragraph>
                                        </div>
                                    </Space>
                                </Card>
                            </div>
                        }
                        extra={[
                            <Button
                                type="primary"
                                key="applications"
                                size="large"
                                icon={<SendOutlined />}
                                onClick={() => {
                                    setApplicationSuccessModalVisible(false);
                                    setActiveTab("my-applications");
                                }}
                            >
                                Go to My Applications
                            </Button>,
                            <Button
                                key="close"
                                size="large"
                                onClick={() =>
                                    setApplicationSuccessModalVisible(false)
                                }
                            >
                                Close
                            </Button>,
                        ]}
                    />
                </Modal>
                {/* ============ NEW: Submit Warning Modal for Alumni ============ */}
                <Modal
                    open={submitWarningModalVisible}
                    title={
                        <Space>
                            <WarningOutlined
                                style={{ color: "#faad14", fontSize: 24 }}
                            />
                            <span>Important Notice Before Submitting</span>
                        </Space>
                    }
                    onOk={async () => {
                        if (pendingFormValues) {
                            setSubmitWarningLoading(true);
                            try {
                                await performFormSubmit(pendingFormValues);
                                setPendingFormValues(null);
                                setSubmitWarningModalVisible(false);
                            } finally {
                                setSubmitWarningLoading(false);
                            }
                        }
                    }}
                    onCancel={() => {
                        setSubmitWarningModalVisible(false);
                        setPendingFormValues(null);
                    }}
                    okText="I Understand, Submit"
                    cancelText="Cancel"
                    width={isMobile ? "95%" : 520}
                    style={{
                        top: isMobile ? 8 : undefined,
                        maxWidth: isMobile ? "95vw" : undefined,
                        paddingBottom: 0,
                    }}
                    confirmLoading={submitWarningLoading}
                    okButtonProps={{ loading: submitWarningLoading }}
                >
                    <Alert
                        message="Edit Restrictions After Approval"
                        description={
                            <div style={{ marginTop: 8 }}>
                                <Paragraph>
                                    <Text strong>
                                        Please note the following:
                                    </Text>
                                </Paragraph>
                                <ul
                                    style={{
                                        paddingLeft: 20,
                                        marginBottom: 16,
                                    }}
                                >
                                    <li style={{ marginBottom: 8 }}>
                                        <Text>
                                            While your job post is{" "}
                                            <Tag color="orange">Pending</Tag>{" "}
                                            approval, you can freely edit all
                                            details or delete.
                                        </Text>
                                    </li>
                                    <li style={{ marginBottom: 8 }}>
                                        <Text>
                                            Once your job post is{" "}
                                            <Tag color="green">Approved</Tag> by
                                            the admin,{" "}
                                            <Text strong type="danger">
                                                you will no longer be able to
                                                delete or edit it.
                                            </Text>
                                        </Text>
                                    </li>
                                    <li style={{ marginBottom: 8 }}>
                                        <Text>
                                            After approval, only the admin can
                                            make changes to prevent any
                                            malicious modifications to verified
                                            content.
                                        </Text>
                                    </li>
                                </ul>
                                <Paragraph
                                    type="secondary"
                                    style={{ fontSize: 13 }}
                                >
                                    This policy ensures the integrity and
                                    trustworthiness of all approved job postings
                                    for our alumni community.
                                </Paragraph>
                            </div>
                        }
                        type="warning"
                        showIcon
                        style={{ marginBottom: 0 }}
                    />
                </Modal>
            </div>
        </Layout>
    );
}

// =============== JOB POSTS GRID COMPONENT (FOR ADMIN & MY POSTINGS) ===============
function JobPostsGrid({
    posts,
    isAdmin,
    currentUser,
    onViewDetails,
    onEdit,
    onDelete,
    onReviewApplications,
    isMyPostings = false,
}) {
    const isTouchDevice = useIsTouchDevice();
    if (posts.length === 0) {
        return (
            <Card className="empty-state-card">
                <Empty
                    description="No job posts available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    // Check if current user is the creator of the job post
    const isJobCreator = (job) => {
        const userId = Number(currentUser?.id);
        const creatorId = Number(job.created_by_user_id) || Number(job.user_id);
        return userId === creatorId;
    };

    return (
        <Row gutter={[20, 20]} className="job-grid">
            {posts.map((post) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={post.id}>
                    <Badge.Ribbon
                        text={post.status}
                        color={
                            post.status === "approved"
                                ? "green"
                                : post.status === "pending"
                                  ? "orange"
                                  : "red"
                        }
                    >
                        <Card
                            className="job-post-card"
                            hoverable
                            cover={
                                <div className="job-card-cover">
                                    {/* ============ FIX: Properly display banner image using buildImageUrl ============ */}
                                    {post.banner_image ||
                                    post.banner_image_url ? (
                                        <img
                                            src={buildImageUrl(
                                                post.banner_image ||
                                                    post.banner_image_url,
                                            )}
                                            alt={post.title}
                                            className="job-card-image"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling &&
                                                    (e.target.nextSibling.style.display =
                                                        "flex");
                                            }}
                                        />
                                    ) : null}
                                    {/* Placeholder shown when no image or image fails to load */}
                                    <div
                                        className="job-card-image-placeholder"
                                        style={{
                                            display:
                                                post.banner_image ||
                                                post.banner_image_url
                                                    ? "none"
                                                    : "flex",
                                        }}
                                    >
                                        <BankOutlined
                                            style={{
                                                fontSize: 36,
                                                color: "#bfbfbf",
                                            }}
                                        />
                                    </div>
                                    {/* REMOVED: Eye icon overlay */}
                                    <div className="job-card-type-badge">
                                        {getJobTypeTag(post.job_type)}
                                    </div>
                                </div>
                            }
                        >
                            {/* Card Content */}
                            <div className="job-card-content">
                                {/* Title */}
                                <Title
                                    level={5}
                                    className="job-card-title"
                                    ellipsis={{ rows: 2 }}
                                >
                                    {post.title}
                                </Title>

                                {/* Company */}
                                <div className="job-card-company">
                                    <BankOutlined
                                        style={{
                                            marginRight: 6,
                                            color: "#667eea",
                                        }}
                                    />
                                    <Text strong>{post.company}</Text>
                                </div>

                                <div className="job-card-creator">
                                    <CreatorInfo creator={post.creator} />
                                </div>

                                {/* Meta Info - ✅ FIXED: Peso sign */}
                                <div className="job-card-meta">
                                    <div className="meta-item">
                                        <EnvironmentOutlined />
                                        <Text type="secondary">
                                            {post.location || "Remote"}
                                        </Text>
                                    </div>
                                    <div className="meta-item">
                                        <DollarOutlined />
                                        <Text type="secondary">
                                            {post.salary_min
                                                ? `₱${Number(post.salary_min).toLocaleString()}`
                                                : "N/A"}
                                        </Text>
                                    </div>
                                </div>

                                {/* Capacity Progress */}
                                {getCapacityProgress(post)}

                                {/* Expiration Info */}
                                {post.expires_at && !post.is_expired && (
                                    <div style={{ marginTop: 8 }}>
                                        <Tag
                                            color="blue"
                                            icon={<ClockCircleOutlined />}
                                        >
                                            {post.expiration_display} left
                                        </Tag>
                                    </div>
                                )}

                                {/* Posted Date */}
                                <div className="job-card-date">
                                    <CalendarOutlined
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Posted{" "}
                                        {moment(post.created_at).fromNow()}
                                    </Text>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="job-card-actions">
                                <Button
                                    type="primary"
                                    onClick={() => onViewDetails(post)}
                                    block
                                >
                                    View Details
                                </Button>

                                {/* Review Applications - Show for admin or for alumni's own approved posts */}
                                {(isAdmin ||
                                    (isJobCreator(post) &&
                                        post.status === "approved")) && (
                                    <Button
                                        type="default"
                                        icon={<TeamOutlined />}
                                        onClick={() =>
                                            onReviewApplications(post)
                                        }
                                        style={{ marginTop: 8 }}
                                        block
                                    >
                                        Review Applications (
                                        {post.applications_count || 0})
                                    </Button>
                                )}

                                {/* Edit/Delete for admin OR for alumni's own PENDING posts */}
                                {(isAdmin ||
                                    (isJobCreator(post) &&
                                        post.status === "pending")) && (
                                    <Space
                                        style={{
                                            marginTop: 8,
                                            width: "100%",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Tooltip
                                            title="Edit"
                                            trigger={
                                                isTouchDevice ? [] : ["hover"]
                                            }
                                            open={
                                                isTouchDevice
                                                    ? false
                                                    : undefined
                                            }
                                        >
                                            <Button
                                                className="job-post-edit-btn"
                                                type="text"
                                                icon={<EditOutlined />}
                                                onClick={() => onEdit(post)}
                                            />
                                        </Tooltip>
                                        <Tooltip
                                            title="Delete"
                                            trigger={
                                                isTouchDevice ? [] : ["hover"]
                                            }
                                            open={
                                                isTouchDevice
                                                    ? false
                                                    : undefined
                                            }
                                        >
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() =>
                                                    onDelete(post.id)
                                                }
                                            />
                                        </Tooltip>
                                    </Space>
                                )}

                                {/* ============ NEW: Help tooltip and Message Admin button for alumni's approved posts ============ */}
                                {isMyPostings &&
                                    isJobCreator(post) &&
                                    post.status === "approved" && (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <Text
                                                            strong
                                                            style={{
                                                                color: "#fff",
                                                                display:
                                                                    "block",
                                                                marginBottom: 8,
                                                            }}
                                                        >
                                                            Why can't I edit or
                                                            delete this post?
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                color: "rgba(255,255,255,0.85)",
                                                                fontSize: 12,
                                                                display:
                                                                    "block",
                                                                marginBottom: 12,
                                                            }}
                                                        >
                                                            Once your job post
                                                            is approved, only
                                                            the admin can make
                                                            edits or delete it.
                                                            This policy protects
                                                            against malicious
                                                            modifications and
                                                            ensures all approved
                                                            job postings remain
                                                            trustworthy for our
                                                            alumni community.
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                color: "rgba(255,255,255,0.85)",
                                                                fontSize: 12,
                                                                display:
                                                                    "block",
                                                            }}
                                                        >
                                                            If you need any
                                                            changes or have
                                                            clarifications,
                                                            please message the
                                                            admin using the
                                                            button below.
                                                        </Text>
                                                    </div>
                                                }
                                                overlayStyle={{ maxWidth: 340 }}
                                                trigger={
                                                    isTouchDevice
                                                        ? []
                                                        : ["hover"]
                                                }
                                                open={
                                                    isTouchDevice
                                                        ? false
                                                        : undefined
                                                }
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <QuestionCircleOutlined
                                                            style={{
                                                                color: "#faad14",
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    }
                                                />
                                            </Tooltip>
                                            <Tooltip
                                                title="Message Admin for Clarification"
                                                trigger={
                                                    isTouchDevice
                                                        ? []
                                                        : ["hover"]
                                                }
                                                open={
                                                    isTouchDevice
                                                        ? false
                                                        : undefined
                                                }
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <MessageOutlined
                                                            style={{
                                                                color: "#1890ff",
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    }
                                                    onClick={() => {
                                                        // Navigate to messages page with admin context
                                                        window.location.href =
                                                            "/messages";
                                                    }}
                                                />
                                            </Tooltip>
                                        </div>
                                    )}
                            </div>
                        </Card>
                    </Badge.Ribbon>
                </Col>
            ))}
        </Row>
    );
}

// =============== FULL OR EXPIRED GRID COMPONENT ===============
function FullOrExpiredGrid({
    posts,
    isAdmin,
    currentUser,
    onViewDetails,
    onEdit,
    onDelete,
    onReviewApplications,
}) {
    const isTouchDevice = useIsTouchDevice();
    if (posts.length === 0) {
        return (
            <Card className="empty-state-card">
                <Empty
                    description="No full or expired job posts"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    // Check if current user is the creator of the job post
    const isJobCreator = (job) => {
        if (!currentUser || !currentUser.id || !job) return false;

        const userId = Number(currentUser.id);
        const creatorId = Number(job.created_by_user_id) || Number(job.user_id);

        if (!userId || isNaN(userId) || userId === 0) return false;
        if (!creatorId || isNaN(creatorId) || creatorId === 0) return false;

        return userId === creatorId;
    };

    return (
        <Row gutter={[20, 20]} className="job-grid">
            {posts.map((post) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={post.id}>
                    <Badge.Ribbon
                        text={post.is_expired ? "Expired" : "Full"}
                        color={post.is_expired ? "red" : "volcano"}
                    >
                        <Card
                            className="job-post-card job-post-card-inactive"
                            hoverable
                            cover={
                                <div
                                    className="job-card-cover"
                                    style={{ opacity: 0.7 }}
                                >
                                    {/* ============ FIX: Properly display banner image using buildImageUrl ============ */}
                                    {post.banner_image ||
                                    post.banner_image_url ? (
                                        <img
                                            src={buildImageUrl(
                                                post.banner_image ||
                                                    post.banner_image_url,
                                            )}
                                            alt={post.title}
                                            className="job-card-image"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling &&
                                                    (e.target.nextSibling.style.display =
                                                        "flex");
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="job-card-image-placeholder"
                                        style={{
                                            display:
                                                post.banner_image ||
                                                post.banner_image_url
                                                    ? "none"
                                                    : "flex",
                                        }}
                                    >
                                        <BankOutlined
                                            style={{
                                                fontSize: 36,
                                                color: "#bfbfbf",
                                            }}
                                        />
                                    </div>
                                    <div className="job-card-type-badge">
                                        {getJobTypeTag(post.job_type)}
                                    </div>
                                </div>
                            }
                        >
                            {/* Card Content */}
                            <div className="job-card-content">
                                {/* Title */}
                                <Title
                                    level={5}
                                    className="job-card-title"
                                    ellipsis={{ rows: 2 }}
                                >
                                    {post.title}
                                </Title>

                                {/* Company */}
                                <div className="job-card-company">
                                    <BankOutlined
                                        style={{
                                            marginRight: 6,
                                            color: "#667eea",
                                        }}
                                    />
                                    <Text strong>{post.company}</Text>
                                </div>

                                <div className="job-card-creator">
                                    <CreatorInfo creator={post.creator} />
                                </div>

                                {/* Status Tags */}
                                <div style={{ marginTop: 8 }}>
                                    {post.is_expired && (
                                        <Tag
                                            color="red"
                                            icon={<ClockCircleOutlined />}
                                        >
                                            Expired on{" "}
                                            {moment(post.expires_at).format(
                                                "MMM D, YYYY",
                                            )}
                                        </Tag>
                                    )}
                                    {post.is_full && (
                                        <Tag
                                            color="volcano"
                                            icon={<StopOutlined />}
                                        >
                                            Full ({post.applications_count}/
                                            {post.capacity})
                                        </Tag>
                                    )}
                                </div>

                                {/* Capacity Progress */}
                                {post.capacity && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 12 }}
                                        >
                                            Applications:{" "}
                                            {post.applications_count || 0} /{" "}
                                            {post.capacity}
                                        </Text>
                                        <Progress
                                            percent={100}
                                            size="small"
                                            status="exception"
                                        />
                                    </div>
                                )}

                                {/* Posted Date */}
                                <div className="job-card-date">
                                    <CalendarOutlined
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Posted{" "}
                                        {moment(post.created_at).fromNow()}
                                    </Text>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="job-card-actions">
                                <Button
                                    type="primary"
                                    onClick={() => onViewDetails(post)}
                                    block
                                >
                                    View Details
                                </Button>

                                {/* Review Applications */}
                                {(isAdmin || isJobCreator(post)) && (
                                    <Button
                                        type="default"
                                        icon={<TeamOutlined />}
                                        onClick={() =>
                                            onReviewApplications(post)
                                        }
                                        style={{ marginTop: 8 }}
                                        block
                                    >
                                        Review Applications (
                                        {post.applications_count || 0})
                                    </Button>
                                )}

                                {(isAdmin || isJobCreator(post)) && (
                                    <Space
                                        style={{
                                            marginTop: 8,
                                            width: "100%",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Tooltip
                                            title="Edit"
                                            trigger={
                                                isTouchDevice ? [] : ["hover"]
                                            }
                                            open={
                                                isTouchDevice
                                                    ? false
                                                    : undefined
                                            }
                                        >
                                            <Button
                                                className="job-post-edit-btn"
                                                type="text"
                                                icon={<EditOutlined />}
                                                onClick={() => onEdit(post)}
                                            />
                                        </Tooltip>
                                        <Tooltip
                                            title="Delete"
                                            trigger={
                                                isTouchDevice ? [] : ["hover"]
                                            }
                                            open={
                                                isTouchDevice
                                                    ? false
                                                    : undefined
                                            }
                                        >
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() =>
                                                    onDelete(post.id)
                                                }
                                            />
                                        </Tooltip>
                                    </Space>
                                )}
                            </div>
                        </Card>
                    </Badge.Ribbon>
                </Col>
            ))}
        </Row>
    );
}

// =============== PENDING APPROVALS TABLE COMPONENT ===============
function PendingApprovalsTable({
    posts,
    currentUser,
    onApprove,
    onReject,
    onViewDetails,
}) {
    const columns = [
        {
            title: "Job Post",
            key: "post",
            render: (_, record) => (
                <div>
                    <Text strong>{record.title}</Text>
                    <div>
                        <Tag icon={<BankOutlined />}>{record.company}</Tag>
                        {getJobTypeTag(record.job_type)}
                    </div>
                </div>
            ),
        },
        {
            title: "Posted By",
            key: "creator",
            render: (_, record) => <CreatorInfo creator={record.creator} />,
        },
        {
            title: "Submitted",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => moment(date).format("MMM D, YYYY"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => onApprove(record.id)}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => onReject(record.id)}
                    >
                        Reject
                    </Button>
                    <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onViewDetails(record)}
                    >
                        View
                    </Button>
                </Space>
            ),
        },
    ];

    if (posts.length === 0) {
        return (
            <Card className="empty-state-card">
                <Empty
                    description="No pending approvals"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    return (
        <Table
            dataSource={posts}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            className="job-table"
        />
    );
}

// =============== JOBS GRID COMPONENT (FOR ALUMNI BROWSE) ===============
function JobsGrid({
    jobs,
    currentUser,
    onApply,
    onViewDetails,
    onReviewApplications,
    myApplications = [],
}) {
    if (jobs.length === 0) {
        return (
            <Card className="empty-state-card">
                <Empty
                    description="No jobs available at the moment"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    // Check if current user is the creator of the job
    const isJobCreator = (job) => {
        if (!currentUser || !currentUser.id || !job) return false;

        const userId = Number(currentUser.id);
        const creatorId = Number(job.created_by_user_id) || Number(job.user_id);

        if (!userId || isNaN(userId) || userId === 0) return false;
        if (!creatorId || isNaN(creatorId) || creatorId === 0) return false;

        return userId === creatorId;
    };

    // ✅ NEW: Check if current user has already applied to this job
    const hasAlreadyApplied = (job) => {
        return myApplications.some(
            (app) =>
                Number(app.job_post_id) === Number(job.id) ||
                Number(app.job?.id) === Number(job.id),
        );
    };

    return (
        <Row gutter={[20, 20]} className="job-grid">
            {jobs.map((job) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={job.id}>
                    <Card
                        className="job-post-card job-browse-card"
                        hoverable
                        cover={
                            <div className="job-card-cover">
                                {/* ============ FIX: Properly display banner image using buildImageUrl ============ */}
                                {job.banner_image || job.banner_image_url ? (
                                    <img
                                        src={buildImageUrl(
                                            job.banner_image ||
                                                job.banner_image_url,
                                        )}
                                        alt={job.title}
                                        className="job-card-image"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling &&
                                                (e.target.nextSibling.style.display =
                                                    "flex");
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="job-card-image-placeholder"
                                    style={{
                                        display:
                                            job.banner_image ||
                                            job.banner_image_url
                                                ? "none"
                                                : "flex",
                                    }}
                                >
                                    <BankOutlined
                                        style={{
                                            fontSize: 36,
                                            color: "#bfbfbf",
                                        }}
                                    />
                                </div>
                                <div className="job-card-status-badge">
                                    <Tag
                                        color="green"
                                        icon={<CheckCircleOutlined />}
                                    >
                                        Live
                                    </Tag>
                                </div>
                                <div className="job-card-type-badge">
                                    {getJobTypeTag(job.job_type)}
                                </div>
                            </div>
                        }
                    >
                        {/* Card Content */}
                        <div className="job-card-content">
                            {/* Title */}
                            <Title
                                level={5}
                                className="job-card-title"
                                ellipsis={{ rows: 2 }}
                            >
                                {job.title}
                            </Title>

                            {/* Company */}
                            <div className="job-card-company">
                                <BankOutlined
                                    style={{ marginRight: 6, color: "#667eea" }}
                                />
                                <Text strong>{job.company}</Text>
                            </div>

                            <div className="job-card-creator">
                                <CreatorInfo creator={job.creator} />
                            </div>

                            {/* Meta Info - ✅ FIXED: Peso sign */}
                            <div className="job-card-meta">
                                <div className="meta-item">
                                    <EnvironmentOutlined />
                                    <Text type="secondary">
                                        {job.location || "Remote"}
                                    </Text>
                                </div>
                                <div className="meta-item">
                                    <DollarOutlined />
                                    <Text type="secondary">
                                        {job.salary_min
                                            ? `₱${Number(job.salary_min).toLocaleString()}`
                                            : "N/A"}
                                    </Text>
                                </div>
                            </div>

                            {/* Capacity Progress */}
                            {job.capacity && (
                                <div style={{ marginTop: 8 }}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Spots remaining:{" "}
                                        {job.remaining_capacity} /{" "}
                                        {job.capacity}
                                    </Text>
                                    <Progress
                                        percent={Math.round(
                                            ((job.applications_count || 0) /
                                                job.capacity) *
                                                100,
                                        )}
                                        size="small"
                                        status={
                                            (job.applications_count || 0) >=
                                            job.capacity
                                                ? "exception"
                                                : "normal"
                                        }
                                        strokeColor={
                                            (job.applications_count || 0) /
                                                job.capacity <=
                                            0.5
                                                ? "#52c41a" // Green - low capacity used
                                                : (job.applications_count ||
                                                        0) /
                                                        job.capacity <=
                                                    0.8
                                                  ? "#faad14" // Yellow - medium capacity
                                                  : "#ff4d4f" // Red - high/full capacity
                                        }
                                    />
                                </div>
                            )}

                            {/* Expiration Info */}
                            {job.expires_at && !job.is_expired && (
                                <div style={{ marginTop: 8 }}>
                                    <Tag
                                        color="blue"
                                        icon={<ClockCircleOutlined />}
                                    >
                                        {job.expiration_display} left
                                    </Tag>
                                </div>
                            )}

                            {/* Posted Date */}
                            <div className="job-card-date">
                                <CalendarOutlined style={{ marginRight: 4 }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Posted {moment(job.created_at).fromNow()}
                                </Text>
                            </div>
                        </div>

                        {/* Card Actions */}
                        <div className="job-card-actions">
                            <Button
                                type="primary"
                                onClick={() => onViewDetails(job)}
                                block
                            >
                                View Details
                            </Button>
                            {/* ✅ UPDATED: If user is the creator, show Review Applications. If already applied, show "Already Applied". Otherwise show "Apply Now" */}
                            {isJobCreator(job) ? (
                                <Button
                                    type="default"
                                    icon={<TeamOutlined />}
                                    onClick={() => onReviewApplications(job)}
                                    style={{ marginTop: 8 }}
                                    block
                                >
                                    Review Applications (
                                    {job.applications_count || 0})
                                </Button>
                            ) : hasAlreadyApplied(job) ? (
                                // ✅ NEW: Show "Already Applied" button if user has applied to this job
                                <Button
                                    type="default"
                                    disabled
                                    icon={<CheckCircleOutlined />}
                                    style={{
                                        marginTop: 8,
                                        backgroundColor: "#f6ffed",
                                        borderColor: "#b7eb8f",
                                        color: "#52c41a",
                                    }}
                                    block
                                >
                                    Already Applied
                                </Button>
                            ) : (
                                <Button
                                    type="default"
                                    icon={<SendOutlined />}
                                    onClick={() => onApply(job)}
                                    style={{ marginTop: 8 }}
                                    block
                                >
                                    Apply Now
                                </Button>
                            )}
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}

// =============== APPLICATIONS TABLE COMPONENT ===============
function ApplicationsTable({
    applications,
    currentUser,
    onWithdraw,
    withdrawLoading = {},
}) {
    const isTouchDevice = useIsTouchDevice();
    const columns = [
        {
            title: "Job",
            key: "job",
            width: 280,
            render: (_, record) => (
                <div className="table-job-info">
                    <Text
                        strong
                        style={{
                            fontSize: 14,
                            display: "block",
                            marginBottom: 4,
                        }}
                    >
                        {record.job?.title}
                    </Text>
                    <Space>
                        <Tag icon={<BankOutlined />} color="default">
                            {record.job?.company}
                        </Tag>
                        {record.job?.is_full && (
                            <Tag color="volcano" icon={<StopOutlined />}>
                                Full
                            </Tag>
                        )}
                        {record.job?.is_expired && (
                            <Tag color="red" icon={<ClockCircleOutlined />}>
                                Expired
                            </Tag>
                        )}
                    </Space>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 130,
            render: (status) => {
                const colors = {
                    accepted: "green",
                    rejected: "red",
                    applied: "orange",
                    reviewing: "blue",
                };
                const icons = {
                    accepted: <CheckCircleOutlined />,
                    rejected: <CloseCircleOutlined />,
                    applied: <ClockCircleOutlined />,
                    reviewing: <EyeOutlined />,
                };
                return (
                    <Tag color={colors[status] || "blue"} icon={icons[status]}>
                        {status?.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: "Applied",
            dataIndex: "created_at",
            key: "created_at",
            width: 120,
            render: (date) => (
                <Tooltip
                    title={moment(date).format("MMMM D, YYYY h:mm A")}
                    trigger={isTouchDevice ? [] : ["hover"]}
                    open={isTouchDevice ? false : undefined}
                >
                    <Text type="secondary">{moment(date).fromNow()}</Text>
                </Tooltip>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Tooltip
                    title="Withdraw Application"
                    trigger={isTouchDevice ? [] : ["hover"]}
                    open={isTouchDevice ? false : undefined}
                >
                    <Button
                        type="text"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => onWithdraw(record.id)}
                        loading={withdrawLoading[record.id]}
                    >
                        Withdraw
                    </Button>
                </Tooltip>
            ),
        },
    ];

    if (applications.length === 0) {
        return (
            <Card className="empty-state-card">
                <Empty
                    description="You haven't applied to any jobs yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    return (
        <Table
            dataSource={applications}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            className="applications-table"
        />
    );
}

export default AdminAlumniJobPostPage;