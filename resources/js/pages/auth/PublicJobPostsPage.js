"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Typography, Row, Col, Spin, Empty, Select } from "antd";
import {
    BankOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    TagOutlined,
    FileOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ArrowRightOutlined,
    MenuOutlined,
    CloseOutlined,
    SunOutlined,
    MoonOutlined,
    MailOutlined,
    PhoneOutlined,
    FacebookOutlined,
    TwitterOutlined,
    InstagramOutlined,
    LockOutlined,
    SortAscendingOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePublicJobPostsData, { sortJobs, normalizeJobType } from "~/hooks/usePublicJobPostsData";
import usePreventInspect, { guardImageEvents, ZoomWarningModal } from "~/hooks/usePreventInspect";
import { BASE_URL } from "~/utils/constant";
// Reuses every design token, header, footer, and .ph-card base style
// already defined for the homepage so this page looks like part of
// the same site instead of a bolt-on. Only the job-posts-page-specific
// additions (dropdown jump-nav, sort control, card fields, badges)
// live in PublicJobPostsPage.css. Same split as PublicEventsPage.js.
import "./PublicHomePage.css";
import ScrollProgressOrb from "../admin/ScrollProgress/ScrollProgressOrb"
import "./PublicJobPostsPage.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ============================================================
// Small helpers — copied to match PublicHomePage.js / PublicEventsPage.js
// exactly so this page renders images/dates/text identically to the
// rest of the site.
// ============================================================
const buildImageUrl = (imagePath) => {
    try {
        if (!imagePath) return null;
        const base = String(BASE_URL || "").replace(/\/$/, "");
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath;
        }
        if (imagePath.startsWith("data:")) return imagePath;
        const raw = String(imagePath);
        const noLeading = raw.replace(/^\/+/, "");
        if (raw.startsWith("/storage/")) return `${base}${raw}`;
        if (noLeading.startsWith("storage/")) return `${base}/${noLeading}`;
        return `${base}/storage/${noLeading}`;
    } catch {
        return null;
    }
};

const formatDate = (value) => {
    if (!value) return "TBA";
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "TBA";
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });
    } catch {
        return "TBA";
    }
};

const stripHtml = (value) => {
    if (!value) return "";
    return String(value).replace(/<[^>]*>/g, "").trim();
};

// ============================================================
// Reveal-on-scroll wrapper — identical pattern to PublicHomePage.js /
// PublicEventsPage.js.
// ============================================================
const Reveal = ({ children, as: As = "div", className = "", ...rest }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <As ref={ref} className={`ph-reveal ${visible ? "is-visible" : ""} ${className}`} {...rest}>
            {children}
        </As>
    );
};

// ============================================================
// Job Type badge config — values match jobTypeOptions in
// AdminAlumniJobPostPage.js ("Full-time" / "Part-time" / "Contract").
// Keyed by the normalized bucket key from usePublicJobPostsData.js.
// ============================================================
const JOB_TYPE_META = {
    "full-time": { label: "Full-time", icon: <CheckCircleOutlined />, cls: "is-fulltime" },
    "part-time": { label: "Part-time", icon: <ClockCircleOutlined />, cls: "is-parttime" },
    "contract": { label: "Contract", icon: <FileOutlined />, cls: "is-contract" },
};

// Header dropdown / hero "Jump to" options, in the order they're
// rendered down the page.
const JOB_SECTIONS = [
    { value: "full-time", label: "Full-time", icon: <CheckCircleOutlined /> },
    { value: "part-time", label: "Part-time", icon: <ClockCircleOutlined /> },
    { value: "contract", label: "Contract", icon: <FileOutlined /> },
];

const SORT_OPTIONS = [
    { value: "date-desc", label: "Date: Latest First" },
    { value: "date-asc", label: "Date: Oldest First" },
    { value: "title-asc", label: "Title: A to Z" },
];

// Section copy — the "what to say" text lives right here so it's easy
// to tweak in one place without hunting through JSX below.
const SECTION_COPY = {
    "full-time": {
        title: "Full-time Job Posts",
        subtitle: "Long-term, full-time openings shared by the institution and its partner companies.",
        empty: "No full-time openings posted yet. Check back soon!",
    },
    "part-time": {
        title: "Part-time Job Posts",
        subtitle: "Flexible, part-time openings for alumni looking for a lighter schedule.",
        empty: "No part-time openings posted yet. Check back soon!",
    },
    "contract": {
        title: "Contract Job Posts",
        subtitle: "Fixed-term and project-based contract openings from our partner companies.",
        empty: "No contract openings posted yet. Check back soon!",
    },
};

// Copy shown under the action buttons of each card, depending on
// whether the post is still open or already full/expired.
const STATUS_MESSAGE = {
    open: "Sign in to apply for this job post. New here? Create a free alumni account — it only takes a minute.",
    closed: "This posting is no longer accepting applicants. Browse the other openings above, or check back soon for new postings.",
};

// ============================================================
// One job card — same content for every section, the only thing
// that changes per card is its type badge and whether it's still
// accepting applicants.
// ============================================================
const JobCard = ({ job, onLogin, onRegister, delayMs = 0 }) => {
    const typeKey = job._typeKey || normalizeJobType(job.job_type);
    const meta = JOB_TYPE_META[typeKey] || {
        label: job.job_type || "General",
        icon: <TagOutlined />,
        cls: "is-general",
    };
    const img = buildImageUrl(job.banner_image || job.banner_image_url);
    const closed = Boolean(job.is_expired || job.is_full);

    return (
        <Reveal className="pjp-card" style={{ transitionDelay: `${delayMs}ms` }}>
            {img ? (
                <div className="pjp-media">
                    <img src={img} alt={job.title || "Job banner"} {...guardImageEvents} />
                </div>
            ) : (
                <div className="pjp-media pjp-media-empty">
                    <BankOutlined />
                </div>
            )}

            <div className="pjp-card-body">
                <div className="pjp-card-tags">
                    <span className={`pjp-badge ${meta.cls}`}>
                        {meta.icon} {meta.label}
                    </span>
                    {closed && (
                        <span className="pjp-badge is-closed">
                            {job.is_expired ? <ClockCircleOutlined /> : <StopOutlined />}
                            {job.is_expired ? "Expired" : "Full"}
                        </span>
                    )}
                </div>

                <Title level={5} className="pjp-card-title">
                    {job.title || "Untitled Position"}
                </Title>

                <div className="pjp-card-company">
                    <BankOutlined />
                    <Text strong>{job.company || "Company withheld"}</Text>
                </div>

                <Paragraph className="pjp-card-desc">
                    {stripHtml(job.description) || "Full details will be shown once you sign in."}
                </Paragraph>

                <div className="pjp-card-facts">
                    <div className="pjp-fact">
                        <EnvironmentOutlined />
                        <span>{job.location || "Location TBA"}</span>
                    </div>
                    <div className="pjp-fact">
                        <CalendarOutlined />
                        <span>Posted {formatDate(job.created_at)}</span>
                    </div>
                    {job.expires_at && !job.is_expired && (
                        <div className="pjp-fact">
                            <ClockCircleOutlined />
                            <span>
                                {job.expiration_display
                                    ? `${job.expiration_display} left`
                                    : `Closes ${formatDate(job.expires_at)}`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="pjp-card-footer">
                    <p className="pjp-status-msg">
                        {closed ? (
                            STATUS_MESSAGE.closed
                        ) : (
                            <>
                                <LockOutlined /> {STATUS_MESSAGE.open}
                            </>
                        )}
                    </p>

                    {closed ? (
                        <div className="pjp-card-actions">
                            <button type="button" className="ph-btn ph-btn-ghost" onClick={onLogin}>
                                View All Jobs
                            </button>
                        </div>
                    ) : (
                        <div className="pjp-card-actions">
                            <button type="button" className="ph-btn ph-btn-solid" onClick={onLogin}>
                                Sign In to Apply
                            </button>
                            <button type="button" className="ph-btn ph-btn-ghost" onClick={onRegister}>
                                Create Account
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Reveal>
    );
};

// ============================================================
// One full section — title, subtitle, and a grid of JobCards
// (or a loading/empty state). `jobs` is expected to already be
// sorted by the caller (so every section reflects the same "Sort
// by" choice from the hero controls).
// ============================================================
const JobSection = ({ sectionKey, sectionRef, jobs, loading, onLogin, onRegister }) => {
    const copy = SECTION_COPY[sectionKey];

    return (
        <section className="ph-section pjp-section" id={`jobs-${sectionKey}`} ref={sectionRef}>
            <Reveal>
                <div className="ph-section-head">
                    <div>
                        <Title level={2} className="ph-section-title">
                            {copy.title}
                        </Title>
                        <Paragraph className="ph-section-sub">{copy.subtitle}</Paragraph>
                    </div>
                </div>
            </Reveal>

            <Row gutter={[22, 22]}>
                {loading ? (
                    <Col span={24}>
                        <div className="ph-state-box">
                            <Spin size="large" />
                            <Text>Loading job posts…</Text>
                        </div>
                    </Col>
                ) : jobs.length === 0 ? (
                    <Col span={24}>
                        <div className="ph-state-box">
                            <Empty description={copy.empty} />
                        </div>
                    </Col>
                ) : (
                    jobs.map((job, i) => (
                        <Col xs={24} sm={12} lg={8} key={job.id || i}>
                            <JobCard
                                job={job}
                                onLogin={onLogin}
                                onRegister={onRegister}
                                delayMs={i * 60}
                            />
                        </Col>
                    ))
                )}
            </Row>
        </section>
    );
};

// ============================================================
// Deep-link landings can look like they "jump back up" a moment
// after arriving — same reasoning/implementation as
// PublicEventsPage.js's scrollToSettled(). Kept local to this file
// so each public page owns its own copy rather than sharing a
// cross-file util.
// ============================================================
const scrollToSettled = (getTarget) => {
    let cancelled = false;
    let lastHeight = -1;
    let stableCount = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 30;
    const STABLE_TICKS_NEEDED = 3;

    const stop = () => {
        cancelled = true;
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchmove", stop);
        window.removeEventListener("keydown", stop);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", stop);

    const tick = () => {
        if (cancelled) return;
        const el = getTarget();
        if (!el) return stop();

        el.scrollIntoView({ behavior: "auto", block: "start" });

        const currentHeight = document.body.scrollHeight;
        if (currentHeight === lastHeight) {
            stableCount += 1;
        } else {
            stableCount = 0;
            lastHeight = currentHeight;
        }

        attempts += 1;
        if (stableCount >= STABLE_TICKS_NEEDED || attempts >= MAX_ATTEMPTS) {
            return stop();
        }
        setTimeout(tick, 90);
    };

    tick();
    return stop;
};

const PublicJobPostsPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [jumpValue, setJumpValue] = useState("full-time");
    const [sortBy, setSortBy] = useState("date-desc");
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();

    const { fullTime, partTime, contract, loading } = usePublicJobPostsData();

    // Every section reflects the same "Sort by" choice from the hero.
    const sortedFullTime = useMemo(() => sortJobs(fullTime, sortBy), [fullTime, sortBy]);
    const sortedPartTime = useMemo(() => sortJobs(partTime, sortBy), [partTime, sortBy]);
    const sortedContract = useMemo(() => sortJobs(contract, sortBy), [contract, sortBy]);

    const headerRef = useRef(null);
    const fullTimeRef = useRef(null);
    const partTimeRef = useRef(null);
    const contractRef = useRef(null);
    const stopSettleScrollRef = useRef(null);

    const sectionRefs = {
        "full-time": fullTimeRef,
        "part-time": partTimeRef,
        "contract": contractRef,
    };

    useEffect(() => {
        document.title = "Job Posts | ATMS - Opol Community College";
    }, []);

    // Deep-link support for /public-job-posts?type=full-time|part-time|
    // contract — this is how the homepage header's Job Posts dropdown
    // (and the jump-to Select below) land a visitor directly on the
    // right section instead of always opening at the top. Same
    // wait-for-loading + settle-scroll approach as PublicEventsPage.js.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const type = params.get("type");
        if (!type || !sectionRefs[type]) return undefined;

        if (loading) return undefined;

        setJumpValue(type);
        const t = setTimeout(() => {
            stopSettleScrollRef.current?.();
            stopSettleScrollRef.current = scrollToSettled(() => sectionRefs[type]?.current);
        }, 150);
        return () => {
            clearTimeout(t);
            stopSettleScrollRef.current?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
            setMobileNavOpen((open) => (open ? false : open));
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Keep --ph-header-h in sync, same measured-height pattern as
    // PublicHomePage.js / PublicEventsPage.js so content never sits
    // under the fixed header.
    useEffect(() => {
        const node = headerRef.current;
        if (!node) return undefined;
        const applyHeight = () => {
            const height = node.offsetHeight;
            if (height > 0) {
                document.documentElement.style.setProperty("--ph-header-h", `${height}px`);
            }
        };
        applyHeight();
        let observer;
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(applyHeight);
            observer.observe(node);
        }
        window.addEventListener("resize", applyHeight);
        window.addEventListener("orientationchange", applyHeight);
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener("resize", applyHeight);
            window.removeEventListener("orientationchange", applyHeight);
        };
    }, []);

    const goLogin = useCallback(() => {
        window.location.href = "/login";
    }, []);

    const goRegister = useCallback(() => {
        window.location.href = "/register";
    }, []);

    const scrollToTop = () => {
        setMobileNavOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goTo = (path) => {
        setMobileNavOpen(false);
        window.location.href = path;
    };

    const scrollToSection = useCallback((key) => {
        setMobileNavOpen(false);
        setJumpValue(key);
        sectionRefs[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const navItems = [
        { label: "Home", onClick: () => goTo("/") },
        { label: "Full-time", onClick: () => scrollToSection("full-time") },
        { label: "Part-time", onClick: () => scrollToSection("part-time") },
        { label: "Contract", onClick: () => scrollToSection("contract") },
    ];
    // Mobile burger panel groups Full-time/Part-time/Contract under a
    // "Job Posts" label instead of listing them flat beside Home — reuses
    // the JOB_SECTIONS constant already defined above (same icons/labels
    // used for the hero "Jump to" dropdown). navItems itself stays as-is
    // since the desktop .ph-nav still needs the full flat list.

    return (
        <div className={`ph-page ${isDark ? "dark" : "light"}`}>
            <ScrollProgressOrb/>
            {/* ============ HEADER ============ */}
            <header
                ref={headerRef}
                className={`ph-header ${scrolled ? "scrolled" : ""} ${isDark ? "dark" : "light"}`}
            >
                <div className="ph-brand" onClick={() => goTo("/")} role="button" tabIndex={0}>
                    <img src={logo} alt="OCC Alumni Logo" />
                    <div className="ph-brand-text">
                        <span className="ph-brand-title">
                            <span style={{ color: "#003366", fontWeight: 900 }}>O</span>
                            <span style={{ color: "#FFD700", fontWeight: 900 }}>C</span>
                            <span style={{ color: "#CC0000", fontWeight: 900 }}>C</span>{" "}
                            <span style={{ color: "#003366", fontWeight: 900 }}>Alumni</span>
                        </span>
                        <span className="ph-brand-sub">Opol Community College</span>
                    </div>
                </div>

                <nav className="ph-nav">
                    {navItems.map((item) => (
                        <button key={item.label} className="ph-nav-link" onClick={item.onClick}>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="ph-header-actions">
                    <button type="button" className="ph-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                        {isDark ? <MoonOutlined /> : <SunOutlined />}
                    </button>
                    <button className="ph-btn ph-btn-ghost ph-header-signin" onClick={goLogin}>
                        Sign In
                    </button>
                    <button className="ph-btn ph-btn-solid ph-header-signup" onClick={goRegister}>
                        Sign Up
                    </button>
                    <button
                        type="button"
                        className={`ph-burger ${mobileNavOpen ? "open" : ""}`}
                        onClick={() => setMobileNavOpen((open) => !open)}
                        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileNavOpen}
                    >
                        {mobileNavOpen ? <CloseOutlined /> : <MenuOutlined />}
                    </button>
                </div>
            </header>

            {/* ============ MOBILE NAV PANEL ============ */}
            <nav className={`ph-mobile-panel ${mobileNavOpen ? "open" : ""}`} aria-hidden={!mobileNavOpen}>
                <div className="ph-mobile-panel-inner">
                    <div className="ph-mobile-panel-links">
                        {/* Only "Home" from navItems — Full-time/Part-time/
                            Contract are the same links but re-grouped under
                            the "Job Posts" label right below, instead of
                            sitting flat beside Home like separate pages. */}
                        <button
                            className="ph-mobile-panel-link"
                            onClick={navItems[0].onClick}
                            tabIndex={mobileNavOpen ? 0 : -1}
                        >
                            {navItems[0].label}
                        </button>

                        <span className="ph-mobile-panel-group-label">Job Posts</span>
                        <div className="ph-mobile-panel-events-group">
                            {JOB_SECTIONS.map((s) => (
                                <button
                                    key={s.value}
                                    className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                    onClick={() => scrollToSection(s.value)}
                                    tabIndex={mobileNavOpen ? 0 : -1}
                                >
                                    {s.icon} {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ============ PAGE HERO ============ */}
            {/* Jump-to and Sort-by controls removed: section links already
                live in the header nav (desktop) and mobile burger menu, so
                the dropdowns were redundant. Sort stays fixed at its
                previous default (see sortBy state below). */}
            <section className="pjp-hero">
                <Reveal>
                    <div className="pjp-hero-eyebrow">
                        <BankOutlined /> Alumni Association
                    </div>
                    <Title level={1} className="pjp-hero-title">
                        Career <span className="grad">Opportunities</span>
                    </Title>
                    <Paragraph className="pjp-hero-lead">
                        Full-time, part-time, and contract openings shared by the
                        institution and its partner companies for OCC graduates.
                    </Paragraph>
                </Reveal>
            </section>

            {/* ============ FULL-TIME ============ */}
            <JobSection
                sectionKey="full-time"
                sectionRef={fullTimeRef}
                jobs={sortedFullTime}
                loading={loading}
                onLogin={goLogin}
                onRegister={goRegister}
            />

            {/* ============ PART-TIME ============ */}
            <JobSection
                sectionKey="part-time"
                sectionRef={partTimeRef}
                jobs={sortedPartTime}
                loading={loading}
                onLogin={goLogin}
                onRegister={goRegister}
            />

            {/* ============ CONTRACT ============ */}
            <JobSection
                sectionKey="contract"
                sectionRef={contractRef}
                jobs={sortedContract}
                loading={loading}
                onLogin={goLogin}
                onRegister={goRegister}
            />

            {/* ============ CTA BANNER ============ */}
            <Reveal as="div" className="ph-cta-banner">
                <div className="ph-cta-content">
                    <Title level={2} className="ph-cta-title">
                        Ready to take the next step?
                    </Title>
                    <Paragraph className="ph-cta-sub">
                        Create your Alumni account to apply for job posts, get notified
                        about new openings, and stay connected with the OCC community.
                    </Paragraph>
                    <div className="ph-cta-actions">
                        <button className="ph-btn ph-btn-white ph-btn-lg" onClick={goRegister}>
                            Create Account <ArrowRightOutlined />
                        </button>
                        <button className="ph-btn ph-btn-outline-white ph-btn-lg" onClick={goLogin}>
                            Sign In
                        </button>
                    </div>
                </div>
            </Reveal>

            {/* ============ FOOTER ============ */}
            {/* Unchanged from PublicEventsPage.js on purpose — Quick Links
                here still only need to get someone back Home; the three
                job Type sections are reachable from the dropdown/nav
                above, same pattern as the Events page. */}
            <footer className="ph-footer">
                <div className="ph-footer-inner">
                    <div className="ph-footer-brand-col">
                        <div className="ph-footer-brand">
                            <img src={logo} alt="OCC Alumni Logo" />
                            <span className="ph-footer-brand-title">OCC Alumni Association</span>
                        </div>
                        <Paragraph className="ph-footer-desc">
                            Connecting Opol Community College alumni worldwide, fostering
                            lifelong relationships with the institution, and supporting
                            the next generation of OCCians.
                        </Paragraph>
                        <div className="ph-footer-social">
                            <a href="#" aria-label="Facebook"><FacebookOutlined /></a>
                            <a href="#" aria-label="Twitter"><TwitterOutlined /></a>
                            <a href="#" aria-label="Instagram"><InstagramOutlined /></a>
                        </div>
                    </div>

                    <div>
                        <div className="ph-footer-heading">Quick Links</div>
                        <div className="ph-footer-links">
                            <button onClick={() => goTo("/")}>Home</button>
                            {/* <button onClick={() => goTo("/public-events")}>Events</button>
                            <button onClick={() => goTo("/public-gallery")}>Gallery</button>
                            <button onClick={() => goTo("/public-job-posts")}>Job Posts</button>
                            <button onClick={() => goTo("/public-announcements")}>Announcements</button>
                            <button onClick={() => goTo("/public-about")}>About</button>
                            <button onClick={() => goTo("/public-faq")}>FAQs</button> */}
                        </div>
                    </div>

                    <div>
                        <div className="ph-footer-heading">ATMS</div>
                        <div className="ph-footer-links">
                            <button onClick={() => goTo("/public-contact")}>Contact Us</button>
                            <button onClick={() => goTo("/public-credits")}>Credits</button>
                            <button onClick={() => goTo("/install-pwa")}>Install PWA</button>
                        </div>
                    </div>
                </div>

                <div className="ph-footer-bottom">
                    <span>ATMS - All rights reserved.</span>
                    <span className="ph-footer-credit">
                        <code className="ph-footer-tag">{"</>"}</code>
                        Developed by <strong className="ph-footer-dev-name"> <a href="https://www.facebook.com/EphemeralKun/" target="_blank" rel="noopener noreferrer">Antiquina, Jonee John R.</a></strong>
                        <span className="ph-footer-dot">•</span> Secure
                        <span className="ph-footer-dot">•</span> Alumni Association
                        <span className="ph-footer-dot">•</span> Events
                        <span className="ph-footer-dot">•</span> © {"2025"} ATMS
                        <span className="ph-footer-dot">•</span> Built with <span className="ph-footer-heart">❤️</span>
                    </span>
                </div>
            </footer>

            <ZoomWarningModal open={zoomModalOpen} onClose={closeZoomModal} />
        </div>
    );
};

export default PublicJobPostsPage;