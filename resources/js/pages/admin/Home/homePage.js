"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Card,
    Typography,
    Tag,
    Button,
    Divider,
    Spin,
    Skeleton,
    Badge,
    Progress,
    Tooltip,
    Image,
} from "antd";
import {
    CalendarOutlined,
    SolutionOutlined,
    MessageOutlined,
    PictureOutlined,
    TeamOutlined,
    TrophyOutlined,
    RocketOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    EnvironmentOutlined,
    StarOutlined,
    IdcardOutlined,
    ApartmentOutlined,
    CloudOutlined,
    ThunderboltOutlined,
    UnorderedListOutlined,
    CrownOutlined,
    SafetyCertificateOutlined,
    BarChartOutlined,
    QuestionCircleOutlined,
    EyeOutlined,
    DownOutlined,
} from "@ant-design/icons";
import { Layout } from "~/components";
import { Link, useLocation } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import axiosConfig from "~/utils/axiosConfig";
import useAlumni from "~/hooks/useAlumni";
import useQuizResult from "~/hooks/useQuizResult";
import moment from "moment";
import "./homePage.css";

/* ── Header logo showcase assets ─────────────────────────────────────────
   Place the uploaded images in this folder (adjust the alias/path below
   to match wherever your project keeps static assets, e.g. src/assets/logos). */
import siteLogo from "~/assets/images/site-logo.png";
import beedLogo from "~/assets/images/beed-logo.png";
import bsbaLogo from "~/assets/images/bsba-logo.png";
import bsitLogo from "~/assets/images/bsit-logo.jpg";
import educLogo from "~/assets/images/educ-logo.png";
import johnLogo from "~/assets/images/john.png";
import joneeLogo from "~/assets/images/jonee.png";

const { Title, Text, Paragraph } = Typography;

/* ── Department logos shown around the central site logo ─────────────────
   BEED and EDUC intentionally use the same artwork (per college branding). */
const DEPARTMENT_LOGOS = [
    {
        key: "beed",
        tag: "BEED",
        full: "Bachelor of Elementary Education",
        logo: beedLogo,
        accent: "#c026d3",
    },
    {
        key: "bsba",
        tag: "BSBA",
        full: "Bachelor of Science in Business Administration",
        logo: bsbaLogo,
        accent: "#1e3a8a",
    },
    {
        key: "bsit",
        tag: "BSIT",
        full: "Bachelor of Science in Information Technology",
        logo: bsitLogo,
        accent: "#b91c1c",
    },
    {
        key: "educ",
        tag: "BSEd",
        full: "Bachelor of Secondary Education",
        logo: educLogo,
        accent: "#7c3aed",
    },
];

const DEV_TEAM = [
    // { key: "john", name: "John", logo: johnLogo },
    { key: "jonee", name: "Jonee", logo: joneeLogo },
];

/* ── Quick-nav cards — filtered by role ──────────────────────────────────── */
const ALL_QUICK_LINKS = [
    {
        key: "alumni",
        icon: <TeamOutlined />,
        label: "Alumni Directory",
        description: "Find and connect with fellow graduates",
        url: "/alumni",
        color: "#1890ff",
        bg: "rgba(24,144,255,0.08)",
        roles: ["admin", "alumni"],
    },
    {
        key: "events",
        icon: <CalendarOutlined />,
        label: "Events",
        description: "Upcoming job fairs, workshops & reunions",
        url: "/events",
        color: "#52c41a",
        bg: "rgba(82,196,26,0.08)",
        roles: ["admin", "alumni"],
    },
    {
        key: "job-posts",
        icon: <SolutionOutlined />,
        label: "Job Postings",
        description: "Browse career opportunities posted for you",
        url: "/job-posts",
        color: "#fa8c16",
        bg: "rgba(250,140,22,0.08)",
        roles: ["admin", "alumni"],
    },
    {
        key: "messages",
        icon: <MessageOutlined />,
        label: "Messages",
        description: "Chat with the guidance counselor",
        url: "/messages",
        color: "#722ed1",
        bg: "rgba(114,46,209,0.08)",
        roles: ["admin", "alumni"],
    },
    {
        key: "profile",
        icon: <IdcardOutlined />,
        label: "My Profile",
        description: "View and update your alumni information",
        url: "/profile",
        color: "#13c2c2",
        bg: "rgba(19,194,194,0.08)",
        roles: ["alumni"],
    },
    {
        key: "gallery",
        icon: <PictureOutlined />,
        label: "Gallery",
        description: "Relive memorable moments and milestones",
        url: "/gallery",
        color: "#eb2f96",
        bg: "rgba(235,47,150,0.08)",
        roles: ["admin", "alumni"],
    },
];

/* ── Greeting + identity helpers ─────────────────────────────────────────── */
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
};

const getFirstName = () => {
    try {
        const fname =
            secureLocalStorage.getItem("firstName") ||
            secureLocalStorage.getItem("fname");
        const name =
            secureLocalStorage.getItem("userName") ||
            secureLocalStorage.getItem("name");
        if (fname) return fname.toUpperCase();
        if (name) return name.split(" ")[0].toUpperCase();
        return "ALUMNI";
    } catch {
        return "ALUMNI";
    }
};

const getCurrentUserId = () => {
    try {
        const userObj = secureLocalStorage.getItem("user");
        return (
            userObj?.id ||
            secureLocalStorage.getItem("userId") ||
            secureLocalStorage.getItem("userID") ||
            secureLocalStorage.getItem("user_id") ||
            secureLocalStorage.getItem("id") ||
            null
        );
    } catch {
        return null;
    }
};

const getWeatherIcon = (condition) => {
    const c = (condition || "").toLowerCase();
    if (c.includes("thunder") || c.includes("storm"))
        return <ThunderboltOutlined style={{ color: "#faad14" }} />;
    if (c.includes("rain") || c.includes("drizzle"))
        return <span style={{ fontSize: 18 }}>🌧️</span>;
    if (c.includes("cloud") || c.includes("overcast"))
        return <CloudOutlined style={{ color: "#8c8c8c" }} />;
    if (c.includes("sun") || c.includes("clear"))
        return <span style={{ fontSize: 18 }}>☀️</span>;
    if (c.includes("fog") || c.includes("mist"))
        return <span style={{ fontSize: 18 }}>🌫️</span>;
    return <CloudOutlined style={{ color: "#8c8c8c" }} />;
};

const toCelsius = (f) => Math.round(((f - 32) * 5) / 9);

/* ── Quiz helpers ────────────────────────────────────────────────────────── */
const getQuizMeta = (row) => {
    const type = (row?.type || "").toLowerCase();
    const map = {
        abcd: {
            label: "Multiple Choice Quiz",
            icon: <UnorderedListOutlined />,
            color: "#52c41a",
        },
        rate: {
            label: "Rating Quiz",
            icon: <StarOutlined />,
            color: "#1890ff",
        },
        survey: {
            label: "Alumni Survey",
            icon: <CheckCircleOutlined />,
            color: "#722ed1",
        },
    };
    if (map[type]) return map[type];
    return {
        label:
            row?.quiz?.title ||
            row?.title ||
            (type ? type.replace(/^\w/, (c) => c.toUpperCase()) + " Quiz" : "Quiz"),
        icon: <QuestionCircleOutlined />,
        color: "#fa8c16",
    };
};

const getQuizScore = (row) => {
    if (!row) return null;
    const direct =
        row.percentage ?? row.score_percentage ?? row.percent ?? null;
    if (direct != null && !isNaN(direct))
        return Math.round(Number(direct));
    const score = row.score ?? row.correct ?? row.total_score;
    const total =
        row.total ??
        row.total_items ??
        row.max_score ??
        row.items ??
        row.questions_count;
    if (score != null && total) {
        const pct = (Number(score) / Number(total)) * 100;
        if (!isNaN(pct)) return Math.round(pct);
    }
    return null;
};

/* ── Stat card ───────────────────────────────────────────────────────────── */
const StatCard = ({ icon, value, label, color, loading }) => (
    <Card className="hp-stat-card" bordered={false}>
        <div className="hp-stat-inner">
            <div
                className="hp-stat-icon"
                style={{
                    background: `linear-gradient(135deg, ${color}26, ${color}10)`,
                    color,
                    boxShadow: `0 6px 16px ${color}26`,
                }}
            >
                {icon}
            </div>
            <div className="hp-stat-text">
                {loading ? (
                    <Skeleton.Input active size="small" style={{ width: 48 }} />
                ) : (
                    <span className="hp-stat-value">{value ?? "0"}</span>
                )}
                <span className="hp-stat-label">{label}</span>
            </div>
        </div>
    </Card>
);

/* ── Event row ───────────────────────────────────────────────────────────── */
const EventRow = ({ event }) => {
    const start = event.start_date || event.event_date || event.date;
    const daysLeft = start
        ? moment(start).diff(moment().startOf("day"), "days")
        : null;
    const typeColorMap = {
        "job-fair": "#1890ff",
        workshop: "#fa8c16",
        conference: "#722ed1",
        hiring: "#52c41a",
        seminar: "#13c2c2",
    };
    const typeColor =
        typeColorMap[(event.type || "").toLowerCase()] || "#1890ff";

    return (
        <div className="hp-event-row">
            <div
                className="hp-event-date-box"
                style={{ borderColor: typeColor }}
            >
                <span className="hp-event-month">
                    {start ? moment(start).format("MMM") : "—"}
                </span>
                <span className="hp-event-day" style={{ color: typeColor }}>
                    {start ? moment(start).format("DD") : "—"}
                </span>
            </div>
            <div className="hp-event-info">
                <Text strong className="hp-event-title">
                    {event.title || event.name || "Untitled Event"}
                </Text>
                <div className="hp-event-meta">
                    {event.location && (
                        <span className="hp-event-meta-item">
                            <EnvironmentOutlined /> {event.location}
                        </span>
                    )}
                    {daysLeft !== null && daysLeft >= 0 && (
                        <Tag
                            color={
                                daysLeft <= 3
                                    ? "red"
                                    : daysLeft <= 7
                                      ? "orange"
                                      : "blue"
                            }
                            style={{ fontSize: 11 }}
                        >
                            {daysLeft === 0 ? "Today!" : `${daysLeft}d left`}
                        </Tag>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Job row ─────────────────────────────────────────────────────────────── */
const JobRow = ({ job }) => (
    <div className="hp-job-row">
        <div className="hp-job-company-avatar">
            {job.company_logo ? (
                <img src={job.company_logo} alt={job.company_name} />
            ) : (
                <ApartmentOutlined style={{ fontSize: 18, color: "#1890ff" }} />
            )}
        </div>
        <div className="hp-job-info">
            <Text strong className="hp-job-title">
                {job.job_title || job.title || "Job Opening"}
            </Text>
            <div className="hp-job-meta">
                <span>{job.company_name || "Company"}</span>
                {job.work_location && (
                    <>
                        <span className="hp-dot">·</span>
                        <span>{job.work_location}</span>
                    </>
                )}
                {job.employment_type && (
                    <Tag
                        color="geekblue"
                        style={{ marginLeft: 6, fontSize: 11 }}
                    >
                        {job.employment_type}
                    </Tag>
                )}
            </div>
        </div>
        <Tag color="green" className="hp-job-new-tag">
            New
        </Tag>
    </div>
);

/* ── Weather + clock widget (supports default & "hero" variant) ──────────── */
const WeatherWidget = ({ weather, loading, variant = "default" }) => {
    const [localTime, setLocalTime] = useState("");

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setLocalTime(
                now.toLocaleTimeString("en-PH", {
                    timeZone: "Asia/Manila",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                }),
            );
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    const dateStr = new Date().toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        weekday: "short",
        month: "short",
        day: "numeric",
    });

    /* ── Hero variant: glassy pill that sits inside the hero header ── */
    if (variant === "hero") {
        return (
            <div className="hp-hero-weather">
                <div className="hp-hero-weather-block">
                    <div className="hp-hero-weather-location">
                        <EnvironmentOutlined />
                        <span>Opol, Mis. Or.</span>
                    </div>
                    <div className="hp-hero-weather-time">
                        {localTime || "—"}
                    </div>
                    {/* <div className="hp-hero-weather-date">{dateStr}</div> */}
                </div>
                <div className="hp-hero-weather-sep" />
                <div className="hp-hero-weather-block hp-hero-weather-block--right">
                    {loading ? (
                        <Skeleton.Input active size="small" style={{ width: 70 }} />
                    ) : weather ? (
                        <>
                            <div className="hp-hero-weather-icon">
                                {getWeatherIcon(weather.condition_text)}
                            </div>
                            <div className="hp-hero-weather-temp">
                                {toCelsius(weather.temperature)}°C
                            </div>
                            <div className="hp-hero-weather-condition">
                                {weather.condition_text}
                            </div>
                        </>
                    ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            N/A
                        </Text>
                    )}
                </div>
            </div>
        );
    }

    /* ── Default (stat-grid) variant — kept intact for backwards-compat ── */
    return (
        <Card className="hp-stat-card hp-weather-card" bordered={false}>
            <div className="hp-weather-inner">
                <div className="hp-weather-left">
                    <div className="hp-weather-location">
                        <EnvironmentOutlined
                            style={{ color: "#1890ff", fontSize: 12 }}
                        />
                        <span className="hp-weather-location-label">
                            Opol, Mis. Or.
                        </span>
                    </div>
                    <div className="hp-weather-time">{localTime || "—"}</div>
                    <div className="hp-weather-date">{dateStr}</div>
                </div>
                <div className="hp-weather-divider" />
                <div className="hp-weather-right">
                    {loading ? (
                        <Skeleton.Input active size="small" style={{ width: 70 }} />
                    ) : weather ? (
                        <>
                            <div className="hp-weather-icon">
                                {getWeatherIcon(weather.condition_text)}
                            </div>
                            <span className="hp-weather-temp">
                                {toCelsius(weather.temperature)}°C
                            </span>
                            <span className="hp-weather-condition">
                                {weather.condition_text}
                            </span>
                        </>
                    ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            N/A
                        </Text>
                    )}
                </div>
            </div>
        </Card>
    );
};

/* ── Achievements panel (alumni only) ────────────────────────────────────── */
const AchievementsPanel = ({ results, loading }) => {
    if (loading) {
        return (
            <Card className="hp-panel-card" bordered={false}>
                <Skeleton active avatar paragraph={{ rows: 1 }} />
                <Skeleton active avatar paragraph={{ rows: 1 }} style={{ marginTop: 16 }} />
            </Card>
        );
    }
    return (
        <Card
            className="hp-panel-card hp-achievement-card"
            bordered={false}
            title={
                <div className="hp-panel-title">
                    <SafetyCertificateOutlined style={{ color: "#722ed1" }} />
                    <span>My Achievements</span>
                    {results.length > 0 && (
                        <Badge
                            count={results.length}
                            style={{
                                backgroundColor: "#722ed1",
                                marginLeft: 6,
                            }}
                        />
                    )}
                </div>
            }
        >
            {results.length === 0 ? (
                <div className="hp-panel-empty">
                    <TrophyOutlined className="hp-panel-empty-icon" />
                    <Text type="secondary">
                        Take a quiz to unlock your first achievement.
                    </Text>
                </div>
            ) : (
                <div className="hp-achv-list">
                    {results.slice(0, 4).map((r, i) => {
                        const meta = getQuizMeta(r);
                        const score = getQuizScore(r);
                        const when =
                            r.created_at || r.updated_at || r.submitted_at;
                        return (
                            <div
                                key={r.id || `${r.type}-${i}`}
                                className="hp-achv-row"
                            >
                                <div
                                    className="hp-achv-icon"
                                    style={{
                                        background: `${meta.color}1a`,
                                        color: meta.color,
                                    }}
                                >
                                    {meta.icon}
                                </div>
                                <div className="hp-achv-info">
                                    <Text strong className="hp-achv-title">
                                        {meta.label}
                                    </Text>
                                    <div className="hp-achv-meta">
                                        {when && (
                                            <span>
                                                {moment(when).format(
                                                    "MMM D, YYYY",
                                                )}
                                            </span>
                                        )}
                                        {when && score != null && (
                                            <span className="hp-dot">·</span>
                                        )}
                                        {score != null && (
                                            <span>Score {score}%</span>
                                        )}
                                    </div>
                                </div>
                                {score != null ? (
                                    <Tooltip title={`${score}%`}>
                                        <Progress
                                            type="circle"
                                            percent={score}
                                            size={40}
                                            strokeWidth={10}
                                            strokeColor={meta.color}
                                            format={() => (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: meta.color,
                                                    }}
                                                >
                                                    {score}
                                                </span>
                                            )}
                                        />
                                    </Tooltip>
                                ) : (
                                    <CheckCircleOutlined
                                        style={{
                                            color: "#52c41a",
                                            fontSize: 22,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
const HomePage = () => {
    const userRole = (
        secureLocalStorage.getItem("userRole") ||
        secureLocalStorage.getItem("role") ||
        "alumni"
    ).toLowerCase();
    const isAlumni = userRole === "alumni";
    const isAdmin = userRole === "admin";
    const firstName = getFirstName();
    const currentUserId = getCurrentUserId();
    const currentUserName =
        secureLocalStorage.getItem("userName") ||
        secureLocalStorage.getItem("name") ||
        "";

    // GET /alumni is admin-only on the backend — this page is shared by
    // both admin and alumni (see MainPage.js redirect logic), so this
    // must stay disabled for non-admins or every alumni landing here
    // fires an admin-only request and gets a 403.
    const { data: alumni = [], isLoading: alumniLoading } = useAlumni({
        enabled: isAdmin,
    });
    const {
        data: quizResults = [],
        isLoading: quizLoading,
        refetch: refetchQuizResults,
    } = useQuizResult();
    const location = useLocation();

    const stats = React.useMemo(() => {
        const list = (Array.isArray(alumni) ? alumni : []).filter(
            (a) => a.status !== "rejected",
        );
        return {
            totalAlumni: list.length,
            employed: list.filter((a) => a.employment_status_id === 1).length,
            unemployed: list.filter((a) => a.employment_status_id === 2).length,
        };
    }, [alumni]);

    const myQuizResults = useMemo(() => {
        if (!Array.isArray(quizResults)) return [];
        const firstWord =
            (currentUserName || "").split(" ")[0].toLowerCase() || "";
        return quizResults.filter((r) => {
            if (currentUserId != null) {
                const candidateIds = [
                    r.user?.id,
                    r.alumni_id,
                    r.user_id,
                    r.alumni?.id,
                ];
                // Compare as strings — localStorage values are strings while
                // API ids often come back as numbers, so a strict === here
                // was silently matching nothing.
                if (
                    candidateIds.some(
                        (id) =>
                            id != null &&
                            String(id) === String(currentUserId),
                    )
                )
                    return true;
            }
            if (firstWord && r.user?.name) {
                return r.user.name.toLowerCase().includes(firstWord);
            }
            return false;
        });
    }, [quizResults, currentUserId, currentUserName]);

    const [recentEvents, setRecentEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsTotal, setEventsTotal] = useState(0);

    const [recentJobs, setRecentJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsTotal, setJobsTotal] = useState(0);

    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(true);

    const [revealed, setRevealed] = useState(false);
    const BRAND_SHOWCASE_KEY = "hp_brand_showcase_open";
    const [showBrandShowcase, setShowBrandShowcase] = useState(() => {
        try {
            const saved = secureLocalStorage.getItem(BRAND_SHOWCASE_KEY);
            return saved === true || saved === "true";
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            secureLocalStorage.setItem(
                BRAND_SHOWCASE_KEY,
                showBrandShowcase,
            );
        } catch {
            // ignore storage failures (e.g. private browsing)
        }
    }, [showBrandShowcase]);

 

    useEffect(() => {
        const t = setTimeout(() => setRevealed(true), 60);
        return () => clearTimeout(t);
    }, []);

    // The quiz-taking page lives on a different route, so the cached
    // useQuizResult() data here can be stale by the time the user is
    // redirected back to Home right after submitting. Force a refetch
    // every time Home mounts / is navigated back to so a just-completed
    // quiz is picked up immediately instead of waiting for the next
    // background refetch.
    useEffect(() => {
        refetchQuizResults?.();
    }, [location.pathname]);

    useEffect(() => {
        (async () => {
            try {
                const res = await axiosConfig.get("/events");
                const raw = res?.data;
                const list =
                    raw?.data || raw?.events || (Array.isArray(raw) ? raw : []);
                const total =
                    raw?.total || raw?.meta?.total || list.length || 0;
                const upcoming = list
                    .filter((e) => {
                        const d = e.start_date || e.event_date || e.date;
                        return (
                            !d ||
                            moment(d).isSameOrAfter(moment().startOf("day"))
                        );
                    })
                    .sort((a, b) =>
                        moment(
                            a.start_date || a.event_date || a.date || "",
                        ).diff(
                            moment(
                                b.start_date || b.event_date || b.date || "",
                            ),
                        ),
                    );
                setEventsTotal(total);
                setRecentEvents(upcoming.slice(0, 4));
            } catch {
                setRecentEvents([]);
                setEventsTotal(0);
            } finally {
                setEventsLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const endpoint = isAlumni
                    ? "/job-posts?status=approved"
                    : "/job-posts";
                const res = await axiosConfig.get(endpoint);
                const raw = res?.data;
                const list =
                    raw?.data ||
                    raw?.jobs ||
                    raw?.job_posts ||
                    (Array.isArray(raw) ? raw : []);
                const active = list.filter((j) => !j.is_full && !j.is_expired);
                setJobsTotal(active.length);
                setRecentJobs(active.slice(0, 4));
            } catch {
                setRecentJobs([]);
                setJobsTotal(0);
            } finally {
                setJobsLoading(false);
            }
        })();
    }, [isAlumni]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(
                    "https://api.open-meteo.com/v1/forecast?latitude=8.5239&longitude=124.5658&current_weather=true&timezone=Asia%2FManila",
                );
                const data = await res.json();
                const cw = data?.current_weather;
                const wmoText = (code) => {
                    if (code === 0) return "Clear sky";
                    if (code <= 3) return "Partly cloudy";
                    if (code <= 49) return "Foggy";
                    if (code <= 67) return "Rainy";
                    if (code <= 77) return "Snowy";
                    if (code <= 82) return "Showers";
                    if (code <= 99) return "Thunderstorm";
                    return "Mostly cloudy";
                };
                setWeather(
                    cw
                        ? {
                              temperature: cw.temperature * (9 / 5) + 32,
                              condition_text: wmoText(cw.weathercode),
                              condition: wmoText(cw.weathercode),
                          }
                        : {
                              temperature: 83.3,
                              condition_text: "Mostly cloudy",
                              condition: "cloudy",
                          },
                );
            } catch {
                setWeather({
                    temperature: 83.3,
                    condition_text: "Mostly cloudy",
                    condition: "cloudy",
                });
            } finally {
                setWeatherLoading(false);
            }
        })();
    }, []);

    const quickLinks = ALL_QUICK_LINKS.filter((l) =>
        l.roles.includes(userRole),
    );

    const roleBadge = isAdmin ? (
        <>
            <CrownOutlined className="hp-hero-badge-icon" />
            <span>Administrator</span>
        </>
    ) : (
        <>
            <TrophyOutlined className="hp-hero-badge-icon" />
            <span>OCC Alumni</span>
        </>
    );

    const heroTagline = isAdmin ? (
        <>
            Welcome back, Admin. Manage the{" "}
            <strong>OCC Alumni Tracing System</strong> — track graduates,
            curate events, and keep the community thriving.
        </>
    ) : (
        <>
            Welcome to the <strong>OCC Alumni Tracing System</strong>. Stay
            connected, explore opportunities, and grow with your community.
        </>
    );

    return (
        <Layout>
            <div className={`hp-root ${revealed ? "hp-revealed" : ""}`}>
                {/* ── BRAND / LOGO SHOWCASE (toggled via the role badge) ── */}
                <div
                    className={`hp-brand-toggle-wrap ${showBrandShowcase ? "hp-brand-toggle-wrap--open" : ""}`}
                    aria-hidden={!showBrandShowcase}
                >
                    <div className="hp-brand-showcase">
                        <div className="hp-brand-devteam">
                            <Image.PreviewGroup
                                preview={{
                                rootClassName: "hp-dev-preview-root",
                                imageRender: (originalNode, info) => (
                                    <div className="hp-dev-preview-stage">
                                        {originalNode}
                                        <div className="hp-dev-preview-caption">
                                            <Text
                                                strong
                                                className="hp-dev-preview-name"
                                            >
                                                {DEV_TEAM[info?.current]
                                                    ?.name}
                                            </Text>
                                            <Text className="hp-dev-preview-role">
                                                Developer · OCC Alumni
                                                Tracing System
                                            </Text>
                                        </div>
                                    </div>
                                ),
                            }}
                        >
                            {DEV_TEAM.map((dev, i) => (
                                <Tooltip
                                    key={dev.key}
                                    title={`${dev.name} · Click to view`}
                                >
                                    <div
                                        className={`hp-dev-avatar hp-dev-avatar--${i + 1}`}
                                    >
                                        <Image
                                            src={dev.logo}
                                            alt={dev.name}
                                            rootClassName="hp-dev-avatar-image"
                                            preview={{
                                                mask: (
                                                    <EyeOutlined
                                                        style={{
                                                            fontSize: 16,
                                                        }}
                                                    />
                                                ),
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            ))}
                        </Image.PreviewGroup>
                        <span className="hp-dev-label">Built by OCC Dev</span>
                    </div>

                    <div className="hp-brand-track">
                        {DEPARTMENT_LOGOS.slice(0, 2).map((dept, i) => (
                            <Tooltip key={dept.key} title={dept.full}>
                                <div
                                    className="hp-brand-badge"
                                    tabIndex={0}
                                    style={{
                                        "--accent": dept.accent,
                                        "--i": i,
                                    }}
                                >
                                    <img src={dept.logo} alt={dept.full} />
                                    <span className="hp-brand-badge-tag">
                                        {dept.tag}
                                    </span>
                                </div>
                            </Tooltip>
                        ))}

                        <div className="hp-brand-center">
                            {/* <div className="hp-brand-center-ring" /> */}
                            <div className="hp-brand-center-glow" />
                            <img
                                src={siteLogo}
                                alt="Opol Community College"
                                className="hp-brand-center-img"
                            />
                        </div>

                        {DEPARTMENT_LOGOS.slice(2).map((dept, i) => (
                            <Tooltip key={dept.key} title={dept.full}>
                                <div
                                    className="hp-brand-badge"
                                    tabIndex={0}
                                    style={{
                                        "--accent": dept.accent,
                                        "--i": i + 2,
                                    }}
                                >
                                    <img src={dept.logo} alt={dept.full} />
                                    <span className="hp-brand-badge-tag">
                                        {dept.tag}
                                    </span>
                                </div>
                            </Tooltip>
                        ))}
                    </div>

                    <Text className="hp-brand-caption">
                        Opol Community College 
                    </Text>
                    </div>
                </div>

                {/* ── HERO ──────────────────────────────────────────────── */}
                <div
                    className={`hp-hero ${isAdmin ? "hp-hero--admin" : "hp-hero--alumni"}`}
                >
                    <div className="hp-hero-bg-shape" />
                    <div className="hp-hero-bg-shape hp-hero-bg-shape-2" />
                    <div className="hp-hero-grid-overlay" />
                    <div className="hp-hero-content">
                        <div className="hp-hero-left">
                            <Tag className="hp-hero-chip">
                                {isAdmin ? (
                                    <>
                                        <CrownOutlined /> Admin Console
                                    </>
                                ) : (
                                    <>
                                        <StarOutlined /> Alumni Portal
                                    </>
                                )}
                            </Tag>
                            <div className="hp-greeting-row">
                                <Text className="hp-greeting-text">
                                    {getGreeting()},
                                </Text>
                                <Title level={2} className="hp-greeting-name">
                                    {firstName}
                                </Title>
                                <span className="hp-greeting-wave">👋</span>
                            </div>
                            <div className="hp-date-row">
                                <CalendarOutlined className="hp-date-icon" />
                                <Text className="hp-date-text">
                                    {moment().format("dddd, MMMM D, YYYY")}
                                </Text>
                            </div>
                            <Paragraph className="hp-hero-tagline">
                                {heroTagline}
                            </Paragraph>
                        </div>
                        {/* ── HERO RIGHT: role badge + weather/time widget ── */}
                        <div className="hp-hero-right">
                            <button
                                type="button"
                                className={`hp-hero-badge hp-hero-badge--toggle ${showBrandShowcase ? "hp-hero-badge--active" : ""}`}
                                onClick={() =>
                                    setShowBrandShowcase((v) => !v)
                                }
                                aria-expanded={showBrandShowcase}
                                aria-label={
                                    showBrandShowcase
                                        ? "Hide college logos"
                                        : "Show college logos"
                                }
                            >
                                {roleBadge}
                                <DownOutlined
                                    className={`hp-hero-badge-chevron ${showBrandShowcase ? "hp-hero-badge-chevron--open" : ""}`}
                                />
                            </button>
                            <WeatherWidget
                                weather={weather}
                                loading={weatherLoading}
                                variant="hero"
                            />
                        </div>
                    </div>
                </div>

                <Divider className="hp-hero-divider" />

                {/* ── STATS ─────────────────────────────────────────────── */}
                <div className="hp-section">
                    <div className="hp-stats-grid">
                        <StatCard
                            icon={<TeamOutlined />}
                            value={stats.totalAlumni.toLocaleString()}
                            label="Total Alumni"
                            color="#1890ff"
                            loading={alumniLoading}
                        />
                        <StatCard
                            icon={<CheckCircleOutlined />}
                            value={stats.employed.toLocaleString()}
                            label="Employed"
                            color="#52c41a"
                            loading={alumniLoading}
                        />
                        <StatCard
                            icon={<CalendarOutlined />}
                            value={eventsTotal.toLocaleString()}
                            label="Events"
                            color="#fa8c16"
                            loading={eventsLoading}
                        />
                        <StatCard
                            icon={<SolutionOutlined />}
                            value={jobsTotal.toLocaleString()}
                            label="Job Openings"
                            color="#722ed1"
                            loading={jobsLoading}
                        />
                        {isAdmin && (
                            <StatCard
                                icon={<BarChartOutlined />}
                                value={(Array.isArray(quizResults)
                                    ? quizResults.length
                                    : 0
                                ).toLocaleString()}
                                label="Quiz Submissions"
                                color="#13c2c2"
                                loading={quizLoading}
                            />
                        )}
                        {isAlumni && (
                            <StatCard
                                icon={<SafetyCertificateOutlined />}
                                value={myQuizResults.length.toLocaleString()}
                                label="My Quizzes Taken"
                                color="#13c2c2"
                                loading={quizLoading}
                            />
                        )}
                    </div>
                </div>

                {/* ── QUICK ACCESS ──────────────────────────────────────── */}
                <div className="hp-section">
                    <div className="hp-section-header">
                        <Title level={5} className="hp-section-title">
                            <RocketOutlined /> Quick Access
                        </Title>
                    </div>
                    <div className="hp-quick-grid">
                        {quickLinks.map((item) => (
                            <Link
                                key={item.key}
                                to={item.url}
                                className="hp-quick-link"
                            >
                                <Card
                                    className="hp-quick-card"
                                    bordered={false}
                                    hoverable
                                >
                                    <div
                                        className="hp-quick-icon-wrap"
                                        style={{
                                            background: `linear-gradient(135deg, ${item.color}26, ${item.color}10)`,
                                            boxShadow: `0 6px 16px ${item.color}26`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: item.color,
                                                fontSize: 22,
                                            }}
                                        >
                                            {item.icon}
                                        </span>
                                    </div>
                                    <Text strong className="hp-quick-label">
                                        {item.label}
                                    </Text>
                                    <Text className="hp-quick-desc">
                                        {item.description}
                                    </Text>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── EVENTS + JOBS (+ Achievements for alumni) ────────── */}
                <div className="hp-section hp-bottom-row">
                    <div className="hp-panels-grid">
                        {/* Upcoming Events */}
                        <Card
                            className="hp-panel-card"
                            bordered={false}
                            title={
                                <div className="hp-panel-title">
                                    <CalendarOutlined
                                        style={{ color: "#52c41a" }}
                                    />
                                    <span>Upcoming Events</span>
                                    {recentEvents.length > 0 && (
                                        <Badge
                                            count={recentEvents.length}
                                            style={{
                                                backgroundColor: "#52c41a",
                                                marginLeft: 6,
                                            }}
                                        />
                                    )}
                                </div>
                            }
                            extra={
                                <Link to="/events">
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<ArrowRightOutlined />}
                                    >
                                        View All
                                    </Button>
                                </Link>
                            }
                        >
                            {eventsLoading ? (
                                <div className="hp-panel-loading">
                                    <Spin size="small" />
                                </div>
                            ) : recentEvents.length === 0 ? (
                                <div className="hp-panel-empty">
                                    <CalendarOutlined className="hp-panel-empty-icon" />
                                    <Text type="secondary">
                                        No upcoming events yet.
                                    </Text>
                                    <Link to="/events">
                                        <Button
                                            size="small"
                                            type="dashed"
                                            style={{ marginTop: 8 }}
                                        >
                                            Browse Events
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="hp-event-list">
                                    {recentEvents.map((e) => (
                                        <EventRow
                                            key={e.id || e.event_id || e.title}
                                            event={e}
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Latest Job Posts */}
                        <Card
                            className="hp-panel-card"
                            bordered={false}
                            title={
                                <div className="hp-panel-title">
                                    <SolutionOutlined
                                        style={{ color: "#fa8c16" }}
                                    />
                                    <span>Latest Job Posts</span>
                                    {recentJobs.length > 0 && (
                                        <Badge
                                            count={recentJobs.length}
                                            style={{
                                                backgroundColor: "#fa8c16",
                                                marginLeft: 6,
                                            }}
                                        />
                                    )}
                                </div>
                            }
                            extra={
                                <Link to="/job-posts">
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<ArrowRightOutlined />}
                                    >
                                        View All
                                    </Button>
                                </Link>
                            }
                        >
                            {jobsLoading ? (
                                <div className="hp-panel-loading">
                                    <Spin size="small" />
                                </div>
                            ) : recentJobs.length === 0 ? (
                                <div className="hp-panel-empty">
                                    <SolutionOutlined className="hp-panel-empty-icon" />
                                    <Text type="secondary">
                                        No job posts available right now.
                                    </Text>
                                    <Link to="/job-posts">
                                        <Button
                                            size="small"
                                            type="dashed"
                                            style={{ marginTop: 8 }}
                                        >
                                            Browse Jobs
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="hp-job-list">
                                    {recentJobs.map((j) => (
                                        <JobRow
                                            key={
                                                j.id || j.job_id || j.job_title
                                            }
                                            job={j}
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Achievements (alumni only) */}
                        {isAlumni && (
                            <AchievementsPanel
                                results={myQuizResults}
                                loading={quizLoading}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default HomePage;