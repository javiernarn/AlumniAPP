import React, { useState, useEffect, useRef } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    Typography,
    Space,
    Divider,
    Progress,
    Alert,
    Statistic,
    Tag,
    Result,
    Tooltip,
    Image,
    Avatar,
    Spin,
    Modal,
    notification,
} from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    SmileOutlined,
    BulbOutlined,
    ThunderboltOutlined,
    PictureOutlined,
    EyeOutlined,
    StarOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    SunOutlined,
    MoonOutlined,
    DisconnectOutlined,
    LogoutOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import "./ImageQuizPage.css";
import useTakeQuiz from "~/hooks/useTakeQuiz";
import axiosConfig from "~/utils/axiosConfig";
import logo from "~/assets/images/OCC_LOGO.png";
import secureLocalStorage from "react-secure-storage";
import { useAppTheme } from "~/hooks/useAppTheme";

const { Title, Text, Paragraph } = Typography;



// ============ THEMED MODAL HELPERS ============
// Reusable modal theme that mirrors the rest of the app (white/black).
const getModalTheme = (theme) => {
    const isDark = theme === "black";
    return {
        backgroundColor: isDark ? "#141414" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        border: isDark ? "1px solid #303746" : "1px solid #e2e8f0",
    };
};

// Returns props you can spread onto <Modal/> or Modal.method({...}) calls.
const getThemedModalProps = (theme) => {
    const isDark = theme === "black";
    const surface = isDark ? "#141414" : "#ffffff";
    const bodySurface = isDark ? "#1a1f2b" : "#f8fafc";
    const borderColor = isDark ? "#303746" : "#e2e8f0";
    return {
        className: isDark ? "themed-modal themed-modal--dark" : "themed-modal themed-modal--light",
        styles: {
            content: {
                background: surface,
                color: isDark ? "#ffffff" : "#000000",
                border: `1px solid ${borderColor}`,
                borderRadius: "12px",
                padding: 0,
            },
            header: {
                background: surface,
                borderBottom: `1px solid ${borderColor}`,
            },
            body: {
                background: bodySurface,
                color: isDark ? "#e7ecf3" : "#000000",
            },
            footer: {
                background: surface,
                borderTop: `1px solid ${borderColor}`,
            },
            mask: { backdropFilter: "blur(2px)" },
        },
    };
};

// Inline container style for any custom content inside a Modal body.
const getModalContentStyle = (theme) => ({
    background: theme === "black" ? "#141414" : "#ffffff",
    color: theme === "black" ? "#ffffff" : "#000000",
    borderRadius: "12px",
    border:
        theme === "black"
            ? "1px solid #303746"
            : "1px solid #e2e8f0",
    padding: "16px",
});
// ============ END THEMED MODAL HELPERS ============

// ===== Constants for Time Expiration & Auto-Save =====
const QUIZ_DURATION = 10 * 60; // 10 minutes (in seconds)
const STORAGE_KEY = "imageQuizProgress";
const LOGOUT_COUNTDOWN = 10;

// Company/University Information
const companyInfo = {
    name: "Opol Community College Alumni Association",
    logo: logo,
    slogan: "Building tomorrow's leaders, one student at a time.",
    website: "alumni.occph.com",
    address: "ZONE C. Salva St, Opol, 9016 Misamis Oriental",
};

const ImageQuizPage = () => {
    const {
        isLoading: isLoadingQuizzes,
        data: questions = [],
        isFetching: isFetchingQuizzes,
        refetch: refetchQuizzes,
    } = useTakeQuiz("abcd");

    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState({});
    const [revealed, setRevealed] = useState(false);

    // ===== Time Expired / Resume / Offline state =====
    const [timeExpired, setTimeExpired] = useState(false);
    const [expiryCountdown, setExpiryCountdown] = useState(LOGOUT_COUNTDOWN);
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== "undefined" ? !navigator.onLine : false
    );
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [progressChecked, setProgressChecked] = useState(false);
    const pendingResumeRef = useRef(null);

useEffect(() => {
    document.title = "Image Quiz | ATMS - Opol Community College";
}, []);

//  Prevent //
  useEffect(() => {
  const disableContextMenu = (e) => {
    e.preventDefault();
  };

  document.addEventListener("contextmenu", disableContextMenu);

  return () => {
    document.removeEventListener("contextmenu", disableContextMenu);
  };
}, []);

useEffect(() => {
  const handleKeyDown = (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
      (e.ctrlKey && e.key === "u")
    ) {
      e.preventDefault();
      return false;
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, []);


    // ============ THEME SYNC (shared with FormLogin) ============
    // Uses the same useAppTheme hook as FormLogin so this page can never
    // drift out of sync with what was actually saved (cookie + secureLocalStorage
    // + BroadcastChannel, all handled centrally by the hook).
    const { theme: currentTheme, setTheme: setCurrentTheme } = useAppTheme();
    // ============ END THEME SYNC ============

    useEffect(() => {
        const t = setTimeout(() => setRevealed(true), 60);
        return () => clearTimeout(t);
    }, []);

    // ===== Load saved progress on mount (Resume Assessment) =====
    useEffect(() => {
        try {
            const raw = secureLocalStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.quizType === "image") {
                    pendingResumeRef.current = parsed;
                    setShowResumeModal(true);
                    return;
                }
            }
        } catch (e) {
            console.warn("Failed to read saved progress", e);
        }
        setProgressChecked(true);
    }, []);

    // Transform API data to match expected format
    useEffect(() => {
        if (questions && questions.length > 0) {
            const transformedQuiz = {
                id: 2,
                title: "Visual Personality & Preference Assessment",
                description:
                    "Discover your personality traits through image selection and visual preferences",
                questions: questions.map((q, index) => ({
                    id: q.id,
                    type: q.type,
                    question: q.question,
                    description: q.description,
                    required: q.required,
                    category: "Visual Assessment",
                    options: q.choices.map((choice, choiceIndex) => ({
                        id: `${q.id}_${choice.letter}`,
                        image: choice.image,
                        label: choice.letter,
                        value: choice.letter.toLowerCase(),
                        interpretation: choice.interpretation,
                    })),
                })),
                createdAt: "2024-01-20",
                estimatedTime: 10,
                category: "Visual Personality Assessment",
            };
            setCurrentQuiz(transformedQuiz);
        }
    }, [questions]);

    // ===== Timer (paused during resume modal / expiry / completion) =====
    useEffect(() => {
        if (!progressChecked) return;
        if (timeExpired || isQuizCompleted || showResumeModal) return;
        const timer = setInterval(() => {
            setTimeSpent((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [progressChecked, timeExpired, isQuizCompleted, showResumeModal]);

    // ===== Time-expiration trigger =====
    useEffect(() => {
        if (timeExpired) return;
        if (!progressChecked) return;
        if (timeSpent >= QUIZ_DURATION) {
            try {
                secureLocalStorage.removeItem(STORAGE_KEY);
            } catch (_) {}
            setTimeExpired(true);
            setExpiryCountdown(LOGOUT_COUNTDOWN);
        }
    }, [timeSpent, timeExpired, progressChecked]);

    // ===== Expiry countdown -> session cleanup + redirect =====
    useEffect(() => {
        if (!timeExpired) return;
        if (expiryCountdown <= 0) {
            try {
                secureLocalStorage.removeItem("access_token");
                secureLocalStorage.removeItem("faculty_id");
                secureLocalStorage.removeItem("userID");
                secureLocalStorage.removeItem("userRole");
                secureLocalStorage.removeItem("email");
                secureLocalStorage.removeItem("name");
                secureLocalStorage.removeItem("courseId");
                secureLocalStorage.clear();
            } catch (_) {}
            notification.warning({
                message: "Session Expired",
                description:
                    "Your assessment session has ended. Please sign in again to continue.",
                placement: "topRight",
                duration: 4,
            });
            window.location.href = "/login";
            return;
        }
        const t = setTimeout(() => {
            setExpiryCountdown((c) => c - 1);
        }, 1000);
        return () => clearTimeout(t);
    }, [timeExpired, expiryCountdown]);

    // ===== Save helper =====
    const saveQuizProgress = (overrides = {}) => {
        if (timeExpired || isQuizCompleted) return;
        try {
            const payload = {
                answers,
                currentQuestionIndex,
                timeSpent,
                quizType: "image",
                savedAt: Date.now(),
                ...overrides,
            };
            secureLocalStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.warn("Auto-save failed", e);
        }
    };

    // ===== Auto-save every 1s =====
    useEffect(() => {
        if (!progressChecked || timeExpired || isQuizCompleted || showResumeModal) return;
        const id = setInterval(() => saveQuizProgress(), 1000);
        return () => clearInterval(id);
    }, [
        progressChecked,
        timeExpired,
        isQuizCompleted,
        showResumeModal,
        answers,
        currentQuestionIndex,
        timeSpent,
    ]);

    // ===== BeforeUnload protection =====
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (timeExpired || isQuizCompleted) return;
            saveQuizProgress();
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [answers, currentQuestionIndex, timeSpent, timeExpired, isQuizCompleted]);

    // ===== Offline / Online detection =====
    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            notification.warning({
                key: "net-status",
                message: "⚠️ Connection Lost",
                description:
                    "Don't worry. Your progress is being saved automatically. Reconnect to continue normally.",
                placement: "topRight",
                duration: 0,
            });
        };
        const handleOnline = () => {
            setIsOffline(false);
            notification.success({
                key: "net-status",
                message: "✅ Connection Restored",
                description: "Your assessment session continues normally.",
                placement: "topRight",
                duration: 3,
            });
        };
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    const currentQuestion = currentQuiz?.questions?.[currentQuestionIndex];

    const handleImageSelect = (questionId, optionId) => {
        if (timeExpired) return;
        setAnswers((prev) => {
            const next = { ...prev, [questionId]: optionId };
            saveQuizProgress({ answers: next });
            return next;
        });
    };

    // ===== Resume modal handlers =====
    const handleContinueAssessment = () => {
        const saved = pendingResumeRef.current;
        if (saved) {
            try {
                setAnswers(saved.answers || {});
                setCurrentQuestionIndex(
                    Number.isFinite(saved.currentQuestionIndex)
                        ? saved.currentQuestionIndex
                        : 0
                );
                setTimeSpent(Number.isFinite(saved.timeSpent) ? saved.timeSpent : 0);
            } catch (_) {}
        }
        pendingResumeRef.current = null;
        setShowResumeModal(false);
        setProgressChecked(true);
        notification.success({
            message: "Assessment Resumed",
            description: "Your previous progress has been restored.",
            placement: "topRight",
            duration: 3,
        });
    };

    const handleStartNewAssessment = () => {
        try {
            secureLocalStorage.removeItem(STORAGE_KEY);
            secureLocalStorage.removeItem("answerQuizProgress");
        } catch (_) {}
        setAnswers({});
        setCurrentQuestionIndex(0);
        setTimeSpent(0);
        pendingResumeRef.current = null;
        setShowResumeModal(false);
        setProgressChecked(true);
    };

    const handleSubmit = async () => {
        if (timeExpired) return;
        if (!allRequiredAnswered()) {
            Modal.warning({
                ...getThemedModalProps(currentTheme),
                title: "📋 Incomplete Assessment",
                content: (
                    <div style={{ padding: "10px 0" }}>
                        <p style={{ marginBottom: 8 }}>
                            Please answer all required questions before submitting.
                        </p>
                        <div
                            style={{
                                background: "#fffbf0",
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px solid #ffe58f",
                            }}
                        >
                            <Space>
                                <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                                <Text type="warning">
                                    {completionStatus.requiredTotal -
                                        completionStatus.requiredAnswered}{" "}
                                    required question(s) remaining
                                </Text>
                            </Space>
                        </div>
                    </div>
                ),
                icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
                okText: "Continue Assessment",
                okType: "primary",
                centered: true,
                style: { borderRadius: "12px" },
            });
            return;
        }

        setIsSubmitting(true);

        Modal.confirm({
                ...getThemedModalProps(currentTheme),
            title: (
                <Space>
                    <ThunderboltOutlined style={{ color: "#7c3aed" }} />
                    <span>Ready to Submit?</span>
                </Space>
            ),
            content: (
                <div style={{ padding: "10px 0" }}>
                    <p>You're about to submit your assessment. Make sure:</p>
                    <ul style={{ paddingLeft: 20, margin: "10px 0" }}>
                        <li>All required questions are answered</li>
                        <li>Your responses reflect your honest opinions</li>
                        <li>You won't be able to modify after submission</li>
                    </ul>
                    <div
                        style={{
                            background: currentTheme === "black" ? "#141414" : "#f6ffed",
                            padding: "12px",
                            borderRadius: "6px",
                            border:
                                currentTheme === "black"
                                    ? "1px solid #303030"
                                    : "1px solid #b7eb8f",
                            marginTop: "12px",
                            color: currentTheme === "black" ? "#ffffff" : "#000000",
                        }}
                    >
                        <Space>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <Text type="success">
                                {completionStatus.answered} of{" "}
                                {completionStatus.total} questions completed
                            </Text>
                        </Space>
                    </div>
                </div>
            ),
            icon: <ExclamationCircleOutlined style={{ color: "#1890ff" }} />,
            okText: "Yes, Submit Now",
            cancelText: "Review Answers",
            okType: "primary",
            centered: true,
            style: { borderRadius: "12px" },
            onCancel: () => {
                setIsSubmitting(false);
            },
            onOk: async () => {
                try {
                    const submissionData = {
                        type: "abcd",
                        quizId: currentQuiz?.id || "default-quiz-id",
                        timeSpent: timeSpent,
                        answers: Object.entries(answers).map(
                            ([questionId, selectedOptionId]) => {
                                const optionLetter = selectedOptionId
                                    .charAt(selectedOptionId.length - 1)
                                    .toUpperCase();

                                return {
                                    questionId: questionId,
                                    rating: optionLetter,
                                    answeredAt: new Date().toISOString(),
                                };
                            }
                        ),
                    };

                    const userInfo = secureLocalStorage.getItem("userInfo");
                    if (userInfo) {
                        submissionData.userInfo = userInfo;
                    }

                    const loadingModal = Modal.info({
                ...getThemedModalProps(currentTheme),
                        title: (
                            <Space>
                                <LoadingOutlined />
                                <span>Submitting Assessment</span>
                            </Space>
                        ),
                        content: (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <Progress
                                    percent={100}
                                    status="active"
                                    showInfo={false}
                                    strokeColor={{
                                        "0%": "#7c3aed",
                                        "100%": "#52c41a",
                                    }}
                                />
                                <p style={{ marginTop: 16, color: "#666" }}>
                                    Processing your responses...
                                </p>
                            </div>
                        ),
                        okButtonProps: { disabled: true },
                        closable: false,
                        maskClosable: false,
                        centered: true,
                        style: { borderRadius: "12px" },
                    });

                    const response = await axiosConfig.post(
                        "/save-alumni-quiz",
                        submissionData,
                        {
                            headers: { "Content-Type": "application/json" },
                            timeout: 30000,
                        }
                    );

                    loadingModal.destroy();

                    if (response.data.success) {
                        if (response.data.alumniQuizId) {
                            secureLocalStorage.setItem(
                                "lastSubmissionId",
                                response.data.alumniQuizId
                            );
                        }

                        // Clean saved progress so it does not restore old answers
                        try {
                            secureLocalStorage.removeItem(STORAGE_KEY);
                        } catch (_) {}
                        setIsQuizCompleted(true);

                        Modal.success({
                ...getThemedModalProps(currentTheme),
                            title: (
                                <Space>
                                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                    <span>Assessment Complete! 🎉</span>
                                </Space>
                            ),
                            content: (
                                <div style={{ padding: "10px 0" }}>
                                    <p style={{ marginBottom: 12 }}>
                                        Thank you for completing the assessment.
                                        Your personality profile has been analyzed successfully.
                                    </p>
                                    <div
                                        style={{
                                            background: currentTheme === "black" ? "#1f1f1f" : "#f6ffed",
                                            padding: "12px",
                                            borderRadius: "6px",
                                            border:
                                                currentTheme === "black"
                                                    ? "1px solid #434343"
                                                    : "1px solid #b7eb8f",
                                            color: currentTheme === "black" ? "#e6e6e6" : "#000",
                                        }}
                                    >
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Statistic
                                                    title="Time Spent"
                                                    value={formatTime(timeSpent)}
                                                    prefix={<ClockCircleOutlined />}
                                                    valueStyle={{ fontSize: "14px", color: "#1890ff" }}
                                                />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic
                                                    title="Questions Answered"
                                                    value={Object.keys(answers).length}
                                                    suffix={`/ ${completionStatus.total}`}
                                                    valueStyle={{ fontSize: "14px", color: "#52c41a" }}
                                                />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic
                                                    title="Quiz Type"
                                                    value="ABCD"
                                                    valueStyle={{ fontSize: "14px", color: "#7c3aed" }}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            ),
                            okText: "Back to Home",
                            onOk: () => (window.location.href = "/"),
                            centered: true,
                            style: { borderRadius: "12px" },
                            width: 500,
                        });
                    } else {
                        throw new Error(response.data.message || "Submission failed");
                    }
                } catch (error) {
                    console.error("❌ Error submitting quiz:", error);

                    let errorMessage = "Failed to submit quiz. Please try again.";
                    let errorTitle = "Submission Error";

                    if (error.code === "ECONNABORTED") {
                        errorTitle = "⏰ Request Timeout";
                        errorMessage =
                            "The request took too long. Please check your internet connection and try again.";
                    } else if (error.response?.status === 413) {
                        errorTitle = "📁 File Too Large";
                        errorMessage =
                            "The file you uploaded is too large. Please reduce the file size and try again.";
                    } else if (error.response?.status === 429) {
                        errorTitle = "🚦 Too Many Requests";
                        errorMessage = "Please wait a moment before trying again.";
                    } else if (error.response?.status >= 500) {
                        errorTitle = "🔧 Server Error";
                        errorMessage =
                            "Our servers are experiencing issues. Please try again in a few minutes.";
                    } else if (error.response?.data?.error) {
                        errorMessage = error.response.data.error;
                    } else if (error.response?.data?.errors) {
                        const validationErrors = error.response.data.errors;
                        errorMessage = Object.values(validationErrors).flat().join(", ");
                    }

                    Modal.error({
                ...getThemedModalProps(currentTheme),
                        title: errorTitle,
                        content: (
                            <div style={{ padding: "10px 0" }}>
                                <p>{errorMessage}</p>
                                <div
                                    style={{
                                        background: "#fff2f0",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ffccc7",
                                        marginTop: "12px",
                                    }}
                                >
                                    <Text type="secondary">
                                        If this continues, please contact support.
                                    </Text>
                                </div>
                            </div>
                        ),
                        okText: "Try Again",
                        centered: true,
                        style: { borderRadius: "12px" },
                    });
                } finally {
                    setIsSubmitting(false);
                }
            },
        });
    };

    const getProgress = () => {
        if (!currentQuiz) return 0;
        const answered = Object.keys(answers).length;
        return Math.floor((answered / currentQuiz.questions.length) * 100);
    };

    const getCompletionStatus = () => {
        if (!currentQuiz) return { answered: 0, total: 0, requiredAnswered: 0, requiredTotal: 0 };
        const requiredQuestions = currentQuiz.questions.filter((q) => q.required);
        const answeredRequired = requiredQuestions.filter(
            (q) => answers[q.id] !== undefined
        ).length;
        return {
            answered: Object.keys(answers).length,
            total: currentQuiz.questions.length,
            requiredAnswered: answeredRequired,
            requiredTotal: requiredQuestions.length,
        };
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const allRequiredAnswered = () => {
        if (!currentQuiz) return false;
        const requiredQuestions = currentQuiz.questions.filter((q) => q.required);
        return requiredQuestions.every((q) => answers[q.id] !== undefined);
    };

    const getPersonalityTraits = () => {
        if (!currentQuiz)
            return {
                level: "Thinker",
                color: "#fa8c16",
                description: "You're logical and enjoy solving complex problems",
            };

        const selectedOptions = Object.values(answers)
            .map((answerId) => {
                for (let question of currentQuiz.questions) {
                    const option = question.options.find((opt) => opt.id === answerId);
                    if (option) return option;
                }
                return null;
            })
            .filter((opt) => opt !== null);

        const traits = {
            adventurous: selectedOptions.filter(
                (opt) =>
                    opt.interpretation?.includes("nature") ||
                    opt.interpretation?.includes("ocean") ||
                    opt.interpretation?.includes("eagle") ||
                    opt.interpretation?.includes("explor")
            ).length,
            social: selectedOptions.filter(
                (opt) =>
                    opt.interpretation?.includes("social") ||
                    opt.interpretation?.includes("people") ||
                    opt.interpretation?.includes("community") ||
                    opt.interpretation?.includes("connection")
            ).length,
            creative: selectedOptions.filter(
                (opt) =>
                    opt.interpretation?.includes("creative") ||
                    opt.interpretation?.includes("innovative") ||
                    opt.interpretation?.includes("artistic") ||
                    opt.interpretation?.includes("imaginative")
            ).length,
            analytical: selectedOptions.filter(
                (opt) =>
                    opt.interpretation?.includes("analytical") ||
                    opt.interpretation?.includes("logical") ||
                    opt.interpretation?.includes("structured") ||
                    opt.interpretation?.includes("detail")
            ).length,
        };

        const maxTrait = Object.keys(traits).reduce((a, b) =>
            traits[a] > traits[b] ? a : b
        );

        const traitInfo = {
            adventurous: {
                level: "Explorer",
                color: "#52c41a",
                description: "You're naturally curious and love exploring new possibilities",
            },
            social: {
                level: "Connector",
                color: "#1890ff",
                description: "You thrive on relationships and community interactions",
            },
            creative: {
                level: "Innovator",
                color: "#7c3aed",
                description: "You're imaginative and bring unique perspectives",
            },
            analytical: {
                level: "Thinker",
                color: "#fa8c16",
                description: "You're logical and enjoy solving complex problems",
            },
        };

        return traitInfo[maxTrait] || traitInfo.analytical;
    };

    const handleNext = () => {
        if (timeExpired) return;
        if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
            const next = currentQuestionIndex + 1;
            setCurrentQuestionIndex(next);
            saveQuizProgress({ currentQuestionIndex: next });
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePrevious = () => {
        if (timeExpired) return;
        if (currentQuestionIndex > 0) {
            const next = currentQuestionIndex - 1;
            setCurrentQuestionIndex(next);
            saveQuizProgress({ currentQuestionIndex: next });
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleImageLoad = (optionId) => {
        setImagesLoaded((prev) => ({ ...prev, [optionId]: true }));
    };

    // ===== Reusable modal nodes (rendered even on loading / not-found screens) =====
    const timeLeft = Math.max(0, QUIZ_DURATION - timeSpent);
    const expiryProgress = Math.max(
        0,
        Math.min(100, (expiryCountdown / LOGOUT_COUNTDOWN) * 100)
    );

    const resumeModalNode = (
        <Modal
            {...getThemedModalProps(currentTheme)}
            open={showResumeModal}
            closable={false}
            maskClosable={false}
            keyboard={false}
            centered
            footer={null}
            width={460}
            className="resume-modal"
            title={null}
        >
            <div className="resume-modal__body">
                <div className="resume-modal__icon">
                    <ReloadOutlined />
                </div>
                <h2 className="resume-modal__title">Resume Previous Assessment?</h2>
                <p className="resume-modal__text">
                    We found an unfinished assessment session. Would you like to
                    continue where you left off? Your saved answers and remaining
                    time have been restored.
                </p>
                <div className="resume-modal__actions">
                    <Button
                        size="large"
                        onClick={handleStartNewAssessment}
                        className="btn-ghost"
                    >
                        Start New Assessment
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleContinueAssessment}
                        className="btn-primary-grad"
                        icon={<ArrowRightOutlined />}
                    >
                        Continue Assessment
                    </Button>
                </div>
            </div>
        </Modal>
    );

    const expiredModalNode = (
        <Modal
            {...getThemedModalProps(currentTheme)}
            open={timeExpired}
            closable={false}
            maskClosable={false}
            keyboard={false}
            centered
            footer={null}
            width={520}
            className="expired-modal"
            title={null}
        >
            <div className="expired-modal__body">
                <div className="expired-modal__clock" aria-hidden>
                    <ClockCircleOutlined />
                </div>
                <h2 className="expired-modal__title">
                    <span className="grad-text">⏰ TIME LIMIT REACHED</span>
                </h2>
                <p className="expired-modal__text">
                    Thank you for participating in the assessment. Your allotted
                    time has ended and your session has expired for security
                    purposes.
                </p>
                <p className="expired-modal__text expired-modal__text--muted">
                    You will be automatically logged out and redirected to the
                    Login Page. If you wish to continue, please sign in again and
                    start a new session.
                </p>

                <div className="expired-modal__countdown">
                    <span className="expired-modal__badge">{expiryCountdown}</span>
                    <span>Redirecting in {expiryCountdown} second{expiryCountdown === 1 ? "" : "s"}...</span>
                </div>

                <div className="expired-modal__progress">
                    <div
                        className="expired-modal__progress-bar"
                        style={{ width: `${expiryProgress}%` }}
                    />
                </div>

                <div className="expired-modal__logout">
                    <LogoutOutlined /> Logging out securely...
                </div>
            </div>
        </Modal>
    );

    const offlineBannerNode = isOffline ? (
        <div className="net-banner net-banner--offline" role="status">
            <DisconnectOutlined />
            <span>
                <strong>Connection Lost.</strong> Your progress is being saved
                automatically. Reconnect to continue normally.
            </span>
        </div>
    ) : null;

    if (isLoadingQuizzes) {
        return (
            <div className="quiz-page is-revealed">
                {offlineBannerNode}
                <div className="quiz-loading">
                    <Spin size="large" />
                </div>
                {resumeModalNode}
                {expiredModalNode}
            </div>
        );
    }

    if (!currentQuiz || !currentQuestion) {
        return (
            <div className="quiz-page is-revealed">
                {offlineBannerNode}
                <section className="quiz-section" style={{ marginTop: 60 }}>
                    <Card className="quiz-card">
                        <Result
                            status="404"
                            title="Assessment Not Found"
                            subTitle="Sorry, the visual assessment you are looking for does not exist."
                        />
                    </Card>
                </section>
                {resumeModalNode}
                {expiredModalNode}
            </div>
        );
    }

    if (isQuizCompleted) {
        const completionStatus = getCompletionStatus();
        const personality = getPersonalityTraits();

        return (
            <div className={`quiz-page ${revealed ? "is-revealed" : ""}`}>
                {offlineBannerNode}
                <section className="quiz-section" style={{ marginTop: 40 }}>
                    <Card className="quiz-completion-card">
                        <Result
                            icon={<SmileOutlined style={{ color: personality.color }} />}
                            status="success"
                            title="Visual Assessment Complete!"
                            subTitle={
                                <Space direction="vertical">
                                    <Text>
                                        Your personality profile has been analyzed through
                                        your visual preferences.
                                    </Text>
                                    <Tag color={personality.color} icon={<StarOutlined />}>
                                        {personality.level} Personality
                                    </Tag>
                                </Space>
                            }
                            extra={[
                                <Button key="another" onClick={() => window.location.reload()}>
                                    Retake Assessment
                                </Button>,
                                <Button key="home" type="primary" className="btn-primary-grad">
                                    View Detailed Analysis
                                </Button>,
                            ]}
                        >
                            <div className="quiz-stats" style={{ marginTop: 12 }}>
                                <div className="quiz-stat">
                                    <span className="quiz-stat__icon"><EyeOutlined /></span>
                                    <div>
                                        <Text className="quiz-stat__label">Personality Type</Text>
                                        <Text className="quiz-stat__value" style={{ color: personality.color }}>
                                            {personality.level}
                                        </Text>
                                        <Text className="quiz-stat__sub">{personality.description}</Text>
                                    </div>
                                </div>
                                <div className="quiz-stat">
                                    <span className="quiz-stat__icon"><CheckCircleOutlined /></span>
                                    <div>
                                        <Text className="quiz-stat__label">Completion Rate</Text>
                                        <Text className="quiz-stat__value">
                                            {((completionStatus.answered / completionStatus.total) * 100).toFixed(0)}%
                                        </Text>
                                        <Text className="quiz-stat__sub">
                                            {completionStatus.answered} of {completionStatus.total} questions
                                        </Text>
                                    </div>
                                </div>
                                <div className="quiz-stat">
                                    <span className="quiz-stat__icon"><ClockCircleOutlined /></span>
                                    <div>
                                        <Text className="quiz-stat__label">Time Spent</Text>
                                        <Text className="quiz-stat__value">{formatTime(timeSpent)}</Text>
                                        <Text className="quiz-stat__sub">
                                            Estimated: {currentQuiz.estimatedTime} min
                                        </Text>
                                    </div>
                                </div>
                            </div>

                            <Divider className="quiz-divider" />

                            <div>
                                <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
                                    🎨 Your Visual Preferences Analysis
                                </Title>
                                <Row gutter={[16, 16]}>
                                    {currentQuiz.questions.map((question, index) => {
                                        const selectedOption = question.options.find(
                                            (opt) => opt.id === answers[question.id]
                                        );
                                        return (
                                            <Col xs={24} lg={12} key={question.id}>
                                                <Card
                                                    className="quiz-card"
                                                    size="small"
                                                    style={{ borderLeft: `4px solid ${personality.color}`, height: "100%" }}
                                                >
                                                    <Space direction="vertical" style={{ width: "100%" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                            <Text strong style={{ flex: 1 }}>
                                                                Q{index + 1}: {question.question}
                                                            </Text>
                                                            <Space>
                                                                {question.required && (
                                                                    <Tag color="red">Required</Tag>
                                                                )}
                                                                <Tag color="blue">{question.category}</Tag>
                                                            </Space>
                                                        </div>

                                                        {selectedOption && (
                                                            <div
                                                                style={{
                                                                    marginTop: 8,
                                                                    padding: 12,
                                                                    background: "var(--surface-2)",
                                                                    borderRadius: 8,
                                                                    border: "1px solid var(--border)",
                                                                }}
                                                            >
                                                                <Row gutter={16} align="middle">
                                                                    <Col xs={24} sm={8}>
                                                                        <Image
                                                                            src={selectedOption.image}
                                                                            alt={`Selected option ${selectedOption.label}`}
                                                                            width="100%"
                                                                            height={60}
                                                                            style={{ objectFit: "cover", borderRadius: 6 }}
                                                                            preview={{ mask: <EyeOutlined /> }}
                                                                        />
                                                                    </Col>
                                                                    <Col xs={24} sm={16}>
                                                                        <Text strong>Option {selectedOption.label}</Text>
                                                                        <br />
                                                                        <Text type="secondary" style={{ fontSize: "13px" }}>
                                                                            {selectedOption.interpretation}
                                                                        </Text>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        )}

                                                        {!selectedOption && (
                                                            <Text type="secondary" italic>
                                                                Not answered
                                                            </Text>
                                                        )}
                                                    </Space>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </div>
                        </Result>
                    </Card>
                </section>
                {expiredModalNode}
            </div>
        );
    }

    const completionStatus = getCompletionStatus();

    return (
        <div
            className={`quiz-page ${revealed ? "is-revealed" : ""} ${
                timeExpired ? "is-locked" : ""
            }`}
        >
            {offlineBannerNode}
            <div className="page-theme-toggle">
                <button
                    type="button"
                    className="page-theme-toggle__btn"
                    onClick={() => {
                        setCurrentTheme(currentTheme === "black" ? "white" : "black");
                    }}
                    aria-label="Toggle theme"
                >
                    {currentTheme === "black" ? <MoonOutlined /> : <SunOutlined />}
                </button>
                <style>{`
                /* ============ Theme toggle (synced with FormLogin) ============ */
                .page-theme-toggle {
                    position: fixed; top: 20px; right: 20px; z-index: 1000;
                }
                .page-theme-toggle__btn {
                    width: 48px; height: 48px;
                    border-radius: 50%;
                    display: inline-flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #4f46e5;
                    box-shadow: 0 4px 14px rgba(2, 6, 23, 0.10);
                    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                                box-shadow 0.25s ease, border-color 0.2s;
                }
                .page-theme-toggle__btn:hover {
                    transform: rotate(-8deg) scale(1.05);
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.10),
                                0 10px 28px rgba(2, 6, 23, 0.18);
                }
                .page-theme-toggle__btn .anticon { font-size: 20px; }
                [data-theme="black"] .page-theme-toggle__btn {
                    background: #121620;
                    border-color: #303746;
                    color: #60a5fa;
                    box-shadow: 0 4px 14px rgba(0,0,0,0.45);
                }
`}</style>
            </div>
            {/* ============ HERO ============ */}
            <section className="quiz-hero">
                <div className="quiz-hero__bg" aria-hidden>
                    <span className="blob blob-1" />
                    <span className="blob blob-2" />
                    <span className="blob blob-3" />
                    <div className="dot-grid" />
                </div>

                <div className="quiz-hero__content">
                    <div className="quiz-hero__brand">
                        <img src={logo} alt="OCC Logo" className="quiz-hero__logo" />
                        <div className="quiz-hero__brand-meta">
                            <Tag className="quiz-chip" icon={<PictureOutlined />}>
                                VISUAL ASSESSMENT
                            </Tag>
                            <Text className="quiz-hero__eyebrow">
                                {companyInfo.name}
                            </Text>
                        </div>
                    </div>

                    <Title className="quiz-hero__title">
                        Visual Personality{" "}
                        <span className="grad-text">Assessment</span>
                    </Title>

                    <Paragraph className="quiz-hero__lead">
                        {currentQuiz.description}. Choose the visuals that resonate with
                        you most — there are no right or wrong answers.
                    </Paragraph>

                    <div className="quiz-hero__company">
                        <span><GlobalOutlined /> {companyInfo.website}</span>
                        <span><EnvironmentOutlined /> {companyInfo.address}</span>
                    </div>

                    <div className="quiz-hero__tags">
                        <Tag icon={<PictureOutlined />}>Visual</Tag>
                        <Tag icon={<ClockCircleOutlined />}>{currentQuiz.estimatedTime} min</Tag>
                        <Tag icon={<BulbOutlined />}>{currentQuiz.questions.length} Questions</Tag>
                        <Tag icon={<ClockCircleOutlined />} color={timeLeft < 60 ? "red" : "blue"}>
                            Time Left: {formatTime(timeLeft)}
                        </Tag>
                    </div>
                </div>
            </section>

            {/* ============ STATS ============ */}
            <section className="quiz-section">
                <Card className="quiz-card" bordered={false}>
                    <div className="quiz-stats">
                        <div className="quiz-stat">
                            <span className="quiz-stat__icon"><ThunderboltOutlined /></span>
                            <div style={{ flex: 1 }}>
                                <Text className="quiz-stat__label">Progress</Text>
                                <Text className="quiz-stat__value">{getProgress()}%</Text>
                                <Progress
                                    percent={getProgress()}
                                    size="small"
                                    showInfo={false}
                                    strokeColor={{ "0%": "#0ea5e9", "100%": "#7c3aed" }}
                                />
                            </div>
                        </div>
                        <div className="quiz-stat">
                            <span className="quiz-stat__icon"><CheckCircleOutlined /></span>
                            <div>
                                <Text className="quiz-stat__label">Required</Text>
                                <Text className="quiz-stat__value">
                                    {completionStatus.requiredAnswered}
                                    <span className="quiz-footer__muted"> / {completionStatus.requiredTotal}</span>
                                </Text>
                                <Text className="quiz-stat__sub">questions completed</Text>
                            </div>
                        </div>
                        <div className="quiz-stat">
                            <span className="quiz-stat__icon"><ClockCircleOutlined /></span>
                            <div>
                                <Text className="quiz-stat__label">Time Spent</Text>
                                <Text className="quiz-stat__value">{formatTime(timeSpent)}</Text>
                                <Text className="quiz-stat__sub">since you started</Text>
                            </div>
                        </div>
                        <div className="quiz-stat">
                            <span className="quiz-stat__icon"><BulbOutlined /></span>
                            <div>
                                <Text className="quiz-stat__label">Current Question</Text>
                                <Text className="quiz-stat__value">
                                    {currentQuestionIndex + 1}
                                    <span className="quiz-footer__muted"> / {currentQuiz.questions.length}</span>
                                </Text>
                                <Text className="quiz-stat__sub">visual preference</Text>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            {/* ============ QUESTION ============ */}
            <section className="quiz-section">
                <Card className="quiz-question-card" bordered={false}>
                    <div className="quiz-question-meta">
                        <Tag color="purple" icon={<PictureOutlined />}>
                            {currentQuestion.category}
                        </Tag>
                        {currentQuestion.required ? (
                            <Tag color="red">Required</Tag>
                        ) : (
                            <Tag color="orange">Optional</Tag>
                        )}
                        {answers[currentQuestion.id] && (
                            <Tag color="green" icon={<CheckCircleOutlined />}>
                                Answered
                            </Tag>
                        )}
                    </div>

                    <Title level={3} className="quiz-question-text">
                        <PictureOutlined />
                        {currentQuestion.question}
                    </Title>

                    {currentQuestion.description && (
                        <Alert
                            message="Visual Context"
                            description={currentQuestion.description}
                            type="info"
                            showIcon
                            style={{ marginBottom: 18, borderRadius: 12 }}
                        />
                    )}

                    {/* Image Options */}
                    <div className="image-options-grid">
                        <Row gutter={[16, 16]}>
                            {currentQuestion.options.map((option) => {
                                const isSelected = answers[currentQuestion.id] === option.id;
                                return (
                                    <Col xs={12} sm={12} md={6} key={option.id}>
                                        <Tooltip title={`Choose option ${option.label}`}>
                                            <div
                                                className={`image-option ${isSelected ? "selected" : ""} ${timeExpired ? "is-disabled" : ""}`}
                                                onClick={() =>
                                                    handleImageSelect(currentQuestion.id, option.id)
                                                }
                                            >
                                                <div className="image-container">
                                                    <Image
                                                        src={option.image}
                                                        alt={`Option ${option.label}`}
                                                        width="100%"
                                                        height={160}
                                                        style={{ objectFit: "cover" }}
                                                        preview={{ mask: <EyeOutlined /> }}
                                                        onLoad={() => handleImageLoad(option.id)}
                                                    />
                                                </div>
                                                <div className="option-label">
                                                    <Text className="label-text">
                                                        Option {option.label}
                                                    </Text>
                                                    <span className="selection-indicator">
                                                        {isSelected ? (
                                                            <CheckCircleOutlined
                                                                style={{ color: "#7c3aed", fontSize: 20 }}
                                                            />
                                                        ) : (
                                                            <span className="radio-placeholder" />
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </Tooltip>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                </Card>
            </section>

            {/* ============ NAVIGATION ============ */}
            <section className="quiz-section">
                <div className="quiz-navigation">
                    <Button
                        size="large"
                        icon={<ArrowLeftOutlined />}
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0 || timeExpired}
                        className="btn-ghost"
                    >
                        Previous
                    </Button>

                    <Space>
                        <Text strong>
                            Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
                        </Text>
                        <Tag color="cyan">
                            {Math.round(((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100)}% Complete
                        </Tag>
                    </Space>

                    <Button
                        size="large"
                        icon={<ArrowRightOutlined />}
                        onClick={handleNext}
                        disabled={
                            currentQuestionIndex === currentQuiz.questions.length - 1 ||
                            timeExpired
                        }
                        className="btn-ghost"
                    >
                        Next
                    </Button>
                </div>
            </section>

            {/* ============ SUBMIT SECTION ============ */}
            {currentQuestionIndex === currentQuiz.questions.length - 1 && (
                <section className="quiz-section">
                    <Card className="quiz-submit-card">
                        <Space direction="vertical" size="large" style={{ width: "100%" }}>
                            <div>
                                <Title
                                    level={3}
                                    style={{
                                        color: allRequiredAnswered() ? "#7c3aed" : "#fa8c16",
                                        margin: 0,
                                    }}
                                >
                                    {allRequiredAnswered()
                                        ? "🎉 Ready to Discover!"
                                        : "📋 Complete Required Selections"}
                                </Title>
                                <Text type="secondary">
                                    {allRequiredAnswered()
                                        ? "All required visual selections have been made. Submit to discover your personality profile."
                                        : `${
                                              completionStatus.requiredTotal -
                                              completionStatus.requiredAnswered
                                          } required selection(s) remaining.`}
                                </Text>
                            </div>

                            <Button
                                size="large"
                                icon={<ThunderboltOutlined />}
                                onClick={handleSubmit}
                                disabled={!allRequiredAnswered() || timeExpired}
                                loading={isSubmitting}
                                className="btn-primary-grad"
                                style={{ minWidth: 240 }}
                            >
                                {isSubmitting ? "Analyzing..." : "Discover My Personality"}
                            </Button>

                            <Space wrap split={<Divider type="vertical" />} style={{ justifyContent: "center", width: "100%" }}>
                                <Space>
                                    <CheckCircleOutlined
                                        style={{
                                            color:
                                                completionStatus.requiredAnswered ===
                                                completionStatus.requiredTotal
                                                    ? "#52c41a"
                                                    : "#d9d9d9",
                                        }}
                                    />
                                    <Text>
                                        Required: {completionStatus.requiredAnswered}/{completionStatus.requiredTotal}
                                    </Text>
                                </Space>
                                <Space>
                                    <CheckCircleOutlined
                                        style={{
                                            color:
                                                completionStatus.answered === completionStatus.total
                                                    ? "#52c41a"
                                                    : "#d9d9d9",
                                        }}
                                    />
                                    <Text>
                                        Total: {completionStatus.answered}/{completionStatus.total}
                                    </Text>
                                </Space>
                                <Space>
                                    <BulbOutlined style={{ color: "#0ea5e9" }} />
                                    <Text>
                                        Question: {currentQuestionIndex + 1}/{currentQuiz.questions.length}
                                    </Text>
                                </Space>
                            </Space>
                        </Space>
                    </Card>
                </section>
            )}

            {/* Help */}
            <section className="quiz-section">
                <Alert
                    message="💡 Visual Assessment Guidance"
                    description="This personality assessment uses visual preferences to understand your traits. Select the images that genuinely resonate with you — there are no right or wrong answers. Your choices reveal your natural inclinations and personality characteristics."
                    type="info"
                    showIcon
                    style={{ borderRadius: 14 }}
                />
            </section>

            {/* ============ RESUME + TIME EXPIRED MODALS ============ */}
            {resumeModalNode}
            {expiredModalNode}
        </div>
    );
};

export default ImageQuizPage;