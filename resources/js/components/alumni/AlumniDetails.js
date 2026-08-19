import React, { useState } from "react";
import {
    Drawer,
    Image,
    Button,
    Space,
    Row,
    Col,
    Card,
    Tag,
    Typography,
    Divider,
    Avatar,
    Modal,
    Upload,
    message,
} from "antd";
import {
    BankOutlined,
    EyeOutlined,
    DownloadOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    TrophyOutlined,
    BookOutlined,
    IdcardOutlined,
    GlobalOutlined,
    LinkedinOutlined,
    GithubOutlined,
    FileImageOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
    TrophyOutlined as TrophyIcon,
    CloseOutlined,
    UploadOutlined,
    TwitterOutlined,
} from "@ant-design/icons";
import moment from "moment";
import secureLocalStorage from "react-secure-storage";
import logo from "~/assets/images/OCC_LOGO.png";
import axios from "~/utils/axiosConfig";
import "./AlumniDetails.css";

const { Title, Text, Paragraph } = Typography;

const companyInfo = {
    name: "Opol Community College Alumni Association",
    logo: "https://alumni.occph.com/build/assets/OCC_LOGO-BWCM4zrL.png",
};

const ID_TYPES = [
    { value: "student_id", label: "Student ID Card", icon: <IdcardOutlined /> },
    { value: "alumni_id", label: "Alumni ID Card", icon: <UserOutlined /> },
    {
        value: "government_id",
        label: "Government ID",
        icon: <FileImageOutlined />,
    },
    { value: "diploma", label: "Diploma", icon: <SafetyCertificateOutlined /> },
    { value: "transcript", label: "Transcript", icon: <BookOutlined /> },
];

const employmentStatusOptions = [
    { value: "employed", label: "Employed", color: "green" },
    { value: "unemployed", label: "Unemployed", color: "red" },
    { value: "self-employed", label: "Self-Employed", color: "orange" },
    { value: "freelancer", label: "Freelancer", color: "blue" },
    { value: "graduate_student", label: "Graduate Student", color: "purple" },
    { value: "entrepreneur", label: "Entrepreneur", color: "cyan" },
    {
        value: "seeking_opportunities",
        label: "Seeking Opportunities",
        color: "gold",
    },
];

const courseOptions = [
    {
        value: "BSIT",
        label: "Bachelor of Science in Information Technology",
        college: "College of Computer Studies",
    },
    {
        value: "BSCS",
        label: "Bachelor of Science in Computer Science",
        college: "College of Computer Studies",
    },
    // ... other courses
];


// === Course-based header color themes ===
// Each theme exposes CSS variables consumed by the preview header.
const COURSE_THEMES = {
    BSIT:    { primary: "#e11d2b", dark: "#1e3a8a", deeper: "#050810", accent: "#facc15" },
    BSCS:    { primary: "#06b6d4", dark: "#0e7490", deeper: "#042f3a", accent: "#7c3aed" },
    BSBA:    { primary: "#f59e0b", dark: "#d97706", deeper: "#1e1a06", accent: "#fbbf24" },
    BSEd:    { primary: "#2563eb", dark: "#1d4ed8", deeper: "#06122b", accent: "#7dd3fc" },
    BEEd:    { primary: "#2563eb", dark: "#1d4ed8", deeper: "#06122b", accent: "#7dd3fc" },
    BEED:    { primary: "#2563eb", dark: "#1d4ed8", deeper: "#06122b", accent: "#7dd3fc" },
    BSN:     { primary: "#16a34a", dark: "#15803d", deeper: "#052e16", accent: "#c1121f" },
    BSA:     { primary: "#f97316", dark: "#c2410c", deeper: "#3b1606", accent: "#1e40af" },
    BSEE:    { primary: "#7c3aed", dark: "#5b21b6", deeper: "#1e0b3a", accent: "#f59e0b" },
    BSME:    { primary: "#64748b", dark: "#334155", deeper: "#0b1220", accent: "#f59e0b" },
    BSArch:  { primary: "#b45309", dark: "#78350f", deeper: "#2d1804", accent: "#d4af37" },
    BSPsych: { primary: "#ec4899", dark: "#be185d", deeper: "#3a0a23", accent: "#7c3aed" },
    default: { primary: "#2563eb", dark: "#1d4ed8", deeper: "#06122b", accent: "#7dd3fc" },
};

const COURSE_ID_TO_CODE = {
    1: "BSIT",
    2: "BSEd",
    3: "BEED",
    4: "BSBA",
};

// Full name lookup keyed by course code
const COURSE_NAME_MAP = {
    BSIT:    "Bachelor of Science in Information Technology",
    BSCS:    "Bachelor of Science in Computer Science",
    BSBA:    "Bachelor of Science in Business Administration",
    BSEd:    "Bachelor in Teacher Education",
    BEED:    "Bachelor of Elementary Education",
    BSN:     "Bachelor of Science in Nursing",
    BSA:     "Bachelor of Science in Accountancy",
    BSEE:    "Bachelor of Science in Electrical Engineering",
    BSME:    "Bachelor of Science in Mechanical Engineering",
    BSArch:  "Bachelor of Science in Architecture",
    BSPsych: "Bachelor of Science in Psychology",
};

const getCourseTheme = (courseValue) => {
    if (!courseValue) return COURSE_THEMES.default;
    if (COURSE_THEMES[courseValue]) return COURSE_THEMES[courseValue];
    const key = Object.keys(COURSE_THEMES).find(
        (k) => k.toLowerCase() === String(courseValue).toLowerCase()
    );
    return key ? COURSE_THEMES[key] : COURSE_THEMES.default;
};

const AlumniDetails = ({
    visible,
    onCancel,
    onSubmit,
    previewData,
    loading = false,
    viewOnly = false,
    refetchAlumni,
    viewOwnProfile = false, // NEW PROP: When true, alumni can see their own full details
}) => {
    const [zoomImage, setZoomImage] = useState(null);
    const [zoomVisible, setZoomVisible] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [zoomDocumentType, setZoomDocumentType] = useState(null);
    const [localDocuments, setLocalDocuments] = useState([]);
    const [localProfileImage, setLocalProfileImage] = useState(null);
    const role = secureLocalStorage.getItem("userRole");
    const isAdmin = role === "admin";

    // NEW: Determine if full details should be shown (admin OR viewing own profile)
    const canViewFullDetails = isAdmin || viewOwnProfile;

    // Sync local state with previewData when it changes.
    // NOTE: the parent passes the image as `profileImage` (no underscore),
    // so we watch that field – not `profile_image` – to avoid a stale sync.
    React.useEffect(() => {
        if (previewData?.idDocuments) {
            setLocalDocuments(previewData.idDocuments);
        }
        // Accept both field name shapes so this works regardless of caller
        const img = previewData?.profileImage || previewData?.profile_image;
        if (img) {
            setLocalProfileImage(img);
        }
    }, [previewData?.idDocuments, previewData?.profileImage, previewData?.profile_image]);

    const alumniId =
        previewData?.id ?? previewData?.alumni_id ?? previewData?.alumni?.id;

    const handleImageZoom = (imageUrl, documentType = null) => {
        setZoomImage(imageUrl);
        setZoomDocumentType(documentType);
        setZoomVisible(true);
    };

    // 🔕 Silent auto-refresh every 1 second
    React.useEffect(() => {
        if (!visible || !alumniId || !refetchAlumni) return;

        const interval = setInterval(async () => {
            try {
                await axios.get(`/admin/alumni/${alumniId}`, {
                    silent: true, // 🔕 NO loading, NO modal
                });

                // re-sync parent data
                await refetchAlumni();
            } catch (err) {
                // fail silently
            }
        }, 1000); // ⏱ 1 second

        return () => clearInterval(interval);
    }, [visible, alumniId, refetchAlumni]);

    // Safe data access with fallbacks
    const getData = (path, defaultValue = "") => {
        return path
            .split(".")
            .reduce((obj, key) => obj?.[key] ?? defaultValue, previewData);
    };

// Resolve a course code from whatever shape the API / registration preview returns.
const resolveCourseCode = () => {
    // 1) Direct course_code string passed from AlumniRegistration previewData
    if (previewData?.course_code && typeof previewData.course_code === "string") {
        return previewData.course_code;
    }

    // 2) nested relation: previewData.course = { course_code: "BSIT", ... }
    const nested =
        previewData?.course?.course_code ||
        previewData?.course?.code ||
        previewData?.course?.name;
    if (nested) return nested;

    // 3) numeric course_id → code (supports both field name shapes)
    const cid = previewData?.course_id ?? previewData?.courseId;
    if (cid != null && COURSE_ID_TO_CODE[cid]) return COURSE_ID_TO_CODE[cid];

    // 4) raw string field named "course"
    const raw = getData("course");
    return typeof raw === "string" ? raw : "";
};

// Return the human-readable course name for display in the Academic Background card.
const getCourseName = () => {
    const code = resolveCourseCode();
    if (!code) return getData("course") || "";

    // Check COURSE_NAME_MAP by exact or case-insensitive key match
    if (COURSE_NAME_MAP[code]) return COURSE_NAME_MAP[code];
    const key = Object.keys(COURSE_NAME_MAP).find(
        (k) => k.toLowerCase() === code.toLowerCase()
    );
    if (key) return COURSE_NAME_MAP[key];

    // Fall back to what the API gave us (e.g. a full name stored directly)
    return code;
};

const resolvedCode = resolveCourseCode();
const courseTheme = getCourseTheme(resolvedCode);
const isBSIT = resolvedCode.toUpperCase() === "BSIT";

// Verification state comes from the admin-controlled `status` field
// (set via AlumniList's "Edit Status" action). Any alumnus, regardless of
// course, only shows "Verified" once an admin has approved them; while
// still pending/rejected/undefined (e.g. the live AlumniRegistration
// preview, which has no status yet) it reads "Verify".
const alumniStatus = String(getData("status") || "").toLowerCase();
const isVerified = alumniStatus === "approved";
const verifiedPillText = isVerified
    ? "Verified OCC Graduate"
    : "Verify OCC Graduate";
const headerThemeStyle = {
    "--hdr-primary": courseTheme.primary,
    "--hdr-dark":    courseTheme.dark,
    "--hdr-deeper":  courseTheme.deeper,
    "--hdr-accent":  courseTheme.accent,
    // BSIT-only multi-color palette vars
    ...(isBSIT && {
        "--bsit-red":    "#e11d2b",
        "--bsit-blue":   "#2563eb",
        "--bsit-yellow": "#facc15",
        "--bsit-white":  "#f8fafc",
        "--bsit-black":  "#050810",
    }),
};


    const downloadImage = (imageUrl) => {
        if (!imageUrl) return;

        const link = document.createElement("a");
        link.href = imageUrl;
        link.target = "_blank";
        link.download = imageUrl.split("/").pop() || "image";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatName = () => {
        const firstName = getData("first_name");
        const middleName = getData("middle_name");
        const lastName = getData("last_name");
        const suffix = getData("suffix");

        return `${firstName} ${middleName} ${lastName} ${suffix}`
            .replace(/\s+/g, " ")
            .trim();
    };

    const getEmploymentStatus = () => {
        const statusValue = getData("employment_status");
        return (
            employmentStatusOptions.find((s) => s.value === statusValue)
                ?.label || statusValue
        );
    };

    const handleUploadDocument = async (file, documentType) => {
        if (!alumniId) {
            message.error("Alumni ID not found");
            // console.log("[v0] Alumni ID is missing for document upload:", alumniId);
            return false;
        }

        try {
            // Phase 6: removed a console.log here that included the
            // alumni ID and document type on every upload attempt.
            setUploadLoading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("document_type", documentType);

            const uploadUrl = `/admin/alumni/${alumniId}/upload-document`;

            const response = await axios.post(uploadUrl, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.success) {
                message.success(`${documentType} uploaded successfully`);
                setZoomVisible(false);

                // Immediately update local state with the new document
                const newDocUrl =
                    response.data.file_url ||
                    response.data.data?.file_url ||
                    URL.createObjectURL(file);
                setLocalDocuments((prev) => {
                    const filtered = prev.filter(
                        (doc) =>
                            doc.document_type !== documentType &&
                            doc.type !== documentType,
                    );
                    return [
                        ...filtered,
                        {
                            document_type: documentType,
                            type: documentType,
                            file_url: newDocUrl,
                        },
                    ];
                });

                if (refetchAlumni) {
                    try {
                        await refetchAlumni();
                    } catch (refetchError) {
                        // Refetch error - local state already updated
                    }
                }
            } else {
                message.error(response.data.message || "Upload failed");
            }
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                    `Failed to upload ${documentType}`,
            );
        } finally {
            setUploadLoading(false);
        }

        return false;
    };

    const getEmploymentStatusColor = () => {
        const statusValue = getData("employment_status");
        return (
            employmentStatusOptions.find((s) => s.value === statusValue)
                ?.color || "blue"
        );
    };

    const handleUploadProfileImage = async (file) => {
        if (!alumniId) {
            message.error("Alumni ID not found");
            return false;
        }

        try {
            setUploadLoading(true);
            const formData = new FormData();
            formData.append("profile_image", file);

            const uploadUrl = `/admin/alumni/${alumniId}/profile-image`;

            const response = await axios.post(uploadUrl, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

           if (response.data.success) {
    message.success("Profile image updated successfully");
    setZoomVisible(false);

    // Resolve the new URL (server URL preferred, blob as fallback)
    const newImageUrl =
        response.data.profile_image ||
        response.data.data?.profile_image ||
        response.data.profile_image_url ||
        response.data.data?.profile_image_url ||
        URL.createObjectURL(file);

    // Immediately update local state
    setLocalProfileImage(newImageUrl);

    // 🔔 Broadcast to other components (e.g. Layout notifications)
    //    so cached avatars referencing this alumni update instantly.
    window.dispatchEvent(
        new CustomEvent("alumni-profile-image-updated", {
            detail: {
                alumniId,
                userId: previewData?.user_id || previewData?.user?.id,
                newImageUrl,
            },
        }),
    );

    if (refetchAlumni) {
        try {
            await refetchAlumni();
        } catch (refetchError) {
            // Refetch error - local state already updated
        }
    }
} else {
    message.error(response.data.message || "Upload failed");
}

        } catch (error) {
            message.error(
                error.response?.data?.message ||
                    "Failed to upload profile image",
            );
        } finally {
            setUploadLoading(false);
        }

        return false;
    };

    const honors = getData("honors", []);

    if (!previewData) return null;

    return (
        <>
            <Drawer
                title={
                    <Space>
                        <BankOutlined />
                        Alumni Registration Preview - {companyInfo.name}
                    </Space>
                }
                open={visible}
                onClose={onCancel}
                width="100%"
                height="100%"
                className="preview-drawer"
                placement="right"
                extra={
                    <Space>
                        <Button
                            icon={<CloseOutlined />}
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Close
                        </Button>
                        {!viewOnly && (
                            <Button
                                type="primary"
                                onClick={onSubmit}
                                loading={loading}
                            >
                                Submit Application
                            </Button>
                        )}
                    </Space>
                }
                styles={{
                    body: { padding: 0 },
                    header: { borderBottom: "1px solid #f0f0f0" },
                }}
            >
                <div className=" drawer-content">
                    {/* Header Section - OCC Graduation Theme */}
                    <div className={`preview-header preview-header--modern preview-header--occ${isBSIT ? " preview-header--bsit" : ""}`} style={headerThemeStyle}>
                        <div className="preview-header__shape preview-header__shape--a" />
                        <div className="preview-header__shape preview-header__shape--b" />
                        <div className="preview-header__sash" aria-hidden="true" />
                        <span className="header-toga-line header-toga-line--l" aria-hidden="true" />
                        <span className="header-toga-line header-toga-line--r" aria-hidden="true" />

                        {/* Floating OCC emblem badge */}
                        <div className="occ-emblem-badge">
                            <img
                                src={logo}
                                alt="OCC Logo"
                                className="occ-emblem-badge__logo"
                            />
                            <div className="occ-emblem-badge__text">
                                <span className="occ-emblem-badge__title">
                                    OCC ALUMNI
                                </span>
                                <span className="occ-emblem-badge__sub">
                                    Verified Graduate
                                </span>
                            </div>
                        </div>

                        <div className="preview-profile-section">
                            <div className="profile-image-container">
                                {/* OCC Profile Card (geometric background + circular avatar) */}
                                <div className="occ-profile-card">
                                    <div
                                        className="occ-profile-card__bg"
                                        aria-hidden="true"
                                    >
                                        <span className="occ-profile-card__shape occ-profile-card__shape--1" />
                                        <span className="occ-profile-card__shape occ-profile-card__shape--2" />
                                        <span className="occ-profile-card__shape occ-profile-card__shape--3" />
                                    </div>

                                    <div className="occ-profile-card__avatar">
                                        {localProfileImage ||
                                        getData("profileImage") ? (
                                            <div className="profile-image-wrapper">
                                                <img
                                                    src={
                                                        localProfileImage ||
                                                        getData("profileImage")
                                                    }
                                                    alt="Profile"
                                                    className="preview-profile-img"
                                                />
                                                <div
                                                    className="image-zoom-overlay"
                                                    onClick={() =>
                                                        handleImageZoom(
                                                            localProfileImage ||
                                                                getData(
                                                                    "profileImage",
                                                                ),
                                                        )
                                                    }
                                                >
                                                    <EyeOutlined />
                                                    <span>Click to Zoom</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <Avatar
                                                size={128}
                                                icon={<UserOutlined />}
                                                className="default-avatar"
                                            />
                                        )}
                                        <span
                                            className="profile-status-dot"
                                            title="Active"
                                        />
                                    </div>
                                </div>
                            </div>


                            <div className="profile-info">
                               <div className="preview-verified-pill">
                                    <SafetyCertificateOutlined />
                                    <span>{verifiedPillText}</span>
                                </div>
                                <Title level={2} className="preview-name">
                                    {formatName()}
                                </Title>
                                <Text className="preview-title">
                                    {getData("job_title") || "Alumni"}
                                    {getData("current_company") &&
                                        ` \u00b7 ${getData("current_company")}`}
                                </Text>


 {/* <div className="profile-info__eyebrow">
                                    <SafetyCertificateOutlined />
                                    <span>VERIFIED OCC ALUMNI</span>
                                </div>
                                 */}

                                <div className="preview-contact-info">
                                    <Row gutter={[12, 12]}>
                                        {getData("email") && (
                                            <Col xs={24} sm={12} md={8}>
                                                <div className="contact-item contact-item--chip">
                                                    <span className="contact-icon-wrap">
                                                        <MailOutlined className="contact-icon" />
                                                    </span>
                                                    <div className="contact-details">
                                                        <Text className="contact-label">
                                                            Email
                                                        </Text>
                                                        <Text
                                                            className="contact-value"
                                                            ellipsis={{
                                                                tooltip:
                                                                    getData(
                                                                        "email",
                                                                    ),
                                                            }}
                                                        >
                                                            {getData("email")}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>
                                        )}
                                        {getData("phone") && (
                                            <Col xs={24} sm={12} md={8}>
                                                <div className="contact-item contact-item--chip">
                                                    <span className="contact-icon-wrap">
                                                        <PhoneOutlined className="contact-icon" />
                                                    </span>
                                                    <div className="contact-details">
                                                        <Text className="contact-label">
                                                            Phone
                                                        </Text>
                                                        <Text
                                                            className="contact-value"
                                                            ellipsis={{
                                                                tooltip:
                                                                    getData(
                                                                        "phone",
                                                                    ),
                                                            }}
                                                        >
                                                            {getData("phone")}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>
                                        )}
                                        {getData("address") && (
                                            <Col xs={24} sm={12} md={8}>
                                                <div className="contact-item contact-item--chip">
                                                    <span className="contact-icon-wrap">
                                                        <EnvironmentOutlined className="contact-icon" />
                                                    </span>
                                                    <div className="contact-details">
                                                        <Text className="contact-label">
                                                            Address
                                                        </Text>
                                                        <Text
                                                            className="contact-value"
                                                            ellipsis={{
                                                                tooltip:
                                                                    getData(
                                                                        "address",
                                                                    ),
                                                            }}
                                                        >
                                                            {getData("address")}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="preview-body">
                        <Row gutter={[32, 24]}>
                            {/* Left Column - Main Content */}
                            <Col xs={24} lg={16}>
                                {/* CHANGED: Use canViewFullDetails instead of role === "admin" */}
                                {canViewFullDetails && (
                                    <>
                                        {/* Personal Summary */}
                                        {getData("bio") && (
                                            <Card
                                                className="preview-card"
                                                size="small"
                                            >
                                                <div className="section-header">
                                                    <UserOutlined className="section-icon" />
                                                    <Title
                                                        level={4}
                                                        className="section-title"
                                                    >
                                                        Personal Summary
                                                    </Title>
                                                </div>
                                                <Paragraph className="preview-bio">
                                                    {getData("bio")}
                                                </Paragraph>
                                            </Card>
                                        )}

                                        {/* Career Information */}
                                        <Card
                                            className="preview-card"
                                            size="small"
                                        >
                                            <div className="section-header">
                                                <TrophyOutlined className="section-icon" />
                                                <Title
                                                    level={4}
                                                    className="section-title"
                                                >
                                                    Career Information
                                                </Title>
                                            </div>
                                            <div className="career-details">
                                                <Row gutter={[16, 12]}>
                                                    {getData(
                                                        "current_company",
                                                    ) && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Current
                                                                    Company:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "current_company",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData("job_title") && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Position:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "job_title",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData("industry") && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Industry:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "industry",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData(
                                                        "years_experience",
                                                    ) && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Experience:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "years_experience",
                                                                    )}{" "}
                                                                    {getData(
                                                                        "years_experience",
                                                                    ) === 1
                                                                        ? "year"
                                                                        : "years"}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData(
                                                        "work_location",
                                                    ) && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Work
                                                                    Location:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "work_location",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData(
                                                        "salary_range",
                                                    ) && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Annual
                                                                    Salary
                                                                    Range:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "salary_range",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData(
                                                        "employment_status",
                                                    ) && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Employment
                                                                    Status:
                                                                </Text>
                                                                <Tag
                                                                    color={getEmploymentStatusColor()}
                                                                >
                                                                    {getEmploymentStatus()}
                                                                </Tag>
                                                            </div>
                                                        </Col>
                                                    )}
                                                </Row>

                                                {/* Career Goals */}
                                                {getData("career_goals") && (
                                                    <div className="subsection">
                                                        <Text
                                                            strong
                                                            className="subsection-title"
                                                        >
                                                            Career Goals
                                                        </Text>
                                                        <Paragraph className="preview-text">
                                                            {getData(
                                                                "career_goals",
                                                            )}
                                                        </Paragraph>
                                                    </div>
                                                )}

                                                {/* Previous Experience */}
                                                {getData(
                                                    "previous_companies",
                                                ) && (
                                                    <div className="subsection">
                                                        <Text
                                                            strong
                                                            className="subsection-title"
                                                        >
                                                            Previous Experience
                                                        </Text>
                                                        <Paragraph className="preview-text">
                                                            {getData(
                                                                "previous_companies",
                                                            )}
                                                        </Paragraph>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>

                                        {/* Academic Information */}
                                        <Card
                                            className="preview-card"
                                            size="small"
                                        >
                                            <div className="section-header">
                                                <BookOutlined className="section-icon" />
                                                <Title
                                                    level={4}
                                                    className="section-title"
                                                >
                                                    Academic Background
                                                </Title>
                                            </div>

                                            <div className="academic-details">
                                                <Row gutter={[16, 12]}>
                                                    {getData("course") && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Course/Degree:
                                                                </Text>
                                                                <Text>
                                                                    {getCourseName()}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}
                                                    {getData(
                                                        "enrollment_year",
                                                    ) && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Enrollment
                                                                    Year:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "enrollment_year",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData(
                                                        "graduation_year",
                                                    ) && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Graduation
                                                                    Year:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "graduation_year",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}

                                                    {getData("student_id") && (
                                                        <Col xs={24} sm={12}>
                                                            <div className="detail-item">
                                                                <Text strong>
                                                                    Student ID:
                                                                </Text>
                                                                <Text>
                                                                    {getData(
                                                                        "student_id",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}
                                                </Row>

                                                {/* Academic Achievements */}
                                                {getData(
                                                    "academic_achievements",
                                                ) && (
                                                    <div className="subsection">
                                                        <Text
                                                            strong
                                                            className="subsection-title"
                                                        >
                                                            Academic
                                                            Achievements
                                                        </Text>
                                                        <Paragraph className="preview-text">
                                                            {getData(
                                                                "academic_achievements",
                                                            )}
                                                        </Paragraph>
                                                    </div>
                                                )}

                                                {/* Extracurricular Activities */}
                                                {getData("extracurricular") && (
                                                    <div className="subsection">
                                                        <Text
                                                            strong
                                                            className="subsection-title"
                                                        >
                                                            Extracurricular
                                                            Activities
                                                        </Text>
                                                        <Paragraph className="preview-text">
                                                            {getData(
                                                                "extracurricular",
                                                            )}
                                                        </Paragraph>
                                                    </div>
                                                )}

                                                {/* Thesis/Capstone */}
                                                {getData("thesis_title") && (
                                                    <div className="subsection">
                                                        <Text
                                                            strong
                                                            className="subsection-title"
                                                        >
                                                            Thesis/Capstone
                                                            Project
                                                        </Text>
                                                        <Paragraph className="preview-text">
                                                            {getData(
                                                                "thesis_title",
                                                            )}
                                                        </Paragraph>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </>
                                )}
                            </Col>

                            {/* Right Column - Sidebar */}

                            {/* CHANGED: Use canViewFullDetails instead of role === "admin" */}
                            {canViewFullDetails && (
                                <>
                                    <Col xs={24} lg={8}>
                                        {/* Quick Info Card */}
                                        <Card
                                            className="sidebar-card"
                                            size="small"
                                        >
                                            {/* Personal Information */}
                                            <div className="sidebar-section">
                                                <Title
                                                    level={5}
                                                    className="sidebar-title"
                                                >
                                                    <IdcardOutlined /> Personal
                                                    Info
                                                </Title>
                                                <div className="sidebar-items">
                                                    {getData("birth_date") && (
                                                        <div className="sidebar-item">
                                                            <CalendarOutlined className="sidebar-icon" />
                                                            <div className="sidebar-content">
                                                                <Text className="sidebar-label">
                                                                    Birth Date
                                                                </Text>
                                                                <Text className="sidebar-value">
                                                                    {moment(
                                                                        getData(
                                                                            "birth_date",
                                                                        ),
                                                                    ).format(
                                                                        "MMM DD, YYYY",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {getData("gender") && (
                                                        <div className="sidebar-item">
                                                            <UserOutlined className="sidebar-icon" />
                                                            <div className="sidebar-content">
                                                                <Text className="sidebar-label">
                                                                    Gender
                                                                </Text>
                                                                <Text
                                                                    className="sidebar-value"
                                                                    style={{
                                                                        textTransform:
                                                                            "capitalize",
                                                                    }}
                                                                >
                                                                    {getData(
                                                                        "gender",
                                                                    ).replace(
                                                                        "_",
                                                                        " ",
                                                                    )}
                                                                </Text>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Social Profiles */}
                                            <div className="sidebar-section">
                                                <Title
                                                    level={5}
                                                    className="sidebar-title"
                                                >
                                                    <GlobalOutlined /> Social
                                                    Profiles
                                                </Title>

                                                <div className="sidebar-items">
                                                    {getData("linkedin") && (
                                                        <div className="sidebar-item">
                                                            <LinkedinOutlined className="sidebar-icon linkedin" />

                                                            <div
                                                                className="sidebar-content"
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Text className="sidebar-label">
                                                                    LinkedIn
                                                                </Text>

                                                                <Text
                                                                    className="sidebar-value"
                                                                    ellipsis={{
                                                                        tooltip:
                                                                            getData(
                                                                                "linkedin",
                                                                            ),
                                                                    }}
                                                                >
                                                                    {getData(
                                                                        "linkedin",
                                                                    )}
                                                                </Text>
                                                            </div>

                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={
                                                                    <EyeOutlined />
                                                                }
                                                                onClick={() =>
                                                                    window.open(
                                                                        getData(
                                                                            "linkedin",
                                                                        ),
                                                                        "_blank",
                                                                        "noopener,noreferrer",
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {getData("github") && (
                                                        <div className="sidebar-item">
                                                            <GithubOutlined className="sidebar-icon github" />

                                                            <div
                                                                className="sidebar-content"
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Text className="sidebar-label">
                                                                    GitHub
                                                                </Text>

                                                                <Text
                                                                    className="sidebar-value"
                                                                    ellipsis={{
                                                                        tooltip:
                                                                            getData(
                                                                                "github",
                                                                            ),
                                                                    }}
                                                                >
                                                                    {getData(
                                                                        "github",
                                                                    )}
                                                                </Text>
                                                            </div>

                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={
                                                                    <EyeOutlined />
                                                                }
                                                                onClick={() =>
                                                                    window.open(
                                                                        getData(
                                                                            "github",
                                                                        ),
                                                                        "_blank",
                                                                        "noopener,noreferrer",
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {getData("portfolio") && (
                                                        <div className="sidebar-item">
                                                            <GlobalOutlined className="sidebar-icon portfolio" />

                                                            <div
                                                                className="sidebar-content"
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Text className="sidebar-label">
                                                                    Portfolio
                                                                </Text>

                                                                <Text
                                                                    className="sidebar-value"
                                                                    ellipsis={{
                                                                        tooltip:
                                                                            getData(
                                                                                "portfolio",
                                                                            ),
                                                                    }}
                                                                >
                                                                    {getData(
                                                                        "portfolio",
                                                                    )}
                                                                </Text>
                                                            </div>

                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={
                                                                    <EyeOutlined />
                                                                }
                                                                onClick={() =>
                                                                    window.open(
                                                                        getData(
                                                                            "portfolio",
                                                                        ),
                                                                        "_blank",
                                                                        "noopener,noreferrer",
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {getData("twitter") && (
                                                        <div className="sidebar-item">
                                                            <TwitterOutlined
                                                                className="sidebar-icon"
                                                                style={{
                                                                    color: "#1DA1F2",
                                                                }}
                                                            />

                                                            <div
                                                                className="sidebar-content"
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Text className="sidebar-label">
                                                                    Twitter / X
                                                                </Text>

                                                                <Text
                                                                    className="sidebar-value"
                                                                    ellipsis={{
                                                                        tooltip:
                                                                            getData(
                                                                                "twitter",
                                                                            ),
                                                                    }}
                                                                >
                                                                    {getData(
                                                                        "twitter",
                                                                    )}
                                                                </Text>
                                                            </div>

                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={
                                                                    <EyeOutlined />
                                                                }
                                                                onClick={() =>
                                                                    window.open(
                                                                        getData(
                                                                            "twitter",
                                                                        ),
                                                                        "_blank",
                                                                        "noopener,noreferrer",
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Document Status - Only show for admin, not for viewOwnProfile */}
                                            {canViewFullDetails && (
                                                <div className="sidebar-section">
                                                    <Title
                                                        level={5}
                                                        className="sidebar-title"
                                                    >
                                                        <FileImageOutlined />{" "}
                                                        Documents
                                                    </Title>
                                                    <div className="document-status">
                                                        {/* Show all document types - View for uploaded, Upload icon for missing */}
                                                        {ID_TYPES.map(
                                                            (docType) => {
                                                                // Check if this document type is uploaded - use localDocuments for immediate updates
                                                                const uploadedDoc =
                                                                    Array.isArray(
                                                                        localDocuments,
                                                                    )
                                                                        ? localDocuments.find(
                                                                              (
                                                                                  doc,
                                                                              ) =>
                                                                                  doc.document_type ===
                                                                                      docType.value ||
                                                                                  doc.type ===
                                                                                      docType.value,
                                                                          )
                                                                        : null;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            docType.value
                                                                        }
                                                                        className={`document-item ${uploadedDoc ? "uploaded" : "pending"}`}
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            justifyContent:
                                                                                "space-between",
                                                                            padding:
                                                                                "6px 0",
                                                                        }}
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
                                                                            {uploadedDoc ? (
                                                                                <CheckCircleOutlined
                                                                                    className="doc-icon"
                                                                                    style={{
                                                                                        color: "#52c41a",
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <span
                                                                                    style={{
                                                                                        color: "#bfbfbf",
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        docType.icon
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            <Text
                                                                                style={{
                                                                                    color: uploadedDoc
                                                                                        ? "inherit"
                                                                                        : "#8c8c8c",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    docType.label
                                                                                }
                                                                            </Text>
                                                                        </div>
                                                                        {uploadedDoc ? (
                                                                            <Button
                                                                                type="link"
                                                                                size="small"
                                                                                icon={
                                                                                    <EyeOutlined />
                                                                                }
                                                                                onClick={() =>
                                                                                    handleImageZoom(
                                                                                        uploadedDoc.file_url ||
                                                                                            uploadedDoc.url,
                                                                                        docType.value,
                                                                                    )
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            isAdmin && (
                                                                                <Upload
                                                                                    showUploadList={
                                                                                        false
                                                                                    }
                                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                                    beforeUpload={(
                                                                                        file,
                                                                                    ) =>
                                                                                        handleUploadDocument(
                                                                                            file,
                                                                                            docType.value,
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        uploadLoading
                                                                                    }
                                                                                >
                                                                                    <Button
                                                                                        type="text"
                                                                                        size="small"
                                                                                        icon={
                                                                                            <UploadOutlined />
                                                                                        }
                                                                                        loading={
                                                                                            uploadLoading
                                                                                        }
                                                                                        style={{
                                                                                            color: "#1890ff",
                                                                                        }}
                                                                                    />
                                                                                </Upload>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Preferences */}
                                            <div className="sidebar-section">
                                                <Title
                                                    level={5}
                                                    className="sidebar-title"
                                                >
                                                    <SafetyCertificateOutlined />{" "}
                                                    Preferences
                                                </Title>
                                                <div className="preference-items">
                                                    <div className="preference-item">
                                                        <CheckCircleOutlined className="pref-icon" />
                                                        <Text>
                                                            Terms & Conditions
                                                            Accepted
                                                        </Text>
                                                    </div>
                                                    {getData("newsletter") && (
                                                        <div className="preference-item">
                                                            <CheckCircleOutlined className="pref-icon" />
                                                            <Text>
                                                                Newsletter
                                                                Subscribed
                                                            </Text>
                                                        </div>
                                                    )}
                                                    {getData(
                                                        "contactPermission",
                                                    ) && (
                                                        <div className="preference-item">
                                                            <CheckCircleOutlined className="pref-icon" />
                                                            <Text>
                                                                Contact
                                                                Permission
                                                                Granted
                                                            </Text>
                                                        </div>
                                                    )}
                                                    {getData(
                                                        "continueEducation",
                                                    ) && (
                                                        <div className="preference-item">
                                                            <CheckCircleOutlined className="pref-icon" />
                                                            <Text>
                                                                Planning Further
                                                                Education
                                                            </Text>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                </>
                            )}
                        </Row>

                        {/* CHANGED: Show confidential message only when NOT canViewFullDetails */}
                        {!canViewFullDetails && (
                            <>
                                <Card
                                    className="preview-card"
                                    size="small"
                                    style={{
                                        marginTop: 10,
                                        borderColor: "red",
                                    }}
                                >
                                    <div
                                        className="section-header"
                                        style={{
                                            justifyContent: "center",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <Title
                                            level={3}
                                            style={{
                                                color: "red",
                                                textAlign: "center",
                                                marginBottom: 0,
                                                letterSpacing: 2,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            CONFIDENTIAL
                                        </Title>
                                        <Text
                                            style={{
                                                textAlign: "center",
                                                fontStyle: "italic",
                                            }}
                                        >
                                            Admin Access Only
                                        </Text>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 20,
                                            textAlign: "center",
                                            padding: "10px 20px",
                                        }}
                                    >
                                        <Text style={{ fontSize: 16 }}>
                                            This section contains confidential
                                            information.
                                        </Text>
                                    </div>
                                </Card>
                            </>
                        )}
                        {/* CHANGED: Use canViewFullDetails instead of role === "admin" */}
                        {canViewFullDetails && (
                            <>
                                {/* Honors & Awards Section */}
                                {honors.length > 0 && (
                                    <Card
                                        className="preview-card"
                                        size="small"
                                        style={{ marginTop: 10 }}
                                    >
                                        <div className="section-header">
                                            <TrophyIcon className="section-icon" />
                                            <Title
                                                level={4}
                                                className="section-title"
                                            >
                                                Honors & Awards
                                            </Title>
                                        </div>
                                        <div className="honors-container">
                                            <Row gutter={[8, 8]}>
                                                {Array.isArray(honors) &&
                                                    honors.map(
                                                        (honor, index) => (
                                                            <Col
                                                                key={index}
                                                                xs={24}
                                                                sm={12}
                                                                md={8}
                                                                lg={6}
                                                            >
                                                                <div className="honor-item">
                                                                    <TrophyIcon className="honor-icon" />
                                                                    <Text>
                                                                        {honor}
                                                                    </Text>
                                                                </div>
                                                            </Col>
                                                        ),
                                                    )}
                                            </Row>
                                        </div>
                                    </Card>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Drawer>

            <Modal
                open={zoomVisible}
                onCancel={() => setZoomVisible(false)}
                footer={null}
                width="auto"
                className="image-zoom-modal"
                closable
                style={{ top: 20 }}
            >
                {zoomImage && (
                    <div className="zoom-container">
                        <Image
                            src={zoomImage}
                            alt="Zoomed"
                            style={{ maxWidth: "100%", maxHeight: "80vh" }}
                            preview={false}
                        />

                        <div className="zoom-actions">
                            {isAdmin && (
                                <>
                                    {/* DOWNLOAD (always allowed) */}
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={() => downloadImage(zoomImage)}
                                        loading={uploadLoading}
                                    >
                                        Download
                                    </Button>

                                    {/* ✅ PROFILE IMAGE UPLOAD (only if NOT a document) */}
                                    {zoomDocumentType === null && (
                                        <Upload
                                            showUploadList={false}
                                            accept="image/*"
                                            beforeUpload={
                                                handleUploadProfileImage
                                            }
                                            disabled={uploadLoading}
                                        >
                                            <Button
                                                icon={<UploadOutlined />}
                                                loading={uploadLoading}
                                            >
                                                Replace Profile Image
                                            </Button>
                                        </Upload>
                                    )}

                                    {/* ✅ DOCUMENT UPLOAD (only if documentType exists) */}
                                    {zoomDocumentType && (
                                        <Upload
                                            showUploadList={false}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            beforeUpload={(file) =>
                                                handleUploadDocument(
                                                    file,
                                                    zoomDocumentType,
                                                )
                                            }
                                            disabled={uploadLoading}
                                        >
                                            <Button
                                                icon={<UploadOutlined />}
                                                loading={uploadLoading}
                                            >
                                                Replace Document
                                            </Button>
                                        </Upload>
                                    )}
                                </>
                            )}

                            {/* CLOSE */}
                            <Button onClick={() => setZoomVisible(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <style jsx>{`
                .preview-drawer .ant-drawer-body {
                    padding: 0;
                    background: #f5f5f5;
                }

                .drawer-content {
                    height: 100%;
                    overflow-y: auto;
                }

                .preview-content {
                    padding: 0;
                }

                /* === OCC Graduation Header Card === */
                .preview-header.preview-header--modern {
                    position: relative;
                    overflow: hidden;
                    padding: 48px 40px 44px;
                    color: #ffffff;
                    background:
                        radial-gradient(
                            820px 360px at 112% -12%,
                            color-mix(in srgb, var(--hdr-primary) 45%, transparent),
                            transparent 60%
                        ),
                        radial-gradient(
                            680px 360px at -10% 120%,
                            color-mix(in srgb, var(--hdr-dark) 50%, transparent),
                            transparent 60%
                        ),
                        linear-gradient(
                            135deg,
                            var(--hdr-deeper) 0%,
                            var(--hdr-deeper) 25%,
                            var(--hdr-dark) 58%,
                            var(--hdr-primary) 100%
                        );
                    border-bottom: 2px solid color-mix(in srgb, var(--hdr-accent) 55%, transparent);
                }
                /* Red ceremonial sash sweeping across the header */
                .preview-header__sash {
                    position: absolute;
                    top: -40px;
                    right: -120px;
                    width: 460px;
                    height: 130px;
                    background: linear-gradient(
                        90deg,
                        color-mix(in srgb, var(--hdr-accent) 0%, transparent) 0%,
                        color-mix(in srgb, var(--hdr-accent) 85%, transparent) 45%,
                        var(--hdr-accent) 70%,
                        color-mix(in srgb, var(--hdr-accent) 60%, transparent) 100%
                    );
                    transform: rotate(-18deg);
                    filter: blur(0.5px);
                    box-shadow: 0 18px 40px color-mix(in srgb, var(--hdr-accent) 35%, transparent);
                    pointer-events: none;
                    opacity: 0.9;
                    z-index: 0;
                }
                /* White ceremonial toga lines */
                .header-toga-line {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: linear-gradient(
                        180deg,
                        rgba(255, 255, 255, 0),
                        rgba(255, 255, 255, 0.35) 35%,
                        rgba(255, 255, 255, 0.35) 65%,
                        rgba(255, 255, 255, 0)
                    );
                    pointer-events: none;
                    z-index: 0;
                }
                .header-toga-line--l {
                    left: 34px;
                }
                .header-toga-line--r {
                    right: 34px;
                }
                .preview-header__shape {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(46px);
                    pointer-events: none;
                    opacity: 0.5;
                    animation: occGlowFloat 9s ease-in-out infinite;
                }
                .preview-header__shape--a {
                    width: 300px;
                    height: 300px;
                    background: color-mix(in srgb, var(--hdr-primary) 60%, transparent);
                    top: -90px;
                    right: -70px;
                }
                .preview-header__shape--b {
                    width: 240px;
                    height: 240px;
                    background: color-mix(in srgb, var(--hdr-accent) 45%, transparent);
                    bottom: -100px;
                    left: -50px;
                    animation-delay: -4s;
                }
                @keyframes occGlowFloat {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(14px, -12px); }
                }

                /* Floating OCC emblem badge (glassmorphism) */
                .occ-emblem-badge {
                    position: absolute;
                    top: 22px;
                    right: 26px;
                    z-index: 3;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 14px 8px 10px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.45);
                    backdrop-filter: blur(12px);
                    box-shadow: 0 12px 30px rgba(2, 6, 23, 0.4);
                }
                .occ-emblem-badge__logo {
                    width: 34px;
                    height: 34px;
                    object-fit: contain;
                    border-radius: 50%;
                    background: #ffffff;
                    padding: 3px;
                }
                .occ-emblem-badge__text {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.1;
                }
                .occ-emblem-badge__title {
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.6px;
                    color: #ffffff;
                }
                .occ-emblem-badge__sub {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .preview-header .preview-profile-section {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    gap: 36px;
                }
                .profile-image-container {
                    position: relative;
                    flex-shrink: 0;
                }

                /* ===== OCC Profile Card (geometric bg + circular avatar) ===== */
                .occ-profile-card {
                    position: relative;
                    width: 230px;
                    height: 200px;
                    border-radius: 22px;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(180deg, var(--hdr-deeper) 0%, var(--hdr-dark) 100%);
                    box-shadow:
                        0 18px 40px rgba(2, 6, 23, 0.5),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.08);
                }
                .occ-profile-card__bg {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                }
                .occ-profile-card__shape {
                    position: absolute;
                    opacity: 0.9;
                }
                /* large royal-blue diagonal band */
                .occ-profile-card__shape--1 {
                    top: -40%;
                    left: -20%;
                    width: 160%;
                    height: 120%;
                    background: linear-gradient(135deg, var(--hdr-dark) 0%, var(--hdr-primary) 60%, transparent 60%);
                    transform: rotate(-8deg);
                }
                /* red accent wedge */
                .occ-profile-card__shape--2 {
                    bottom: -30%;
                    right: -25%;
                    width: 120%;
                    height: 110%;
                    background: linear-gradient(315deg, var(--hdr-accent) 0%, var(--hdr-accent) 45%, transparent 45%);
                    transform: rotate(6deg);
                    opacity: 0.75;
                }
                /* subtle navy crossing facet */
                .occ-profile-card__shape--3 {
                    top: -10%;
                    right: -10%;
                    width: 90%;
                    height: 140%;
                    background: linear-gradient(200deg, color-mix(in srgb, var(--hdr-deeper) 85%, transparent) 0%, transparent 55%);
                    transform: rotate(-14deg);
                }
                .occ-profile-card__avatar {
                    position: relative;
                    z-index: 3;
                    width: 150px;
                    height: 150px;
                    margin: 0 auto;
                }

                .profile-image-wrapper {
                    position: relative;
                    cursor: pointer;
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    padding: 5px;
                    background:
                        radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%),
                        conic-gradient(from 220deg, var(--hdr-deeper), var(--hdr-dark), var(--hdr-primary), var(--hdr-accent), var(--hdr-deeper));
                    box-shadow:
                        0 0 0 4px color-mix(in srgb, var(--hdr-deeper) 90%, transparent),
                        0 0 0 6px color-mix(in srgb, var(--hdr-accent) 85%, transparent),
                        0 0 0 8px rgba(255, 255, 255, 0.95),
                        0 18px 40px rgba(2, 6, 23, 0.5),
                        0 0 34px color-mix(in srgb, var(--hdr-primary) 55%, transparent);
                    animation: occAvatarGlow 3.6s ease-in-out infinite;
                }
                @keyframes occAvatarGlow {
                    0%, 100% {
                        box-shadow:
                            0 0 0 4px color-mix(in srgb, var(--hdr-deeper) 90%, transparent),
                            0 0 0 6px color-mix(in srgb, var(--hdr-accent) 85%, transparent),
                            0 0 0 8px rgba(255, 255, 255, 0.95),
                            0 18px 40px rgba(2, 6, 23, 0.5),
                            0 0 28px color-mix(in srgb, var(--hdr-primary) 45%, transparent);
                    }
                    50% {
                        box-shadow:
                            0 0 0 4px color-mix(in srgb, var(--hdr-deeper) 90%, transparent),
                            0 0 0 6px color-mix(in srgb, var(--hdr-accent) 95%, transparent),
                            0 0 0 8px rgba(255, 255, 255, 0.95),
                            0 18px 44px rgba(2, 6, 23, 0.55),
                            0 0 48px color-mix(in srgb, var(--hdr-primary) 75%, transparent);
                    }
                }
                .preview-profile-img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                    object-position: center top;
                    border: 3px solid rgba(255, 255, 255, 0.95);
                    background: var(--hdr-deeper);
                }
                .default-avatar {
                    background: rgba(255, 255, 255, 0.15) !important;
                    border: 3px solid rgba(255, 255, 255, 0.4) !important;
                    backdrop-filter: blur(6px);
                }
                .profile-status-dot {
                    position: absolute;
                    right: 10px;
                    bottom: 12px;
                    z-index: 4;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #22c55e;
                    border: 3px solid var(--hdr-deeper);
                    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.35);
                }
                .image-zoom-overlay {
                    position: absolute;
                    inset: 5px;
                    background: rgba(7, 22, 51, 0.7);
                    backdrop-filter: blur(2px);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    gap: 4px;
                    opacity: 0;
                    transition: opacity 0.25s ease;
                }
                .profile-image-wrapper:hover .image-zoom-overlay {
                    opacity: 1;
                }

                /* (graduation gown elements removed — replaced by profile card) */

                .profile-info {
                    flex: 1;
                    min-width: 0;
                }
                .profile-info__eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 12px;
                    margin-bottom: 10px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                    color: #ffffff;
                    background: linear-gradient(
                        135deg,
                        color-mix(in srgb, var(--hdr-accent) 50%, transparent),
                        color-mix(in srgb, var(--hdr-primary) 45%, transparent)
                    );
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 999px;
                    backdrop-filter: blur(8px);
                }
                .preview-name {
                    color: #ffffff !important;
                    margin-top: 16px !important;
                    margin-bottom: 6px !important;
                    font-weight: 800 !important;
                    letter-spacing: 0.5px;
                    line-height: 1.18 !important;
                    text-shadow: 0 2px 14px rgba(2, 6, 23, 0.45);
                }
                .preview-title {
                    color: rgba(255, 255, 255, 0.88);
                    font-size: 15px;
                    font-weight: 500;
                }

                /* Premium verified alumni pill */
                .preview-verified-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 14px;
                    padding: 7px 16px;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.4px;
                    color: #ffffff;
                    border-radius: 999px;
                    background: linear-gradient(
                        135deg,
                        color-mix(in srgb, var(--hdr-accent) 90%, transparent),
                        color-mix(in srgb, var(--hdr-primary) 90%, transparent)
                    );
                    border: 1px solid rgba(255, 255, 255, 0.55);
                    box-shadow: 0 10px 24px rgba(2, 6, 23, 0.35);
                    position: relative;
                    overflow: hidden;
                }
                .preview-verified-pill::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: -60%;
                    width: 40%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.55),
                        transparent
                    );
                    transform: skewX(-20deg);
                    animation: occShimmer 3.2s ease-in-out infinite;
                }
                @keyframes occShimmer {
                    0% { left: -60%; }
                    55%, 100% { left: 130%; }
                }

                .preview-contact-info {
                    margin-top: 22px;
                }
                .contact-item.contact-item--chip {
                    display: grid;
                    grid-template-columns: 36px 1fr 36px;
                    column-gap: 12px;
                    align-items: center;
                    padding: 10px 14px;
                    background: color-mix(in srgb, var(--hdr-deeper) 45%, transparent);
                    border: 1px solid color-mix(in srgb, var(--hdr-accent) 40%, transparent);
                    border-radius: 14px;
                    backdrop-filter: blur(10px);
                    transition:
                        transform 0.2s ease,
                        background 0.2s ease,
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }
                .contact-item.contact-item--chip:hover {
                    transform: translateY(-2px);
                    background: color-mix(in srgb, var(--hdr-dark) 50%, transparent);
                    border-color: rgba(255, 255, 255, 0.55);
                    box-shadow: 0 10px 26px rgba(37, 99, 235, 0.35);
                }
                .contact-icon-wrap {
                    grid-column: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: linear-gradient(
                        135deg,
                        rgba(30, 64, 175, 0.7),
                        rgba(37, 99, 235, 0.7)
                    );
                    color: #ffffff;
                    box-shadow: 0 0 14px rgba(37, 99, 235, 0.5);
                }
                .contact-icon {
                    color: #ffffff;
                    font-size: 16px;
                }
                .contact-details {
                    grid-column: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 0;
                    width: 100%;
                    text-align: center;
                }
                .contact-label {
                    width: 100%;
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.4px;
                    text-transform: uppercase;
                    text-align: center;
                }
                .contact-value {
                    width: 100%;
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 500;
                    text-align: center;
                }

                .preview-body {
                    padding: 30px;
                }

                .preview-card {
                    margin-bottom: 24px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .section-icon {
                    color: #1890ff;
                    font-size: 18px;
                }

                .section-title {
                    margin: 0 !important;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .subsection {
                    margin-top: 20px;
                }

                .subsection-title {
                    display: block;
                    margin-bottom: 8px;
                    color: #1890ff;
                }

                .preview-text {
                    margin: 0;
                    line-height: 1.6;
                }

                .sidebar-card {
                    position: sticky;
                    top: 20px;
                }

                .sidebar-section {
                    margin-bottom: 24px;
                }

                .sidebar-section:last-child {
                    margin-bottom: 0;
                }

                .sidebar-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px !important;
                    color: #1890ff;
                }

                .sidebar-items {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 0;
                }

                .sidebar-item.clickable {
                    cursor: pointer;
                }

                .sidebar-item.clickable:hover {
                    background: #f5f5f5;
                    border-radius: 6px;
                    padding: 8px 12px;
                    margin: 0 -12px;
                }

                .sidebar-icon {
                    font-size: 16px;
                    color: #666;
                    width: 20px;
                }

                .sidebar-icon.linkedin {
                    color: #0077b5;
                }
                .sidebar-icon.github {
                    color: #333;
                }
                .sidebar-icon.portfolio {
                    color: #1890ff;
                }

                .sidebar-content {
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-label {
                    font-size: 12px;
                    color: #666;
                }

                .sidebar-value {
                    font-size: 14px;
                    color: #333;
                }

                .document-status,
                .preference-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .document-item,
                .preference-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 0;
                }

                .document-item.uploaded {
                    color: #52c41a;
                }

                .doc-icon,
                .pref-icon {
                    font-size: 16px;
                }

                .doc-view-btn {
                    margin-left: auto;
                }

                .honors-container {
                    margin-top: 16px;
                }

                .honor-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: #f0f8ff;
                    border-radius: 6px;
                    border: 1px solid #d6e4ff;
                }

                .honor-icon {
                    color: #faad14;
                }

                /* Image Zoom Modal */
                .image-zoom-modal .ant-modal-body {
                    padding: 0;
                }

                .zoom-container {
                    text-align: center;
                }

                .zoom-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                /* Responsive Design */
                @media (max-width: 991px) {
                    .occ-emblem-badge {
                        top: 16px;
                        right: 16px;
                    }
                }

                /* Tablet + landscape phones: avatar left, details right */
                @media (max-width: 768px) {
                    .preview-header.preview-header--modern {
                        padding: 56px 20px 28px;
                    }
                    .preview-header .preview-profile-section {
                        gap: 22px;
                    }
                    .occ-emblem-badge__sub {
                        display: none;
                    }
                    .preview-body {
                        padding: 20px;
                    }
                    .sidebar-card {
                        position: static;
                    }
                }

                /* Portrait phones: everything centered, no overflow */
                @media (max-width: 560px) {
                    .preview-header .preview-profile-section {
                        flex-direction: column;
                        text-align: center;
                        gap: 18px;
                    }
                    .profile-image-container {
                        margin: 0 auto;
                    }
                    .occ-profile-card {
                        width: 200px;
                        height: 178px;
                    }
                    .occ-profile-card__avatar,
                    .profile-image-wrapper {
                        width: 132px;
                        height: 132px;
                    }
                    .profile-info__eyebrow,
                    .preview-verified-pill {
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .profile-info {
                        width: 100%;
                    }
                    .occ-emblem-badge {
                        top: 14px;
                        right: 50%;
                        transform: translateX(50%);
                    }
                }

                /* Mobile phones in LANDSCAPE: the viewport is wide but very
                   short, so the header shrinks and the email/phone/address
                   chips get squeezed into narrow columns, forcing the text
                   to wrap letter-by-letter and become unreadable. Force the
                   chips to stack full-width, one per row, with the icon and
                   text side-by-side (left aligned, single line + ellipsis)
                   instead of the centered vertical stack used elsewhere. */
                @media (max-width: 900px) and (orientation: landscape) {
                    .preview-header.preview-header--modern {
                        padding: 44px 18px 20px;
                    }
                    .preview-contact-info {
                        margin-top: 14px;
                    }
                    .preview-contact-info .ant-col {
                        flex: 0 0 100% !important;
                        max-width: 100% !important;
                    }
                    .contact-item.contact-item--chip {
                        grid-template-columns: 30px 1fr;
                        column-gap: 10px;
                        padding: 6px 12px;
                    }
                    .contact-icon-wrap {
                        width: 30px;
                        height: 30px;
                        border-radius: 8px;
                    }
                    .contact-icon {
                        font-size: 14px;
                    }
                    .contact-details {
                        flex-direction: row;
                        align-items: baseline;
                        flex-wrap: nowrap;
                        gap: 6px;
                        text-align: left;
                        min-width: 0;
                    }
                    .contact-label {
                        width: auto;
                        flex: 0 0 auto;
                        font-size: 10px;
                        text-align: left;
                        white-space: nowrap;
                    }
                    .contact-value {
                        width: auto;
                        flex: 1 1 auto;
                        min-width: 0;
                        font-size: 12px;
                        text-align: left;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: block;
                    }
                }

                /* ============================================================
                   BSIT — MULTI-COLOR PROGRAMMER THEME
                   Colors: black · white · red · blue · yellow
                   ============================================================ */

                /* Header background: deep black base with red + blue + yellow rays */
                .preview-header--bsit.preview-header--modern {
                    background:
                        /* yellow streak top-right */
                        radial-gradient(600px 280px at 105% -5%,  rgba(250,204,21,0.30), transparent 55%),
                        /* blue streak bottom-left */
                        radial-gradient(600px 280px at -8%  115%, rgba(37,99,235,0.35),  transparent 55%),
                        /* red burst center-right */
                        radial-gradient(400px 220px at 80%   50%, rgba(225,29,43,0.22),  transparent 60%),
                        /* deep-black base */
                        linear-gradient(135deg, #050810 0%, #0a0f1e 40%, #0d1526 70%, #111827 100%) !important;
                    border-bottom: 2px solid rgba(250,204,21,0.55) !important;
                }

                /* Sash: diagonal yellow-to-red sweep */
                .preview-header--bsit .preview-header__sash {
                    background: linear-gradient(
                        90deg,
                        rgba(250,204,21,0) 0%,
                        rgba(250,204,21,0.85) 35%,
                        rgba(225,29,43,0.90) 65%,
                        rgba(225,29,43,0.50) 100%
                    );
                    box-shadow: 0 18px 40px rgba(225,29,43,0.30);
                }

                /* Blob A: red glow top-right */
                .preview-header--bsit .preview-header__shape--a {
                    background: rgba(225,29,43,0.55);
                }

                /* Blob B: blue glow bottom-left */
                .preview-header--bsit .preview-header__shape--b {
                    background: rgba(37,99,235,0.50);
                }

                /* Toga lines: white — already white so just ensure opacity */
                .preview-header--bsit .header-toga-line {
                    background: linear-gradient(
                        180deg,
                        rgba(255,255,255,0),
                        rgba(255,255,255,0.50) 35%,
                        rgba(255,255,255,0.50) 65%,
                        rgba(255,255,255,0)
                    );
                }

                /* Profile card bg: black base + blue + red + yellow facets */
                .preview-header--bsit .occ-profile-card {
                    background: linear-gradient(180deg, #050810 0%, #0d1a3a 100%);
                }
                /* Blue diagonal band */
                .preview-header--bsit .occ-profile-card__shape--1 {
                    background: linear-gradient(135deg, #0d1a3a 0%, #1e3a8a 55%, transparent 55%);
                }
                /* Red accent wedge */
                .preview-header--bsit .occ-profile-card__shape--2 {
                    background: linear-gradient(315deg, #e11d2b 0%, rgba(225,29,43,0.80) 45%, transparent 45%);
                    opacity: 0.85;
                }
                /* Yellow crossing facet */
                .preview-header--bsit .occ-profile-card__shape--3 {
                    background: linear-gradient(200deg, rgba(250,204,21,0.18) 0%, transparent 50%);
                }

                /* Avatar ring: 5-color conic gradient border */
                .preview-header--bsit .profile-image-wrapper {
                    background:
                        radial-gradient(circle at 30% 20%, rgba(255,255,255,0.30), transparent 55%),
                        conic-gradient(
                            from 0deg,
                            #050810,   /* black */
                            #e11d2b,   /* red */
                            #f8fafc,   /* white */
                            #2563eb,   /* blue */
                            #facc15,   /* yellow */
                            #050810    /* back to black */
                        );
                    animation: bsitRingPulse 4s ease-in-out infinite;
                }
                @keyframes bsitRingPulse {
                    0%,100% {
                        box-shadow:
                            0 0 0 4px rgba(5,8,16,0.90),
                            0 0 0 6px rgba(250,204,21,0.85),
                            0 0 0 8px rgba(248,250,252,0.95),
                            0 18px 40px rgba(2,6,23,0.55),
                            0 0 32px rgba(225,29,43,0.45);
                    }
                    33% {
                        box-shadow:
                            0 0 0 4px rgba(5,8,16,0.90),
                            0 0 0 6px rgba(37,99,235,0.95),
                            0 0 0 8px rgba(248,250,252,0.95),
                            0 18px 44px rgba(2,6,23,0.60),
                            0 0 44px rgba(37,99,235,0.60);
                    }
                    66% {
                        box-shadow:
                            0 0 0 4px rgba(5,8,16,0.90),
                            0 0 0 6px rgba(225,29,43,0.95),
                            0 0 0 8px rgba(248,250,252,0.95),
                            0 18px 44px rgba(2,6,23,0.60),
                            0 0 44px rgba(250,204,21,0.50);
                    }
                }

                /* Verified pill: red → blue gradient + yellow shimmer */
                .preview-header--bsit .preview-verified-pill {
                    background: linear-gradient(
                        135deg,
                        rgba(225,29,43,0.92),
                        rgba(37,99,235,0.92)
                    );
                    border: 1px solid rgba(250,204,21,0.70);
                    box-shadow: 0 10px 24px rgba(2,6,23,0.40), 0 0 16px rgba(250,204,21,0.20);
                }

                /* Contact chips: dark bg + yellow border */
                .preview-header--bsit .contact-item.contact-item--chip {
                    background: rgba(5,8,16,0.55);
                    border: 1px solid rgba(250,204,21,0.40);
                }
                .preview-header--bsit .contact-item.contact-item--chip:hover {
                    background: rgba(13,26,58,0.65);
                    border-color: rgba(250,204,21,0.75);
                    box-shadow: 0 10px 26px rgba(37,99,235,0.35);
                }

                /* Contact icon wrap: yellow tint */
                .preview-header--bsit .contact-icon-wrap {
                    background: linear-gradient(135deg, rgba(225,29,43,0.65), rgba(37,99,235,0.65));
                    box-shadow: 0 0 14px rgba(250,204,21,0.35);
                }

                /* Status dot: yellow */
                .preview-header--bsit .profile-status-dot {
                    background: #facc15;
                    border-color: #050810;
                    box-shadow: 0 0 0 2px rgba(250,204,21,0.40);
                }
            `}</style>
        </>
    );
};

export default AlumniDetails;