import { useState, useEffect, useRef } from "react"
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { Layout } from "~/components"
import {
  useDepartmentHeads,
  useCreateDepartmentHead,
  useUpdateDepartmentHead,
  useDeleteDepartmentHead,
} from "~/hooks/useDepartmentHeads"
import useCourses from "~/hooks/useCourses"
import moment from "moment"
import secureLocalStorage from "react-secure-storage"
import "./DepartmentHeadsPage.css"
import beedLogo from "~/assets/images/beed-logo.png";
import bsbaLogo from "~/assets/images/bsba-logo.png";
import bsitLogo from "~/assets/images/bsit-logo.jpg";
import educLogo from "~/assets/images/educ-logo.png";


const { Title, Text } = Typography
const { Option } = Select

const courseColors = {
  1: "#f5222d",
  2: "#1890ff",
  3: "#1890ff",
  4: "#faad14",
}

const courseLogos = {
  BEED: beedLogo,
  BSBA: bsbaLogo,
  BSIT: bsitLogo,
  BSEd: educLogo,
};

// ============ ONLINE / OFFLINE STATUS HELPERS (same pattern as AlumniList.js) ============
const getLastActiveStatus = (lastActive, isOnline) => {
  const now = moment()
  const lastActiveTime = lastActive ? moment(lastActive) : null

  const HEARTBEAT_GRACE_MINUTES = 5

  const isGenuinelyOnline =
    isOnline &&
    lastActiveTime !== null &&
    now.diff(lastActiveTime, "minutes") < HEARTBEAT_GRACE_MINUTES

  if (isGenuinelyOnline) {
    return {
      status: "active",
      color: "#52c41a",
      text: "Active now",
      dotColor: "#52c41a",
    }
  }

  if (!lastActive) {
    return {
      status: "offline",
      color: "#ff4d4f",
      text: "Never active",
      dotColor: "#ff4d4f",
    }
  }

  const diffSeconds = now.diff(lastActiveTime, "seconds")
  const diffMinutes = now.diff(lastActiveTime, "minutes")
  const diffHours = now.diff(lastActiveTime, "hours")
  const diffDays = now.diff(lastActiveTime, "days")
  const diffWeeks = now.diff(lastActiveTime, "weeks")
  const diffMonths = now.diff(lastActiveTime, "months")
  const diffYears = now.diff(lastActiveTime, "years")

  let timeText = ""

  if (diffSeconds < 60) {
    timeText = diffSeconds <= 1 ? "Just now" : `${diffSeconds} seconds ago`
  } else if (diffMinutes < 60) {
    timeText = diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`
  } else if (diffHours < 24) {
    timeText = diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`
  } else if (diffDays < 7) {
    timeText = diffDays === 1 ? "1 day ago" : `${diffDays} days ago`
  } else if (diffWeeks < 4) {
    timeText = diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`
  } else if (diffMonths < 12) {
    timeText = diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`
  } else {
    timeText = diffYears === 1 ? "1 year ago" : `${diffYears} years ago`
  }

  return {
    status: "offline",
    color: "#ff4d4f",
    text: timeText,
    dotColor: "#ff4d4f",
  }
}

const LastActiveIndicator = ({ lastActive, isOnline }) => {
  const statusInfo = getLastActiveStatus(lastActive, isOnline)

  return (
    <div
      className="last-active-indicator"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
    >
      <span
        className="status-dot"
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: statusInfo.dotColor,
          display: "inline-block",
          boxShadow:
            statusInfo.status === "active"
              ? `0 0 8px ${statusInfo.dotColor}, 0 0 12px ${statusInfo.dotColor}`
              : "none",
          animation: statusInfo.status === "active" ? "pulse-green 2s infinite" : "none",
        }}
      />
      <Text
        type="secondary"
        style={{
          color: statusInfo.color,
          fontSize: "11px",
          fontWeight: statusInfo.status === "active" ? 600 : 400,
        }}
      >
        {statusInfo.text}
      </Text>
    </div>
  )
}
// ============ END ONLINE / OFFLINE STATUS HELPERS ============

const DepartmentHeadsPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [isDiscardConfirmVisible, setIsDiscardConfirmVisible] = useState(false)
  const initialSnapshotRef = useRef(null)
  const [form] = Form.useForm()

  const { data: departmentHeads = [], isLoading } = useDepartmentHeads()
  const { data: courses = [] } = useCourses()
  const createMutation = useCreateDepartmentHead()
  const updateMutation = useUpdateDepartmentHead()
  const deleteMutation = useDeleteDepartmentHead()

  // Normalizes the form's current values into a comparable string so we can
  // tell whether anything has actually changed since the modal was opened.
  const snapshotFormState = (values) =>
    JSON.stringify({
      name: values.name || "",
      email: values.email || "",
      password: values.password || "",
      course_id: values.course_id || null,
    })

  // True if the form's current state differs from what it was when the
  // modal was opened — covers both a blank create form being filled in and
  // an edit form being changed away from its original values.
  const isFormDirty = () => {
    if (initialSnapshotRef.current === null) return false
    return snapshotFormState(form.getFieldsValue()) !== initialSnapshotRef.current
  }

  const handleOpenModal = (record = null) => {
    setEditingRecord(record)
    if (record) {
      form.setFieldsValue({
        name: record.name,
        email: record.email,
        course_id: record.course_id,
      })
    } else {
      form.resetFields()
    }
    initialSnapshotRef.current = snapshotFormState(form.getFieldsValue())
    setIsModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setEditingRecord(null)
    form.resetFields()
    initialSnapshotRef.current = null
  }

  // Smart close: clicking the X, backdrop, or Cancel only closes right away
  // if nothing has changed since the modal opened. Otherwise we ask first.
  const handleModalCancel = () => {
    if (isFormDirty()) {
      setIsDiscardConfirmVisible(true)
      return
    }
    handleCloseModal()
  }

  const handleContinueEditing = () => {
    setIsDiscardConfirmVisible(false)
  }

  const handleDiscardChanges = () => {
    setIsDiscardConfirmVisible(false)
    handleCloseModal()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await updateMutation.mutateAsync({
          id: editingRecord.id,
          data: values,
        })
      } else {
        await createMutation.mutateAsync(values)
      }
      handleCloseModal()
    } catch (error) {
      console.error("Validation failed:", error)
    }
  }

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id)
  }

  const assignedCourseIds = departmentHeads.map((dh) => dh.course_id)

  const getAvailableCourses = () => {
    if (editingRecord) {
      return courses.filter(
        (course) => course.id === editingRecord.course_id || !assignedCourseIds.includes(course.id),
      )
    }
    return courses.filter((course) => !assignedCourseIds.includes(course.id))
  }

  const assignedCount = assignedCourseIds.length
  const unassignedCount = Math.max(courses.length - assignedCount, 0)
  const coveragePct = courses.length
    ? Math.round((assignedCount / courses.length) * 100)
    : 0

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      fixed: "left",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 210,
      ellipsis: true,
    },
    {
      title: "Department",
      key: "course",
      width: 240,
      render: (_, record) => {
        const label = `${record.course?.course_code || "N/A"} — ${record.course?.course_name || "N/A"}`
        return (
          <Tag
            color={courseColors[record.course_id] || "default"}
            icon={<BookOutlined />}
            title={label}
            style={{
              fontWeight: 600,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
              verticalAlign: "middle",
            }}
          >
            {label}
          </Tag>
        )
      },
    },
    {
      title: "Status",
      key: "online_status",
      width: 140,
      render: (_, record) => {
        const statusInfo = getLastActiveStatus(
          record.last_active_at || record.last_active || record.updated_at,
          record.is_online || false,
        )
        return (
          <Space size={6}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: statusInfo.dotColor,
                display: "inline-block",
                flexShrink: 0,
                boxShadow:
                  statusInfo.status === "active"
                    ? `0 0 8px ${statusInfo.dotColor}, 0 0 12px ${statusInfo.dotColor}`
                    : "none",
              }}
            />
            <Text style={{ color: statusInfo.color, fontSize: 12, whiteSpace: "nowrap" }}>
              {statusInfo.text}
            </Text>
          </Space>
        )
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (date) => (
        <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
          {moment(date).format("MMM DD, YYYY")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            style={{ paddingInline: 6 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Department Head"
            description="Are you sure you want to delete this department head?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ paddingInline: 6 }}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Layout>
      <div className="department-heads-page">
        {/* ============ HERO HEADER (matches AlumniQuestionsPage) ============ */}
        <div className="dh-hero">
          <div className="dh-hero__bg" aria-hidden="true">
            <span className="dh-orb dh-orb-1" />
            <span className="dh-orb dh-orb-2" />
            <span className="dh-orb dh-orb-3" />
            <div className="dh-grid-overlay" />
          </div>

          <div className="dh-hero__content">
            <div className="dh-hero__left">
              <Tag className="dh-chip">
                <ApartmentOutlined /> Administrative Management
              </Tag>
              <Title level={2} className="dh-hero__title">
                Manage Your{" "}
                <span className="dh-grad-text">Department Heads</span>
              </Title>
              <Text className="dh-hero__lead">
                Create, assign, and oversee department head accounts for every course and
                program — a single, structured workspace built for admins.
              </Text>
            </div>

            <div className="dh-hero__actions">
              <Button
                className="dh-btn-primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => handleOpenModal()}
                disabled={getAvailableCourses().length === 0}
              >
                Create Department Head
              </Button>
            </div>
          </div>
        </div>
        {/* ============ /HERO HEADER ============ */}

        {/* ============ STAT CARDS ============ */}
        <div className="dh-stats-grid">
          <div className="dh-stat">
            <div className="dh-stat__icon dh-stat__icon--indigo">
              <TeamOutlined />
            </div>
            <div className="dh-stat__body">
              <div className="dh-stat__label">Total Department Heads</div>
              <div className="dh-stat__value">{departmentHeads.length}</div>
              <div className="dh-stat__hint">Active administrator accounts</div>
            </div>
          </div>

          <div className="dh-stat">
            <div className="dh-stat__icon dh-stat__icon--sky">
              <BookOutlined />
            </div>
            <div className="dh-stat__body">
              <div className="dh-stat__label">Total Courses</div>
              <div className="dh-stat__value">{courses.length}</div>
              <div className="dh-stat__hint">Programs available to assign</div>
            </div>
          </div>

          <div className="dh-stat">
            <div className="dh-stat__icon dh-stat__icon--green">
              <CheckCircleOutlined />
            </div>
            <div className="dh-stat__body">
              <div className="dh-stat__label">Assigned Courses</div>
              <div className="dh-stat__value">
                {assignedCount}
                <span className="dh-stat__value-sub"> / {courses.length}</span>
              </div>
              <div className="dh-stat__progress">
                <span
                  className="dh-stat__progress-bar dh-stat__progress-bar--green"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
              <div className="dh-stat__hint">{coveragePct}% coverage</div>
            </div>
          </div>

          <div className="dh-stat">
            <div className="dh-stat__icon dh-stat__icon--red">
              <CloseCircleOutlined />
            </div>
            <div className="dh-stat__body">
              <div className="dh-stat__label">Unassigned Courses</div>
              <div className="dh-stat__value">{unassignedCount}</div>
              <div className="dh-stat__hint">Needs a department head</div>
            </div>
          </div>
        </div>

        {/* ============ DEPARTMENT OVERVIEW ============ */}
        <div className="dh-section">
          <div className="dh-section__header">
            <div className="dh-section__title">
              <ApartmentOutlined className="dh-section__title-icon" />
              <span>Department Overview</span>
            </div>
            <div className="dh-section__legend">
              <span className="dh-legend"><span className="dh-legend-dot dh-legend-dot--assigned" /> Assigned</span>
              <span className="dh-legend"><span className="dh-legend-dot dh-legend-dot--unassigned" /> Unassigned</span>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {courses.map((course) => {
              const head = departmentHeads.find((dh) => dh.course_id === course.id)
              const isAssigned = Boolean(head)
              return (
                <Col xs={24} sm={12} md={12} lg={6} key={course.id}>
                  <div
                    className={`dh-dept-card ${isAssigned ? "is-assigned" : "is-unassigned"}`}
                    style={{ "--dh-dept-accent": courseColors[course.id] || "#94a3b8" }}
                  >
                    <div className="dh-dept-card__top">
                      <span className="dh-dept-card__code">{course.course_code}</span>
                      <span className={`dh-dept-card__status ${isAssigned ? "ok" : "warn"}`}>
                        {isAssigned ? (
                          <>
                            <CheckCircleOutlined /> Assigned
                          </>
                        ) : (
                          <>
                            <CloseCircleOutlined /> Vacant
                          </>
                        )}
                      </span>
                    </div>

                    <div className="dh-dept-card__name" title={course.course_name}>
                      {course.course_name}
                    </div>

                    <div className="dh-dept-card__divider" />

                    <div className="dh-dept-card__foot">
                      {isAssigned ? (
                        <>
                          <div className="dh-dept-card__head">
                           <div className="dh-dept-card__avatar">
  {courseLogos[course.course_code] ? (
    <img
      src={courseLogos[course.course_code]}
      alt={course.course_code}
      className="dh-dept-card__avatar-img"
    />
  ) : (
    (head.name || "?").trim().charAt(0).toUpperCase()
  )}
</div>
                            <div className="dh-dept-card__head-meta">
                              <div className="dh-dept-card__head-name">{head.name}</div>
                              <div className="dh-dept-card__head-role">Department Head</div>
                            </div>
                          </div>
                          <LastActiveIndicator
                            lastActive={head.last_active_at || head.last_active || head.updated_at}
                            isOnline={head.is_online || false}
                          />
                        </>
                      ) : (
                        <div className="dh-dept-card__empty">
                          <UserOutlined /> No head assigned yet
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>
        </div>

        {/* ============ DEPARTMENT HEADS LIST ============ */}
        <Card
          title={
            <Space>
              <TeamOutlined style={{ color: "#4f46e5" }} />
              <span>Department Heads List</span>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={departmentHeads}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} department heads`,
            }}
            scroll={{ x: 1060 }}
          />
        </Card>

        {/* ============ MODAL ============ */}
        <Modal
          title={editingRecord ? "Edit Department Head" : "Create Department Head"}
          open={isModalVisible}
          onCancel={handleModalCancel}
          onOk={handleSubmit}
          confirmLoading={createMutation.isLoading || updateMutation.isLoading}
          width={520}
          okText={editingRecord ? "Update" : "Create"}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: "Please enter the name" }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter full name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please enter the email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="Enter email address" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  required: !editingRecord,
                  message: "Please enter a password",
                },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                placeholder={
                  editingRecord ? "Leave blank to keep current password" : "Enter password"
                }
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="course_id"
              label="Department / Course"
              rules={[{ required: true, message: "Please select a course" }]}
            >
              <Select
                placeholder="Select department/course"
                size="large"
                popupClassName="dh-course-select-dropdown"
              >
                {getAvailableCourses().map((course) => (
                  <Option key={course.id} value={course.id}>
                    <Tag color={courseColors[course.id]}>{course.course_code}</Tag>
                    <span className="dh-course-option-name">{course.course_name}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Smart Close / Discard Changes Confirmation */}
        <Modal
          title={
            <Space>
              <WarningOutlined style={{ color: "var(--warning, #f59e0b)", fontSize: "22px" }} />
              <span>Discard Changes?</span>
            </Space>
          }
          open={isDiscardConfirmVisible}
          onCancel={handleContinueEditing}
          footer={[
            <Button key="continue" onClick={handleContinueEditing}>
              Continue Editing
            </Button>,
            <Button key="discard" danger type="primary" onClick={handleDiscardChanges}>
              Discard Changes
            </Button>,
          ]}
          centered
        >
          <p style={{ margin: 0 }}>
            You have unsaved changes. Are you sure you want to discard your progress?
          </p>
        </Modal>
      </div>
    </Layout>
  )
}

export default DepartmentHeadsPage