"use client";

import { useMemo, useState } from "react";
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
} from "antd";
import {
    FileSearchOutlined,
    LoginOutlined,
    LogoutOutlined,
    SearchOutlined,
    TeamOutlined,
    IdcardOutlined,
    ReloadOutlined,
    UserOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { Layout } from "~/components";
import { useAuditLogs, useAuditLogSummary } from "~/hooks/useAuditLogs";
import logo from "~/assets/images/OCC_LOGO.png";
import avatarGuidance from "~/assets/images/avatar_guidance.png";
import avatarBSIT from "~/assets/images/bsit-logo.jpg";
import avatarBSED from "~/assets/images/educ-logo.png";
import avatarBEED from "~/assets/images/beed-logo.png";
import avatarBSBA from "~/assets/images/bsba-logo.png";
import "./AuditLogPage.css";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const ROLE_META = {
    admin: { label: "Administrator", color: "gold", icon: <SafetyCertificateOutlined /> },
    alumni: { label: "Alumni", color: "blue", icon: <TeamOutlined /> },
    department_head: { label: "Department Head", color: "purple", icon: <IdcardOutlined /> },
};

const ROLE_AVATAR_BG = {
    admin: "#b8860b",
    alumni: "#1a1a2e",
    department_head: "#6b21a8",
};

// Department heads and the guidance admin don't have an uploaded profile
// photo in this system — the rest of the app (see components/layout/index.js
// -> getDepartmentHeadAvatar) represents them with their department/office
// logo instead. Mirror that here so the Audit Log shows the same image
// instead of a generic role icon.
const DEPARTMENT_LOGO_BY_COURSE_CODE = {
    BSIT: avatarBSIT,
    BSEd: avatarBSED,
    BEED: avatarBEED,
    BSBA: avatarBSBA,
};

const getRoleAvatarSrc = (record) => {
    if (record.role === "alumni") {
        return record.profile_image_url || undefined;
    }
    if (record.role === "admin") {
        return avatarGuidance;
    }
    if (record.role === "department_head") {
        return (
            DEPARTMENT_LOGO_BY_COURSE_CODE[record.course_code] || avatarGuidance
        );
    }
    return undefined;
};

const AuditLogPage = () => {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("all");
    const [action, setAction] = useState("all");
    const [dateRange, setDateRange] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const filters = useMemo(
        () => ({
            search: search || undefined,
            role,
            action,
            date_from: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
            date_to: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
            page,
            per_page: pageSize,
        }),
        [search, role, action, dateRange, page, pageSize],
    );

    const { data, isLoading, isFetching, refetch } = useAuditLogs(filters);
    const { data: summary } = useAuditLogSummary();

    const logs = data?.data || [];
    const meta = data?.meta || { total: 0, current_page: 1, per_page: 20 };

    const resetFilters = () => {
        setSearch("");
        setRole("all");
        setAction("all");
        setDateRange(null);
        setPage(1);
    };

    const columns = [
        {
            title: "User",
            dataIndex: "name",
            key: "name",
            render: (_, record) => {
                const meta = ROLE_META[record.role] || {};
                const avatarSrc = getRoleAvatarSrc(record);
                return (
                    <Space>
                        <Avatar
                            src={avatarSrc}
                            icon={!avatarSrc ? (meta.icon || <UserOutlined />) : undefined}
                            style={
                                !avatarSrc
                                    ? { backgroundColor: ROLE_AVATAR_BG[record.role] || "#8c8c8c" }
                                    : undefined
                            }
                            className="audit-avatar"
                        />
                        <div className="audit-user-cell">
                            <Text strong>{record.name}</Text>
                            <br />
                            <Text type="secondary" className="audit-user-email">
                                {record.email}
                            </Text>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            width: 170,
            render: (roleKey, record) => {
                const meta = ROLE_META[roleKey] || { label: record.role_label, color: "default" };
                return (
                    <Tag color={meta.color} icon={meta.icon} className="audit-role-tag">
                        {meta.label}
                        {record.course_code ? ` · ${record.course_code}` : ""}
                    </Tag>
                );
            },
            filters: [
                { text: "Alumni", value: "alumni" },
                { text: "Department Head", value: "department_head" },
                { text: "Administrator", value: "admin" },
            ],
        },
        {
            title: "Activity",
            dataIndex: "action",
            key: "action",
            width: 130,
            render: (action) =>
                action === "login" ? (
                    <Tag color="green" icon={<LoginOutlined />}>
                        Login
                    </Tag>
                ) : (
                    <Tag color="volcano" icon={<LogoutOutlined />}>
                        Logout
                    </Tag>
                ),
        },
        {
            title: "Date & Time",
            dataIndex: "occurred_at",
            key: "occurred_at",
            width: 200,
            render: (value) =>
                value ? (
                    <Tooltip title={moment(value).format("MMMM D, YYYY — h:mm:ss A")}>
                        <span>{moment(value).format("MMM D, YYYY h:mm A")}</span>
                    </Tooltip>
                ) : (
                    "—"
                ),
            sorter: (a, b) => moment(a.occurred_at).unix() - moment(b.occurred_at).unix(),
            defaultSortOrder: "descend",
        },
        {
            title: "IP Address",
            dataIndex: "ip_address",
            key: "ip_address",
            width: 150,
            render: (ip) => (
                <Space size={4}>
                    <GlobalOutlined className="audit-ip-icon" />
                    <Text code>{ip || "—"}</Text>
                </Space>
            ),
        },
        {
            title: "Device / Browser",
            dataIndex: "user_agent",
            key: "user_agent",
            ellipsis: { showTitle: false },
            render: (ua) => (
                <Tooltip title={ua || "Unknown device"}>
                    <Text type="secondary" className="audit-ua-text">
                        {ua || "—"}
                    </Text>
                </Tooltip>
            ),
        },
    ];

    return (
        <Layout>
            <div className="audit-log-container">
                {/* Header Section — Modern Hero (matches other admin pages) */}
                <section className="ae-hero">
                    <div className="ae-hero__bg" aria-hidden>
                        <span className="blob blob-1" />
                        <span className="blob blob-2" />
                        <span className="blob blob-3" />
                        <div className="dot-grid" />
                    </div>

                    <div className="ae-hero__content">
                        <div className="ae-hero__brand">
                            <img src={logo} alt="OCC Logo" className="ae-hero__logo" />
                            <div className="ae-hero__brand-meta">
                                <Tag className="ae-chip" icon={<FileSearchOutlined />}>
                                    AUDIT LOG
                                </Tag>
                                <Text className="ae-hero__eyebrow">
                                    Alumni Tracing Management System
                                </Text>
                            </div>
                        </div>

                        <Title className="ae-hero__title">
                            Account Activity{" "}
                            <span className="grad-text">Audit Log</span>
                        </Title>

                        <Paragraph className="ae-hero__lead">
                            Track every alumni, department head, and admin login &
                            logout — who signed in, when, and from where.
                        </Paragraph>

                        <div className="ae-hero__stats">
                            <div className="ae-stat">
                                <span className="ae-stat__icon">
                                    <LoginOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {summary?.today_logins ?? 0}
                                    </span>
                                    <span className="ae-stat__label">
                                        Logins Today
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--blue">
                                    <LoginOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {summary?.week_logins ?? 0}
                                    </span>
                                    <span className="ae-stat__label">
                                        Logins This Week
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--green">
                                    <TeamOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {summary?.alumni_logins_today ?? 0}
                                    </span>
                                    <span className="ae-stat__label">
                                        Alumni Logins Today
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--gray">
                                    <IdcardOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {summary?.department_head_logins_today ?? 0}
                                    </span>
                                    <span className="ae-stat__label">
                                        Dept. Head Logins Today
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Card className="audit-filters-card">
                    <Row gutter={[12, 12]} align="middle" justify="space-between">
                        <Col xs={24} md={7}>
                            <Input
                                allowClear
                                placeholder="Search by name or email"
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
                                value={role}
                                onChange={(v) => {
                                    setRole(v);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "all", label: "All Roles" },
                                    { value: "alumni", label: "Alumni" },
                                    { value: "department_head", label: "Department Head" },
                                    { value: "admin", label: "Administrator" },
                                ]}
                            />
                        </Col>
                        <Col xs={12} md={4}>
                            <Select
                                style={{ width: "100%" }}
                                value={action}
                                onChange={(v) => {
                                    setAction(v);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "all", label: "All Activity" },
                                    { value: "login", label: "Login" },
                                    { value: "logout", label: "Logout" },
                                ]}
                            />
                        </Col>
                        <Col xs={18} md={5}>
                            <RangePicker
                                style={{ width: "100%" }}
                                value={dateRange}
                                onChange={(v) => {
                                    setDateRange(v);
                                    setPage(1);
                                }}
                            />
                        </Col>
                        <Col xs={6} md={2}>
                            <Button block onClick={resetFilters}>
                                Reset
                            </Button>
                        </Col>
                        <Col xs={24} md={2}>
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
                </Card>

                <Card className="audit-table-card">
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={logs}
                        loading={isLoading}
                        locale={{
                            emptyText: (
                                <Empty description="No login or logout activity found for these filters" />
                            ),
                        }}
                        pagination={{
                            current: meta.current_page,
                            pageSize: meta.per_page,
                            total: meta.total,
                            showSizeChanger: true,
                            showTotal: (total) => `${total} total activity records`,
                            onChange: (nextPage, nextPageSize) => {
                                setPage(nextPage);
                                setPageSize(nextPageSize);
                            },
                        }}
                        scroll={{ x: 900 }}
                    />
                </Card>
            </div>
        </Layout>
    );
};

export default AuditLogPage;