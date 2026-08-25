"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Button,
    Input,
    Select,
    Tag,
    Typography,
    Modal,
    Form,
    Switch,
    DatePicker,
    Upload,
    message,
    Empty,
    Popconfirm,
    Image,
    Badge,
    Tooltip,
    Alert,
    Space,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    PushpinOutlined,
    PushpinFilled,
    NotificationOutlined,
    SearchOutlined,
    UploadOutlined,
    EyeOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    TagOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQueryClient } from "react-query";
import secureLocalStorage from "react-secure-storage";
import { Layout, CardSkeletonGrid } from "~/components";
import axiosConfig from "~/utils/axiosConfig";
import useAnnouncements from "~/hooks/useAnnouncements";
import logo from "~/assets/images/OCC_LOGO.png";
import "./AnnouncementsPage.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CATEGORY_OPTIONS = [
    { value: "general", label: "General", color: "default" },
    { value: "academic", label: "Academic", color: "blue" },
    { value: "event", label: "Event", color: "purple" },
    { value: "career", label: "Career", color: "green" },
    { value: "urgent", label: "Urgent", color: "red" },
    { value: "maintenance", label: "Maintenance", color: "orange" },
    { value: "other", label: "Other", color: "cyan" },
];

const STATUS_OPTIONS = [
    { value: "draft", label: "Draft", color: "default" },
    { value: "published", label: "Published", color: "green" },
    { value: "archived", label: "Archived", color: "default" },
];

const categoryMeta = (value) =>
    CATEGORY_OPTIONS.find((c) => c.value === value) || CATEGORY_OPTIONS[0];

const statusMeta = (value) =>
    STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];

// Published, but publish_date hasn't arrived yet — this is the state that
// looks "live" in the admin list but is still invisible to alumni, since
// scopeActive() on the backend requires publish_date <= today.
const isScheduled = (a) =>
    a.status === "published" &&
    !!a.publish_date &&
    dayjs(a.publish_date).startOf("day").isAfter(dayjs().startOf("day"));

export default function AnnouncementPage() {
    const role = secureLocalStorage.getItem("userRole");
    const isAdmin = role === "admin";

    const { data, isLoading, isFetching } = useAnnouncements();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const [formVisible, setFormVisible] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const [isDiscardConfirmVisible, setIsDiscardConfirmVisible] = useState(false);
    // Snapshot taken right after the form is populated (create defaults or
    // edit values), so "dirty" means "changed since the form was opened" —
    // not "has any value at all" — which lets the same check work for both
    // create and edit.
    const initialSnapshotRef = useRef(null);

    const [detailAnnouncement, setDetailAnnouncement] = useState(null);
    // Tracks the ?id= from a notification link so we only try to auto-open
    // it once, even after the announcement list refreshes.
    const [pendingDetailId, setPendingDetailId] = useState(null);
    const location = useLocation();
    const history = useHistory();

    // Watched so expiry_date's disabledDate can react live to publish_date,
    // and so the submit button/alert can reflect what will actually happen.
    const watchedPublishDate = Form.useWatch("publish_date", form);
    const watchedStatus = Form.useWatch("status", form);

    const isFutureDated = (date) =>
        !!date && dayjs(date).startOf("day").isAfter(dayjs().startOf("day"));

    // The "Publish" button used to say "Publish" no matter what — even when
    // the picked publish_date was weeks out, or status was still Draft —
    // which is exactly how announcements ended up invisible to alumni while
    // looking "done" to the admin. The label now always matches what will
    // actually happen on submit.
    const submitLabel = useMemo(() => {
        if (editingAnnouncement) return "Save Changes";
        if (!watchedStatus) return "Save";
        if (watchedStatus === "draft") return "Save as Draft";
        if (watchedStatus === "published" && isFutureDated(watchedPublishDate)) {
            return `Schedule for ${dayjs(watchedPublishDate).format("MMM D, YYYY")}`;
        }
        return "Publish";
    }, [editingAnnouncement, watchedStatus, watchedPublishDate]);

    const announcements = data?.data || [];

    // Publish date can never be in the past.
    const disablePastDates = (current) =>
        current && current < dayjs().startOf("day");

    // Expiry date can't be before today, and can't be before whatever
    // publish date is currently picked — the two fields are linked.
    const disableExpiryDates = (current) => {
        if (!current) return false;
        const today = dayjs().startOf("day");
        const minDate = watchedPublishDate
            ? dayjs(watchedPublishDate).startOf("day")
            : today;
        const floor = minDate.isAfter(today) ? minDate : today;
        return current < floor;
    };

    const handlePublishDateChange = (value) => {
        const expiry = form.getFieldValue("expiry_date");
        if (value && expiry && dayjs(expiry).isBefore(dayjs(value), "day")) {
            // The previously-picked expiry date no longer makes sense
            // against the new publish date, so clear it instead of
            // silently keeping an invalid combination.
            form.setFieldsValue({ expiry_date: null });
            message.info("Expiry date was cleared since it was before the new publish date.");
        }
    };

    const stats = useMemo(() => {
        return {
            total: announcements.length,
            published: announcements.filter((a) => a.status === "published").length,
            pinned: announcements.filter((a) => a.pinned).length,
            categories: new Set(announcements.map((a) => a.category || "general")).size,
        };
    }, [announcements]);

    const filtered = useMemo(() => {
        return announcements.filter((a) => {
            const matchesSearch =
                !search ||
                a.title?.toLowerCase().includes(search.toLowerCase()) ||
                a.content?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory =
                categoryFilter === "all" || a.category === categoryFilter;
            const matchesStatus = isAdmin
                ? statusFilter === "all" || a.status === statusFilter
                : a.status === "published";
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [announcements, search, categoryFilter, statusFilter, isAdmin]);

    const refresh = () => queryClient.invalidateQueries(["announcements"]);

    // Normalizes form values + files into a comparable string. Dates are
    // formatted (not left as dayjs objects) so two separately-created dayjs
    // instances for the same day compare equal.
    const snapshotFormState = (values, files) =>
        JSON.stringify({
            title: values.title || "",
            content: values.content || "",
            category: values.category || null,
            status: values.status || null,
            pinned: !!values.pinned,
            publish_date: values.publish_date
                ? dayjs(values.publish_date).format("YYYY-MM-DD")
                : null,
            expiry_date: values.expiry_date
                ? dayjs(values.expiry_date).format("YYYY-MM-DD")
                : null,
            files: (files || []).map((f) => f.url || f.uid),
        });

    // True if the form's current state differs from what it was when the
    // modal was opened — covers both a blank create form being filled in
    // and an edit form being changed away from its original values. Since
    // Category/Status start unselected on create (no more "General"/"Draft"
    // defaults), this plain comparison is enough: touching nothing keeps the
    // snapshot identical, so Cancel/X closes right away with no prompt.
    const isFormDirty = () => {
        if (initialSnapshotRef.current === null) return false;
        return (
            snapshotFormState(form.getFieldsValue(), fileList) !==
            initialSnapshotRef.current
        );
    };

    const openCreateForm = () => {
        setEditingAnnouncement(null);
        setFileList([]);
        form.resetFields();
        form.setFieldsValue({
            category: undefined,
            status: undefined,
            pinned: false,
        });
        initialSnapshotRef.current = snapshotFormState(form.getFieldsValue(), []);
        setFormVisible(true);
    };

    const openEditForm = (announcement) => {
        setEditingAnnouncement(announcement);
        const initialFiles = (announcement.image_urls || []).map((url, idx) => ({
            uid: `existing-${idx}`,
            name: `image-${idx}`,
            status: "done",
            url,
        }));
        setFileList(initialFiles);
        form.setFieldsValue({
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            status: announcement.status,
            pinned: announcement.pinned,
            publish_date: announcement.publish_date ? dayjs(announcement.publish_date) : null,
            expiry_date: announcement.expiry_date ? dayjs(announcement.expiry_date) : null,
        });
        initialSnapshotRef.current = snapshotFormState(
            form.getFieldsValue(),
            initialFiles
        );
        setFormVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axiosConfig.delete(`/announcements/${id}`);
            message.success("Announcement deleted");
            refresh();
        } catch (err) {
            message.error(
                err?.response?.data?.message || "Failed to delete announcement"
            );
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const payload = new FormData();
            payload.append("title", values.title);
            payload.append("content", values.content);
            payload.append("category", values.category || "general");
            payload.append("status", values.status || "draft");
            payload.append("pinned", values.pinned ? 1 : 0);
            if (values.publish_date) {
                payload.append("publish_date", values.publish_date.format("YYYY-MM-DD"));
            }
            if (values.expiry_date) {
                payload.append("expiry_date", values.expiry_date.format("YYYY-MM-DD"));
            }

            // Existing images kept (edit mode) + any newly picked files.
            // 'images_touched' always gets sent (even when the list is now
            // empty) so the backend can tell "removed every image" apart
            // from "the image field was never part of this request" —
            // otherwise an empty existing_images[] never arrives at all and
            // the backend has no way to distinguish the two cases.
            payload.append("images_touched", "1");

            const existingUrls = fileList
                .filter((f) => f.status === "done" && f.url)
                .map((f) => f.url);
            existingUrls.forEach((url) => payload.append("existing_images[]", url));

            fileList
                .filter((f) => f.originFileObj)
                .forEach((f) => payload.append("images[]", f.originFileObj));

            if (editingAnnouncement) {
                await axiosConfig.post(
                    `/announcements/${editingAnnouncement.id}?_method=PUT`,
                    payload,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                message.success("Announcement updated successfully!");
            } else {
                await axiosConfig.post(`/announcements`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                message.success("Announcement created successfully!");
            }

            initialSnapshotRef.current = null;
            setFormVisible(false);
            refresh();
        } catch (err) {
            if (err?.errorFields) return; // form validation error, already shown inline
            message.error(
                err?.response?.data?.message || "Failed to save announcement"
            );
        } finally {
            setSaving(false);
        }
    };

    // Smart close: clicking the X or the backdrop only closes right away
    // if nothing has changed since the modal opened. Otherwise we ask first.
    const handleFormCancel = () => {
        if (isFormDirty()) {
            setIsDiscardConfirmVisible(true);
            return;
        }
        setFormVisible(false);
    };

    const handleContinueEditing = () => {
        setIsDiscardConfirmVisible(false);
    };

    const handleDiscardChanges = () => {
        setIsDiscardConfirmVisible(false);
        setFormVisible(false);
    };

    // Coming from a notification link (?id=123): grab the id once on mount.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("id");
        if (id) setPendingDetailId(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Once the announcement list has loaded, open the linked announcement
    // (if it's findable — e.g. still published and not deleted) and then
    // clean the ?id= off the URL so re-navigating here doesn't reopen it.
    useEffect(() => {
        if (!pendingDetailId || announcements.length === 0) return;
        const match = announcements.find(
            (a) => String(a.id) === String(pendingDetailId)
        );
        if (match) {
            setDetailAnnouncement(match);
            axiosConfig.get(`/announcements/${match.id}`).catch(() => {});
        } else {
            message.warning("That announcement is no longer available.");
        }
        setPendingDetailId(null);
        history.replace("/announcements");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingDetailId, announcements]);

    const openDetail = async (announcement) => {
        setDetailAnnouncement(announcement);
        try {
            // Hits show(), which increments the view counter for alumni.
            await axiosConfig.get(`/announcements/${announcement.id}`);
        } catch (_) {
            // Non-fatal — detail is already shown from the list payload.
        }
    };

    return (
        <Layout>
            <div className="alumni-events-container ann-page">
                {/* Header Section — Modern Hero (same markup/classes as AlumniEvents.js) */}
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
                                    icon={<NotificationOutlined />}
                                >
                                    ANNOUNCEMENTS HUB
                                </Tag>
                                <Text className="ae-hero__eyebrow">
                                    Alumni Tracing Management System
                                </Text>
                            </div>
                        </div>

                        <Title className="ae-hero__title">
                            Alumni Announcements &amp;{" "}
                            <span className="grad-text">Updates</span>
                        </Title>

                        <Paragraph className="ae-hero__lead">
                            {isAdmin
                                ? "Create and manage announcements for all alumni, keep the community informed, and highlight what matters most."
                                : "Stay up to date with the latest news, updates, and important notices from the alumni office."}
                        </Paragraph>

                        <div className="ae-hero__stats">
                            <div className="ae-stat">
                                <span className="ae-stat__icon">
                                    <NotificationOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.total}
                                    </span>
                                    <span className="ae-stat__label">
                                        Total Announcements
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--blue">
                                    <CheckCircleOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.published}
                                    </span>
                                    <span className="ae-stat__label">
                                        Published
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--green">
                                    <PushpinOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.pinned}
                                    </span>
                                    <span className="ae-stat__label">
                                        Pinned
                                    </span>
                                </div>
                            </div>
                            <div className="ae-stat">
                                <span className="ae-stat__icon ae-stat__icon--gray">
                                    <TagOutlined />
                                </span>
                                <div className="ae-stat__body">
                                    <span className="ae-stat__value">
                                        {stats.categories}
                                    </span>
                                    <span className="ae-stat__label">
                                        Categories
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="ann-toolbar">
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Search announcements..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ann-search"
                    />
                    <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        className="ann-filter"
                    >
                        <Option value="all">All categories</Option>
                        {CATEGORY_OPTIONS.map((c) => (
                            <Option key={c.value} value={c.value}>
                                {c.label}
                            </Option>
                        ))}
                    </Select>
                    {isAdmin && (
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="ann-filter"
                        >
                            <Option value="all">All statuses</Option>
                            {STATUS_OPTIONS.map((s) => (
                                <Option key={s.value} value={s.value}>
                                    {s.label}
                                </Option>
                            ))}
                        </Select>
                    )}
                    {isAdmin && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            className="ann-new-btn"
                            onClick={openCreateForm}
                        >
                            New Announcement
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <CardSkeletonGrid
                        variant="gallery"
                        count={6}
                        containerClassName="ann-grid"
                    />
                ) : filtered.length === 0 ? (
                    <Empty
                        description="No announcements found"
                        className="ann-empty"
                    />
                ) : (
                    <div className={`ann-grid ${isFetching ? "ann-grid-fetching" : ""}`}>
                        {filtered.map((a) => {
                            const cat = categoryMeta(a.category);
                            const stat = statusMeta(a.status);
                            const thumb = a.image_urls?.[0];

                            return (
                                <div
                                    key={a.id}
                                    className={`ann-card ${a.pinned ? "ann-card-pinned" : ""}`}
                                    onClick={() => openDetail(a)}
                                >
                                    {a.pinned && (
                                        <div className="ann-pin-badge">
                                            <PushpinFilled /> Pinned
                                        </div>
                                    )}

                                    {isAdmin && isScheduled(a) && (
                                        <div className="ann-scheduled-badge">
                                            <CalendarOutlined /> Scheduled
                                        </div>
                                    )}

                                    {thumb ? (
                                        <div className="ann-card-image">
                                            <img src={thumb} alt={a.title} />
                                        </div>
                                    ) : (
                                        <div className={`ann-card-image ann-card-image-placeholder ann-cat-${a.category || "general"}`}>
                                            <NotificationOutlined />
                                        </div>
                                    )}

                                    <div className="ann-card-body">
                                        <div className="ann-card-tags">
                                            <Tag color={cat.color}>{cat.label}</Tag>
                                            {isAdmin && (
                                                <Tag color={stat.color}>{stat.label}</Tag>
                                            )}
                                            {isAdmin && isScheduled(a) && (
                                                <Tag color="blue" icon={<CalendarOutlined />}>
                                                    Live {dayjs(a.publish_date).format("MMM D, YYYY")}
                                                </Tag>
                                            )}
                                        </div>

                                        <Title level={4} className="ann-card-title">
                                            {a.title}
                                        </Title>

                                        <Paragraph className="ann-card-excerpt" ellipsis={{ rows: 3 }}>
                                            {a.content}
                                        </Paragraph>

                                        <div className="ann-card-footer">
                                            <span className="ann-card-date">
                                                <CalendarOutlined />{" "}
                                                {a.publish_date
                                                    ? dayjs(a.publish_date).format("MMM D, YYYY")
                                                    : dayjs(a.created_at).format("MMM D, YYYY")}
                                            </span>

                                            {isAdmin ? (
                                                <div
                                                    className="ann-card-actions"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Tooltip title="Views">
                                                        <span className="ann-views">
                                                            <EyeOutlined /> {a.views_count ?? 0}
                                                        </span>
                                                    </Tooltip>
                                                    <Button
                                                        type="text"
                                                        icon={<EditOutlined />}
                                                        onClick={() => openEditForm(a)}
                                                    />
                                                    <Popconfirm
                                                        title="Delete this announcement?"
                                                        onConfirm={() => handleDelete(a.id)}
                                                        okText="Delete"
                                                        okButtonProps={{ danger: true }}
                                                    >
                                                        <Button type="text" danger icon={<DeleteOutlined />} />
                                                    </Popconfirm>
                                                </div>
                                            ) : (
                                                <Button type="link" className="ann-read-more">
                                                    Read more
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create / Edit modal (admin only) */}
            <Modal
                title={editingAnnouncement ? "Edit Announcement" : "New Announcement"}
                open={formVisible}
                onCancel={handleFormCancel}
                onOk={handleSubmit}
                okText={submitLabel}
                confirmLoading={saving}
                width={640}
                destroyOnClose
                className="ann-modal"
            >
                <Form form={form} layout="vertical">
                    {watchedStatus === "published" && isFutureDated(watchedPublishDate) && (
                        <Alert
                            type="info"
                            showIcon
                            className="ann-schedule-alert"
                            message={`Scheduled — alumni won't see this until ${dayjs(
                                watchedPublishDate
                            ).format("MMMM D, YYYY")}.`}
                        />
                    )}
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Please enter a title" }]}
                    >
                        <Input placeholder="e.g. Homecoming 2026 Registration Now Open" />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Content"
                        rules={[{ required: true, message: "Please enter the announcement content" }]}
                    >
                        <TextArea rows={5} placeholder="Write the full announcement here..." />
                    </Form.Item>

                    <div className="ann-form-row">
                        <Form.Item
                            name="category"
                            label="Category"
                            className="ann-form-col"
                            rules={[{ required: true, message: "Please select a category" }]}
                        >
                            <Select placeholder="Select category">
                                {CATEGORY_OPTIONS.map((c) => (
                                    <Option key={c.value} value={c.value}>
                                        {c.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="Status"
                            className="ann-form-col"
                            rules={[{ required: true, message: "Please select a status" }]}
                        >
                            <Select placeholder="Select status">
                                {STATUS_OPTIONS.map((s) => (
                                    <Option key={s.value} value={s.value}>
                                        {s.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="pinned" label="Pin to top" valuePropName="checked" className="ann-form-col">
                            <Switch />
                        </Form.Item>
                    </div>

                    <div className="ann-form-row">
                        <Form.Item
                            name="publish_date"
                            label="Publish date"
                            className="ann-form-col"
                            tooltip="Can't be set in the past."
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                disabledDate={disablePastDates}
                                onChange={handlePublishDateChange}
                            />
                        </Form.Item>

                        <Form.Item
                            name="expiry_date"
                            label="Expiry date (optional)"
                            className="ann-form-col"
                            tooltip="Must be on or after the publish date."
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                disabledDate={disableExpiryDates}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item label="Image (optional)">
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            beforeUpload={() => false}
                            onChange={({ fileList: fl }) => setFileList(fl)}
                            onRemove={(file) =>
                                setFileList((fl) => fl.filter((f) => f.uid !== file.uid))
                            }
                        >
                            {fileList.length >= 4 ? null : (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Smart Close / Discard Changes Confirmation */}
            <Modal
                title={
                    <Space>
                        <WarningOutlined
                            style={{ color: "var(--warning, #f59e0b)", fontSize: "22px" }}
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
                    You have unsaved changes. Are you sure you want to discard
                    your progress?
                </p>
            </Modal>

            {/* Detail view (everyone) */}
            <Modal
                title={null}
                open={!!detailAnnouncement}
                onCancel={() => setDetailAnnouncement(null)}
                footer={null}
                width={640}
                className="ann-modal ann-detail-modal"
            >
                {detailAnnouncement && (
                    <div className="ann-detail">
                        <div className="ann-detail-tags">
                            <Tag color={categoryMeta(detailAnnouncement.category).color}>
                                {categoryMeta(detailAnnouncement.category).label}
                            </Tag>
                            {detailAnnouncement.pinned && (
                                <Tag icon={<PushpinOutlined />} color="gold">
                                    Pinned
                                </Tag>
                            )}
                        </div>
                        <Title level={3}>{detailAnnouncement.title}</Title>
                        <Text type="secondary">
                            <CalendarOutlined />{" "}
                            {dayjs(
                                detailAnnouncement.publish_date || detailAnnouncement.created_at
                            ).format("MMMM D, YYYY")}
                        </Text>

                        {detailAnnouncement.image_urls?.length > 0 ? (
                            <div className="ann-detail-images">
                                <Image.PreviewGroup>
                                    {detailAnnouncement.image_urls.map((url, idx) => (
                                        <Image key={idx} src={url} width={120} />
                                    ))}
                                </Image.PreviewGroup>
                            </div>
                        ) : (
                            <div className={`ann-detail-placeholder ann-cat-${detailAnnouncement.category || "general"}`}>
                                <NotificationOutlined />
                            </div>
                        )}

                        <Paragraph className="ann-detail-content">
                            {detailAnnouncement.content}
                        </Paragraph>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}