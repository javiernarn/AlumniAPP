"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    Input,
    Select,
    Tag,
    Avatar,
    Typography,
    Space,
    Divider,
    List,
    Tabs,
    Badge,
    Dropdown,
    Menu,
    Modal,
    Form,
    DatePicker,
    TimePicker,
    Switch,
    Tooltip,
    Statistic,
    Upload,
    message,
    Steps,
    InputNumber,
    Carousel,
    Image,
    Alert,
    Progress,
    Table,
    Spin,
} from "antd";
import {
    SearchOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    DollarOutlined,
    UserOutlined,
    PlusOutlined,
    MoreOutlined,
    VideoCameraOutlined,
    ShareAltOutlined,
    HeartOutlined,
    BookOutlined,
    TrophyOutlined,
    StarOutlined,
    CheckCircleOutlined,
    GlobalOutlined,
    PhoneOutlined,
    CopyOutlined,
    SolutionOutlined,
    IdcardOutlined,
    UserSwitchOutlined,
    CustomerServiceOutlined,
    FileTextOutlined,
    SmileOutlined,
    ToolOutlined,
    ReadOutlined,
    ShoppingOutlined,
    RocketOutlined,
    CodeOutlined,
    UserAddOutlined,
    GiftOutlined,
    AudioOutlined,
    BankOutlined,
    DesktopOutlined,
    PictureOutlined,
    PhoneFilled,
    MailFilled,
    SafetyCertificateOutlined,
    MessageOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    TagOutlined,
    PrinterOutlined,
    FilePdfOutlined,
    UsergroupAddOutlined,
    WarningOutlined, // Added WarningOutlined icon for validation modal
    HomeOutlined,
    SafetyOutlined,
    RobotOutlined,
    AppstoreOutlined,
    CloudOutlined,
    SketchOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "./AlumniEvents.css";
import "~/styles/printPreview.css";
import { Layout, CardSkeletonGrid } from "~/components";
import { exportElementToPdf } from "~/utils/exportPdf";
import axiosConfig from "~/utils/axiosConfig";
import useEvents from "~/hooks/useEvents";
import secureLocalStorage from "react-secure-storage";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import logo from "~/assets/images/OCC_LOGO.png";

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Step } = Steps;

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

// ===== Draft Auto-Save: storage key & helpers (additive, non-breaking) =====
const EVENT_DRAFT_STORAGE_KEY = "alumni-event-draft";

// Convert a File/Blob to a base64 data URL so banners/posters persist across reloads.
const draftFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        } catch (err) {
            reject(err);
        }
    });

// Rebuild a File object from a stored base64 data URL (so it can still be uploaded).
const draftDataURLtoFile = (dataUrl, fileName) => {
    try {
        const arr = dataUrl.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/png";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], fileName || "draft-image.png", { type: mime });
    } catch (err) {
        console.error("Failed to rebuild draft file:", err);
        return null;
    }
};

const eventTypes = [
    {
        value: "all",
        label: "All Events",
        color: "default",
        icon: <CalendarOutlined />,
    },

    {
        value: "job-fair",
        label: "Job Fair",
        color: "geekblue",
        icon: <SolutionOutlined />,
    },
    {
        value: "hiring",
        label: "Hiring Event",
        color: "cyan",
        icon: <IdcardOutlined />,
    },
    {
        value: "interview",
        label: "Interview Day",
        color: "blue",
        icon: <UserSwitchOutlined />,
    },
    {
        value: "career-networking",
        label: "Career Networking",
        color: "gold",
        icon: <TeamOutlined />,
    },
    {
        value: "career-coaching",
        label: "Career Coaching",
        color: "purple",
        icon: <CustomerServiceOutlined />,
    },
    {
        value: "resume",
        label: "Resume Workshop",
        color: "orange",
        icon: <FileTextOutlined />,
    },
    {
        value: "internship",
        label: "Internship Event",
        color: "volcano",
        icon: <SmileOutlined />,
    },
    {
        value: "apprenticeship",
        label: "Apprenticeship Event",
        color: "magenta",
        icon: <ToolOutlined />,
    },

    {
        value: "conference",
        label: "Conference",
        color: "purple",
        icon: <VideoCameraOutlined />,
    },
    {
        value: "workshop",
        label: "Workshop",
        color: "orange",
        icon: <UserOutlined />,
    },
    {
        value: "seminar",
        label: "Seminar",
        color: "red",
        icon: <ReadOutlined />,
    },
    {
        value: "trade-show",
        label: "Trade Show",
        color: "geekblue",
        icon: <ShoppingOutlined />,
    },
    {
        value: "pitch",
        label: "Startup Pitch",
        color: "lime",
        icon: <RocketOutlined />,
    },
    {
        value: "fundraising",
        label: "Fundraising",
        color: "gold",
        icon: <DollarOutlined />,
    },
    {
        value: "networking",
        label: "Networking",
        color: "blue",
        icon: <TeamOutlined />,
    },

    {
        value: "class",
        label: "Class / Training",
        color: "green",
        icon: <BookOutlined />,
    },
    {
        value: "hackathon",
        label: "Hackathon",
        color: "volcano",
        icon: <CodeOutlined />,
    },
    {
        value: "mentoring",
        label: "Mentoring",
        color: "cyan",
        icon: <UserAddOutlined />,
    },

    {
        value: "sports",
        label: "Sports",
        color: "green",
        icon: <TrophyOutlined />,
    },
    {
        value: "fitness",
        label: "Fitness",
        color: "lime",
        icon: <HeartOutlined />,
    },

    {
        value: "showcase",
        label: "Showcase",
        color: "red",
        icon: <StarOutlined />,
    },
    {
        value: "festival",
        label: "Festival",
        color: "magenta",
        icon: <GiftOutlined />,
    },
    {
        value: "concert",
        label: "Concert",
        color: "purple",
        icon: <AudioOutlined />,
    },
    {
        value: "party",
        label: "Party",
        color: "volcano",
        icon: <SmileOutlined />,
    },
    { value: "expo", label: "Expo", color: "blue", icon: <BankOutlined /> },

    {
        value: "virtual",
        label: "Virtual",
        color: "cyan",
        icon: <GlobalOutlined />,
    },
    {
        value: "webinar",
        label: "Webinar",
        color: "geekblue",
        icon: <DesktopOutlined />,
    },
    {
        value: "hybrid",
        label: "Hybrid Event",
        color: "gold",
        icon: <ShareAltOutlined />,
    },
    // =========================
    // ALUMNI EVENTS
    // =========================

    {
        value: "alumni-homecoming",
        label: "Alumni Homecoming",
        color: "gold",
        icon: <HomeOutlined />,
    },
    {
        value: "alumni-reunion",
        label: "Batch Reunion",
        color: "cyan",
        icon: <TeamOutlined />,
    },
    {
        value: "alumni-awards",
        label: "Alumni Recognition Awards",
        color: "orange",
        icon: <TrophyOutlined />,
    },
    {
        value: "industry-talk",
        label: "Industry Expert Talk",
        color: "purple",
        icon: <ReadOutlined />,
    },
    {
        value: "community-outreach",
        label: "Community Outreach",
        color: "green",
        icon: <HeartOutlined />,
    },
    {
        value: "leadership-summit",
        label: "Leadership Summit",
        color: "volcano",
        icon: <SolutionOutlined />,
    },

    // =========================
    // BSBA EVENTS
    // =========================

    {
        value: "business-forum",
        label: "Business Leadership Forum",
        color: "gold",
        icon: <SolutionOutlined />,
    },
    {
        value: "entrepreneurship-summit",
        label: "Entrepreneurship Summit",
        color: "lime",
        icon: <RocketOutlined />,
    },
    {
        value: "marketing-expo",
        label: "Marketing Expo",
        color: "blue",
        icon: <ShoppingOutlined />,
    },
    {
        value: "finance-workshop",
        label: "Finance Workshop",
        color: "green",
        icon: <DollarOutlined />,
    },
    {
        value: "startup-showcase",
        label: "Startup Showcase",
        color: "volcano",
        icon: <StarOutlined />,
    },

    // =========================
    // BEED EVENTS
    // =========================

    {
        value: "teaching-demo",
        label: "Teaching Demonstration",
        color: "green",
        icon: <BookOutlined />,
    },
    {
        value: "classroom-management",
        label: "Classroom Management Workshop",
        color: "blue",
        icon: <ReadOutlined />,
    },
    {
        value: "teacher-mentoring",
        label: "Teacher Mentoring Session",
        color: "purple",
        icon: <UserAddOutlined />,
    },
    {
        value: "child-development",
        label: "Child Development Seminar",
        color: "orange",
        icon: <SmileOutlined />,
    },
    {
        value: "literacy-program",
        label: "Literacy Outreach Program",
        color: "cyan",
        icon: <HeartOutlined />,
    },

    // =========================
    // BSED EVENTS
    // =========================

    {
        value: "subject-specialization",
        label: "Subject Specialization Seminar",
        color: "blue",
        icon: <ReadOutlined />,
    },
    {
        value: "teaching-strategies",
        label: "Teaching Strategies Workshop",
        color: "orange",
        icon: <BookOutlined />,
    },
    {
        value: "research-colloquium",
        label: "Research Colloquium",
        color: "purple",
        icon: <FileTextOutlined />,
    },
    {
        value: "curriculum-development",
        label: "Curriculum Development Workshop",
        color: "cyan",
        icon: <UserOutlined />,
    },
    {
        value: "academic-symposium",
        label: "Academic Symposium",
        color: "red",
        icon: <VideoCameraOutlined />,
    },

    // =========================
    // BSIT EVENTS
    // =========================

    {
        value: "tech-conference",
        label: "Technology Conference",
        color: "geekblue",
        icon: <CodeOutlined />,
    },
    {
        value: "coding-bootcamp",
        label: "Coding Bootcamp",
        color: "blue",
        icon: <DesktopOutlined />,
    },
    {
        value: "cybersecurity-seminar",
        label: "Cybersecurity Seminar",
        color: "red",
        icon: <SafetyOutlined />,
    },
    {
        value: "ai-data-workshop",
        label: "AI & Data Workshop",
        color: "purple",
        icon: <RobotOutlined />,
    },
    {
        value: "system-development",
        label: "System Development Showcase",
        color: "cyan",
        icon: <AppstoreOutlined />,
    },
    {
        value: "cloud-computing",
        label: "Cloud Computing Workshop",
        color: "blue",
        icon: <CloudOutlined />,
    },
    {
        value: "uiux-design",
        label: "UI/UX Design Workshop",
        color: "magenta",
        icon: <SketchOutlined />,
    },
];



const eventCategories = [
    { value: "all", label: "All Categories" },
    { value: "professional", label: "Professional Development" },
    { value: "social", label: "Social & Networking" },
    { value: "recreational", label: "Recreational" },
    { value: "educational", label: "Educational" },
    { value: "philanthropy", label: "Philanthropy & Service" },
    { value: "campus_traditions", label: "Campus & Traditions" },
    { value: "student_engagement", label: "Student Engagement" },
    { value: "regional_global", label: "Regional & Global Chapters" },
    { value: "family", label: "Family & Community" },
    { value: "arts_culture", label: "Arts & Cultural" },
    { value: "athletics", label: "Athletics & Spirit" },
    { value: "virtual", label: "Virtual / Hybrid" },
    { value: "affinity", label: "Affinity & Identity Groups" },
    { value: "career_development", label: "Career Development" },
    { value: "industry_networking", label: "Industry Networking" },
    { value: "research_innovation", label: "Research & Innovation" },
    { value: "entrepreneurship", label: "Entrepreneurship" },
    { value: "teacher_education", label: "Teacher Education" },
    { value: "technology", label: "Technology & Innovation" },
    { value: "community_service", label: "Community Service" },
    { value: "alumni_relations", label: "Alumni Relations" },
    {
        value: "professional_certification",
        label: "Professional Certification",
    },
];



const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

const sortOptions = [
    { value: "date-asc", label: "Date: Earliest First" },
    { value: "date-desc", label: "Date: Latest First" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "rating-desc", label: "Highest Rated" },
    { value: "popularity", label: "Most Popular" },
    { value: "title-asc", label: "Title: A to Z" },
    { value: "capacity", label: "Availability" },
];

const getEventTypeConfig = (type) => {
    return eventTypes.find((et) => et.value === type) || eventTypes[0];
};

const getCategoryLabel = (value) => {
    const category = eventCategories.find((cat) => cat.value === value);
    return category ? category.label : value;
};

// Formats any time string (24h "HH:mm:ss", 24h "HH:mm", or already 12h "hh:mm A")
// into a consistent 12-hour "hh:mm A" display string, e.g. "05:00 AM".
const formatTimeDisplay = (value) => {
    if (!value) return "";
    const parsed = moment(
        value,
        ["HH:mm:ss", "HH:mm", "hh:mm A", "h:mm A"],
        true,
    );
    return parsed.isValid() ? parsed.format("hh:mm A") : value;
};

const RegistrationsModal = ({ event, visible, onClose }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [eventData, setEventData] = useState(null);
    const printRef = useRef(null);
    const [printPreviewVisible, setPrintPreviewVisible] = useState(false);

    useEffect(() => {
        if (visible && event) {
            fetchRegistrations();
        }
    }, [visible, event]);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const response = await axiosConfig.get(
                `/events/${event.id}/registrations`,
            );
            if (response.data.success) {
                setRegistrations(response.data.data);
                setEventData(response.data.event);
            }
        } catch (error) {
            message.error("Failed to fetch registrations");
        } finally {
            setLoading(false);
        }
    };

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handlePrint = () => {
        setPrintPreviewVisible(true);
    };

    const handleActualPrint = async () => {
        setIsGeneratingPdf(true);
        try {
            const eventLabel = event?.title
                ? event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                : "event";
            await exportElementToPdf("printable-area", {
                filename: `event-registrations-${eventLabel}.pdf`,
            });
        } catch (err) {
            console.error("Failed to generate PDF:", err);
            message.error("Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    const columns = [
        {
            title: "#",
            key: "index",
            width: 50,
            render: (_, __, index) => index + 1,
        },
        {
            title: "Check",
            key: "check",
            width: 70,
            align: "center",
            render: () => (
                <div
                    style={{
                        width: 20,
                        height: 20,
                        border: "1.5px solid #000",
                        borderRadius: 3,
                        margin: "0 auto",
                    }}
                />
            ),
        },
        {
            title: "Name",
            key: "name",
            render: (_, record) => (
                <Text strong>{record.alumni?.name || "N/A"}</Text>
            ),
        },
        {
            title: "Contact",
            key: "contact_number",
            render: (_, record) => record.alumni?.contact_number || "N/A",
        },
        {
            title: "Batch Year",
            key: "batch_year",
            render: (_, record) => record.alumni?.batch_year || "N/A",
        },
        {
            title: "Registration Date",
            key: "registration_date",
            render: (_, record) =>
                moment(record.registration_date || record.created_at).format(
                    "MMM DD, YYYY hh:mm A",
                ),
        },
    ];


    
    return (
        <>
            <Modal
                title={
                    <Space>
                        <UsergroupAddOutlined
                            style={{ color: "var(--accent, #4f46e5)" }}
                        />
                        <span>Event Registrations - {event?.title}</span>
                    </Space>
                }
                open={visible}
                onCancel={onClose}
                width={1000}
                footer={[
                    <Button key="close" onClick={onClose}>
                        Close
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        disabled={registrations.length === 0}
                    >
                        Print Preview
                    </Button>,
                ]}
            >
                <div ref={printRef}>
                    {/* Event Summary */}
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Total Registered"
                                    value={registrations.length}
                                    suffix={`/ ${event?.capacity}`}
                                    valueStyle={{
                                        color: "var(--accent, #4f46e5)",
                                    }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Spots Remaining"
                                    value={
                                        (event?.capacity || 0) -
                                        registrations.length
                                    }
                                    valueStyle={{
                                        color:
                                            registrations.length >=
                                            (event?.capacity || 0)
                                                ? "var(--danger, #ef4444)"
                                                : "var(--success, #22c55e)",
                                    }}
                                />
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">
                                    Registration Progress
                                </Text>
                                <Progress
                                    percent={Math.round(
                                        (registrations.length /
                                            (event?.capacity || 1)) *
                                            100,
                                    )}
                                    status={
                                        registrations.length >=
                                        (event?.capacity || 0)
                                            ? "exception"
                                            : "active"
                                    }
                                    strokeColor={{
                                        "0%": "#108ee9",
                                        "100%": "#87d068",
                                    }}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* Registrations Table */}
                    <Spin spinning={loading}>
                        <Table
                            dataSource={registrations}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            locale={{ emptyText: "No registrations yet" }}
                        />
                    </Spin>
                </div>
            </Modal>

            {/* Print Preview Modal — #printable-area uses the shared
                .printable-area-surface (fixed real A4 size, see
                ~/styles/printPreview.css) inside the shared scrollable
                .print-preview-canvas wrapper, so this report is
                pixel-consistent with every other PDF in the app and
                never reflows or gets clipped between mobile
                portrait/landscape. */}
            <Modal
                title="Print Preview - A4 Layout"
                open={printPreviewVisible}
                onCancel={() => setPrintPreviewVisible(false)}
                width={900}
                style={{ top: 16, maxWidth: "calc(100vw - 16px)" }}
                styles={{ body: { maxHeight: "78vh", overflowY: "auto", padding: 0 } }}
                wrapClassName="print-preview-modal"
                className="print-preview-modal"
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => setPrintPreviewVisible(false)}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<FilePdfOutlined />}
                        loading={isGeneratingPdf}
                        onClick={handleActualPrint}
                    >
                        {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
                    </Button>,
                ]}
            >
                <div className="print-preview-canvas">
                <div
                    id="printable-area"
                    data-print-theme="light"
                    className="printable-area-surface"
                    style={{
                        backgroundColor: "#fff",
                        color: "#0f172a",
                    }}
                >
                    {/* Header with Logo */}
                    <div
                        className="print-report-header"
                        style={{
                            textAlign: "center",
                            borderBottom: "2px solid #000",
                        }}
                    >
                        <img
                            src={logo || "/placeholder.svg"}
                            alt="OCC Logo"
                            style={{
                                width: "80px",
                                height: "80px",
                                marginBottom: "10px",
                                objectFit: "contain",
                            }}
                        />
                        <Title level={2} style={{ margin: 0, color: "#000" }}>
                            Event Registration List
                        </Title>
                        <Title
                            level={4}
                            style={{
                                margin: "10px 0",
                                color: "var(--accent, #4f46e5)",
                            }}
                        >
                            {event?.title}
                        </Title>
                        <Text type="secondary" style={{ color: "#666" }}>
                            Generated on: {moment().format("MMMM DD, YYYY")}
                        </Text>
                    </div>

                    {/* Event Info */}
                    <Card
                        className="print-block"
                        style={{
                            border: "1px solid #d9d9d9",
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <p style={{ margin: "5px 0" }}>
                                    <strong>Date:</strong>{" "}
                                    {moment(event?.date).format(
                                        "MMMM DD, YYYY",
                                    )}
                                </p>
                                <p style={{ margin: "5px 0" }}>
                                    <strong>Time:</strong>{" "}
                                    {moment(event?.start_time, "HH:mm").format(
                                        "hh:mm A",
                                    )}{" "}
                                    -{" "}
                                    {moment(event?.end_time, "HH:mm").format(
                                        "hh:mm A",
                                    )}
                                </p>
                            </Col>
                            <Col span={12}>
                                <p style={{ margin: "5px 0" }}>
                                    <strong>Location:</strong> {event?.location}
                                </p>
                                <p style={{ margin: "5px 0" }}>
                                    <strong>Organizer:</strong>{" "}
                                    {event?.organizer}
                                </p>
                            </Col>
                        </Row>
                    </Card>

                    {/* Print Statistics */}
                    <Card
                        className="print-block"
                        style={{
                            border: "1px solid #d9d9d9",
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <div style={{ textAlign: "center" }}>
                                    <Title
                                        level={3}
                                        style={{
                                            color: "var(--accent, #4f46e5)",
                                        }}
                                    >
                                        {registrations.length}
                                    </Title>
                                    <Text style={{ color: "#000" }}>
                                        Total Registered
                                    </Text>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ textAlign: "center" }}>
                                    <Title
                                        level={3}
                                        style={{
                                            color:
                                                registrations.length >=
                                                (event?.capacity || 0)
                                                    ? "var(--danger, #ef4444)"
                                                    : "var(--success, #22c55e)",
                                        }}
                                    >
                                        {(event?.capacity || 0) -
                                            registrations.length}
                                    </Title>
                                    <Text style={{ color: "#000" }}>
                                        Spots Remaining (Capacity:{" "}
                                        {event?.capacity})
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Print Table */}
                    <Table
                        className="print-block"
                        dataSource={registrations}
                        pagination={false}
                        size="small"
                        rowKey="id"
                        style={{ width: "100%" }}
                        columns={[
                            {
                                title: "No.",
                                key: "index",
                                width: 50,
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: "Check",
                                key: "check",
                                width: 60,
                                align: "center",
                                render: () => (
                                    <div
                                        style={{
                                            width: 18,
                                            height: 18,
                                            border: "1.5px solid #000",
                                            borderRadius: 3,
                                            margin: "0 auto",
                                        }}
                                    />
                                ),
                            },
                            {
                                title: "Name",
                                key: "name",
                                render: (_, record) =>
                                    record.alumni?.name || "N/A",
                            },
                            {
                                title: "Contact Number",
                                key: "contact_number",
                                render: (_, record) =>
                                    record.alumni?.contact_number || "N/A",
                            },
                            {
                                title: "Batch Year",
                                key: "batch_year",
                                render: (_, record) =>
                                    record.alumni?.batch_year || "N/A",
                            },
                            {
                                title: "Registration Date",
                                key: "registration_date",
                                render: (_, record) =>
                                    moment(
                                        record.registration_date ||
                                            record.created_at,
                                    ).format("MMM DD, YYYY hh:mm A"),
                            },
                            {
                                title: "Signature",
                                key: "signature",
                                width: 140,
                                render: () => "",
                            },
                        ]}
                    />

                    {/* Print Footer */}
                    <div style={{
                            marginTop: "40px",
                            paddingTop: "20px",
                            borderTop: "1px solid #d9d9d9",
                            textAlign: "center",
                        }}
                    >
                        <Text type="secondary" style={{ color: "#666" }}>
                            Alumni Events Management System
                        </Text>
                    </div>
                </div>
                </div>
            </Modal>

            {/* Print mechanics only — appearance (size/padding/typography/
                table density) lives once, unconditionally, in
                ~/styles/printPreview.css. Duplicating appearance here is
                exactly what let the preview drift from the downloaded
                PDF before, and what made the printable area's real width
                depend on the current page rather than always being a
                fixed A4 size. */}
            <style jsx global>{`
                @media print {
                    html,
                    body {
                        background: #ffffff !important;
                        color: #0f172a !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #printable-area,
                    #printable-area * {
                        visibility: visible !important;
                    }

                    #printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        z-index: 999999 !important;
                    }

                    .ant-modal-mask,
                    .ant-modal-wrap {
                        position: static !important;
                        background: none !important;
                    }

                    .ant-modal,
                    .ant-modal-content {
                        position: static !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: transparent !important;
                    }

                    .ant-modal-header,
                    .ant-modal-footer,
                    .ant-modal-close {
                        display: none !important;
                    }

                    .ant-modal-body {
                        padding: 0 !important;
                    }

                    .print-preview-canvas {
                        background: none !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    .print-preview-canvas .printable-area-surface {
                        box-shadow: none !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }

                    html,
                    body {
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }
                }
            `}</style>
        </>
    );
};

const EventDetailsModal = ({
    event,
    visible,
    onClose,
    onEdit,
    onDelete,
    onRefresh,
}) => {
    const isTouchDevice = useIsTouchDevice();
    const [isLiked, setIsLiked] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [phoneModalVisible, setPhoneModalVisible] = useState(false);
    const [emailModalVisible, setEmailModalVisible] = useState(false);
    const [messengerModalVisible, setMessengerModalVisible] = useState(false);
    const [registrationsModalVisible, setRegistrationsModalVisible] =
        useState(false);
    const [isLoadingRegistrationStatus, setIsLoadingRegistrationStatus] =
        useState(false);
    const [galPreviewOpen, setGalPreviewOpen] = useState(false);
    const [galPreviewIndex, setGalPreviewIndex] = useState(0);

    // Each time the modal becomes visible, increment the key to force
    // react-slick to unmount + remount with correct viewport dimensions.
    // Without this, slick measures width=0 during the AntD zoom animation
    // and all slides are invisibly positioned off-screen on portrait mobile.
    const [carouselKey, setCarouselKey] = useState(0);
    useEffect(() => {
        if (visible) {
            setCarouselKey((k) => k + 1);
        }
    }, [visible]);

    const role = secureLocalStorage.getItem("userRole");

    const contactInfo = {
        phone: event?.contact_number || "N/A",
        email: event?.contact_email || "N/A",
        // messenger: "https://www.facebook.com/messages/t/your-page-id",
        title: event?.organizer || "Event Organizer",
    };

    // Helper function to check if early bird pricing is available
    const isEarlyBirdAvailable = (event) => {
        if (!event.earlyBirdEndDate) return false;
        const now = dayjs();
        return now.isBefore(dayjs(event.earlyBirdEndDate));
    };

    const eventId = event?.id;
    useEffect(() => {
        const fetchFreshEventData = async () => {
            if (visible && eventId && role === "alumni") {
                setIsLoadingRegistrationStatus(true);
                try {
                    const response = await axiosConfig.get(
                        `/events/${eventId}`,
                    );
                    const freshEvent = response.data;
                    const backendRegistered =
                        freshEvent.is_user_registered || false;
                    setIsRegistered(backendRegistered);

                    // Sync localStorage with fresh backend value
                    const storedRegistrations = JSON.parse(
                        localStorage.getItem("eventRegistrations") || "{}",
                    );
                    if (backendRegistered) {
                        storedRegistrations[eventId] = true;
                    } else {
                        delete storedRegistrations[eventId];
                    }
                    localStorage.setItem(
                        "eventRegistrations",
                        JSON.stringify(storedRegistrations),
                    );
                } catch (error) {
                    console.error("Failed to fetch fresh event data:", error);
                    // Fallback to event prop value if fetch fails
                    setIsRegistered(event?.is_user_registered || false);
                } finally {
                    setIsLoadingRegistrationStatus(false);
                }
            } else if (event) {
                // For non-alumni users, just use the prop value
                setIsRegistered(event.is_user_registered || false);
            }
        };

        fetchFreshEventData();
    }, [visible, eventId, role, event]);

    if (!event) return null;

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            const response = await axiosConfig.post(
                `/events/${event.id}/register`,
            );
            if (response.data.success) {
                setIsRegistered(true);

                // Persist registration to localStorage
                const storedRegistrations = JSON.parse(
                    localStorage.getItem("eventRegistrations") || "{}",
                );
                storedRegistrations[event.id] = true;
                localStorage.setItem(
                    "eventRegistrations",
                    JSON.stringify(storedRegistrations),
                );

                message.success(
                    response.data.message ||
                        "Successfully registered for this event!",
                );
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                    "Failed to register for the event",
            );
        } finally {
            setIsRegistering(false);
        }
    };

    const handleCancelRegistration = async () => {
        Modal.confirm({
            title: "Cancel Registration",
            icon: <ExclamationCircleOutlined />,
            content:
                "Are you sure you want to cancel your registration for this event?",
            okText: "Yes, Cancel",
            okType: "danger",
            cancelText: "No",
            async onOk() {
                try {
                    const response = await axiosConfig.post(
                        `/events/${event.id}/cancel-registration`,
                    );
                    if (response.data.success) {
                        setIsRegistered(false);

                        // Remove registration from localStorage
                        const storedRegistrations = JSON.parse(
                            localStorage.getItem("eventRegistrations") || "{}",
                        );
                        delete storedRegistrations[event.id];
                        localStorage.setItem(
                            "eventRegistrations",
                            JSON.stringify(storedRegistrations),
                        );

                        message.success(
                            response.data.message ||
                                "Registration cancelled successfully",
                        );
                        if (onRefresh) onRefresh();
                    }
                } catch (error) {
                    message.error(
                        error.response?.data?.message ||
                            "Failed to cancel registration",
                    );
                }
            },
        });
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        message.success(
            isLiked ? "Removed from favorites" : "Added to favorites",
        );
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        message.success("Event link copied to clipboard!");
    };

    const handleMenuClick = ({ key }) => {
        if (key === "delete") {
            Modal.confirm({
                title: "Delete Event",
                icon: <ExclamationCircleOutlined />,
                content:
                    "Are you sure you want to delete this event? This action cannot be undone.",
                okText: "Yes, Delete",
                okType: "danger",
                cancelText: "Cancel",
                onOk() {
                    onDelete(event);
                },
            });
        } else if (key === "edit") {
            onEdit(event);
        } else if (key === "share") {
            handleShare();
        } else if (key === "registrations") {
            setRegistrationsModalVisible(true);
        }
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                disabled={
                    event.status === "ongoing" || event.status === "completed"
                }
            >
                Edit Event
            </Menu.Item>
            {/* <Menu.Item key="duplicate" icon={<CopyOutlined />}>
        Duplicate Event
      </Menu.Item>
      <Menu.Divider /> */}
            {/* <Menu.Item key="share" icon={<ShareAltOutlined />}>
        Share Event
      </Menu.Item> */}
            <Menu.Item key="registrations" icon={<UsergroupAddOutlined />}>
                View Registrations
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
                Delete Event
            </Menu.Item>
        </Menu>
    );

    const registeredCount = event.registered_count || event.registered || 0;
    const capacity = event.capacity || 0;
    const spotsRemaining = capacity - registeredCount;
    const isFull = registeredCount >= capacity;

    return (
        <>
            <Modal
                title={
                    <div
                        className="event-detail-header"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingRight: "48px",
                        }}
                    >
                        <Title level={3} style={{ margin: 0 }}>
                            {event.title}
                        </Title>
                        <div className="event-header-actions">
                            {role === "admin" && (
                                <Dropdown overlay={menu} trigger={["click"]}>
                                    <Button
                                        type="text"
                                        icon={<MoreOutlined />}
                                    />
                                </Dropdown>
                            )}
                        </div>
                    </div>
                }
                open={visible}
                onCancel={onClose}
                footer={null}
                width={1200}
                className="event-details-modal"
                afterOpenChange={(open) => {
                    if (open) {
                        // Fire a resize event AFTER the AntD modal zoom animation
                        // completes. React-slick listens to window resize and will
                        // recalculate all slide widths/positions, fixing the
                        // "images invisible on portrait mobile" bug.
                        window.dispatchEvent(new Event("resize"));
                    }
                }}
            >
                <div className="event-details-content">
                    {/* Image Gallery */}
                    <div className="event-gallery-section">
                        <Carousel
                            key={carouselKey}
                            arrows
                            dots={{ className: "custom-dots" }}
                            effect="fade"
                            className="event-carousel"
                            afterChange={() => {
                                // Defensive repaint nudge for mobile portrait.
                                // The CSS fix (pinning .slick-track) handles
                                // the root cause, but some WebKit/Blink
                                // builds can still finish a fade transition
                                // without actually painting the <img>. This
                                // forces an invisible reflow on the newly
                                // active slide's image so it always paints.
                                requestAnimationFrame(() => {
                                    const activeImg = document.querySelector(
                                        ".event-carousel .slick-active .event-detail-image",
                                    );
                                    if (activeImg) {
                                        const prevDisplay =
                                            activeImg.style.display;
                                        activeImg.style.display = "none";
                                        // Reading offsetHeight forces the
                                        // browser to flush layout before we
                                        // restore display, triggering a
                                        // fresh repaint.
                                        // eslint-disable-next-line no-unused-expressions
                                        activeImg.offsetHeight;
                                        activeImg.style.display =
                                            prevDisplay || "block";
                                    }
                                });
                            }}
                        >
                            {event.image_urls?.map((image, index) => (
                                <div key={index} className="carousel-slide">
                                    {/* Plain <img> — avoids Antd <Image> wrapper
                                        collapsing inside slick on portrait mobile.
                                        loading="eager" is intentional: lazy-loading
                                        inside a modal can leave images blank on iOS
                                        because the modal is not considered "in viewport". */}
                                    <img
                                        src={image || "/placeholder.svg"}
                                        alt={`${event.title} - Image ${index + 1}`}
                                        className="event-detail-image"
                                        loading="eager"
                                        onClick={() => {
                                            setGalPreviewIndex(index);
                                            setGalPreviewOpen(true);
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                "/placeholder.svg";
                                        }}
                                    />
                                    <div
                                        className="event-detail-image-overlay"
                                        onClick={() => {
                                            setGalPreviewIndex(index);
                                            setGalPreviewOpen(true);
                                        }}
                                    >
                                        <EyeOutlined />
                                        <span>View Photo</span>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                        {/* Hidden Antd preview group — provides zoom / rotate / swipe UX */}
                        <div style={{ display: "none" }}>
                            <Image.PreviewGroup
                                preview={{
                                    visible: galPreviewOpen,
                                    current: galPreviewIndex,
                                    onVisibleChange: (v) =>
                                        setGalPreviewOpen(v),
                                    onChange: (idx) => setGalPreviewIndex(idx),
                                }}
                            >
                                {event.image_urls?.map((image, index) => (
                                    <Image
                                        key={index}
                                        src={image || "/placeholder.svg"}
                                    />
                                ))}
                            </Image.PreviewGroup>
                        </div>
                    </div>

                    <Row gutter={32} className="event-details-body">
                        {/* Left Column - Main Content */}
                        <Col span={16}>
                            {/* Event Status & Basic Info */}
                            <Card className="event-info-card">
                                <Space
                                    size="middle"
                                    style={{ marginBottom: 16 }}
                                >
                                    <Tag
                                        color={
                                            getEventTypeConfig(
                                                event.eventType ||
                                                    event.event_type,
                                            ).color
                                        }
                                        icon={
                                            getEventTypeConfig(
                                                event.eventType ||
                                                    event.event_type,
                                            ).icon
                                        }
                                    >
                                        {
                                            getEventTypeConfig(
                                                event.eventType ||
                                                    event.event_type,
                                            ).label
                                        }
                                    </Tag>
                                    <Tag icon={<TagOutlined />} color="blue">
                                        {getCategoryLabel(event.category)}
                                    </Tag>
                                    {event.featured && (
                                        <Tag
                                            icon={<StarOutlined />}
                                            color="gold"
                                        >
                                            Featured
                                        </Tag>
                                    )}
                                </Space>

                                <Paragraph className="event-description-detailed">
                                    {event.description}
                                </Paragraph>

                                <Divider />

                                {/* Event Details Grid */}
                                <Row
                                    gutter={[16, 16]}
                                    className="event-details-grid"
                                >
                                    <Col span={12}>
                                        <div className="detail-item-large">
                                            <CalendarOutlined className="detail-icon" />
                                            <div className="detail-content">
                                                <Text strong>Date</Text>
                                                <Text>
                                                    {moment(event.date).format(
                                                        "dddd, MMMM DD, YYYY",
                                                    )}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="detail-item-large">
                                            <ClockCircleOutlined className="detail-icon" />
                                            <div className="detail-content">
                                                <Text strong>Time</Text>
                                                <Text>
                                                    {formatTimeDisplay(
                                                        event.startTime ||
                                                            event.start_time,
                                                    )}{" "}
                                                    -{" "}
                                                    {formatTimeDisplay(
                                                        event.endTime ||
                                                            event.end_time,
                                                    )}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="detail-item-large">
                                            <EnvironmentOutlined className="detail-icon" />
                                            <div className="detail-content">
                                                <Text strong>Location</Text>
                                                <Text>{event.location}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="detail-item-large">
                                            <TeamOutlined className="detail-icon" />
                                            <div className="detail-content">
                                                <Text strong>Capacity</Text>
                                                <Text>
                                                    {registeredCount} /{" "}
                                                    {capacity} registered
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <div
                                    className="registration-progress"
                                    style={{ marginTop: 20 }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <Text strong>
                                            Registration Progress
                                        </Text>
                                        <Text type="secondary">
                                            {spotsRemaining} spots remaining
                                        </Text>
                                    </div>
                                    <Progress
                                        percent={Math.round(
                                            (registeredCount / capacity) * 100,
                                        )}
                                        status={isFull ? "exception" : "active"}
                                        strokeColor={{
                                            from: "#108ee9",
                                            to: isFull
                                                ? "var(--danger, #ef4444)"
                                                : "#87d068",
                                        }}
                                    />
                                    {role === "admin" && (
                                        <Button
                                            type="link"
                                            icon={<UsergroupAddOutlined />}
                                            onClick={() =>
                                                setRegistrationsModalVisible(
                                                    true,
                                                )
                                            }
                                            style={{ padding: 0, marginTop: 8 }}
                                        >
                                            View All Registrations (
                                            {registeredCount})
                                        </Button>
                                    )}
                                </div>
                            </Card>

                            {/* Agenda Section */}
                            {event.agenda && (
                                <Card
                                    title="Event Agenda"
                                    className="agenda-card"
                                >
                                    <List
                                        dataSource={
                                            typeof event.agenda === "string"
                                                ? event.agenda.split("\n")
                                                : event.agenda
                                        }
                                        renderItem={(item, index) => {
                                            const hasTimeFormat =
                                                item.includes(" - ");
                                            const timePart = hasTimeFormat
                                                ? item.split(" - ")[0]
                                                : `Item ${index + 1}`;
                                            const contentPart = hasTimeFormat
                                                ? item.split(" - ")[1]
                                                : item;

                                            return (
                                                <List.Item className="agenda-item">
                                                    <div className="agenda-time">
                                                        <Text strong>
                                                            {timePart}
                                                        </Text>
                                                    </div>
                                                    <div className="agenda-content">
                                                        <Text>
                                                            {contentPart}
                                                        </Text>
                                                    </div>
                                                </List.Item>
                                            );
                                        }}
                                    />
                                </Card>
                            )}

                            {/* Speakers Section */}
                            {event.speakers && (
                                <Card
                                    title="Featured Speakers"
                                    className="speakers-card"
                                >
                                    <Row gutter={[16, 16]}>
                                        {event.speakers.map(
                                            (speaker, index) => (
                                                <Col span={8} key={index}>
                                                    <div className="speaker-card">
                                                        <Avatar
                                                            size={64}
                                                            icon={
                                                                <UserOutlined />
                                                            }
                                                        />
                                                        <div className="speaker-info">
                                                            <Text strong>
                                                                {speaker.name}
                                                            </Text>
                                                            <Text type="secondary">
                                                                {speaker.role}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </Col>
                                            ),
                                        )}
                                    </Row>
                                </Card>
                            )}
                        </Col>

                        {/* Right Column - Sidebar */}
                        <Col span={8}>
                            {/* Pricing & Registration Card */}
                            <Card className="pricing-card">
                                <div className="pricing-header">
                                    <Title level={3} style={{ margin: 0 }}>
                                        {event.price === 0
                                            ? "FREE"
                                            : `₱${Number(event.price).toLocaleString()}`}
                                    </Title>

                                    {event.earlyBirdPrice &&
                                        isEarlyBirdAvailable(event) && (
                                            <div className="early-bird-pricing">
                                                <Text delete type="secondary">
                                                    ₱
                                                    {Number(
                                                        event.price,
                                                    ).toLocaleString()}
                                                </Text>

                                                <Text
                                                    strong
                                                    style={{
                                                        color: "var(--danger, #ef4444)",
                                                        fontSize: "20px",
                                                    }}
                                                >
                                                    ₱
                                                    {Number(
                                                        event.earlyBirdPrice,
                                                    ).toLocaleString()}
                                                </Text>

                                                <Tag color="red">
                                                    Early Bird
                                                </Tag>
                                            </div>
                                        )}
                                </div>

                                {role === "alumni" &&
                                    event.status === "upcoming" && (
                                        <>
                                            {isRegistered ? (
                                                <Space
                                                    direction="vertical"
                                                    style={{
                                                        width: "100%",
                                                        marginTop: 16,
                                                    }}
                                                >
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        block
                                                        icon={
                                                            <CheckCircleOutlined />
                                                        }
                                                        style={{
                                                            background:
                                                                "var(--success, #22c55e)",
                                                            borderColor:
                                                                "var(--success, #22c55e)",
                                                        }}
                                                        disabled
                                                    >
                                                        Registered
                                                    </Button>
                                                    <Button
                                                        type="default"
                                                        size="large"
                                                        block
                                                        danger
                                                        onClick={
                                                            handleCancelRegistration
                                                        }
                                                    >
                                                        Cancel Registration
                                                    </Button>
                                                </Space>
                                            ) : (
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    block
                                                    onClick={handleRegister}
                                                    disabled={
                                                        isFull ||
                                                        isLoadingRegistrationStatus
                                                    }
                                                    loading={isRegistering}
                                                    className="register-btn"
                                                    style={{ marginTop: 16 }}
                                                >
                                                    {isFull
                                                        ? "Fully Booked"
                                                        : "Register Now"}
                                                </Button>
                                            )}
                                        </>
                                    )}

                                {isFull && !isRegistered && (
                                    <Text
                                        type="danger"
                                        style={{
                                            textAlign: "center",
                                            display: "block",
                                            marginTop: 8,
                                        }}
                                    >
                                        This event is fully booked
                                    </Text>
                                )}

                                <Divider />

                                <div className="event-organizer-detailed">
                                    <div className="organizer-header">
                                        <Avatar
                                            size="large"
                                            src="/images/avatar.jpg"
                                        />

                                        <div className="organizer-info">
                                            <Text strong>
                                                Hosted by {event.organizer}
                                            </Text>
                                            <Text type="secondary">
                                                Event Organizer
                                            </Text>
                                        </div>
                                    </div>
                                    <div className="organizer-actions">
                                        <Tooltip
                                            title="Call"
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
                                                icon={<PhoneFilled />}
                                                size="small"
                                                onClick={() =>
                                                    setPhoneModalVisible(true)
                                                }
                                            />
                                        </Tooltip>
                                        <Tooltip
                                            title="Email"
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
                                                icon={<MailFilled />}
                                                size="small"
                                                onClick={() =>
                                                    setEmailModalVisible(true)
                                                }
                                            />
                                        </Tooltip>
                                        <Tooltip
                                            title="Message"
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
                                                icon={<MessageOutlined />}
                                                size="small"
                                                onClick={() =>
                                                    setMessengerModalVisible(
                                                        true,
                                                    )
                                                }
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
                            </Card>

                            {/* Event Tags */}
                            <Card title="Event Tags" className="tags-card">
                                <div className="event-tags-detailed">
                                    {event.tags.map((tag) => (
                                        <Tag
                                            key={tag}
                                            className="event-tag-detailed"
                                        >
                                            {tag}
                                        </Tag>
                                    ))}
                                </div>
                            </Card>

                            <Card
                                title="Safety & Guidelines"
                                className="safety-card"
                                extra={
                                    <Tooltip
                                        title="All safety measures are strictly enforced"
                                        trigger={
                                            isTouchDevice ? [] : ["hover"]
                                        }
                                        open={
                                            isTouchDevice ? false : undefined
                                        }
                                    >
                                        <SafetyCertificateOutlined
                                            style={{
                                                color: "var(--success, #22c55e)",
                                                fontSize: "16px",
                                            }}
                                        />
                                    </Tooltip>
                                }
                            >
                                <Space
                                    direction="vertical"
                                    size="middle"
                                    style={{ width: "100%" }}
                                >
                                    {/* Health & Hygiene */}
                                    <div className="guideline-category">
                                        <div className="category-header">
                                            <HeartOutlined
                                                style={{
                                                    color: "var(--danger, #ef4444)",
                                                }}
                                            />
                                            <Text strong>Health & Hygiene</Text>
                                        </div>
                                        <div className="guideline-item">
                                            <CheckCircleOutlined
                                                style={{
                                                    color: "var(--success, #22c55e)",
                                                }}
                                            />
                                            <Text>
                                                Hand sanitizing stations
                                                throughout venue
                                            </Text>
                                        </div>
                                        <div className="guideline-item">
                                            <CheckCircleOutlined
                                                style={{
                                                    color: "var(--success, #22c55e)",
                                                }}
                                            />
                                            <Text>
                                                Enhanced cleaning between
                                                sessions
                                            </Text>
                                        </div>
                                        <div className="guideline-item">
                                            <CheckCircleOutlined
                                                style={{
                                                    color: "var(--success, #22c55e)",
                                                }}
                                            />
                                            <Text>
                                                Medical staff and first aid
                                                available
                                            </Text>
                                        </div>
                                    </div>

                                    {/* Security */}
                                    <div className="guideline-category">
                                        <div className="category-header">
                                            <SafetyCertificateOutlined
                                                style={{
                                                    color: "var(--accent, #4f46e5)",
                                                }}
                                            />
                                            <Text strong>
                                                Security & Safety
                                            </Text>
                                        </div>
                                        <div className="guideline-item">
                                            <CheckCircleOutlined
                                                style={{
                                                    color: "var(--success, #22c55e)",
                                                }}
                                            />
                                            <Text>
                                                Professional security personnel
                                                on duty
                                            </Text>
                                        </div>
                                        <div className="guideline-item">
                                            <CheckCircleOutlined
                                                style={{
                                                    color: "var(--success, #22c55e)",
                                                }}
                                            />
                                            <Text>
                                                Bag checks and metal detection
                                                at entrance
                                            </Text>
                                        </div>
                                        <div className="guideline-item">
                                            <CheckCircleOutlined
                                                style={{
                                                    color: "var(--success, #22c55e)",
                                                }}
                                            />
                                            <Text>
                                                Emergency evacuation procedures
                                                in place
                                            </Text>
                                        </div>
                                    </div>

                                    {/* Additional Notes */}
                                    <Alert
                                        message="Important Notice"
                                        description="By attending this event, you agree to comply with all safety guidelines."
                                        type="warning"
                                        showIcon
                                        closable
                                    />
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* Contact Modals */}
                <Modal
                    title={
                        <Space>
                            <PhoneFilled
                                style={{
                                    color: "var(--accent, #4f46e5)",
                                    fontSize: "20px",
                                }}
                            />
                            <span>Contact via Phone</span>
                        </Space>
                    }
                    open={phoneModalVisible}
                    onCancel={() => setPhoneModalVisible(false)}
                    footer={[
                        <Button
                            key="close"
                            onClick={() => setPhoneModalVisible(false)}
                        >
                            Close
                        </Button>,
                        <Button
                            key="call"
                            type="primary"
                            icon={<PhoneOutlined />}
                            href={`tel:${contactInfo.phone}`}
                        >
                            Call Now
                        </Button>,
                    ]}
                >
                    <div style={{ padding: "20px 0" }}>
                        <Space
                            direction="vertical"
                            size="large"
                            style={{ width: "100%" }}
                        >
                            <div>
                                <Text type="secondary">Contact Person</Text>
                                <Title level={4} style={{ margin: "8px 0" }}>
                                    {contactInfo.title}
                                </Title>
                            </div>
                            <div>
                                <Text type="secondary">Phone Number</Text>
                                <Title
                                    level={3}
                                    style={{
                                        margin: "8px 0",
                                        color: "var(--accent, #4f46e5)",
                                    }}
                                >
                                    {contactInfo.phone}
                                </Title>
                            </div>
                            <Alert
                                message="Available Hours"
                                description="Monday - Friday: 8:00 AM - 5:00 PM"
                                type="info"
                                showIcon
                                icon={<ClockCircleOutlined />}
                            />
                        </Space>
                    </div>
                </Modal>

                <Modal
                    title={
                        <Space>
                            <MailFilled
                                style={{
                                    color: "var(--success, #22c55e)",
                                    fontSize: "20px",
                                }}
                            />
                            <span>Contact via Email</span>
                        </Space>
                    }
                    open={emailModalVisible}
                    onCancel={() => setEmailModalVisible(false)}
                    footer={[
                        <Button
                            key="copy"
                            icon={<CopyOutlined />}
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    contactInfo.email,
                                );
                                message.success("Email copied to clipboard!");
                            }}
                        >
                            Copy Email
                        </Button>,
                        <Button
                            key="close"
                            onClick={() => setEmailModalVisible(false)}
                        >
                            Close
                        </Button>,
                        <Button
                            key="email"
                            type="primary"
                            icon={<MailFilled />}
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contactInfo.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Send Email
                        </Button>,
                    ]}
                >
                    <div style={{ padding: "20px 0" }}>
                        <Space
                            direction="vertical"
                            size="large"
                            style={{ width: "100%" }}
                        >
                            <div>
                                <Text type="secondary">Contact Person</Text>
                                <Title level={4} style={{ margin: "8px 0" }}>
                                    {contactInfo.title}
                                </Title>
                            </div>
                            <div>
                                <Text type="secondary">Email Address</Text>
                                <Title
                                    level={4}
                                    style={{
                                        margin: "8px 0",
                                        color: "var(--success, #22c55e)",
                                    }}
                                >
                                    {contactInfo.email}
                                </Title>
                            </div>
                            <Alert
                                message="Response Time"
                                description="We typically respond within 24-48 hours during business days."
                                type="success"
                                showIcon
                                icon={<InfoCircleOutlined />}
                            />
                        </Space>
                    </div>
                </Modal>

                <Modal
                    title={
                        <Space>
                            <MessageOutlined
                                style={{ color: "#0084ff", fontSize: "20px" }}
                            />
                            <span>Contact Via Messages</span>
                        </Space>
                    }
                    open={messengerModalVisible}
                    onCancel={() => setMessengerModalVisible(false)}
                    footer={[
                        <Button
                            key="close"
                            onClick={() => setMessengerModalVisible(false)}
                        >
                            Close
                        </Button>,
                        <Button
                            key="messenger"
                            type="primary"
                            size="large"
                            icon={<MessageOutlined />}
                            onClick={() => {
                                // Navigate to messages page
                                window.location.href = "/messages";
                            }}
                        >
                            Open Messages
                        </Button>,
                    ]}
                >
                    <div style={{ padding: "20px 0" }}>
                        <Space
                            direction="vertical"
                            size="large"
                            style={{ width: "100%" }}
                        >
                            <div>
                                <Text type="secondary">Contact Person</Text>
                                <Title level={4} style={{ margin: "8px 0" }}>
                                    Guidance Counselor
                                </Title>
                            </div>
                            <div>
                                <Text type="secondary">Messages</Text>
                                <Paragraph style={{ margin: "8px 0" }}>
                                    Click the button below to start a
                                    conversation on Messages.
                                </Paragraph>
                            </div>
                            <Alert
                                message="Instant Messaging"
                                description="Get quick responses to your inquiries through Messages during office hours."
                                type="info"
                                showIcon
                                icon={<MessageOutlined />}
                            />
                        </Space>
                    </div>
                </Modal>
            </Modal>

            <RegistrationsModal
                event={event}
                visible={registrationsModalVisible}
                onClose={() => setRegistrationsModalVisible(false)}
            />
        </>
    );
};

const EventCard = ({ event, showEventDetails, onEdit, onDelete }) => {
    const isTouchDevice = useIsTouchDevice();
    const role = secureLocalStorage.getItem("userRole");
    const [registrationsModalVisible, setRegistrationsModalVisible] =
        useState(false);

    const handleMenuClick = ({ key }) => {
        if (key === "delete") {
            Modal.confirm({
                title: "Delete Event",
                icon: <ExclamationCircleOutlined />,
                content:
                    "Are you sure you want to delete this event? This action cannot be undone.",
                okText: "Yes, Delete",
                okType: "danger",
                cancelText: "Cancel",
                onOk() {
                    onDelete(event);
                },
            });
        } else if (key === "edit") {
            if (event.status === "ongoing" || event.status === "completed") {
                message.warning("Cannot edit ongoing or completed events");
                return;
            }
            onEdit(event);
        } else if (key === "registrations") {
            setRegistrationsModalVisible(true);
        }
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                disabled={
                    event.status === "ongoing" || event.status === "completed"
                }
            >
                Edit Event
            </Menu.Item>
            <Menu.Item key="registrations" icon={<UsergroupAddOutlined />}>
                View Registrations
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
                Delete Event
            </Menu.Item>
        </Menu>
    );

    const registeredCount = event.registered_count || event.registered || 0;
    const capacity = event.capacity || 0;

    return (
        <>
            <Badge.Ribbon
                text="Featured"
                color="red"
                style={{ display: event.featured ? "block" : "none" }}
            >
                <Card
                    className={`event-card ${event.featured ? "has-featured" : ""}`}
                    cover={(() => {
                        const imageUrls =
                            event.image_urls?.filter(Boolean) || [];
                        return (
                            <div className="event-cover">
                                {imageUrls.length === 0 ? (
                                    <div className="event-cover-placeholder">
                                        <CalendarOutlined
                                            style={{
                                                fontSize: 40,
                                                color: "#adb5bd",
                                            }}
                                        />
                                    </div>
                                ) : imageUrls.length === 1 ? (
                                    <img
                                        alt={event.title}
                                        src={imageUrls[0]}
                                        className="event-cover-img"
                                        loading="lazy"
                                    />
                                ) : (
                                    <Carousel
                                        autoplay
                                        dots={false}
                                        effect="fade"
                                        autoplaySpeed={3000}
                                        className="event-card-carousel"
                                    >
                                        {imageUrls.map((img, i) => (
                                            <div
                                                key={i}
                                                className="event-card-carousel-slide"
                                            >
                                                <img
                                                    alt={`${event.title} - ${i + 1}`}
                                                    src={img}
                                                    className="event-cover-img"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ))}
                                    </Carousel>
                                )}
                                <div className="event-cover-overlay" />
                                <div className="event-status-badge">
                                    {getStatusTag(event.status)}
                                </div>
                            </div>
                        );
                    })()}
                    actions={[
                        <Tooltip
                            title="View Details"
                            key="view"
                            trigger={isTouchDevice ? [] : ["hover"]}
                            open={isTouchDevice ? false : undefined}
                        >
                            <EyeOutlined
                                onClick={() => showEventDetails(event)}
                            />
                        </Tooltip>,
                        ...(role === "admin"
                            ? [
                                  <Tooltip
                                      title={`${registeredCount} Registered`}
                                      key="registrations"
                                      trigger={
                                          isTouchDevice ? [] : ["hover"]
                                      }
                                      open={
                                          isTouchDevice ? false : undefined
                                      }
                                  >
                                      <Badge
                                          count={registeredCount}
                                          size="small"
                                          offset={[5, 0]}
                                      >
                                          <UsergroupAddOutlined
                                              onClick={() =>
                                                  setRegistrationsModalVisible(
                                                      true,
                                                  )
                                              }
                                          />
                                      </Badge>
                                  </Tooltip>,
                                  <Dropdown
                                      overlay={menu}
                                      trigger={["click"]}
                                      key="more"
                                  >
                                      <MoreOutlined />
                                  </Dropdown>,
                              ]
                            : []),
                    ]}
                >
                    <div className="event-card-content">
                        <div className="event-header">
                            <Title level={4} className="event-title">
                                {event.title}
                            </Title>
                        </div>

                        <Paragraph
                            ellipsis={{ rows: 2 }}
                            className="event-description"
                        >
                            {event.description}
                        </Paragraph>

                        <div className="event-organizer">
                            <Avatar size="large" src="/images/avatar.jpg" />
                            <Text type="secondary">
                                Hosted by {event.organizer}
                            </Text>
                        </div>

                        <Divider />

                        <div style={{ marginBottom: 12 }}>
                            <Space size={4} wrap>
                                <Tag
                                    color={
                                        getEventTypeConfig(
                                            event.eventType || event.event_type,
                                        ).color
                                    }
                                    style={{ fontSize: 10 }}
                                >
                                    {
                                        getEventTypeConfig(
                                            event.eventType || event.event_type,
                                        ).label
                                    }
                                </Tag>

                                <Tag color="blue" style={{ fontSize: 10 }}>
                                    {getCategoryLabel(event.category)}
                                </Tag>
                            </Space>
                        </div>

                        <div className="event-details">
                            <div className="detail-item">
                                <CalendarOutlined />
                                <Text>
                                    {moment(event.date).format("MMM DD, YYYY")}
                                </Text>
                            </div>
                            <div className="detail-item">
                                <ClockCircleOutlined />
                                <Text>
                                    {moment(event.start_time, "HH:mm").format(
                                        "hh:mm A",
                                    )}{" "}
                                    -
                                    {moment(event.end_time, "HH:mm").format(
                                        "hh:mm A",
                                    )}
                                </Text>
                            </div>
                            <div className="detail-item">
                                <EnvironmentOutlined />
                                <Text ellipsis={{ tooltip: event.location }}>
                                    {event.location}
                                </Text>
                            </div>
                            <div className="detail-item">
                                <TeamOutlined />
                                <Text>
                                    {registeredCount} / {capacity} registered
                                </Text>
                            </div>
                        </div>

                        <div style={{ marginTop: 12, marginBottom: 12 }}>
                            <Progress
                                percent={Math.round(
                                    (registeredCount / capacity) * 100,
                                )}
                                size="small"
                                status={
                                    registeredCount >= capacity
                                        ? "exception"
                                        : "active"
                                }
                                showInfo={false}
                            />
                        </div>

                        <div className="event-pricing">
                            <Text strong className="regular-price">
                                {Number.parseFloat(event.price) === 0
                                    ? "FREE"
                                    : `₱${Number(event.price).toLocaleString()}`}
                            </Text>
                        </div>

                        <div className="event-tags">
                            {event.tags.map((tag) => (
                                <Tag key={tag} className="event-tag">
                                    {tag}
                                </Tag>
                            ))}
                        </div>
                    </div>
                </Card>
            </Badge.Ribbon>

            <RegistrationsModal
                event={event}
                visible={registrationsModalVisible}
                onClose={() => setRegistrationsModalVisible(false)}
            />
        </>
    );
};

const getStatusTag = (status) => {
    const statusConfig = {
        upcoming: {
            color: "blue",
            text: "Upcoming",
            icon: <ClockCircleOutlined />,
        },
        ongoing: {
            color: "green",
            text: "Live Now",
            icon: <CheckCircleOutlined />,
        },
        completed: {
            color: "default",
            text: "Completed",
            icon: <CheckCircleOutlined />,
        },
        cancelled: {
            color: "red",
            text: "Cancelled",
            icon: <DeleteOutlined />,
        },
    };
    const config = statusConfig[status] || { color: "default", text: status };
    return (
        <Tag color={config.color} icon={config.icon}>
            {config.text}
        </Tag>
    );
};

const normalizeTime = (t) => {
    if (!t) return null;
    // Parse both 12-hour (h:mm A) and 24-hour (HH:mm:ss) formats
    const parsed = dayjs(
        t,
        ["h:mm A", "hh:mm A", "H:mm", "HH:mm", "HH:mm:ss"],
        true,
    );
    if (!parsed.isValid()) {
        console.warn("Invalid time format:", t);
        return null;
    }
    return parsed.format("HH:mm"); // Return in 24-hour format for consistent parsing
};

const computeEventStatus = (event) => {
    const now = dayjs();

    const startTime = normalizeTime(event.start_time);
    const endTime = normalizeTime(event.end_time);

    if (!startTime || !endTime) {
        console.warn("Missing time data:", event);
        return "upcoming";
    }

    // Parse date and combine with time in 24-hour format
    const eventDate = dayjs(event.date).format("YYYY-MM-DD");
    const start = dayjs(`${eventDate} ${startTime}`, "YYYY-MM-DD HH:mm");
    const end = dayjs(`${eventDate} ${endTime}`, "YYYY-MM-DD HH:mm");

    // Debug logging
    // console.log("Event Status Calculation:", {
    //   title: event.title,
    //   date: event.date,
    //   eventDate,
    //   startTime: event.start_time,
    //   endTime: event.end_time,
    //   normalizedStart: startTime,
    //   normalizedEnd: endTime,
    //   parsedStart: start.format("YYYY-MM-DD HH:mm"),
    //   parsedEnd: end.format("YYYY-MM-DD HH:mm"),
    //   currentTime: now.format("YYYY-MM-DD HH:mm"),
    //   isStartValid: start.isValid(),
    //   isEndValid: end.isValid(),
    //   isBeforeStart: now.isBefore(start),
    //   isBetween: now.isBetween(start, end, null, "[]"),
    //   isAfterEnd: now.isAfter(end),
    // })

    if (!start.isValid() || !end.isValid()) {
        console.warn("Invalid event date/time:", event);
        return "upcoming";
    }

    if (now.isBefore(start)) return "upcoming";
    if (now.isBetween(start, end, null, "[]")) return "ongoing";
    return "completed";
};

const AlumniEvents = () => {
    const {
        isLoading,
        data: rawEvents = [],
        isFetching,
        refetch: fetchEvents,
    } = useEvents();

    const [now, setNow] = useState(dayjs());
    useEffect(() => {
        const interval = setInterval(() => setNow(dayjs()), 60000);
        return () => clearInterval(interval);
    }, []);

    const events = useMemo(() => {
        return rawEvents.map((e) => ({
            ...e,
            status: computeEventStatus(e),
        }));
    }, [rawEvents, now]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchEvents(); // Refresh events from server
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, [fetchEvents]);

    //const [events, setEvents] = useState(initialEvents);
    const [viewMode, setViewMode] = useState("grid");
    const [activeTab, setActiveTab] = useState("all");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const role = secureLocalStorage.getItem("userRole");
    const [fileList, setFileList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false); // Drives "Saving..." state for Create/Update Event
    const [isValidationModalVisible, setIsValidationModalVisible] =
        useState(false);
    const [validationErrors, setValidationErrors] = useState([]);

    // ===== Draft Auto-Save state (additive) =====
    const [isDraftPromptVisible, setIsDraftPromptVisible] = useState(false);
    const [isDiscardConfirmVisible, setIsDiscardConfirmVisible] =
        useState(false);
    const [draftLastSaved, setDraftLastSaved] = useState(null);
    const draftSaveTimer = useRef(null);
    const isRestoringDraftRef = useRef(false);
    const fileListRef = useRef([]);

    const selectedDate = Form.useWatch("date", form);

    // Trigger re-render every minute for real-time disabling

    useEffect(() => {
        const interval = setInterval(() => setNow(dayjs()), 60000);
        return () => clearInterval(interval);
    }, []);

    const disabledTime = () => {
        if (!selectedDate) return {};

        if (dayjs(selectedDate).isSame(now, "day")) {
            const disabledHours = [];
            for (let i = 0; i < now.hour(); i++) disabledHours.push(i);

            const disabledMinutes = (hour) =>
                hour === now.hour()
                    ? Array.from({ length: now.minute() }, (_, i) => i)
                    : [];

            return { disabledHours: () => disabledHours, disabledMinutes };
        }

        return {};
    };

    // Filter states
    const [filters, setFilters] = useState({
        search: "",
        eventType: "all",
        category: "all",
        status: "all",
        priceRange: "all",
        featured: "all",
        dateRange: null,
    });

    const [sortBy, setSortBy] = useState("date-asc");

    useEffect(() => {
        const interval = setInterval(() => {
            fetchEvents();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [fetchEvents]);

    const showEventDetails = (event) => {
        // console.log({ event })
        setSelectedEvent(event);
        setIsDetailModalVisible(true);
    };

    const handleCloseDetails = () => {
        setIsDetailModalVisible(false);
        setSelectedEvent(null);
    };

    const handleDeleteEvent = async (event) => {
        try {
            const response = await axiosConfig.delete(`/events/${event.id}`);

            if (response.data.success) {
                message.success("Event deleted successfully!");
                setIsDetailModalVisible(false);
                setSelectedEvent(null);
                fetchEvents();
            }
        } catch (error) {
            message.error("Failed to delete event");
            console.error("Event deletion error:", error);
        }
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setIsDetailModalVisible(false);
        setIsModalVisible(true);

        const existingImages =
            event.image_urls?.map((url, index) => ({
                uid: `existing-${index}`,
                name: `Image ${index + 1}`,
                status: "done",
                url: url,
                thumbUrl: url,
            })) || [];

        setFileList(existingImages);

        // Pre-fill the form with event data for editing
        // NOTE: DatePicker and TimePicker (Ant Design v5) require dayjs objects,
        // NOT moment objects. Passing moment() here caused auto-scroll / auto-
        // navigation bugs in the pickers without the user clicking anything.
        form.setFieldsValue({
            title: event.title,
            description: event.description,
            event_type: event.event_type || event.eventType,
            category: event.category,
            date: dayjs(event.date),
            timeRange: [
                dayjs(event.start_time || event.startTime, "HH:mm"),
                dayjs(event.end_time || event.endTime, "HH:mm"),
            ],
            location: event.location,
            price: event.price,
            capacity: event.capacity,
            organizer: event.organizer,
            contact_number: event.contact_number,
            contact_email: event.contact_email,
            tags: event.tags,
            agenda:
                typeof event.agenda === "string"
                    ? event.agenda
                    : event.agenda?.join("\n"),
            featured: event.featured || false,
            earlyBirdPrice: event.earlyBirdPrice,
            earlyBirdEndDate: event.earlyBirdEndDate
                ? dayjs(event.earlyBirdEndDate)
                : null,
        });
    };

    // Filter and sort events
    const filteredAndSortedEvents = useMemo(() => {
        const filtered = events
            .filter((event) => {
                if (activeTab === "featured") {
                    // Featured tab - only show featured events
                    if (!event.featured) return false;
                } else if (activeTab !== "all") {
                    // Status tabs (upcoming, ongoing, completed) - filter by status
                    if (event.status !== activeTab) return false;
                }

                // Search filter
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    return (
                        event.title.toLowerCase().includes(searchLower) ||
                        event.description.toLowerCase().includes(searchLower) ||
                        event.location.toLowerCase().includes(searchLower) ||
                        event.organizer.toLowerCase().includes(searchLower) ||
                        (event.tags &&
                            event.tags.some((tag) =>
                                tag.toLowerCase().includes(searchLower),
                            )) // Added check for event.tags
                    );
                }

                return true;
            })
            .filter((event) => {
                // Event type filter
                if (
                    filters.eventType !== "all" &&
                    (event.eventType || event.event_type) !== filters.eventType
                ) {
                    return false;
                }

                // Category filter
                if (
                    filters.category !== "all" &&
                    event.category !== filters.category
                ) {
                    return false;
                }

                // Status filter
                if (
                    filters.status !== "all" &&
                    event.status !== filters.status
                ) {
                    return false;
                }

                // Price range filter
                if (filters.priceRange !== "all") {
                    switch (filters.priceRange) {
                        case "free":
                            if (event.price !== 0) return false;
                            break;
                        case "0-50":
                            if (event.price === 0 || event.price > 50)
                                return false;
                            break;
                        case "50-100":
                            if (event.price < 50 || event.price > 100)
                                return false;
                            break;
                        case "100-200":
                            if (event.price < 100 || event.price > 200)
                                return false;
                            break;
                        case "200+":
                            if (event.price < 200) return false;
                            break;
                        default:
                            break;
                    }
                }

                // Featured filter
                if (filters.featured !== "all") {
                    const isFeatured = filters.featured === "featured";
                    if (event.featured !== isFeatured) return false;
                }

                // Date range filter
                // Date range filter
                if (filters.dateRange && filters.dateRange.length === 2) {
                    const eventDate = moment(event.date || event.event_date);
                    const startDate = filters.dateRange[0];
                    const endDate = filters.dateRange[1];

                    if (!eventDate.isBetween(startDate, endDate, "day", "[]")) {
                        return false;
                    }
                }

                return true;
            });

        // Sort events
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "date-asc":
                    return moment(a.date).diff(moment(b.date));
                case "date-desc":
                    return moment(b.date).diff(moment(a.date));
                case "price-asc":
                    return a.price - b.price;
                case "price-desc":
                    return b.price - a.price;
                case "rating-desc":
                    return b.rating - a.rating;
                case "popularity":
                    return b.registered - a.registered;
                case "title-asc":
                    return a.title.localeCompare(b.title);
                case "capacity":
                    return (
                        a.capacity - a.registered - (b.capacity - b.registered)
                    );
                default:
                    return 0;
            }
        });

        return filtered;
    }, [events, activeTab, filters, sortBy]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const clearAllFilters = () => {
        setFilters({
            search: "",
            eventType: "all",
            category: "all",
            status: "all",
            priceRange: "all",
            featured: "all",
            dateRange: null,
        });
    };

    // ===== Draft Auto-Save: serialization helpers =====
    const serializeDraftValues = (values = {}) => {
        const v = { ...values };
        if (v.date) v.date = moment(v.date).toISOString();
        if (
            v.timeRange &&
            v.timeRange.length === 2 &&
            v.timeRange[0] &&
            v.timeRange[1]
        ) {
            v.timeRange = [
                moment(v.timeRange[0]).format("HH:mm"),
                moment(v.timeRange[1]).format("HH:mm"),
            ];
        }
        if (v.earlyBirdEndDate)
            v.earlyBirdEndDate = moment(v.earlyBirdEndDate).toISOString();
        return v;
    };

    const buildDraftFileList = async (list = []) => {
        const out = [];
        for (const f of list) {
            try {
                if (f.originFileObj) {
                    const b64 = await draftFileToBase64(f.originFileObj);
                    out.push({
                        uid: f.uid,
                        name: f.name,
                        status: "done",
                        url: b64,
                        thumbUrl: b64,
                        __draftFile: true,
                    });
                } else if (f.url) {
                    // Existing/already-uploaded image (e.g. while editing) — keep its URL.
                    out.push({
                        uid: f.uid,
                        name: f.name,
                        status: "done",
                        url: f.url,
                        thumbUrl: f.thumbUrl || f.url,
                    });
                }
            } catch (err) {
                console.error("Failed to serialize draft file:", err);
            }
        }
        return out;
    };

    const persistEventDraft = async (values, list) => {
        try {
            const draft = {
                values: serializeDraftValues(values || {}),
                fileList: await buildDraftFileList(list || []),
                savedAt: new Date().toISOString(),
            };
            secureLocalStorage.setItem(EVENT_DRAFT_STORAGE_KEY, draft);
            setDraftLastSaved(moment(draft.savedAt).format("HH:mm:ss"));
        } catch (err) {
            console.error("Failed to save event draft:", err);
        }
    };

    const clearEventDraft = () => {
        try {
            secureLocalStorage.removeItem(EVENT_DRAFT_STORAGE_KEY);
        } catch (err) {
            console.error("Failed to clear event draft:", err);
        }
        setDraftLastSaved(null);
    };

    // Determine if the create form holds any user-entered data.
    const isCreateFormDirty = () => {
        const v = form.getFieldsValue();
        const hasFieldValues = Object.keys(v || {}).some((key) => {
            const val = v[key];
            if (val === undefined || val === null) return false;
            if (typeof val === "boolean") return false; // e.g. featured default
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === "string") return val.trim() !== "";
            return true;
        });
        return (
            hasFieldValues ||
            (fileListRef.current && fileListRef.current.length > 0)
        );
    };

    // Debounced auto-save whenever the create form changes.
    const handleFormValuesChange = () => {
        if (selectedEvent) return; // drafts are only for creating new events
        if (isRestoringDraftRef.current) return;
        if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
        draftSaveTimer.current = setTimeout(() => {
            persistEventDraft(form.getFieldsValue(), fileListRef.current);
        }, 700);
    };

    const restoreEventDraft = async () => {
        try {
            const draft = secureLocalStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
            if (!draft) return;
            isRestoringDraftRef.current = true;

            const v = { ...(draft.values || {}) };
            if (v.date) v.date = moment(v.date);
            if (v.timeRange && v.timeRange.length === 2) {
                v.timeRange = [
                    moment(v.timeRange[0], "HH:mm"),
                    moment(v.timeRange[1], "HH:mm"),
                ];
            }
            if (v.earlyBirdEndDate)
                v.earlyBirdEndDate = moment(v.earlyBirdEndDate);
            form.setFieldsValue(v);

            const restoredList = (draft.fileList || []).map((f) => {
                if (f.__draftFile && f.url) {
                    const file = draftDataURLtoFile(f.url, f.name);
                    return {
                        uid: f.uid,
                        name: f.name,
                        status: "done",
                        url: f.url,
                        thumbUrl: f.thumbUrl || f.url,
                        originFileObj: file,
                    };
                }
                return {
                    uid: f.uid,
                    name: f.name,
                    status: "done",
                    url: f.url,
                    thumbUrl: f.thumbUrl || f.url,
                };
            });
            setFileList(restoredList);
            fileListRef.current = restoredList;

            if (draft.savedAt)
                setDraftLastSaved(moment(draft.savedAt).format("HH:mm:ss"));
            setTimeout(() => {
                isRestoringDraftRef.current = false;
            }, 0);
        } catch (err) {
            console.error("Failed to restore event draft:", err);
            isRestoringDraftRef.current = false;
        }
    };

    // Performs the actual modal close/reset (original handleCancel behavior).
    const performCreateModalClose = () => {
        setIsModalVisible(false);
        form.resetFields();
        setSelectedEvent(null);
        setFileList([]);
        fileListRef.current = [];
        setValidationErrors([]); // Clear validation errors on cancel
        setIsValidationModalVisible(false); // Close validation modal if open
    };

    const showCreateModal = () => {
        setIsModalVisible(true);
        setCurrentStep(0);
        setSelectedEvent(null);
        form.resetFields();
        setFileList([]);
        fileListRef.current = [];
        setValidationErrors([]); // Clear previous validation errors
        setIsValidationModalVisible(false); // Close validation modal if open
        // Draft Restore Prompt: if a saved draft exists, ask the user.
        try {
            const existingDraft = secureLocalStorage.getItem(
                EVENT_DRAFT_STORAGE_KEY,
            );
            if (existingDraft) {
                setIsDraftPromptVisible(true);
            } else {
                setDraftLastSaved(null);
            }
        } catch (err) {
            console.error("Failed to read event draft:", err);
        }
    };

    const handleContinueDraft = () => {
        setIsDraftPromptVisible(false);
        restoreEventDraft();
    };

    const handleStartNewDraft = () => {
        clearEventDraft();
        form.resetFields();
        setFileList([]);
        fileListRef.current = [];
        setIsDraftPromptVisible(false);
    };

    // Smart Close Confirmation
    const handleCancel = () => {
        // Only guard new-event creation; editing keeps original behavior.
        if (!selectedEvent && isCreateFormDirty()) {
            setIsDiscardConfirmVisible(true);
            return;
        }
        performCreateModalClose();
    };

    const handleContinueEditing = () => {
        setIsDiscardConfirmVisible(false);
    };

    const handleDiscardChanges = () => {
        clearEventDraft();
        setIsDiscardConfirmVisible(false);
        performCreateModalClose();
    };

    // Unsaved Changes Protection: warn before refresh/tab close.
    useEffect(() => {
        const beforeUnloadHandler = (e) => {
            if (isModalVisible && !selectedEvent && isCreateFormDirty()) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes.";
                return "You have unsaved changes.";
            }
        };
        window.addEventListener("beforeunload", beforeUnloadHandler);
        return () =>
            window.removeEventListener("beforeunload", beforeUnloadHandler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalVisible, selectedEvent]);

    const handleFormSubmit = async () => {
        if (isSubmitting) return; // Prevent double-submit while a save is already in progress
        try {
            const values = await form.validateFields();
            // If validation passes, call the original create event handler
            handleCreateEvent(values);
        } catch (errorInfo) {
            // Extract error messages from validation
            const errors =
                errorInfo.errorFields?.map((field) => field.errors[0]) || [];
            setValidationErrors(errors);
            setIsValidationModalVisible(true);
        }
    };

    const handleCreateEvent = async (values) => {
        setIsSubmitting(true); // Saving...
        try {
            const formData = new FormData();

            formData.append("title", values.title);
            formData.append("description", values.description);
            formData.append("event_type", values.event_type);
            formData.append("category", values.category);
            formData.append("date", values.date.format("YYYY-MM-DD"));
            formData.append(
                "timeRange[0]",
                values.timeRange[0].format("HH:mm"),
            );
            formData.append(
                "timeRange[1]",
                values.timeRange[1].format("HH:mm"),
            );
            formData.append("location", values.location);
            formData.append("price", values.price || 0);
            formData.append("capacity", values.capacity);
            formData.append("organizer", values.organizer);
            formData.append("contact_number", values.contact_number || "");
            formData.append("contact_email", values.contact_email || "");
            formData.append("agenda", values.agenda || "");
            formData.append("earlyBirdPrice", values.earlyBirdPrice || 0);
            if (values.earlyBirdEndDate) {
                formData.append(
                    "earlyBirdEndDate",
                    values.earlyBirdEndDate.format("YYYY-MM-DD"),
                );
            }

            // ⭐ THE IMPORTANT PART ⭐
            formData.append("featured", values.featured ? 1 : 0);

            // Handle tags
            if (values.tags && values.tags.length > 0) {
                values.tags.forEach((tag, index) => {
                    formData.append(`tags[${index}]`, tag);
                });
            }

            // When editing, tell the backend which existing images to KEEP.
            // Any existing image the user removed will NOT appear in this list,
            // so the backend will drop it from the stored paths.
            if (selectedEvent) {
                fileList.forEach((file) => {
                    if (!file.originFileObj && file.url) {
                        formData.append(`existing_images[]`, file.url);
                    }
                });
            }

            // Handle new uploaded images
            fileList.forEach((file, index) => {
                if (file.originFileObj) {
                    // New file being uploaded
                    formData.append(`images[]`, file.originFileObj);
                }
            });

            const isEditing = !!selectedEvent;
            let response;
            if (isEditing) {
                // Update existing event
                response = await axiosConfig.post(
                    `/events/${selectedEvent.id}?_method=PUT`,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    },
                );
            } else {
                // Create new event
                response = await axiosConfig.post("/events", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            if (response.data.success) {
                // Distinct, explicit confirmation for create vs. update
                const defaultMessage = isEditing
                    ? "Event updated successfully!"
                    : "Event created successfully!";
                message.success(response.data.message || defaultMessage);

                setIsModalVisible(false);
                form.resetFields();
                setFileList([]);
                fileListRef.current = [];
                setSelectedEvent(null);
                clearEventDraft(); // Auto-clear draft after successful event creation
                fetchEvents(); // Refresh event list so the new/updated event displays immediately
            }
        } catch (error) {
            console.error("Error creating/updating event:", error);
            message.error(
                error.response?.data?.message || "Failed to save event",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRegistrationProgress = (registered, capacity) => {
        return (registered / capacity) * 100;
    };

    const stats = {
        total: events.length,
        upcoming: events.filter((e) => e.status === "upcoming").length,
        ongoing: events.filter((e) => e.status === "ongoing").length,
        completed: events.filter((e) => e.status === "completed").length,
        featured: events.filter((e) => e.featured).length,
        totalRegistrations: events.reduce(
            (sum, event) => sum + event.registered,
            0,
        ),
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        fileListRef.current = newFileList;
        // Save uploaded banner/poster immediately after upload (drafts only on create).
        if (!selectedEvent && !isRestoringDraftRef.current) {
            persistEventDraft(form.getFieldsValue(), newFileList);
        }
    };

    const handleBeforeUpload = (file) => {
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
    };

    return (
        <Layout>
            <div className="alumni-events-container">
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
                                    icon={<CalendarOutlined />}
                                >
                                    EVENTS HUB
                                </Tag>
                                <Text className="ae-hero__eyebrow">
                                    Alumni Tracing Management System
                                </Text>
                            </div>
                        </div>

                        <Title className="ae-hero__title">
                            Alumni Events &amp;{" "}
                            <span className="grad-text">Networking</span>
                        </Title>

                        <Paragraph className="ae-hero__lead">
                            {role === "admin"
                                ? "Manage alumni events, oversee registrations, and foster community engagement through reunions, networking sessions, and special gatherings."
                                : "Reconnect with alumni, register for upcoming events, or host your own. Strengthen your network through reunions, career opportunities, and community activities."}
                        </Paragraph>

                        <div className="ae-hero__stats">
                            <div className="ae-stat">
                                <span className="ae-stat__icon">
                                    <CalendarOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.total}
                                    </span>
                                    <span className="ae-stat__label">
                                        Total Events
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--blue">
                                    <ClockCircleOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.upcoming}
                                    </span>
                                    <span className="ae-stat__label">
                                        Upcoming
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--green">
                                    <CheckCircleOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.ongoing}
                                    </span>
                                    <span className="ae-stat__label">
                                        Ongoing
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--gray">
                                    <BookOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.completed}
                                    </span>
                                    <span className="ae-stat__label">
                                        Completed
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Status Tabs */}
                <Card className="tabs-card">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        className="status-tabs"
                    >
                        <TabPane
                            tab={
                                <span>
                                    <CalendarOutlined />
                                    All Events
                                    <Badge
                                        count={stats.total}
                                        style={{
                                            backgroundColor:
                                                "var(--accent, #4f46e5)",
                                            marginLeft: 8,
                                        }}
                                    />
                                </span>
                            }
                            key="all"
                        />
                        <TabPane
                            tab={
                                <span>
                                    <ClockCircleOutlined />
                                    Upcoming
                                    <Badge
                                        count={stats.upcoming}
                                        style={{
                                            backgroundColor:
                                                "var(--accent, #4f46e5)",
                                            marginLeft: 8,
                                        }}
                                    />
                                </span>
                            }
                            key="upcoming"
                        />
                        <TabPane
                            tab={
                                <span>
                                    <CheckCircleOutlined />
                                    Ongoing
                                    <Badge
                                        count={stats.ongoing}
                                        style={{
                                            backgroundColor:
                                                "var(--success, #22c55e)",
                                            marginLeft: 8,
                                        }}
                                    />
                                </span>
                            }
                            key="ongoing"
                        />
                        <TabPane
                            tab={
                                <span>
                                    <BookOutlined />
                                    Completed
                                    <Badge
                                        count={stats.completed}
                                        style={{
                                            backgroundColor: "#8c8c8c",
                                            marginLeft: 8,
                                        }}
                                    />
                                </span>
                            }
                            key="completed"
                        />
                        <TabPane
                            tab={
                                <span>
                                    <StarOutlined />
                                    Featured
                                    <Badge
                                        count={stats.featured}
                                        style={{
                                            backgroundColor:
                                                "var(--warning, #f59e0b)",
                                            marginLeft: 8,
                                        }}
                                    />
                                </span>
                            }
                            key="featured"
                        />
                    </Tabs>
                </Card>

                {/* Controls Section */}
                <Card className="controls-card">
                    <div className="controls-section">
                        <div className="controls-left">
                            <Input
                                placeholder="Search events by title, description, location..."
                                prefix={<SearchOutlined />}
                                value={filters.search}
                                onChange={(e) =>
                                    handleFilterChange("search", e.target.value)
                                }
                                style={{ width: 300 }}
                                size="large"
                            />

                            <Select
                                value={filters.eventType}
                                onChange={(value) =>
                                    handleFilterChange("eventType", value)
                                }
                                style={{ width: 180 }}
                                placeholder="Event Type"
                            >
                                {eventTypes.map((type) => (
                                    <Option key={type.value} value={type.value}>
                                        <Tag color={type.color}>
                                            {type.label}
                                        </Tag>
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                value={filters.category}
                                onChange={(value) =>
                                    handleFilterChange("category", value)
                                }
                                style={{ width: 200 }}
                                placeholder="Category"
                            >
                                {eventCategories.map((category) => (
                                    <Option
                                        key={category.value}
                                        value={category.value}
                                    >
                                        {category.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div className="controls-right">
                            {role === "admin" && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={showCreateModal}
                                    size="large"
                                >
                                    Create Event
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Events Display */}
                <div className="events-display">
                    {isLoading ? (
                        <CardSkeletonGrid
                            variant="gallery"
                            count={8}
                            columns={{ xs: 24, sm: 12, lg: 8, xl: 6 }}
                            gutter={[24, 24]}
                        />
                    ) : filteredAndSortedEvents.length === 0 ? (
                        <Card className="no-events-card">
                            <div className="no-events-content">
                                <Title level={3}>No events found</Title>
                                <Text type="secondary">
                                    {role === "admin"
                                        ? "Try adjusting your filters or create a new event to get started."
                                        : "No events found at the moment. Only administrators are authorized to create events. If you would like to request an event, please message the administrator with complete event details for review and approval, or visit the Guidance Counselor's Office for further assistance."}
                                </Text>
                                <br />
                                <Button
                                    type="primary"
                                    onClick={clearAllFilters}
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {filteredAndSortedEvents.map((event) => (
                                <Col
                                    xs={24}
                                    sm={12}
                                    lg={8}
                                    xl={6}
                                    key={event.id}
                                >
                                    <EventCard
                                        event={event}
                                        showEventDetails={(event) =>
                                            showEventDetails(event)
                                        }
                                        onEdit={handleEditEvent}
                                        onDelete={handleDeleteEvent}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>

                {/* Create/Edit Event Modal */}
                <Modal
                    title={selectedEvent ? "Edit Event" : "Create New Event"}
                    open={isModalVisible}
                    onCancel={handleCancel}
                    footer={null}
                    width={900}
                    className="create-event-modal"
                    style={{ top: 20 }}
                    maskClosable={!isSubmitting}
                    closable={!isSubmitting}
                    keyboard={!isSubmitting}
                >
                    <div className="event-form-container">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleCreateEvent}
                            onValuesChange={handleFormValuesChange}
                            className="event-form-full"
                        >
                            {/* Draft Status Indicator */}
                            {!selectedEvent && draftLastSaved && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "16px",
                                        padding: "8px 12px",
                                        background: "rgba(16, 185, 129, 0.08)",
                                        border: "1px solid rgba(16, 185, 129, 0.25)",
                                        borderRadius: "8px",
                                        width: "fit-content",
                                    }}
                                >
                                    <CheckCircleOutlined
                                        style={{
                                            color: "#10b981",
                                            fontSize: "16px",
                                        }}
                                    />
                                    <Text strong style={{ color: "#10b981" }}>
                                        Auto Saved
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: "12px" }}
                                    >
                                        Last saved: {draftLastSaved}
                                    </Text>
                                </div>
                            )}
                            <div className="form-sections">
                                {/* Basic Info Section */}
                                <div className="form-section">
                                    <div className="section-header">
                                        <h3>Basic Information</h3>
                                        <div className="section-divider"></div>
                                    </div>
                                    <div className="section-content">
                                        <Form.Item
                                            name="title"
                                            label="Event Title"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter event title",
                                                },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter a compelling event title"
                                                className="form-input"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="description"
                                            label="Event Description"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter event description",
                                                },
                                            ]}
                                        >
                                            <TextArea
                                                rows={4}
                                                placeholder="Describe your event in detail. What will attendees experience?"
                                                className="form-textarea"
                                            />
                                        </Form.Item>

                                        <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="event_type"
                                                    label="Event Type"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please select event type",
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        size="large"
                                                        placeholder="Select event type"
                                                    >
                                                        {eventTypes
                                                            .filter(
                                                                (et) =>
                                                                    et.value !==
                                                                    "all",
                                                            )
                                                            .map((type) => (
                                                                <Option
                                                                    key={
                                                                        type.value
                                                                    }
                                                                    value={
                                                                        type.value
                                                                    }
                                                                >
                                                                    <Tag
                                                                        color={
                                                                            type.color
                                                                        }
                                                                    >
                                                                        {
                                                                            type.label
                                                                        }
                                                                    </Tag>
                                                                </Option>
                                                            ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="category"
                                                    label="Category"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please select category",
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        size="large"
                                                        placeholder="Select category"
                                                    >
                                                        {eventCategories
                                                            .filter(
                                                                (ec) =>
                                                                    ec.value !==
                                                                    "all",
                                                            )
                                                            .map((category) => (
                                                                <Option
                                                                    key={
                                                                        category.value
                                                                    }
                                                                    value={
                                                                        category.value
                                                                    }
                                                                >
                                                                    {
                                                                        category.label
                                                                    }
                                                                </Option>
                                                            ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>

                                {/* Date & Time Section */}
                                <div className="form-section">
                                    <div className="section-header">
                                        <h3>Date & Time</h3>
                                        <div className="section-divider"></div>
                                    </div>
                                    <div className="section-content">
                                        <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="date"
                                                    label="Event Date"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please select event date",
                                                        },
                                                    ]}
                                                >
                                                    <DatePicker
                                                        style={{
                                                            width: "100%",
                                                        }}
                                                        size="large"
                                                        disabledDate={(
                                                            current,
                                                        ) =>
                                                            current &&
                                                            current <
                                                                dayjs().startOf(
                                                                    "day",
                                                                )
                                                        }
                                                        getPopupContainer={(trigger) =>
                                                            trigger.closest(".create-event-modal") ||
                                                            trigger.parentElement
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="timeRange"
                                                    label="Event Time"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please select event time",
                                                        },
                                                    ]}
                                                >
                                                    <TimePicker.RangePicker
                                                        style={{
                                                            width: "100%",
                                                        }}
                                                        size="large"
                                                        format="hh:mm A"
                                                        disabledTime={
                                                            disabledTime
                                                        }
                                                        getPopupContainer={(trigger) =>
                                                            trigger.closest(".create-event-modal") ||
                                                            trigger.parentElement
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="location"
                                            label="Event Location"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter event location",
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder="Enter physical location or virtual platform"
                                                size="large"
                                                className="form-input"
                                            />
                                        </Form.Item>
                                    </div>
                                </div>

                                {/* Event Details Section */}
                                <div className="form-section">
                                    <div className="section-header">
                                        <h3>Event Details</h3>
                                        <div className="section-divider"></div>
                                    </div>
                                    <div className="section-content">
                                        <Row gutter={16}>
                                            <Col xs={24} sm={12} md={8}>
                                                <Form.Item
                                                    name="price"
                                                    label="Ticket Price (₱)"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please enter ticket price",
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{
                                                            width: "100%",
                                                        }}
                                                        size="large"
                                                        min={0}
                                                        placeholder="0"
                                                        className="form-input-number"
                                                        formatter={(value) =>
                                                            `₱ ${value}`.replace(
                                                                /\B(?=(\d{3})+(?!\d))/g,
                                                                ",",
                                                            )
                                                        }
                                                        parser={(value) =>
                                                            value.replace(
                                                                /₱\s?|(,*)/g,
                                                                "",
                                                            )
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12} md={8}>
                                                <Form.Item
                                                    name="capacity"
                                                    label="Capacity"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please enter event capacity",
                                                        },
                                                        {
                                                            type: "number",
                                                            max: 500,
                                                            message:
                                                                "Capacity cannot exceed 500",
                                                        },
                                                        {
                                                            type: "number",
                                                            min: 1,
                                                            message:
                                                                "Capacity must be at least 1",
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{
                                                            width: "100%",
                                                        }}
                                                        size="large"
                                                        min={1}
                                                        max={500}
                                                        placeholder="500"
                                                        className="form-input-number"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={12} md={8}>
                                                <Form.Item
                                                    name="organizer"
                                                    label="Organizer"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please enter organizer name",
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        placeholder="Organizer name"
                                                        size="large"
                                                        className="form-input"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="contact_number"
                                                    label="Contact Number"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please enter contact number",
                                                        },
                                                        {
                                                            pattern:
                                                                /^09\d{9}$/,
                                                            message:
                                                                "Contact number must start with 09 and be exactly 11 digits",
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        prefix={
                                                            <PhoneOutlined />
                                                        }
                                                        placeholder="e.g. 09496600923"
                                                        maxLength={11}
                                                        size="large"
                                                        className="form-input"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="contact_email"
                                                    label="Email (Gmail)"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please enter your Gmail address",
                                                        },
                                                        {
                                                            type: "email",
                                                            message:
                                                                "Please enter a valid email address",
                                                        },
                                                        {
                                                            pattern:
                                                                /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        prefix={<MailFilled />}
                                                        placeholder="e.g. javiernarn@gmail.com"
                                                        size="large"
                                                        className="form-input"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item
                                            name="tags"
                                            label="Event Tags"
                                            rules={[
                                                {
                                                    type: "array",
                                                    required: true,
                                                    message:
                                                        "Please add at least one tag",
                                                },
                                            ]}
                                        >
                                            <Select
                                                mode="tags"
                                                size="large"
                                                placeholder="Add tags to help people find your event"
                                                tokenSeparators={[","]}
                                                className="form-tags"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="agenda"
                                            label="Event Agenda"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter the event agenda",
                                                },
                                            ]}
                                        >
                                            <TextArea
                                                rows={4}
                                                placeholder="Enter event schedule (one item per line)"
                                                className="form-textarea"
                                            />
                                        </Form.Item>
                                    </div>
                                </div>

                                {/* Early Bird Pricing Section */}
                                {/* <div className="form-section">
                  <div className="section-header">
                    <h3>Early Bird Pricing (Optional)</h3>
                    <div className="section-divider"></div>
                  </div>
                  <div className="section-content">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="earlyBirdPrice" label="Early Bird Price (₱)">
                          <InputNumber
                            style={{ width: "100%" }}
                            size="large"
                            min={0}
                            placeholder="0"
                            className="form-input-number"
                            formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={(value) => value.replace(/₱\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="earlyBirdEndDate" label="Early Bird End Date">
                          <DatePicker
                            style={{ width: "100%" }}
                            size="large"
                            format="YYYY-MM-DD"
                            disabledDate={(current) => current && current < dayjs().endOf("day")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </div> */}

                                {/* Media Section */}
                                <div className="form-section">
                                    <div className="section-header">
                                        <h3>Media & Settings</h3>
                                        <div className="section-divider"></div>
                                    </div>
                                    <div className="section-content">
                                        <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="featured"
                                                    label="Featured Event"
                                                    valuePropName="checked"
                                                    initialValue={false}
                                                >
                                                    <Switch
                                                        checkedChildren="Featured"
                                                        unCheckedChildren="Regular"
                                                        className="featured-switch"
                                                    />
                                                </Form.Item>

                                                <span className="switch-label">
                                                    Mark this event as featured
                                                    to highlight it on the
                                                    platform
                                                </span>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="images"
                                                    label="Event Images"
                                                >
                                                    <Upload
                                                        listType="picture-card"
                                                        multiple
                                                        fileList={fileList}
                                                        onChange={
                                                            handleUploadChange
                                                        }
                                                        beforeUpload={
                                                            handleBeforeUpload
                                                        }
                                                        className="event-images-upload"
                                                    >
                                                        {fileList.length >=
                                                        8 ? null : (
                                                            <div className="upload-placeholder">
                                                                <PlusOutlined />
                                                                <div
                                                                    style={{
                                                                        marginTop: 8,
                                                                    }}
                                                                >
                                                                    Upload
                                                                    Images
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Upload>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions-full">
                                <Button
                                    onClick={handleCancel}
                                    className="cancel-btn"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleFormSubmit}
                                    icon={
                                        selectedEvent ? (
                                            <EditOutlined />
                                        ) : (
                                            <PlusOutlined />
                                        )
                                    }
                                    className="submit-btn"
                                    size="large"
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Saving..."
                                        : selectedEvent
                                          ? "Update Event"
                                          : "Create Event"}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Modal>

                <Modal
                    title={
                        <Space>
                            <WarningOutlined
                                style={{
                                    color: "var(--warning, #f59e0b)",
                                    fontSize: "22px",
                                }}
                            />
                            <span>Required Fields Missing</span>
                        </Space>
                    }
                    open={isValidationModalVisible}
                    onCancel={() => setIsValidationModalVisible(false)}
                    footer={[
                        <Button
                            key="ok"
                            type="primary"
                            onClick={() => setIsValidationModalVisible(false)}
                        >
                            OK, I'll Fill Them
                        </Button>,
                    ]}
                    centered
                >
                    <div style={{ padding: "16px 0" }}>
                        <Alert
                            message="Please complete all required fields before submitting."
                            description={
                                <div style={{ marginTop: "12px" }}>
                                    <Text strong>
                                        The following fields need to be filled:
                                    </Text>
                                    <ul
                                        style={{
                                            marginTop: "8px",
                                            paddingLeft: "20px",
                                        }}
                                    >
                                        {validationErrors.map(
                                            (error, index) => (
                                                <li
                                                    key={index}
                                                    style={{
                                                        color: "var(--danger, #ef4444)",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    {error}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            }
                            type="warning"
                            showIcon
                        />
                    </div>
                </Modal>

                {/* Draft Restore Prompt */}
                <Modal
                    title={
                        <Space>
                            <InfoCircleOutlined
                                style={{ color: "#3b82f6", fontSize: "22px" }}
                            />
                            <span>Unsaved Draft Found</span>
                        </Space>
                    }
                    open={isDraftPromptVisible}
                    onCancel={handleStartNewDraft}
                    footer={[
                        <Button key="new" onClick={handleStartNewDraft}>
                            Start New
                        </Button>,
                        <Button
                            key="continue"
                            type="primary"
                            onClick={handleContinueDraft}
                        >
                            Continue Draft
                        </Button>,
                    ]}
                    centered
                >
                    <p style={{ margin: 0 }}>
                        We found a saved event draft. Would you like to continue
                        where you left off?
                    </p>
                </Modal>

                {/* Smart Close / Discard Changes Confirmation */}
                <Modal
                    title={
                        <Space>
                            <WarningOutlined
                                style={{
                                    color: "var(--warning, #f59e0b)",
                                    fontSize: "22px",
                                }}
                            />
                            <span>Discard Changes?</span>
                        </Space>
                    }
                    open={isDiscardConfirmVisible}
                    onCancel={handleContinueEditing}
                    footer={[
                        <Button key="continue" onClick={handleContinueEditing}>
                            Continue Editing
                        </Button>,
                        <Button
                            key="discard"
                            danger
                            type="primary"
                            onClick={handleDiscardChanges}
                        >
                            Discard Changes
                        </Button>,
                    ]}
                    centered
                >
                    <p style={{ margin: 0 }}>
                        You have unsaved event information. Are you sure you
                        want to discard your progress?
                    </p>
                </Modal>
            </div>

            <EventDetailsModal
                event={selectedEvent}
                visible={isDetailModalVisible}
                onClose={handleCloseDetails}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onRefresh={fetchEvents}
            />
        </Layout>
    );
};

export default AlumniEvents;