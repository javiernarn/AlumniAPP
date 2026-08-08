import React, { useState, useEffect, useRef } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    Typography,
    Space,
    Divider,
    Rate,
    Progress,
    Alert,
    Statistic,
    Tag,
    Result,
    Pagination,
    Tooltip,
    Modal,
    Steps,
    Badge,
    Avatar,
    notification,
} from "antd";
import {
    StarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SmileOutlined,
    ExclamationCircleOutlined,
    BulbOutlined,
    ThunderboltOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    UserOutlined,
    QuestionCircleOutlined,
    RocketOutlined,
    TrophyOutlined,
    FireOutlined,
    CalendarOutlined,
    TeamOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    EllipsisOutlined,
    SunOutlined,
    MoonOutlined,
    WifiOutlined,
    DisconnectOutlined,
    LogoutOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import "./AnswerQuizPage.css";
import useTakeQuiz from "~/hooks/useTakeQuiz";
import axiosConfig from "~/utils/axiosConfig";
import logo from "~/assets/images/OCC_LOGO.png";
import secureLocalStorage from "react-secure-storage";
import { useAppTheme } from "~/hooks/useAppTheme";

// ===== Constants for Time Expiration & Auto-Save =====
const QUIZ_DURATION = 5 * 60; // 5 minutes (in seconds)
const STORAGE_KEY = "answerQuizProgress";
const LOGOUT_COUNTDOWN = 10;

// Company/University Information
const companyInfo = {
    name: "Opol Community College Alumni Association",
    logo: logo,
    slogan: "Building tomorrow's leaders, one student at a time.",
    website: "alumni.occph.com",
    address: "ZONE C. Salva St, Opol, 9016 Misamis Oriental",
};

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;



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

const AnswerQuizPage = () => {
    const {
        isLoading: isLoadingQuizzes,
        data: questions = [],
        isFetching: isFetchingQuizzes,
        refetch: refetchQuizzes,
    } = useTakeQuiz("rating");

    const [currentQuiz, setCurrentQuiz] = useState({
        title: "Behavioral Stress Test",
        description: "Please rate your experiences",
        questions: questions,
        estimatedTime: 5,
        category: "Workplace Wellness",
        difficulty: "Intermediate",
    });

    const [answers, setAnswers] = useState({});
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [questionsPerPage] = useState(1);
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([1]));
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
    document.title = "Rating Quiz | ATMS - Opol Community College";
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

    // ===== Load saved progress on mount (Resume Assessment) =====
    useEffect(() => {
        try {
            const raw = secureLocalStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.quizType === "rating") {
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
                currentPage,
                visitedQuestions: Array.from(visitedQuestions),
                timeSpent,
                quizType: "rating",
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
        currentPage,
        visitedQuestions,
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
    }, [answers, currentPage, visitedQuestions, timeSpent, timeExpired, isQuizCompleted]);

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

    useEffect(() => {
        const t = setTimeout(() => setRevealed(true), 60);
        return () => clearTimeout(t);
    }, []);

    // Add interpretation to each question dynamically
    const questionsWithInterpretation = questions.map((question, index) => ({
        ...question,
        interpretation: {
            1: "Very often / Very well",
            2: "Often / Well",
            3: "Sometimes / Moderately",
            4: "Rarely / Poorly",
            5: "Very rarely / Very poorly",
        },
        category: "Workplace Wellness",
        sequence: index + 1,
    }));

    // ============ THEME SYNC (shared with FormLogin) ============
    // Uses the same useAppTheme hook as FormLogin so this page can never
    // drift out of sync with what was actually saved (cookie + secureLocalStorage
    // + BroadcastChannel, all handled centrally by the hook).
    const { theme: currentTheme, setTheme: setCurrentTheme } = useAppTheme();
    // ============ END THEME SYNC ============

    // Pagination logic
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = questionsWithInterpretation.slice(
        indexOfFirstQuestion,
        indexOfLastQuestion
    );

    const totalPages = Math.ceil(
        questionsWithInterpretation.length / questionsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
        setVisitedQuestions((prev) => {
            const next = new Set([...prev, page]);
            saveQuizProgress({ currentPage: page, visitedQuestions: Array.from(next) });
            return next;
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleRateChange = (questionId, value) => {
        setAnswers((prev) => {
            const next = { ...prev, [questionId]: value };
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
                setCurrentPage(saved.currentPage || 1);
                setVisitedQuestions(
                    new Set(
                        Array.isArray(saved.visitedQuestions)
                            ? saved.visitedQuestions
                            : [saved.currentPage || 1]
                    )
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
            secureLocalStorage.removeItem("imageQuizProgress");
        } catch (_) {}
        setAnswers({});
        setCurrentPage(1);
        setVisitedQuestions(new Set([1]));
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
                title: "Incomplete Assessment",
                content:
                    "Please answer all required questions before submitting.",
                icon: <ExclamationCircleOutlined />,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();

            formData.append("type", "rating");
            formData.append("quizId", currentQuiz.id || "default-quiz-id");
            formData.append("timeSpent", timeSpent.toString());
            formData.append("completedAt", new Date().toISOString());
            formData.append(
                "totalQuestions",
                questionsWithInterpretation.length.toString()
            );
            formData.append(
                "answeredQuestions",
                Object.keys(answers).length.toString()
            );

            const userInfo = secureLocalStorage.getItem("userInfo");
            if (userInfo) {
                formData.append("userInfo", userInfo);
            }

            Object.entries(answers).forEach(([questionId, rating], index) => {
                formData.append(`answers[${index}][questionId]`, questionId);
                formData.append(`answers[${index}][rating]`, rating.toString());
                formData.append(
                    `answers[${index}][answeredAt]`,
                    new Date().toISOString()
                );

                const additionalData = answers[questionId]?.additionalData;
                if (additionalData) {
                    if (additionalData.comment) {
                        formData.append(
                            `answers[${index}][comment]`,
                            additionalData.comment
                        );
                    }
                    if (additionalData.file) {
                        formData.append(
                            `answers[${index}][file]`,
                            additionalData.file
                        );
                    }
                }
            });

            const response = await axiosConfig.post(
                "/save-alumni-quiz",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                if (response.data.submissionId) {
                    secureLocalStorage.setItem(
                        "lastSubmissionId",
                        response.data.submissionId
                    );
                }

                // Clean saved progress so it does not restore old answers
                try {
                    secureLocalStorage.removeItem(STORAGE_KEY);
                } catch (_) {}
                setIsQuizCompleted(true);

                Modal.success({
                ...getThemedModalProps(currentTheme),
                    title: "Assessment Complete!",
                    content:
                        "Thank you for completing the assessment. Your responses have been recorded successfully.",
                    onOk: () => (window.location.href = "/"),
                });
            } else {
                throw new Error(response.data.message || "Submission failed");
            }
        } catch (error) {
            console.error("❌ Error submitting quiz:", error);

            let errorMessage = "Failed to submit quiz. Please try again.";

            if (error.code === "ECONNABORTED") {
                errorMessage =
                    "Request timeout. Please check your internet connection and try again.";
            } else if (error.response?.status === 413) {
                errorMessage =
                    "File too large. Please reduce file size and try again.";
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }

            Modal.error({
                ...getThemedModalProps(currentTheme),
                title: "Submission Error",
                content: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProgress = () => {
        const answered = Object.keys(answers).length;
        return Math.floor(
            (answered / questionsWithInterpretation.length) * 100
        );
    };

    const getCompletionStatus = () => {
        const requiredQuestions = questionsWithInterpretation.filter(
            (q) => q.required
        );
        const answeredRequired = requiredQuestions.filter(
            (q) => answers[q.id] !== undefined && answers[q.id] !== null
        ).length;

        return {
            answered: Object.keys(answers).length,
            total: questionsWithInterpretation.length,
            requiredAnswered: answeredRequired,
            requiredTotal: requiredQuestions.length,
        };
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getAverageRating = () => {
        const ratings = Object.values(answers).filter(
            (val) => val !== null && val !== undefined
        );
        if (ratings.length === 0) return 0;
        return (
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        );
    };

   const getStressLevel = () => {
    const average = getAverageRating();

    if (average <= 2) {
        return {
            level: "Critical",
            color: "#f5222d",
            description: "Difficult experiences",
            icon: <FireOutlined />,
            indicator: <Badge color="#f5222d" text="Critical" />,
        };
    } else if (average <= 3) {
        return {
            level: "High",
            color: "#fa8c16",
            description: "Challenging experiences",
            icon: <ExclamationCircleOutlined />,
            indicator: <Badge color="#fa8c16" text="High" />,
        };
    } else if (average <= 4) {
        return {
            level: "Moderate",
            color: "#faad14",
            description: "Balanced experiences",
            icon: <UserOutlined />,
            indicator: <Badge color="#faad14" text="Moderate" />,
        };
    } else {
        return {
            level: "Low",
            color: "#52c41a",
            description: "Positive experiences",
            icon: <SmileOutlined />,
            indicator: <Badge color="#52c41a" text="Low" />,
        };
    }
};

    const allRequiredAnswered = () => {
        const requiredQuestions = questionsWithInterpretation.filter(
            (q) => q.required
        );
        return requiredQuestions.every(
            (q) => answers[q.id] !== undefined && answers[q.id] !== null
        );
    };

    const getStarColors = (value) => {
        const colors = {
            1: "#f5222d",
            2: "#fa8c16",
            3: "#faad14",
            4: "#73d13d",
            5: "#52c41a",
        };
        return colors[value] || "#f0f0f0";
    };

    const CustomRate = ({ value, onChange, questionId }) => {
        return (
            <div className="custom-rate">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Tooltip
                        key={star}
                        title={
                            questionsWithInterpretation.find(
                                (q) => q.id === questionId
                            )?.interpretation[star]
                        }
                    >
                        <button
                            type="button"
                            className={`rate-star ${value >= star ? "active" : ""}`}
                            onClick={() => onChange(questionId, star)}
                            disabled={timeExpired}
                            style={{
                                color:
                                    value >= star
                                        ? getStarColors(star)
                                        : undefined,
                                background:
                                    value >= star
                                        ? `${getStarColors(star)}1F`
                                        : undefined,
                                borderColor:
                                    value >= star
                                        ? getStarColors(star)
                                        : undefined,
                            }}
                        >
                            <StarOutlined />
                            <span className="star-number">{star}</span>
                        </button>
                    </Tooltip>
                ))}
            </div>
        );
    };

    const getQuestionStatus = (questionId) => {
        return answers[questionId] ? "answered" : "unanswered";
    };

    const completionStatus = getCompletionStatus();
    const currentQuestion = currentQuestions[0];
    const questionNumber = (currentPage - 1) * questionsPerPage + 1;
    const timeLeft = Math.max(0, QUIZ_DURATION - timeSpent);
    const expiryProgress = Math.max(
        0,
        Math.min(100, (expiryCountdown / LOGOUT_COUNTDOWN) * 100)
    );

    return (
        <div
            className={`quiz-page ${revealed ? "is-revealed" : ""} ${
                timeExpired ? "is-locked" : ""
            }`}
        >
            {/* Offline banner */}
            {isOffline && (
                <div className="net-banner net-banner--offline" role="status">
                    <DisconnectOutlined />
                    <span>
                        <strong>Connection Lost.</strong> Your progress is being
                        saved automatically. Reconnect to continue normally.
                    </span>
                </div>
            )}

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
                            <Tag className="quiz-chip" icon={<BulbOutlined />}>
                                BEHAVIORAL ASSESSMENT
                            </Tag>
                            <Text className="quiz-hero__eyebrow">
                                {companyInfo.name}
                            </Text>
                        </div>
                    </div>

                    <Title className="quiz-hero__title">
                        {currentQuiz.title.split(" ").slice(0, -1).join(" ")}{" "}
                        <span className="grad-text">
                            {currentQuiz.title.split(" ").slice(-1)[0]}
                        </span>
                    </Title>

                    <Paragraph className="quiz-hero__lead">
                        {currentQuiz.description}. Your honest feedback helps us
                        better understand workplace wellness and continuously
                        improve our alumni community experience.
                    </Paragraph>

                    <div className="quiz-hero__company">
                        <span><GlobalOutlined /> {companyInfo.website}</span>
                        <span><EnvironmentOutlined /> {companyInfo.address}</span>
                    </div>

                    <div className="quiz-hero__tags">
                        <Tag icon={<TeamOutlined />}>{currentQuiz.category}</Tag>
                        <Tag icon={<ThunderboltOutlined />}>{currentQuiz.difficulty}</Tag>
                        <Tag icon={<CalendarOutlined />}>{currentQuiz.estimatedTime} min</Tag>
                        <Tag icon={<QuestionCircleOutlined />}>
                            {questionsWithInterpretation.length} Questions
                        </Tag>
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
                                    className="quiz-progress"
                                    percent={getProgress()}
                                    size="small"
                                    showInfo={false}
                                />
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
                            <span className="quiz-stat__icon"><CheckCircleOutlined /></span>
                            <div>
                                <Text className="quiz-stat__label">Answered</Text>
                                <Text className="quiz-stat__value">
                                    {completionStatus.answered}
                                    <span className="quiz-footer__muted">
                                        {" "}/ {completionStatus.total}
                                    </span>
                                </Text>
                                <Text className="quiz-stat__sub">
                                    {completionStatus.requiredAnswered}/{completionStatus.requiredTotal} required
                                </Text>
                            </div>
                        </div>
                        <div className="quiz-stat">
                            <span className="quiz-stat__icon"><TrophyOutlined /></span>
                            <div>
                                <Text className="quiz-stat__label">Current Question</Text>
                                <Text className="quiz-stat__value">
                                    {questionNumber}
                                    <span className="quiz-footer__muted"> / {totalPages}</span>
                                </Text>
                                <Text className="quiz-stat__sub">step through one at a time</Text>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            {/* ============ STEPS ============ */}
            <section className="quiz-section">
                <Card className="quiz-card quiz-steps-card" bordered={false}>
                    <Steps
                        current={currentPage - 1}
                        percent={
                            (getProgress() / 100) *
                            (currentPage / totalPages) *
                            100
                        }
                        size="small"
                        responsive
                    >
                        {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => (
                                <Step
                                    key={i}
                                    title={`Q${i + 1}`}
                                    description={
                                        i + 1 === currentPage ? "Current" : ""
                                    }
                                    icon={
                                        <Badge
                                            count={
                                                answers[
                                                    questionsWithInterpretation[i]?.id
                                                ] ? (
                                                    <CheckCircleOutlined
                                                        style={{
                                                            color: "#52c41a",
                                                            fontSize: "12px",
                                                        }}
                                                    />
                                                ) : null
                                            }
                                        >
                                            <Avatar
                                                size="small"
                                                style={{
                                                    backgroundColor:
                                                        i + 1 === currentPage
                                                            ? "#0ea5e9"
                                                            : answers[
                                                                  questionsWithInterpretation[i]?.id
                                                              ]
                                                            ? "#52c41a"
                                                            : undefined,
                                                    color:
                                                        i + 1 === currentPage ||
                                                        answers[
                                                            questionsWithInterpretation[i]?.id
                                                        ]
                                                            ? "#fff"
                                                            : undefined,
                                                }}
                                            >
                                                {i + 1}
                                            </Avatar>
                                        </Badge>
                                    }
                                />
                            )
                        )}
                        {totalPages > 5 && (
                            <Step
                                title={`+${totalPages - 5} more`}
                                description=""
                                icon={<EllipsisOutlined />}
                            />
                        )}
                    </Steps>
                </Card>
            </section>

            {/* ============ QUESTION CARD ============ */}
            <section className="quiz-section">
                <Card className="quiz-question-card" bordered={false}>
                    <div className="quiz-question-meta">
                        <Badge
                            count={`Question ${questionNumber} of ${questionsWithInterpretation.length}`}
                            showZero
                        />
                        {currentQuestion?.required && (
                            <Tag color="red" icon={<ExclamationCircleOutlined />}>
                                Required
                            </Tag>
                        )}
                        <Text className="quiz-question-category">
                            {currentQuestion?.category}
                        </Text>
                    </div>

                    <Title level={3} className="quiz-question-text">
                        <QuestionCircleOutlined />
                        {currentQuestion?.question}
                    </Title>

                    {currentQuestion?.description && (
                        <Alert
                            message={currentQuestion.description}
                            type="info"
                            showIcon
                            closable
                            className="quiz-interpretation"
                        />
                    )}

                    <Divider className="quiz-divider" />

                    <div className="quiz-rating-section">
                        <Title level={4} className="quiz-rating-title">
                            Please rate your experience
                        </Title>

                        <CustomRate
                            value={answers[currentQuestion?.id]}
                            onChange={handleRateChange}
                            questionId={currentQuestion?.id}
                        />

                        {answers[currentQuestion?.id] && (
                            <Alert
                                className="quiz-interpretation"
                                message={
                                    <Space>
                                        <TrophyOutlined />
                                        <span>
                                            {
                                                currentQuestion?.interpretation[
                                                    answers[currentQuestion.id]
                                                ]
                                            }
                                        </span>
                                    </Space>
                                }
                                type="success"
                                showIcon
                            />
                        )}
                    </div>

                    <Divider className="quiz-divider" />

                    {/* Navigation */}
                    <div className="quiz-navigation">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handlePrevious}
                            disabled={currentPage === 1 || timeExpired}
                            size="large"
                            className="btn-ghost"
                        >
                            Previous
                        </Button>

                        <Space>
                            <Text type="secondary">
                                {currentPage} / {totalPages}
                            </Text>
                        </Space>

                        {currentPage === totalPages ? (
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleSubmit}
                                disabled={!allRequiredAnswered() || timeExpired}
                                loading={isSubmitting}
                                icon={<RocketOutlined />}
                                className="btn-primary-grad"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Assessment"}
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<ArrowRightOutlined />}
                                onClick={handleNext}
                                size="large"
                                disabled={timeExpired}
                                className="btn-primary-grad"
                            >
                                Next
                            </Button>
                        )}
                    </div>

                    {!allRequiredAnswered() && currentPage === totalPages && (
                        <Alert
                            className="quiz-interpretation"
                            message={`${
                                completionStatus.requiredTotal -
                                completionStatus.requiredAnswered
                            } required question(s) remaining`}
                            type="warning"
                            showIcon
                        />
                    )}

                    {/* Footer Summary */}
                    <div className="quiz-footer">
                        <span className="quiz-footer__item">
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <strong>{completionStatus.answered}</strong>
                            <span className="quiz-footer__muted">questions answered</span>
                        </span>
                        <span className="quiz-footer__item" style={{ justifyContent: "center" }}>
                            <ClockCircleOutlined style={{ color: "#faad14" }} />
                            <strong>{formatTime(timeSpent)}</strong>
                            <span className="quiz-footer__muted">time spent</span>
                        </span>
                        <span className="quiz-footer__item" style={{ justifyContent: "flex-end" }}>
                            <Progress
                                type="circle"
                                percent={getProgress()}
                                size={60}
                                strokeColor={{
                                    "0%": "#0ea5e9",
                                    "100%": "#7c3aed",
                                }}
                            />
                        </span>
                    </div>
                </Card>
            </section>

            {/* ============ RESUME ASSESSMENT MODAL ============ */}
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

            {/* ============ TIME EXPIRED MODAL ============ */}
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
        </div>
    );
};

export default AnswerQuizPage;