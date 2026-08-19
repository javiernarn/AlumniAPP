"use client";

import { useEffect, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Card,
    Row,
    Col,
    Tag,
    Typography,
    Space,
    Select,
    Table,
    Avatar,
    Input,
    DatePicker,
    Button,
    Tooltip,
    Empty,
    Drawer,
    Image,
    Popconfirm,
    Pagination,
    Spin,
    message,
} from "antd";
import {
    CommentOutlined,
    SearchOutlined,
    TeamOutlined,
    ReloadOutlined,
    UserOutlined,
    ExclamationOutlined,
    BulbOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    StopOutlined,
    FileImageOutlined,
    EyeOutlined,
    DeleteOutlined,
    GlobalOutlined,
    DesktopOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { Layout } from "~/components";
import axiosConfig from "~/utils/axiosConfig";
import {
    useAtmsFeedbackReports,
    useAtmsFeedbackStatistics,
    useUpdateAtmsFeedbackStatus,
    useDeleteAtmsFeedback,
} from "~/hooks/useAtmsFeedback";
import logo from "~/assets/images/OCC_LOGO.png";
import "./AtmsFeedbackReportsPage.css";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const TYPE_META = {
    improve: { label: "Help us improve", color: "blue", icon: <BulbOutlined /> },
    wrong: { label: "Something went wrong", color: "orange", icon: <ExclamationOutlined /> },
};

const STATUS_META = {
    pending: { label: "Pending", color: "gold", icon: <ClockCircleOutlined /> },
    in_review: { label: "In Review", color: "processing", icon: <EyeOutlined /> },
    resolved: { label: "Resolved", color: "success", icon: <CheckCircleOutlined /> },
    dismissed: { label: "Dismissed", color: "default", icon: <StopOutlined /> },
};

const AREA_OPTIONS = [
    { value: "all", label: "All Areas" },
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

// Real phones vary a lot below the usual 768px "tablet" breakpoint, so
// the table view (even with horizontal scroll) stays cramped and the
// "Submitted By" cell in particular has no room to breathe. Below
// 860px we swap the AntD Table for a stacked card list instead — the
// same data, no horizontal scrolling required.
const MOBILE_BREAKPOINT = 860;

const useIsMobile = (breakpoint = MOBILE_BREAKPOINT) => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [breakpoint]);

    return isMobile;
};

const AtmsFeedbackReportsPage = () => {
    const isMobile = useIsMobile();
    const location = useLocation();
    const history = useHistory();
    const [search, setSearch] = useState("");
    const [type, setType] = useState("all");
    const [area, setArea] = useState("all");
    const [status, setStatus] = useState("all");
    const [dateRange, setDateRange] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [notesDraft, setNotesDraft] = useState("");
    const [pendingDetailId, setPendingDetailId] = useState(null);

    const filters = useMemo(
        () => ({
            search: search || undefined,
            type,
            area,
            status,
            date_from: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
            date_to: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
            page,
            per_page: pageSize,
        }),
        [search, type, area, status, dateRange, page, pageSize],
    );

    const { data, isLoading, isFetching, refetch } = useAtmsFeedbackReports(filters);
    const { data: stats } = useAtmsFeedbackStatistics();
    const updateStatus = useUpdateAtmsFeedbackStatus();
    const deleteReport = useDeleteAtmsFeedback();

    const reports = data?.data || [];
    const meta = data?.meta || { total: 0, current_page: 1, per_page: 12 };

    const resetFilters = () => {
        setSearch("");
        setType("all");
        setArea("all");
        setStatus("all");
        setDateRange(null);
        setPage(1);
    };

    const openDetail = (record) => {
        setSelectedReport(record);
        setNotesDraft(record.admin_notes || "");
        setDetailOpen(true);
    };

    const closeDetail = () => {
        setDetailOpen(false);
        setSelectedReport(null);
        setNotesDraft("");
    };

    const handleStatusChange = async (nextStatus) => {
        if (!selectedReport) return;
        try {
            const res = await updateStatus.mutateAsync({
                id: selectedReport.id,
                status: nextStatus,
                admin_notes: notesDraft,
            });
            message.success("Feedback report updated.");
            setSelectedReport(res?.data || { ...selectedReport, status: nextStatus });
        } catch (e) {
            message.error(
                e?.response?.data?.message || "Failed to update this report.",
            );
        }
    };

    const handleSaveNotesOnly = async () => {
        if (!selectedReport) return;
        try {
            const res = await updateStatus.mutateAsync({
                id: selectedReport.id,
                status: selectedReport.status,
                admin_notes: notesDraft,
            });
            message.success("Note saved.");
            setSelectedReport(res?.data || selectedReport);
        } catch (e) {
            message.error(e?.response?.data?.message || "Failed to save note.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteReport.mutateAsync(id);
            message.success("Feedback report deleted.");
            if (selectedReport?.id === id) closeDetail();
        } catch (e) {
            message.error(e?.response?.data?.message || "Failed to delete this report.");
        }
    };

    // Coming from a "New ATMS Feedback" notification link (?id=123): grab
    // the id once on mount.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("id");
        if (id) setPendingDetailId(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch the linked report directly (it may live on a different page or
    // under different filters than whatever is currently on screen) and
    // open its detail drawer, then strip ?id= off the URL so navigating
    // back here later doesn't reopen it. If the report has since been
    // deleted, the request 404s — `suppressGenericModal` stops the generic
    // axios error interceptor from popping up the raw Laravel
    // "No query results for model [...]" message, and we show a friendly
    // notice instead.
    useEffect(() => {
        if (!pendingDetailId) return;

        let cancelled = false;

        axiosConfig
            .get(`/admin/atms-feedback/${pendingDetailId}`, {
                suppressGenericModal: true,
            })
            .then((res) => {
                if (cancelled) return;
                const report = res.data?.data;
                if (report) openDetail(report);
            })
            .catch(() => {
                if (!cancelled) {
                    message.warning(
                        "That feedback report is no longer available — it may have been deleted.",
                    );
                }
            });

        setPendingDetailId(null);
        history.replace("/feedback-reports");

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingDetailId]);

    const columns = [
        {
            title: "Submitted By",
            dataIndex: "submitted_by",
            key: "submitted_by",
            width: 230,
            render: (submittedBy) => (
                <div className="fb-submitter-cell">
                    <Avatar
                        size={36}
                        src={submittedBy?.profile_image_url}
                        icon={!submittedBy?.profile_image_url ? <UserOutlined /> : undefined}
                        className="fb-avatar fb-empty-avatar"
                    />
                    <div className="fb-user-cell">
                        <Tooltip title={submittedBy?.name || "Deleted account"}>
                            <Text strong className="fb-user-name">
                                {submittedBy?.name || "Deleted account"}
                            </Text>
                        </Tooltip>
                        <Tooltip title={submittedBy?.email || "—"}>
                            <Text type="secondary" className="fb-user-email">
                                {submittedBy?.email || "—"}
                            </Text>
                        </Tooltip>
                    </div>
                </div>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 170,
            render: (t) => {
                const m = TYPE_META[t] || {};
                return (
                    <Tag color={m.color} icon={m.icon} className="fb-type-tag">
                        {m.label || t}
                    </Tag>
                );
            },
            filters: [
                { text: "Help us improve", value: "improve" },
                { text: "Something went wrong", value: "wrong" },
            ],
        },
        {
            title: "Area",
            dataIndex: "area_label",
            key: "area",
            width: 150,
            render: (label) => <Tag className="fb-area-chip">{label}</Tag>,
        },
        {
            title: "Details",
            dataIndex: "details",
            key: "details",
            width: 260,
            render: (details) => (
                <Tooltip title={details}>
                    <span className="fb-details-preview">{details}</span>
                </Tooltip>
            ),
        },
        {
            title: "Screenshots",
            dataIndex: "screenshot_count",
            key: "screenshot_count",
            width: 130,
            render: (count, record) => (
                <span
                    className="fb-screenshot-thumb-wrapper"
                    onClick={() => openDetail(record)}
                >
                    <FileImageOutlined /> {count} attached
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 130,
            render: (s) => {
                const m = STATUS_META[s] || { label: s, color: "default" };
                return (
                    <Tag color={m.color} icon={m.icon} className="fb-status-tag">
                        {m.label}
                    </Tag>
                );
            },
            filters: [
                { text: "Pending", value: "pending" },
                { text: "In Review", value: "in_review" },
                { text: "Resolved", value: "resolved" },
                { text: "Dismissed", value: "dismissed" },
            ],
        },
        {
            title: "Submitted",
            dataIndex: "created_at",
            key: "created_at",
            width: 190,
            render: (value) =>
                value ? (
                    <Tooltip title={moment(value).format("MMMM D, YYYY — h:mm:ss A")}>
                        <span>{moment(value).format("MMM D, YYYY h:mm A")}</span>
                    </Tooltip>
                ) : (
                    "—"
                ),
            sorter: (a, b) => moment(a.created_at).unix() - moment(b.created_at).unix(),
            defaultSortOrder: "descend",
        },
        {
            title: "Actions",
            key: "actions",
            width: 110,
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <Tooltip title="View details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => openDetail(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this feedback report?"
                        description="This will also delete its attached screenshots. This cannot be undone."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Layout>
            <div className="fb-container">
                {/* Header Section — Modern Hero (matches other admin pages) */}
                <section className="fb-hero">
                    <div className="fb-hero__bg" aria-hidden>
                        <span className="blob blob-1" />
                        <span className="blob blob-2" />
                        <span className="blob blob-3" />
                        <div className="dot-grid" />
                    </div>

                    <div className="fb-hero__content">
                        <div className="fb-hero__brand">
                            <img src={logo} alt="OCC Logo" className="fb-hero__logo" />
                            <div className="fb-hero__brand-meta">
                                <Tag className="fb-chip" icon={<CommentOutlined />}>
                                    FEEDBACK REPORTS
                                </Tag>
                                <Text className="fb-hero__eyebrow">
                                    Alumni Tracing Management System
                                </Text>
                            </div>
                        </div>

                        <Title className="fb-hero__title">
                            Alumni Feedback{" "}
                            <span className="grad-text">to ATMS</span>
                        </Title>

                        <Paragraph className="fb-hero__lead">
                            Every report an alumni submits through the "Give Feedback"
                            widget — improvement ideas and broken-feature reports,
                            each with a required screenshot — lands here for review.
                        </Paragraph>

                        <div className="fb-hero__stats">
                            <div className="fb-stat">
                                <span className="fb-stat__icon">
                                    <ClockCircleOutlined />
                                </span>
                                <div className="fb-stat__body">
                                    <span className="fb-stat__value">{stats?.pending ?? 0}</span>
                                    <span className="fb-stat__label">Pending</span>
                                </div>
                            </div>
                            <div className="fb-stat">
                                <span className="fb-stat__icon fb-stat__icon--indigo">
                                    <EyeOutlined />
                                </span>
                                <div className="fb-stat__body">
                                    <span className="fb-stat__value">{stats?.in_review ?? 0}</span>
                                    <span className="fb-stat__label">In Review</span>
                                </div>
                            </div>
                            <div className="fb-stat">
                                <span className="fb-stat__icon fb-stat__icon--green">
                                    <CheckCircleOutlined />
                                </span>
                                <div className="fb-stat__body">
                                    <span className="fb-stat__value">{stats?.resolved ?? 0}</span>
                                    <span className="fb-stat__label">Resolved</span>
                                </div>
                            </div>
                            <div className="fb-stat">
                                <span className="fb-stat__icon fb-stat__icon--amber">
                                    <ExclamationOutlined />
                                </span>
                                <div className="fb-stat__body">
                                    <span className="fb-stat__value">{stats?.bug_reports ?? 0}</span>
                                    <span className="fb-stat__label">Bug Reports</span>
                                </div>
                            </div>
                            <div className="fb-stat">
                                <span className="fb-stat__icon fb-stat__icon--gray">
                                    <TeamOutlined />
                                </span>
                                <div className="fb-stat__body">
                                    <span className="fb-stat__value">{stats?.this_week ?? 0}</span>
                                    <span className="fb-stat__label">This Week</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Card className="fb-filters-card">
                    <Row gutter={[12, 12]} align="middle" justify="space-between">
                        <Col xs={24} md={6}>
                            <Input
                                allowClear
                                placeholder="Search by name, email, or details"
                                prefix={<SearchOutlined />}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </Col>
                        <Col xs={12} md={4}>
                            <Select
                                style={{ width: "100%" }}
                                value={type}
                                onChange={(v) => {
                                    setType(v);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "all", label: "All Types" },
                                    { value: "improve", label: "Help us improve" },
                                    { value: "wrong", label: "Something went wrong" },
                                ]}
                            />
                        </Col>
                        <Col xs={12} md={4}>
                            <Select
                                style={{ width: "100%" }}
                                value={area}
                                onChange={(v) => {
                                    setArea(v);
                                    setPage(1);
                                }}
                                options={AREA_OPTIONS}
                                showSearch
                                optionFilterProp="label"
                            />
                        </Col>
                        <Col xs={12} md={3}>
                            <Select
                                style={{ width: "100%" }}
                                value={status}
                                onChange={(v) => {
                                    setStatus(v);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "all", label: "All Status" },
                                    { value: "pending", label: "Pending" },
                                    { value: "in_review", label: "In Review" },
                                    { value: "resolved", label: "Resolved" },
                                    { value: "dismissed", label: "Dismissed" },
                                ]}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                            <RangePicker
                                style={{ width: "100%" }}
                                value={dateRange}
                                onChange={(v) => {
                                    setDateRange(v);
                                    setPage(1);
                                }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={2}>
                            <Button
                                block
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                loading={isFetching}
                            >
                                Refresh
                            </Button>
                        </Col>
                    </Row>
                    <Row justify="end" style={{ marginTop: 8 }}>
                        <Button type="link" onClick={resetFilters}>
                            Reset filters
                        </Button>
                    </Row>
                </Card>

                {isMobile ? (
                    <FeedbackReportsCardList
                        reports={reports}
                        loading={isLoading}
                        meta={meta}
                        onPageChange={setPage}
                        onView={openDetail}
                        onDelete={handleDelete}
                    />
                ) : (
                    <Card className="fb-table-card">
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={reports}
                            loading={isLoading}
                            locale={{
                                emptyText: (
                                    <Empty description="No feedback reports found for these filters" />
                                ),
                            }}
                            pagination={{
                                current: meta.current_page,
                                pageSize: meta.per_page,
                                total: meta.total,
                                showSizeChanger: true,
                                showTotal: (total) => `${total} total feedback reports`,
                                onChange: (nextPage, nextPageSize) => {
                                    setPage(nextPage);
                                    setPageSize(nextPageSize);
                                },
                            }}
                            scroll={{ x: 1360 }}
                        />
                    </Card>
                )}
            </div>

            {/* ===== Detail / Moderation Drawer ===== */}
            <Drawer
                className="fb-drawer"
                title={
                    <Space>
                        <CommentOutlined />
                        <span>Feedback Report #{selectedReport?.id}</span>
                    </Space>
                }
                width={isMobile ? "100%" : 480}
                open={detailOpen}
                onClose={closeDetail}
                destroyOnClose
            >
                {selectedReport && (
                    <>
                        <div className="fb-detail-section">
                            <Space wrap>
                                <Tag
                                    color={TYPE_META[selectedReport.type]?.color}
                                    icon={TYPE_META[selectedReport.type]?.icon}
                                >
                                    {selectedReport.type_label}
                                </Tag>
                                <Tag>{selectedReport.area_label}</Tag>
                                <Tag color={STATUS_META[selectedReport.status]?.color}>
                                    {STATUS_META[selectedReport.status]?.label}
                                </Tag>
                            </Space>
                        </div>

                        <div className="fb-detail-section">
                            <span className="fb-detail-label">Submitted by</span>
                            <Space>
                                <Avatar
                                    src={selectedReport.submitted_by?.profile_image_url}
                                    icon={
                                        !selectedReport.submitted_by?.profile_image_url ? (
                                            <UserOutlined />
                                        ) : undefined
                                    }
                                    className="fb-empty-avatar"
                                />
                                <div>
                                    <Text strong>
                                        {selectedReport.submitted_by?.name || "Deleted account"}
                                    </Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {selectedReport.submitted_by?.email || "—"}
                                    </Text>
                                </div>
                            </Space>
                        </div>

                        <div className="fb-detail-section">
                            <span className="fb-detail-label">Details</span>
                            <Paragraph className="fb-detail-body-text">
                                {selectedReport.details}
                            </Paragraph>
                        </div>

                        <div className="fb-detail-section">
                            <span className="fb-detail-label">
                                Screenshots ({selectedReport.screenshot_urls?.length || 0})
                            </span>
                            {selectedReport.screenshot_urls?.length ? (
                                <div className="fb-screenshot-gallery">
                                    <Image.PreviewGroup>
                                        {selectedReport.screenshot_urls.map((url, idx) => (
                                            <Image key={idx} src={url} alt={`Screenshot ${idx + 1}`} />
                                        ))}
                                    </Image.PreviewGroup>
                                </div>
                            ) : (
                                <Empty description="No screenshots" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            )}
                        </div>

                        <div className="fb-detail-section">
                            <span className="fb-detail-label">Device & Diagnostics</span>
                            <div className="fb-diagnostics-grid">
                                <div>
                                    <div className="fb-diag-k">
                                        <GlobalOutlined /> Page URL
                                    </div>
                                    <div className="fb-diag-v">
                                        {selectedReport.device_info?.page_url || "—"}
                                    </div>
                                </div>
                                <div>
                                    <div className="fb-diag-k">
                                        <DesktopOutlined /> Theme
                                    </div>
                                    <div className="fb-diag-v">
                                        {selectedReport.device_info?.theme || "—"}
                                    </div>
                                </div>
                                <div>
                                    <div className="fb-diag-k">IP Address</div>
                                    <div className="fb-diag-v">
                                        {selectedReport.device_info?.ip_address || "—"}
                                    </div>
                                </div>
                                <div>
                                    <div className="fb-diag-k">
                                        <CalendarOutlined /> Submitted
                                    </div>
                                    <div className="fb-diag-v">
                                        {selectedReport.created_at
                                            ? moment(selectedReport.created_at).format(
                                                  "MMM D, YYYY h:mm A",
                                              )
                                            : "—"}
                                    </div>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div className="fb-diag-k">User Agent</div>
                                    <div className="fb-diag-v">
                                        {selectedReport.device_info?.user_agent || "—"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="fb-detail-section">
                            <span className="fb-detail-label">Admin note</span>
                            <Input.TextArea
                                rows={3}
                                placeholder="Add an internal note or a message back to the alumni..."
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                            />
                            <div style={{ marginTop: 8 }}>
                                <Button
                                    size="small"
                                    onClick={handleSaveNotesOnly}
                                    loading={updateStatus.isLoading}
                                >
                                    Save note
                                </Button>
                            </div>
                        </div>

                        <div className="fb-detail-section">
                            <span className="fb-detail-label">Update status</span>
                            <div className="fb-status-actions">
                                <Button
                                    icon={<EyeOutlined />}
                                    disabled={selectedReport.status === "in_review"}
                                    loading={updateStatus.isLoading}
                                    onClick={() => handleStatusChange("in_review")}
                                >
                                    Mark In Review
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    disabled={selectedReport.status === "resolved"}
                                    loading={updateStatus.isLoading}
                                    onClick={() => handleStatusChange("resolved")}
                                >
                                    Mark Resolved
                                </Button>
                                <Button
                                    icon={<StopOutlined />}
                                    disabled={selectedReport.status === "dismissed"}
                                    loading={updateStatus.isLoading}
                                    onClick={() => handleStatusChange("dismissed")}
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </div>

                        <Popconfirm
                            title="Delete this feedback report?"
                            description="This will also delete its attached screenshots. This cannot be undone."
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(selectedReport.id)}
                        >
                            <Button danger icon={<DeleteOutlined />} block>
                                Delete Report
                            </Button>
                        </Popconfirm>
                    </>
                )}
            </Drawer>
        </Layout>
    );
};

// ============ Mobile card list (replaces the Table below 860px) ============
// Same data as the desktop <Table>, laid out as stacked cards so nothing
// requires horizontal scrolling or gets squeezed on a real phone screen.
const FeedbackReportsCardList = ({
    reports,
    loading,
    meta,
    onPageChange,
    onView,
    onDelete,
}) => {
    return (
        <Card className="fb-table-card fb-card-list-wrapper" bodyStyle={{ padding: 12 }}>
            <Spin spinning={loading}>
                {reports.length === 0 ? (
                    <Empty
                        description="No feedback reports found for these filters"
                        style={{ padding: "32px 0" }}
                    />
                ) : (
                    <div className="fb-card-list">
                        {reports.map((record) => {
                            const submittedBy = record.submitted_by;
                            const typeMeta = TYPE_META[record.type] || {};
                            const statusMeta = STATUS_META[record.status] || {
                                label: record.status,
                                color: "default",
                            };

                            return (
                                <div className="fb-report-card" key={record.id}>
                                    <div className="fb-report-card__header">
                                        <Avatar
                                            size={40}
                                            src={submittedBy?.profile_image_url}
                                            icon={
                                                !submittedBy?.profile_image_url ? (
                                                    <UserOutlined />
                                                ) : undefined
                                            }
                                            className="fb-avatar fb-empty-avatar"
                                        />
                                        <div className="fb-report-card__who">
                                            <Text strong className="fb-report-card__name">
                                                {submittedBy?.name || "Deleted account"}
                                            </Text>
                                            <Text
                                                type="secondary"
                                                className="fb-report-card__email"
                                            >
                                                {submittedBy?.email || "—"}
                                            </Text>
                                        </div>
                                        <Tag
                                            color={statusMeta.color}
                                            icon={statusMeta.icon}
                                            className="fb-status-tag fb-report-card__status"
                                        >
                                            {statusMeta.label}
                                        </Tag>
                                    </div>

                                    <div className="fb-report-card__tags">
                                        <Tag color={typeMeta.color} icon={typeMeta.icon} className="fb-type-tag">
                                            {typeMeta.label || record.type}
                                        </Tag>
                                        <Tag className="fb-area-chip">{record.area_label}</Tag>
                                    </div>

                                    <Paragraph
                                        className="fb-report-card__details"
                                        ellipsis={{ rows: 2 }}
                                    >
                                        {record.details}
                                    </Paragraph>

                                    <div className="fb-report-card__footer">
                                        <span className="fb-report-card__meta">
                                            <FileImageOutlined />{" "}
                                            {record.screenshot_count} attached
                                        </span>
                                        <span className="fb-report-card__meta">
                                            {record.created_at
                                                ? moment(record.created_at).format(
                                                      "MMM D, YYYY h:mm A",
                                                  )
                                                : "—"}
                                        </span>
                                    </div>

                                    <div className="fb-report-card__actions">
                                        <Button
                                            icon={<EyeOutlined />}
                                            onClick={() => onView(record)}
                                            block
                                        >
                                            View
                                        </Button>
                                        <Popconfirm
                                            title="Delete this feedback report?"
                                            description="This will also delete its attached screenshots. This cannot be undone."
                                            okText="Delete"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => onDelete(record.id)}
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {reports.length > 0 && (
                    <div className="fb-card-list__pagination">
                        <Pagination
                            simple
                            current={meta.current_page}
                            pageSize={meta.per_page}
                            total={meta.total}
                            onChange={onPageChange}
                        />
                    </div>
                )}
            </Spin>
        </Card>
    );
};

export default AtmsFeedbackReportsPage;
