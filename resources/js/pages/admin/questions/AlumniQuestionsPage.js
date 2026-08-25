"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Typography,
  Space,
  Tabs,
  Form,
  Radio,
  Rate,
  Upload,
  message,
  Modal,
  List,
  Tag,
  Switch,
  Tooltip,
  Popconfirm,
  Image,
  Table,
  Badge,
  Drawer,
  Empty,
  Statistic,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PictureOutlined,
  StarOutlined,
  UnorderedListOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  MenuOutlined,
  FullscreenOutlined,
  CheckSquareOutlined,
  OrderedListOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { Layout } from "~/components"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import "./QuestionsPage.css"
import axiosConfig from "~/utils/axiosConfig"
import useQuestions from "~/hooks/useQuestions"
import useQuiz from "~/hooks/useQuiz"
import useQuizResult from "~/hooks/useQuizResult"
import secureLocalStorage from "react-secure-storage"

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

// On touch devices (phones/tablets, portrait or landscape), antd Tooltip
// has no real "hover" to leave, so tapping an icon leaves the tooltip
// popup stuck open on top of the page — it never gets a mouseleave to
// close it. Same fix already used in index.js / AlumniList.js: detect
// touch capability and force the tooltip off (trigger=[] / open=false)
// instead of relying on hover, since these devices don't need hover
// tooltips anyway.
const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const hasTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0))
    setIsTouchDevice(!!hasTouch)
  }, [])

  return isTouchDevice
}

// Normalize Upload's value so AntD shows existing images
const normalizeUploadFile = (e) => {
  if (Array.isArray(e)) return e
  return e && e.fileList ? e : e
}

const AlumniQuestionsPage = () => {
  const isTouchDevice = useIsTouchDevice()
  const { isLoading, data: questions = [], isFetching, refetch } = useQuestions()
  const {
    isLoading: isLoadingQuizzes,
    data: quizzes = [],
    isFetching: isFetchingQuizzes,
    refetch: refetchQuizzes,
  } = useQuiz()

  const {
    isLoading: isLoadingQuizzesResult,
    data: quizzes_result = [],
    isFetching: isFetchingQuizzesResult,
    refetch: refetchQuizzesResult,
  } = useQuizResult()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [isDiscardConfirmVisible, setIsDiscardConfirmVisible] = useState(false)
  const initialSnapshotRef = useRef(null)
  const [activeTab, setActiveTab] = useState("quizzes-result")
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [isQuizDrawerVisible, setIsQuizDrawerVisible] = useState(false)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [title, setTitle] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isSaving, setIsSaving] = useState(false)
  const [form] = Form.useForm()

  const [isQuizDetailsModalVisible, setIsQuizDetailsModalVisible] = useState(false)
  const [viewingQuiz, setViewingQuiz] = useState(null)


  const questionTypes = [
    { value: "rate", label: "Rating Question", icon: <StarOutlined /> },
    {
      value: "abcd",
      label: "Multiple Choice (ABCD)",
      icon: <UnorderedListOutlined />,
    },
  ]

  const filteredQuestions = useMemo(() => {
    const list = Array.isArray(questions) ? questions : []

    return list.filter((question) => {
      const matchesSearch =
        question.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === "all" || question.type === filterType

      return matchesSearch && matchesType
    })
  }, [questions, searchTerm, filterType])

  // Normalizes the form's current values into a comparable string so we can
  // tell whether anything has actually changed since the modal was opened.
  const snapshotFormState = (values) => {
    const choices = (values.choices || []).map((choice) => ({
      letter: choice?.letter || "",
      interpretation: choice?.interpretation || "",
      image:
        choice?.image?.fileList?.[0]?.url ||
        choice?.image?.fileList?.[0]?.uid ||
        null,
    }))

    return JSON.stringify({
      type: values.type || "",
      question: values.question || "",
      description: values.description || "",
      required: !!values.required,
      choices: values.type === "abcd" ? choices : [],
    })
  }

  // True if the form's current state differs from what it was when the
  // modal was opened — covers both a blank create form being filled in and
  // an edit form being changed away from its original values.
  const isFormDirty = () => {
    if (initialSnapshotRef.current === null) return false
    return snapshotFormState(form.getFieldsValue()) !== initialSnapshotRef.current
  }

  // Show modal for adding/editing question
  const showModal = (question = null) => {
    setEditingQuestion(question)
    if (question) {
      // Prefer choices_with_urls (full image URL) over raw choices (storage path only)
      const sourceChoices =
        (question.choices_with_urls && question.choices_with_urls.length
          ? question.choices_with_urls
          : question.choices) || []

      const choices = sourceChoices.map((choice, i) => ({
        letter: choice.letter || String.fromCharCode(65 + i),
        interpretation: choice.interpretation || "",
        image: choice.image
          ? {
              fileList: [
                {
                  uid: `existing-${i}`,
                  name: `choice-${choice.letter || i}.jpg`,
                  status: "done",
                  url: choice.image, // full URL so the preview renders
                },
              ],
            }
          : undefined,
      }))

      form.setFieldsValue({
        type: question.type,
        question: question.question,
        description: question.description,
        required: question.required,
        choices,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        type: "rate",
        required: true,
      })
    }
    initialSnapshotRef.current = snapshotFormState(form.getFieldsValue())
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingQuestion(null)
    form.resetFields()
    initialSnapshotRef.current = null
  }

  // Smart close: clicking the X, backdrop, or Cancel only closes right away
  // if nothing has changed since the modal opened. Otherwise we ask first.
  const handleFormCancel = () => {
    if (isFormDirty()) {
      setIsDiscardConfirmVisible(true)
      return
    }
    handleCancel()
  }

  const handleContinueEditing = () => {
    setIsDiscardConfirmVisible(false)
  }

  const handleDiscardChanges = () => {
    setIsDiscardConfirmVisible(false)
    handleCancel()
  }

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const formData = new FormData()

      formData.append("type", values.type)
      formData.append("question", values.question)
      formData.append("description", values.description || "")
      formData.append("required", values.required)

      if (values.type === "abcd" && values.choices) {
        values.choices.forEach((choice, index) => {
          formData.append(
            `choices[${index}][interpretation]`,
            choice.interpretation || ""
          )
          formData.append(
            `choices[${index}][letter]`,
            choice.letter || String.fromCharCode(65 + index)
          )

          // Detect a freshly picked file in any of AntD Upload's shapes
          const fileList = choice.image?.fileList || []
          const newFile =
            fileList.find((f) => f.originFileObj)?.originFileObj ||
            choice.image?.file?.originFileObj ||
            (choice.image?.file instanceof File ? choice.image.file : null)

          if (newFile) {
            formData.append(`choices[${index}][image]`, newFile)
          } else if (fileList[0]?.url) {
            // Keep existing image — pass URL back so backend doesn't wipe it
            formData.append(`choices[${index}][existing_image]`, fileList[0].url)
          }
        })
      }

      const endpoint = editingQuestion
        ? `/questions/${editingQuestion.id}`
        : "/questions"

      // Laravel: spoof PUT via _method when editing
      if (editingQuestion) {
        formData.append("_method", "PUT")
      }

      const response = await axiosConfig.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        refetch()
        message.success(
          editingQuestion
            ? "Question updated successfully!"
            : "Question added successfully!"
        )
      }

      handleCancel()
    } catch (error) {
      message.error("Failed to save question")
      console.error("❌ Error saving question:", error)
    }
  }

  const setActive = async (item) => {
    try {
      const formData = new FormData()
      formData.append("id", item?.id)
      formData.append("type", item?.type)

      const response = await axiosConfig.post("/quiz-active", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        refetchQuizzes()
        message.success("Quiz set active!")
      }
    } catch (error) {
      message.error("Failed to save question")
      console.error("❌ Error saving question:", error)
    }
  }

  const handleDelete = (questionId) => {
    message.success("Question removed in frontend only!")
    refetch({
      select: (old) => old.filter((q) => q.id !== questionId),
    })
  }

  const openQuizDrawer = (quiz = null) => {
    setCurrentQuiz(quiz)
    setQuizQuestions(quiz ? quiz.questions : [])
    setIsQuizDrawerVisible(true)
  }

  const closeQuizDrawer = () => {
    setIsQuizDrawerVisible(false)
    setCurrentQuiz(null)
    setQuizQuestions([])
    setSearchTerm("")
    setFilterType("all")
  }

  const addQuestionToQuiz = (question) => {
    if (quizQuestions.find((q) => q.id === question.id)) {
      message.warning("Question already added to quiz")
      return
    }

    setQuizQuestions((prev) => [
      ...prev,
      {
        ...question,
        displayOrder: prev.length + 1,
      },
    ])
    message.success("Question added to quiz")
  }

  const removeQuestionFromQuiz = (questionId) => {
    setQuizQuestions((prev) => prev.filter((q) => q.id !== questionId))
    message.success("Question removed from quiz")
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(quizQuestions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }))

    setQuizQuestions(updatedItems)
  }

  const saveQuiz = async () => {
    if (filterType === "all") {
      message.error("Please select a question category")
      return
    }

    if (!title?.trim()) {
      message.error("Please enter a quiz title")
      return
    }

    setIsSaving(true)
    const questionIds = quizQuestions.map((question) => question.id)
    try {
      const formData = new FormData()
      formData.append("type", filterType)
      formData.append("questions", questionIds)
      formData.append("title", title.trim())

      const response = await axiosConfig.post("/quizzes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        message.success("🎉 Quiz created successfully!")
        refetchQuizzes()
        closeQuizDrawer()
      }
    } catch (error) {
      message.error("❌ Failed to save quiz")
      console.error("Error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteQuiz = async (quizId) => {
    try {
      const { data } = await axiosConfig.delete(`/quizzes/${quizId}`)

      if (data.success) {
        message.success("Quiz deleted successfully!")
        refetchQuizzes()
      } else {
        message.error(data.message || "Failed to delete quiz")
      }
    } catch (error) {
      console.error("Quiz deletion error:", error)
      message.error("Deletion failed")
    }
  }

  const viewQuizDetails = (quiz) => {
    setViewingQuiz(quiz)
    setIsQuizDetailsModalVisible(true)
  }

  const closeQuizDetailsModal = () => {
    setIsQuizDetailsModalVisible(false)
    setViewingQuiz(null)
  }

  const quizColumns = [
    {
      title: "Quiz Name",
      dataIndex: "title",
      key: "title",
      width: 180,
      render: (text, record) => (
        <div className="quiz-name-cell">
          <Text strong className="quiz-name-cell__title">
            {text}
          </Text>
          <div className="quiz-name-cell__meta">
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.questions?.length || 0} questions • Updated{" "}
              {new Date(record.updated_at).toLocaleDateString()}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => {
        const color = type === "rate" ? "blue" : "green"
        return <Tag color={color}>{type}</Tag>
      },
    },
    {
      title: "Active ?",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive) => (isActive ? <Tag color="green">Yes</Tag> : null),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (_, record) => new Date(record.created_at).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip
            title="View Details"
            trigger={isTouchDevice ? [] : ["hover"]}
            open={isTouchDevice ? false : undefined}
          >
            <Button
              className="quiz-action-btn"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => viewQuizDetails(record)}
            />
          </Tooltip>
          <Tooltip
            title="Edit Quiz"
            trigger={isTouchDevice ? [] : ["hover"]}
            open={isTouchDevice ? false : undefined}
          >
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openQuizDrawer(record)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip
            title="Set Active"
            trigger={isTouchDevice ? [] : ["hover"]}
            open={isTouchDevice ? false : undefined}
          >
            <Button
              type="text"
              icon={<CheckSquareOutlined />}
              onClick={() => setActive(record)}
              style={{ color: "#52c41a" }}
            />
          </Tooltip>
          <Popconfirm
            title={<span>Delete Quiz</span>}
            description={<span>Are you sure you want to delete this quiz?</span>}
            onConfirm={() => deleteQuiz(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip
              title="Delete"
              trigger={isTouchDevice ? [] : ["hover"]}
              open={isTouchDevice ? false : undefined}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                style={{ color: "#ff4d4f" }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const questionColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 130,
      className: "qm-col-type",
      render: (type) => (
        <Tag
          color={type === "rate" ? "blue" : "green"}
          icon={type === "rate" ? <StarOutlined /> : <UnorderedListOutlined />}
          style={{ whiteSpace: "nowrap" }}
        >
          {type === "rate" ? "Rating" : "Multiple Choice"}
        </Tag>
      ),
    },
    {
      title: "Question",
      dataIndex: "question",
      key: "question",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => addQuestionToQuiz(record)}
          disabled={quizQuestions.find((q) => q.id === record.id)}
        >
          Add
        </Button>
      ),
    },
  ]

  const quizResultColumns = [
    {
      title: "Name",
      dataIndex: "user",
      key: "user",
      render: (record) => (
        <div>
          <Text strong>{record?.name}</Text>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => {
        const color = type === "rate" ? "blue" : "green"
        return <Tag color={color}>{type}</Tag>
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      align: "center",
      render: (_, record) => new Date(record.created_at).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip
            title="View Details"
            trigger={isTouchDevice ? [] : ["hover"]}
            open={isTouchDevice ? false : undefined}
          >
            <Button
              className="quiz-action-btn"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => viewQuizResultDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const [isQuizResultDetailsModalVisible, setIsQuizResultDetailsModalVisible] =
    useState(false)
  const [viewingQuizResult, setViewingQuizResult] = useState(null)

  const viewQuizResultDetails = (record) => {
    setViewingQuizResult(record)
    setIsQuizResultDetailsModalVisible(true)
  }

  const closeQuizResultDetailsModal = () => {
    setIsQuizResultDetailsModalVisible(false)
    setViewingQuizResult(null)
  }

  // ============ QUIZ RESULT SEARCH & FILTER ============
  const [quizResultSearch, setQuizResultSearch] = useState("")
  const [quizResultTypeFilter, setQuizResultTypeFilter] = useState("all")

  const filteredQuizResults = useMemo(() => {
    const list = Array.isArray(quizzes_result) ? quizzes_result : []
    return list.filter((record) => {
      const name = record.user?.name || ""
      const matchesSearch = name.toLowerCase().includes(quizResultSearch.toLowerCase())
      const matchesType =
        quizResultTypeFilter === "all" || record.type === quizResultTypeFilter
      return matchesSearch && matchesType
    })
  }, [quizzes_result, quizResultSearch, quizResultTypeFilter])
  // ============ END QUIZ RESULT SEARCH & FILTER ============

  return (
    <Layout>
      <div className="alumni-questions-container">
        {/* ===== Modern Hero Header ===== */}
        <div className="qm-hero">
          <div className="qm-hero__bg" aria-hidden="true">
            <span className="qm-orb qm-orb-1" />
            <span className="qm-orb qm-orb-2" />
            <span className="qm-orb qm-orb-3" />
            <div className="qm-grid-overlay" />
          </div>

          <div className="qm-hero__content">
            <div className="qm-hero__left">
              <Tag className="qm-chip">
                <QuestionCircleOutlined /> Quiz Management
              </Tag>
              <Title level={2} className="qm-hero__title">
                Build, Manage & Track{" "}
                <span className="qm-grad-text">Quizzes</span>
              </Title>
              <Text className="qm-hero__lead">
                Create engaging quizzes, organize questions, and monitor results — all in one
                clean, professional workspace built for alumni engagement.
              </Text>

              <div className="qm-hero__stats">
                <div className="qm-stat-card">
                  <span className="qm-stat-icon qm-stat-icon--blue">
                    <OrderedListOutlined />
                  </span>
                  <div className="qm-stat-meta">
                    <span className="qm-stat-value">{quizzes.length}</span>
                    <span className="qm-stat-label">Quizzes</span>
                  </div>
                </div>
                <div className="qm-stat-card">
                  <span className="qm-stat-icon qm-stat-icon--green">
                    <QuestionCircleOutlined />
                  </span>
                  <div className="qm-stat-meta">
                    <span className="qm-stat-value">{questions.length}</span>
                    <span className="qm-stat-label">Questions</span>
                  </div>
                </div>
                <div className="qm-stat-card">
                  <span className="qm-stat-icon qm-stat-icon--purple">
                    <CheckSquareOutlined />
                  </span>
                  <div className="qm-stat-meta">
                    <span className="qm-stat-value">{quizzes_result.length}</span>
                    <span className="qm-stat-label">Results</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="qm-hero__actions">
              <Button
                className="qm-btn-primary"
                icon={<PlusOutlined />}
                onClick={() => openQuizDrawer()}
                size="large"
              >
                Create New Quiz
              </Button>
              <Button
                className="qm-btn-primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                size="large"
              >
                Add Question
              </Button>
            </div>
          </div>
        </div>
        {/* ===== /Modern Hero Header ===== */}

        {/* Tabs */}
        <Card style={{ marginTop: 20 }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} className="questions-tabs">
            <TabPane
              tab={
                <span>
                  <OrderedListOutlined />
                  Quizzes Result
                  <Badge
                    count={quizzes_result.length}
                    style={{ backgroundColor: "#1890ff", marginLeft: 8 }}
                  />
                </span>
              }
              key="quizzes-result"
            />
            <TabPane
              tab={
                <span>
                  <UnorderedListOutlined />
                  All Quizzes
                  <Badge
                    count={quizzes.length}
                    style={{ backgroundColor: "#1890ff", marginLeft: 8 }}
                  />
                </span>
              }
              key="quizzes"
            />
            <TabPane
              tab={
                <span>
                  <QuestionCircleOutlined />
                  All Questions
                  <Badge
                    count={questions.length}
                    style={{ backgroundColor: "#52c41a", marginLeft: 8 }}
                  />
                </span>
              }
              key="questions"
            />
          </Tabs>

          {activeTab === "quizzes-result" && (
            <div className="quizzes-tab-content">
              <div className="table-header">
                <Text strong>
                  Total Results: {filteredQuizResults.length}
                  {filteredQuizResults.length !== quizzes_result.length && ` (${quizzes_result.length} total)`}
                </Text>
                <Space>
                  <Input
                    placeholder="Search by name..."
                    prefix={<SearchOutlined />}
                    allowClear
                    style={{ width: 250 }}
                    value={quizResultSearch}
                    onChange={(e) => setQuizResultSearch(e.target.value)}
                  />
                  <Select
                    placeholder="Filter by type"
                    style={{ width: 150 }}
                    value={quizResultTypeFilter}
                    onChange={setQuizResultTypeFilter}
                  >
                    <Option value="all">All Types</Option>
                    <Option value="abcd">ABCD Quiz</Option>
                    <Option value="rating">Rating Quiz</Option>
                  </Select>
                </Space>
              </div>

              {filteredQuizResults.length === 0 ? (
                <Empty
                  description={
                    quizResultSearch || quizResultTypeFilter !== "all"
                      ? "No results match your search."
                      : "No quiz submissions yet."
                  }
                  style={{ padding: "40px 0" }}
                />
              ) : (
                <Table
                  columns={quizResultColumns}
                  dataSource={filteredQuizResults}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              )}
            </div>
          )}

          {activeTab === "quizzes" && (
            <div className="quizzes-tab-content">
              {quizzes.length === 0 ? (
                <Card className="empty-state-card">
                  <div className="empty-state-content">
                    <UnorderedListOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                    <Title level={4}>No Quizzes Created</Title>
                    <Text type="secondary">Create your first quiz to get started with assessments</Text>
                    <br />
                    <Button type="primary" onClick={() => openQuizDrawer()}>
                      Create First Quiz
                    </Button>
                  </div>
                </Card>
              ) : (
                <Table
                  className="quizzes-table"
                  columns={quizColumns}
                  dataSource={quizzes}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: 700 }}
                />
              )}
            </div>
          )}

          {activeTab === "questions" && (
            <div className="questions-tab-content">
              <div className="table-header">
                <Text strong>
                  Total Questions: {filteredQuestions.length}
                  {filteredQuestions.length !== questions.length && ` (${questions.length} total)`}
                </Text>
                <Space>
                  <Input
                    placeholder="Search questions..."
                    prefix={<SearchOutlined />}
                    style={{ width: 250 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select
                    placeholder="Filter by type"
                    style={{ width: 150 }}
                    value={filterType}
                    onChange={setFilterType}
                  >
                    <Option value="all">All Types</Option>
                    <Option value="rate">Rating</Option>
                    <Option value="abcd">Multiple Choice</Option>
                  </Select>
                </Space>
              </div>

              {filteredQuestions.length === 0 && questions.length > 0 ? (
                <Card className="empty-state-card">
                  <div className="empty-state-content">
                    <SearchOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                    <Title level={4}>No Questions Found</Title>
                    <Text type="secondary">No questions match your search or filter criteria</Text>
                    <br />
                    <Button
                      type="default"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterType("all")
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </Card>
              ) : questions.length === 0 ? (
                <Card className="empty-state-card">
                  <div className="empty-state-content">
                    <QuestionCircleOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                    <Title level={4}>No Questions Available</Title>
                    <Text type="secondary">Create some questions first to build your quizzes</Text>
                    <br />
                    <Button type="primary" onClick={() => showModal()}>
                      Create First Question
                    </Button>
                  </div>
                </Card>
              ) : (
                <Table
                  columns={[
                    ...questionColumns,
                    {
                      title: "Actions",
                      key: "actions",
                      width: 120,
                      render: (_, record) => (
                        <Space size="small">
                          <Tooltip
                            title="Edit"
                            trigger={isTouchDevice ? [] : ["hover"]}
                            open={isTouchDevice ? false : undefined}
                          >
                            <Button
                              className="quiz-action-btn"
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => showModal(record)}
                            />
                          </Tooltip>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={filteredQuestions}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              )}
            </div>
          )}
        </Card>

        {/* Quiz Details Modal */}
        <Modal
          title={
            <Space>
              <Text strong>Quiz Details</Text>
              {viewingQuiz && (
                <Badge
                  count={`${viewingQuiz.questions?.length || 0} questions`}
                  style={{ backgroundColor: "#1890ff" }}
                />
              )}
            </Space>
          }
          open={isQuizDetailsModalVisible}
          onCancel={closeQuizDetailsModal}
          width="min(800px, 94vw)"
          className="quiz-details-modal"
          footer={[
            <Button
              key="edit"
              onClick={() => {
                closeQuizDetailsModal()
                openQuizDrawer(viewingQuiz)
              }}
            >
              Edit Quiz
            </Button>,
            <Button key="preview" type="primary" icon={<FullscreenOutlined />}>
              Preview Quiz
            </Button>,
            <Button key="close" onClick={closeQuizDetailsModal}>
              Close
            </Button>,
          ]}
        >
          {viewingQuiz && (
            <div className="quiz-details-content">
              <Card
                title={
                  <Space>
                    <Text strong>{viewingQuiz.title}</Text>
                    <Tag color={viewingQuiz.type === "rate" ? "blue" : "green"}>
                      {viewingQuiz.type === "rate" ? "Rating Quiz" : "Multiple Choice Quiz"}
                    </Tag>
                    {viewingQuiz.isActive && <Tag color="green">Active</Tag>}
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text>
                    <strong>Created:</strong> {new Date(viewingQuiz.created_at).toLocaleDateString()}
                  </Text>
                  <Text>
                    <strong>Updated:</strong> {new Date(viewingQuiz.updated_at).toLocaleDateString()}
                  </Text>
                </Space>
              </Card>

              <List
                dataSource={viewingQuiz.questions || []}
                renderItem={(question, index) => {
                  // Prefer choices_with_urls (full URL); fall back to raw choices
                  const renderChoices =
                    question.choices_with_urls && question.choices_with_urls.length
                      ? question.choices_with_urls
                      : question.choices || []

                  return (
                    <List.Item className="quiz-question-item">
                      <div className="question-number">
                        <Text strong>#{index + 1}</Text>
                      </div>
                      <div className="question-content">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div className="question-header">
                            <Space>
                              <Tag color={question.type === "rate" ? "blue" : "green"}>
                                {question.type === "rate" ? "Rating" : "Multiple Choice"}
                              </Tag>
                              {question.required && <Tag color="red">Required</Tag>}
                            </Space>
                          </div>
                          <Text strong>{question.question}</Text>
                          {question.description && <Text type="secondary">{question.description}</Text>}
                          {question.type === "abcd" && renderChoices.length > 0 && (
                            <div className="choices-preview">
                              <Text strong>Options:</Text>
                              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                                {renderChoices.map((choice, choiceIndex) => (
                                  <Col xs={24} sm={12} key={choiceIndex}>
                                    <Card size="small">
                                      <Space align="start">
                                        <Text strong>{choice.letter}</Text>
                                        {choice.image && (
                                          <Image
                                            width={80}
                                            height={80}
                                            src={choice.image}
                                            alt={choice.interpretation}
                                            style={{ objectFit: "cover", borderRadius: 6 }}
                                            fallback="https://via.placeholder.com/80?text=No+Image"
                                          />
                                        )}
                                        <Text>{choice.interpretation}</Text>
                                      </Space>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}
                        </Space>
                      </div>
                    </List.Item>
                  )
                }}
              />
            </div>
          )}
        </Modal>

        {/* Quiz Creation/Editing Drawer */}
        <Drawer
          title={
            <Space className="qm-drawer-title" wrap>
              {currentQuiz ? "Edit Quiz" : "Create New Quiz"}
              {currentQuiz && <Tag color="blue">{currentQuiz.title}</Tag>}
            </Space>
          }
          placement="right"
          size="large"
          open={isQuizDrawerVisible}
          onClose={closeQuizDrawer}
          width="90vw"
          className="quiz-drawer"
          extra={
            <Space className="qm-drawer-extra" wrap>
              <Text type="secondary" className="qm-drawer-count">
                {quizQuestions.length} questions selected
              </Text>
              <Button onClick={closeQuizDrawer}>Cancel</Button>
              <Button loading={isSaving} disabled={!title || filterType === "all"} type="primary" onClick={saveQuiz}>
                {currentQuiz ? "Update Quiz" : "Create Quiz"}
              </Button>
            </Space>
          }
        >
          <div className="quiz-drawer-content">
            <div className="questions-panel">
              <Card
                title="Available Questions"
                className="questions-list-card"
                extra={
                  <Space>
                    <Text type="secondary">{filteredQuestions.length} questions</Text>
                  </Space>
                }
              >
                <div className="search-filters">
                  <Input
                    placeholder="Search questions..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                  <Input
                    placeholder="Enter title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                  <Select
                    value={filterType}
                    onChange={setFilterType}
                    style={{ width: "100%", marginBottom: 16 }}
                  >
                    <Option value="all">All Question Types</Option>
                    <Option value="rate">Rating Questions</Option>
                    <Option value="abcd">Multiple Choice</Option>
                  </Select>
                </div>

                {filteredQuestions.length === 0 && !isLoading ? (
                  <Empty description="No questions found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    columns={questionColumns}
                    dataSource={filteredQuestions}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 400, x: 480 }}
                    size="small"
                    loading={isLoading}
                  />
                )}
              </Card>
            </div>

            <div className="quiz-builder-panel">
              <Card
                title="Quiz Builder"
                className="quiz-builder-card"
                extra={
                  <Space>
                    <Text strong>Display Order</Text>
                    <Text type="secondary">Drag to reorder</Text>
                  </Space>
                }
              >
                {quizQuestions.length === 0 ? (
                  <Empty description="No questions added to quiz" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="quiz-questions">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="quiz-questions-list">
                          {quizQuestions.map((question, index) => (
                            <Draggable key={question.id} draggableId={question.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`quiz-question-item ${snapshot.isDragging ? "dragging" : ""}`}
                                >
                                  <div className="question-drag-handle" {...provided.dragHandleProps}>
                                    <MenuOutlined />
                                  </div>
                                  <div className="question-content">
                                    <div className="question-header">
                                      <Space>
                                        <Tag color={question.type === "rate" ? "blue" : "green"}>
                                          {question.type === "rate" ? "Rating" : "Multiple Choice"}
                                        </Tag>
                                        <Text strong>#{index + 1}</Text>
                                        {question.required && <Tag color="red">Required</Tag>}
                                      </Space>
                                      <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeQuestionFromQuiz(question.id)}
                                      />
                                    </div>
                                    <Text strong style={{ display: "block", marginTop: 4 }}>
                                      {question.question}
                                    </Text>
                                    {question.description && (
                                      <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                                        {question.description}
                                      </Text>
                                    )}
                                    {question.type === "abcd" && question.choices && (
                                      <div className="choices-preview">
                                        <Text type="secondary" style={{ fontSize: "12px", marginTop: 8 }}>
                                          {question.choices.length} options with images
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </Card>
            </div>
          </div>
        </Drawer>

        {/* Add/Edit Question Modal */}
        <Modal
          title={editingQuestion ? "Edit Question" : "Add New Question"}
          open={isModalVisible}
          onCancel={handleFormCancel}
          footer={null}
          width="min(800px, 94vw)"
          className="question-modal"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} className="question-form">
            <div className="form-sections">
              <div className="form-section">
                <div className="section-header">
                  <h3>Question Details</h3>
                  <div className="section-divider"></div>
                </div>
                <div className="section-content">
                  <Form.Item
                    name="type"
                    label="Question Type"
                    rules={[{ required: true, message: "Please select question type" }]}
                  >
                    <Radio.Group className="qm-question-type-radio">
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {questionTypes.map((type) => (
                          <Radio key={type.value} value={type.value} className="qm-question-type-option">
                            <Space>
                              {type.icon}
                              {type.label}
                            </Space>
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="question"
                    label="Question Text"
                    rules={[{ required: true, message: "Please enter question text" }]}
                  >
                    <Input.TextArea rows={3} placeholder="Enter your question here..." className="form-textarea" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: "Description is required" }]}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Additional context or instructions for this question..."
                      className="form-textarea"
                    />
                  </Form.Item>

                  <Form.Item name="required" label="Required" valuePropName="checked">
                    <Switch checkedChildren="Required" unCheckedChildren="Optional" />
                  </Form.Item>
                </div>
              </div>

              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
                {({ getFieldValue }) =>
                  getFieldValue("type") === "abcd" && (
                    <div className="form-section">
                      <div className="section-header">
                        <h3>Multiple Choice Options</h3>
                        <div className="section-divider"></div>
                      </div>
                      <div className="section-content">
                        <Form.List name="choices">
                          {(fields, { add, remove }) => (
                            <>
                              {fields.map((field, index) => (
                                <div key={field.key} className="choice-item">
                                  <Row gutter={[16, 12]} align="middle">
                                    <Col xs={4} sm={3} md={2}>
                                      <div className="choice-letter">{String.fromCharCode(65 + index)}</div>
                                    </Col>
                                    <Col xs={20} sm={9} md={10}>
                                      <Form.Item
                                        {...field}
                                        name={[field.name, "image"]}
                                        fieldKey={[field.fieldKey, "image"]}
                                        label="Option Image"
                                        valuePropName="value"
                                        getValueFromEvent={normalizeUploadFile}
                                      >
                                        <Upload
                                          listType="picture-card"
                                          beforeUpload={() => false}
                                          maxCount={1}
                                          fileList={
                                            form.getFieldValue(["choices", field.name, "image"])
                                              ?.fileList || []
                                          }
                                          onChange={(info) => {
                                            const choices = form.getFieldValue("choices") || []
                                            choices[field.name] = {
                                              ...(choices[field.name] || {}),
                                              image: { fileList: info.fileList },
                                            }
                                            form.setFieldsValue({ choices })
                                          }}
                                          onRemove={() => {
                                            const choices = form.getFieldValue("choices") || []
                                            choices[field.name] = {
                                              ...(choices[field.name] || {}),
                                              image: { fileList: [] },
                                            }
                                            form.setFieldsValue({ choices })
                                            return true
                                          }}
                                        >
                                          {(form.getFieldValue(["choices", field.name, "image"])
                                            ?.fileList?.length || 0) >= 1 ? null : (
                                            <div>
                                              <PictureOutlined />
                                              <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                          )}
                                        </Upload>
                                      </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={9} md={10}>
                                      <Form.Item
                                        {...field}
                                        name={[field.name, "interpretation"]}
                                        fieldKey={[field.fieldKey, "interpretation"]}
                                        label="Interpretation Text"
                                        rules={[{ required: true, message: "Please enter interpretation text" }]}
                                      >
                                        <Input.TextArea rows={2} placeholder="Enter what this choice represents..." />
                                      </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={3} md={2} className="choice-remove-col">
                                      {fields.length > 2 && (
                                        <Button
                                          type="text"
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={() => remove(field.name)}
                                        >
                                          <span className="choice-remove-label">Remove choice</span>
                                        </Button>
                                      )}
                                    </Col>
                                  </Row>
                                </div>
                              ))}
                              <Form.Item>
                                <Button
                                  className="add-choice-btn"
                                  type="dashed"
                                  onClick={() => add()}
                                  icon={<PlusOutlined />}
                                  block
                                  disabled={fields.length >= 4}
                                >
                                  Add Choice {fields.length}/4
                                </Button>
                              </Form.Item>
                            </>
                          )}
                        </Form.List>
                      </div>
                    </div>
                  )
                }
              </Form.Item>
            </div>

            <div className="form-actions">
              <Button onClick={handleFormCancel}>Cancel</Button>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const currentType = getFieldValue("type")
                  const typeLabel = currentType === "abcd" ? "ABCD Question" : "Rating Question"
                  return (
                    <Button type="primary" htmlType="submit">
                      {editingQuestion ? `Update ${typeLabel}` : `Add ${typeLabel}`}
                    </Button>
                  )
                }}
              </Form.Item>
            </div>
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

        {/* Quiz Result Details Modal */}
        <Modal
          title={
            <Space>
              <Text strong>Quiz Result Details</Text>
              {viewingQuizResult && (
                <Badge
                  count={`${viewingQuizResult.questions?.length || 0} questions`}
                  style={{ backgroundColor: "#1890ff" }}
                />
              )}
            </Space>
          }
          open={isQuizResultDetailsModalVisible}
          onCancel={closeQuizResultDetailsModal}
          width="min(900px, 94vw)"
          className="quiz-result-details-modal"
          footer={[
            <Button key="close" onClick={closeQuizResultDetailsModal}>
              Close
            </Button>,
          ]}
        >
          {viewingQuizResult && (
            <div className="quiz-result-details-content">
              <Card title="User Information" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>Name: {viewingQuizResult.user?.name || "N/A"}</Text>
                  <Text type="secondary">
                    Submitted: {new Date(viewingQuizResult.created_at).toLocaleDateString()}
                  </Text>
                  <Tag color={viewingQuizResult.type === "rate" ? "blue" : "green"}>
                    {viewingQuizResult.type === "rate" ? "Rating Quiz" : "Multiple Choice Quiz"}
                  </Tag>
                </Space>
              </Card>

              <Card title="Questions & Answers">
                <List
                  dataSource={viewingQuizResult.questions || []}
                  renderItem={(question, index) => (
                    <List.Item className="quiz-result-question-item">
                      <div className="question-number">
                        <Text strong>#{index + 1}</Text>
                      </div>
                      <div className="question-content" style={{ width: "100%" }}>
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div className="question-header">
                            <Space>
                              <Tag color={question.type === "rate" ? "blue" : "green"}>
                                {question.type === "rate" ? "Rating" : "Multiple Choice"}
                              </Tag>
                              {question.required && <Tag color="red">Required</Tag>}
                            </Space>
                          </div>

                          <Text strong>{question.question}</Text>

                          {question.description && <Text type="secondary">{question.description}</Text>}

                          <div
                            className="user-answer-section"
                            style={{
                              marginTop: 12,
                              padding: 12,
                              borderRadius: 6,
                            }}
                          >
                            <Text strong>User's Answer: </Text>
                            {question.type === "rate" ? (
                              <Space>
                                <Rate
                                  value={Number.parseInt(question.pivot?.answer) || 0}
                                  disabled
                                  style={{ marginLeft: 8 }}
                                />
                                <Text>({question.pivot?.answer || "No answer"})</Text>
                              </Space>
                            ) : (
                              <Space>
                                <Text strong style={{ color: "#1890ff" }}>
                                  {question.pivot?.answer || "No answer"}
                                </Text>
                                {question.choices_with_urls && (
                                  <Text>
                                    -{" "}
                                    {question.choices_with_urls.find(
                                      (choice) => choice.letter === question.pivot?.answer,
                                    )?.interpretation || "Interpretation not available"}
                                  </Text>
                                )}
                              </Space>
                            )}
                          </div>

                          {question.type === "abcd" && question.choices_with_urls && (
                            <div className="choices-preview" style={{ marginTop: 12 }}>
                              <Text strong>Available Options:</Text>
                              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                                {question.choices_with_urls.map((choice, choiceIndex) => (
                                  <Col xs={24} sm={12} key={choiceIndex}>
                                    <Card
                                      size="small"
                                      style={{
                                        border:
                                          choice.letter === question.pivot?.answer
                                            ? "2px solid #1890ff"
                                            : "1px solid #d9d9d9",
                                      }}
                                    >
                                      <Space align="start">
                                        <Badge
                                          count={choice.letter}
                                          style={{
                                            backgroundColor:
                                              choice.letter === question.pivot?.answer ? "#1890ff" : "#d9d9d9",
                                          }}
                                        />
                                        <Space direction="vertical" size={0}>
                                          {choice.image && (
                                            <Image
                                              width={60}
                                              height={60}
                                              src={choice.image || "/placeholder.svg"}
                                              alt={choice.interpretation}
                                              style={{ objectFit: "cover", borderRadius: 4 }}
                                              fallback="https://via.placeholder.com/60?text=No+Image"
                                            />
                                          )}
                                          <Text style={{ fontSize: "12px" }}>{choice.interpretation}</Text>
                                        </Space>
                                      </Space>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}

                          {question.type === "rate" && (
                            <div className="rating-info" style={{ marginTop: 8 }}>
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                Scale: 1 (Lowest) - 5 (Highest)
                              </Text>
                            </div>
                          )}
                        </Space>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>

              <Card title="Summary" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Total Questions" value={viewingQuizResult.questions?.length || 0} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Required Questions"
                      value={viewingQuizResult.questions?.filter((q) => q.required)?.length || 0}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Completion Date"
                      value={new Date(viewingQuizResult.created_at).toLocaleDateString()}
                    />
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default AlumniQuestionsPage