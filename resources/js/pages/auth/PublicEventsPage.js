"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import { Typography, Row, Col, Spin, Empty, Select, Carousel } from "antd";
import {
    CalendarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    SoundOutlined,
    TagOutlined,
    StarOutlined,
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
    CheckCircleOutlined,
    LockOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePublicEventsData, { formatTimeDisplay } from "~/hooks/usePublicEventsData";
import usePreventInspect, { guardImageEvents, ZoomWarningModal } from "~/hooks/usePreventInspect";
import { BASE_URL } from "~/utils/constant";
// Reuses every design token, header, footer, and .ph-card base style
// already defined for the homepage so this page looks like part of
// the same site instead of a bolt-on. Only the events-page-specific
// additions (dropdown jump-nav, extra card fields, image swapper,
// status badges) live in PublicEventsPage.css.
import "./PublicHomePage.css";
import ScrollProgressOrb from "../admin/ScrollProgress/ScrollProgressOrb"
import "./PublicEventsPage.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ============================================================
// Small helpers — copied to match PublicHomePage.js exactly so this
// page renders images/dates/text identically to the rest of the site.
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
            weekday: "short",
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
// Event Type + Category label maps — copied value-for-value from
// the `eventTypes` / `eventCategories` arrays in AlumniEvents.js
// (admin side) so a "hiring" event reads "Hiring Event" here too,
// not a generic slug-guess like "Hiring". Keep this in sync any time
// a new value/label pair is added over there.
// ============================================================
const EVENT_TYPE_LABELS = {
    "job-fair": "Job Fair",
    "hiring": "Hiring Event",
    "interview": "Interview Day",
    "career-networking": "Career Networking",
    "career-coaching": "Career Coaching",
    "resume": "Resume Workshop",
    "internship": "Internship Event",
    "apprenticeship": "Apprenticeship Event",
    "conference": "Conference",
    "workshop": "Workshop",
    "seminar": "Seminar",
    "trade-show": "Trade Show",
    "pitch": "Startup Pitch",
    "fundraising": "Fundraising",
    "networking": "Networking",
    "class": "Class / Training",
    "hackathon": "Hackathon",
    "mentoring": "Mentoring",
    "sports": "Sports",
    "fitness": "Fitness",
    "showcase": "Showcase",
    "festival": "Festival",
    "concert": "Concert",
    "party": "Party",
    "expo": "Expo",
    "virtual": "Virtual",
    "webinar": "Webinar",
    "hybrid": "Hybrid Event",
    "alumni-homecoming": "Alumni Homecoming",
    "alumni-reunion": "Batch Reunion",
    "alumni-awards": "Alumni Recognition Awards",
    "industry-talk": "Industry Expert Talk",
    "community-outreach": "Community Outreach",
    "leadership-summit": "Leadership Summit",
    "business-forum": "Business Leadership Forum",
    "entrepreneurship-summit": "Entrepreneurship Summit",
    "marketing-expo": "Marketing Expo",
    "finance-workshop": "Finance Workshop",
    "startup-showcase": "Startup Showcase",
    "teaching-demo": "Teaching Demonstration",
    "classroom-management": "Classroom Management Workshop",
    "teacher-mentoring": "Teacher Mentoring Session",
    "child-development": "Child Development Seminar",
    "literacy-program": "Literacy Outreach Program",
    "subject-specialization": "Subject Specialization Seminar",
    "teaching-strategies": "Teaching Strategies Workshop",
    "research-colloquium": "Research Colloquium",
    "curriculum-development": "Curriculum Development Workshop",
    "academic-symposium": "Academic Symposium",
    "tech-conference": "Technology Conference",
    "coding-bootcamp": "Coding Bootcamp",
    "cybersecurity-seminar": "Cybersecurity Seminar",
    "ai-data-workshop": "AI & Data Workshop",
    "system-development": "System Development Showcase",
    "cloud-computing": "Cloud Computing Workshop",
    "uiux-design": "UI/UX Design Workshop",
};

const EVENT_CATEGORY_LABELS = {
    "professional": "Professional Development",
    "social": "Social & Networking",
    "recreational": "Recreational",
    "educational": "Educational",
    "philanthropy": "Philanthropy & Service",
    "campus_traditions": "Campus & Traditions",
    "student_engagement": "Student Engagement",
    "regional_global": "Regional & Global Chapters",
    "family": "Family & Community",
    "arts_culture": "Arts & Cultural",
    "athletics": "Athletics & Spirit",
    "virtual": "Virtual / Hybrid",
    "affinity": "Affinity & Identity Groups",
    "career_development": "Career Development",
    "industry_networking": "Industry Networking",
    "research_innovation": "Research & Innovation",
    "entrepreneurship": "Entrepreneurship",
    "teacher_education": "Teacher Education",
    "technology": "Technology & Innovation",
    "community_service": "Community Service",
    "alumni_relations": "Alumni Relations",
    "professional_certification": "Professional Certification",
};

// Falls back to a slug-title-case guess only for a value that isn't
// in the map yet (e.g. a brand-new type just added on the admin side
// before this list has been updated to match).
const slugToTitleCase = (value) =>
    String(value)
        .replace(/[-_]+/g, " ")
        .trim()
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");

const formatEventType = (type) => {
    if (!type) return "General";
    return EVENT_TYPE_LABELS[type] || slugToTitleCase(type);
};

const formatCategory = (category) => {
    if (!category) return null;
    return EVENT_CATEGORY_LABELS[category] || slugToTitleCase(category);
};

const getImageList = (ev) => {
    if (Array.isArray(ev?.image_urls) && ev.image_urls.length > 0) {
        return ev.image_urls.map(buildImageUrl).filter(Boolean);
    }
    if (ev?.image) {
        const single = buildImageUrl(ev.image);
        return single ? [single] : [];
    }
    return [];
};

// ============================================================
// Reveal-on-scroll wrapper — identical pattern to PublicHomePage.js
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
// Section copy — the "what to say" text lives right here so it's
// easy to tweak in one place without hunting through JSX below.
// ============================================================
const SECTION_COPY = {
    upcoming: {
        title: "Upcoming Events",
        subtitle:
            "Mark your calendar — here's what the Alumni Association has planned next.",
        empty: "No upcoming events posted yet. Check back soon!",
    },
    ongoing: {
        title: "Ongoing Events",
        subtitle: "These events are happening right now.",
        empty: "Nothing is live at the moment.",
    },
    completed: {
        title: "Completed Events",
        subtitle: "A look back at events that have already taken place.",
        empty: "No completed events to show yet.",
    },
    featured: {
        title: "Featured Events",
        subtitle:
            "Handpicked by the Alumni Association — don't miss these.",
        empty: "No featured events right now.",
    },
};

// Copy shown under the action buttons / status badge of each card,
// depending on the event's real-time status.
const STATUS_MESSAGE = {
    upcoming:
        "Sign in to reserve your slot. New here? Create a free alumni account — it only takes a minute.",
    ongoing:
        "This event is already underway, so registration is closed. Check back soon for the next one!",
    completed:
        "This event has ended and registration is now closed. Browse the gallery to relive the highlights.",
};

const STATUS_BADGE = {
    upcoming: { label: "Upcoming", icon: <ClockCircleOutlined />, cls: "is-upcoming" },
    ongoing: { label: "Live Now", icon: <CheckCircleOutlined />, cls: "is-ongoing" },
    completed: { label: "Completed", icon: <CheckCircleOutlined />, cls: "is-completed" },
};

// ============================================================
// Event image swapper — a single static image when there's only
// one, a lightweight auto-rotating carousel when there's more than
// one, and an icon placeholder when there are none at all.
// ============================================================
const EventImageSwapper = ({ images, title }) => {
    if (!images || images.length === 0) {
        return (
            <div className="pev-media pev-media-empty">
                <SoundOutlined />
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <div className="pev-media">
                <img src={images[0]} alt={title} {...guardImageEvents} />
            </div>
        );
    }

    return (
        <div className="pev-media pev-media-carousel">
            <Carousel autoplay autoplaySpeed={3200} dots draggable>
                {images.map((src, idx) => (
                    <div key={idx} className="pev-slide">
                        <img
                            src={src}
                            alt={`${title} - photo ${idx + 1}`}
                            {...guardImageEvents}
                        />
                    </div>
                ))}
            </Carousel>
            <span className="pev-media-count">{images.length} photos</span>
        </div>
    );
};

// ============================================================
// One event card — same content for every section, the only thing
// that changes per section is the status badge + the message/CTA
// under it (register vs. live vs. closed).
// ============================================================
const EventCard = ({ event, statusOverride, onLogin, onRegister, delayMs = 0 }) => {
    const status = statusOverride || event._computedStatus || "upcoming";
    const badge = STATUS_BADGE[status] || STATUS_BADGE.upcoming;
    const images = getImageList(event);
    const eventType = formatEventType(event.event_type || event.eventType);
    const category = formatCategory(event.category);

    return (
        <Reveal className="pev-card" style={{ transitionDelay: `${delayMs}ms` }}>
            <EventImageSwapper images={images} title={event.title} />

            <div className="pev-card-body">
                <div className="pev-card-tags">
                    <span className={`pev-badge ${badge.cls}`}>
                        {badge.icon} {badge.label}
                    </span>
                    <span className="pev-type-tag">
                        <TagOutlined /> {eventType}
                    </span>
                    {category && (
                        <span className="pev-type-tag pev-category-tag">
                            {category}
                        </span>
                    )}
                    {(event.featured || event.is_featured) && (
                        <span className="pev-badge is-featured">
                            <StarOutlined /> Featured
                        </span>
                    )}
                </div>

                <Title level={5} className="pev-card-title">
                    {event.title || "Untitled Event"}
                </Title>

                <Paragraph className="pev-card-desc">
                    {stripHtml(event.description) ||
                        "Full details will be shown once you sign in."}
                </Paragraph>

                <div className="pev-card-facts">
                    <div className="pev-fact">
                        <CalendarOutlined />
                        <span>{formatDate(event.date || event.event_date)}</span>
                    </div>
                    <div className="pev-fact">
                        <ClockCircleOutlined />
                        <span>
                            {formatTimeDisplay(event.start_time || event.startTime) || "TBA"}
                            {" – "}
                            {formatTimeDisplay(event.end_time || event.endTime) || "TBA"}
                        </span>
                    </div>
                    <div className="pev-fact">
                        <EnvironmentOutlined />
                        <span>{event.location || "Location TBA"}</span>
                    </div>
                </div>

                <div className="pev-card-footer">
                    <p className="pev-status-msg">
                        {status === "upcoming" ? (
                            <>
                                <LockOutlined /> {STATUS_MESSAGE.upcoming}
                            </>
                        ) : (
                            STATUS_MESSAGE[status]
                        )}
                    </p>

                    {status === "upcoming" ? (
                        <div className="pev-card-actions">
                            <button type="button" className="ph-btn ph-btn-solid" onClick={onLogin}>
                                Sign In to Register
                            </button>
                            <button type="button" className="ph-btn ph-btn-ghost" onClick={onRegister}>
                                Create Account
                            </button>
                        </div>
                    ) : (
                        <div className="pev-card-actions">
                            <button type="button" className="ph-btn ph-btn-ghost" onClick={onLogin}>
                                View Full Details
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Reveal>
    );
};

// ============================================================
// One full section — title, subtitle, and a grid of EventCards
// (or a loading/empty state).
// ============================================================
const EventSection = ({ sectionKey, sectionRef, events, loading, onLogin, onRegister }) => {
    const copy = SECTION_COPY[sectionKey];

    return (
        <section className="ph-section pev-section" id={`events-${sectionKey}`} ref={sectionRef}>
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
                            <Text>Loading events…</Text>
                        </div>
                    </Col>
                ) : events.length === 0 ? (
                    <Col span={24}>
                        <div className="ph-state-box">
                            <Empty description={copy.empty} />
                        </div>
                    </Col>
                ) : (
                    events.map((ev, i) => (
                        <Col xs={24} sm={12} lg={8} key={ev.id || i}>
                            <EventCard
                                event={ev}
                                statusOverride={sectionKey === "featured" ? undefined : sectionKey}
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
// after arriving: event cover images/carousels and even web fonts
// can still be resizing things for a few hundred ms after the
// initial scrollIntoView, and anything that grows ABOVE the target
// pushes it further down the page — since the scroll position
// itself never moved, that reads as everything sliding back up and
// away from where we just landed.
//
// This re-issues scrollIntoView on a short interval until the page's
// total height stops changing (a few checks in a row with no change
// = layout has settled), then stops. It also backs off immediately
// if the visitor scrolls or touches the screen themselves, so it
// never fights a real, deliberate scroll.
// ============================================================
const scrollToSettled = (getTarget) => {
    let cancelled = false;
    let lastHeight = -1;
    let stableCount = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // ~2.7s ceiling at 90ms/tick, just in case
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

const PublicEventsPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [jumpValue, setJumpValue] = useState("upcoming");
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();

    const { upcoming, ongoing, completed, featured, loading } = usePublicEventsData();

    const headerRef = useRef(null);
    const upcomingRef = useRef(null);
    const ongoingRef = useRef(null);
    const completedRef = useRef(null);
    const featuredRef = useRef(null);
    const stopSettleScrollRef = useRef(null);

    const sectionRefs = {
        upcoming: upcomingRef,
        ongoing: ongoingRef,
        completed: completedRef,
        featured: featuredRef,
    };

    useEffect(() => {
        document.title = "Events | ATMS - Opol Community College";
    }, []);


    // Deep-link support for /public-events?section=upcoming|ongoing|
    // completed|featured — this is how the homepage header's Events
    // dropdown (and the jump-to Select below) land a visitor directly
    // on the right section instead of always opening at the top.
    //
    // This waits for `loading` to finish before scrolling at all — no
    // point scrolling to a still-empty, spinner-sized section while
    // data hasn't arrived yet. But even once loading is false, event
    // cover images, carousels, and web fonts can keep resizing things
    // for a bit longer; anything that grows ABOVE the target section
    // pushes it further down the page while the scroll position stays
    // put, which reads as the page "jumping back up" right after
    // landing. scrollToSettled() (above) handles that part: it keeps
    // re-correcting the scroll position until the page height stops
    // changing, then stops — see its own comment for details.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const section = params.get("section");
        if (!section || !sectionRefs[section]) return undefined;

        // Data (and therefore final section heights) isn't ready yet —
        // wait for `loading` to flip to false and let this effect
        // re-run instead of guessing with a timer.
        if (loading) return undefined;

        setJumpValue(section);
        // Small delay so the just-rendered cards exist in the DOM
        // before we start; the settle-scroll loop below then keeps
        // correcting position for a bit longer in case images,
        // carousels, or fonts are still resizing things.
        const t = setTimeout(() => {
            stopSettleScrollRef.current?.();
            stopSettleScrollRef.current = scrollToSettled(
                () => sectionRefs[section]?.current,
            );
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
    // PublicHomePage.js so content never sits under the fixed header.
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
        { label: "Upcoming", onClick: () => scrollToSection("upcoming") },
        { label: "Ongoing", onClick: () => scrollToSection("ongoing") },
        { label: "Completed", onClick: () => scrollToSection("completed") },
        { label: "Featured", onClick: () => scrollToSection("featured") },
    ];

    // Mobile burger panel only: same status sections as navItems above,
    // but grouped under an "Events" label instead of sitting flat beside
    // Home — mirrors the group-label pattern PublicHomePage.js already
    // uses for its own Events/Job Posts/Gallery sub-sections. navItems
    // itself is untouched since the desktop .ph-nav still needs the full
    // flat list.
    const EVENTS_MOBILE_SECTIONS = [
        { value: "upcoming", label: "Upcoming", icon: <ClockCircleOutlined /> },
        { value: "ongoing", label: "Live Now", icon: <CheckCircleOutlined /> },
        { value: "completed", label: "Completed", icon: <CheckCircleOutlined /> },
        { value: "featured", label: "Featured", icon: <StarOutlined /> },
    ];

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
                        {/* Only "Home" from navItems — the status filters
                            (Upcoming/Ongoing/Completed/Featured) are the
                            same links but re-grouped under the "Events"
                            label right below, instead of sitting flat
                            beside Home like a separate top-level page. */}
                        <button
                            className="ph-mobile-panel-link"
                            onClick={navItems[0].onClick}
                            tabIndex={mobileNavOpen ? 0 : -1}
                        >
                            {navItems[0].label}
                        </button>

                        <span className="ph-mobile-panel-group-label">Events</span>
                        <div className="ph-mobile-panel-events-group">
                            {EVENTS_MOBILE_SECTIONS.map((s) => (
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
            {/* Jump-to dropdown removed: the same section links already
                live in the header nav (desktop) and the mobile burger
                menu, so this was a redundant third copy. */}
            <section className="pev-hero">
                <Reveal>
                    <div className="pev-hero-eyebrow">
                        <CalendarOutlined /> Alumni Association
                    </div>
                    <Title level={1} className="pev-hero-title">
                        Alumni <span className="grad">Events</span>
                    </Title>
                    <Paragraph className="pev-hero-lead">
                        Every reunion, seminar, and gathering hosted by OCC — upcoming,
                        happening now, or already in the books.
                    </Paragraph>
                </Reveal>
            </section>

            {/* ============ UPCOMING ============ */}
            <EventSection
                sectionKey="upcoming"
                sectionRef={upcomingRef}
                events={upcoming}
                loading={loading}
                onLogin={goLogin}
                onRegister={goRegister}
            />

            {/* ============ ONGOING ============ */}
            <EventSection
                sectionKey="ongoing"
                sectionRef={ongoingRef}
                events={ongoing}
                loading={loading}
                onLogin={goLogin}
                onRegister={goRegister}
            />

            {/* ============ COMPLETED ============ */}
            <EventSection
                sectionKey="completed"
                sectionRef={completedRef}
                events={completed}
                loading={loading}
                onLogin={goLogin}
                onRegister={goRegister}
            />

            {/* ============ FEATURED ============ */}
            <EventSection
                sectionKey="featured"
                sectionRef={featuredRef}
                events={featured}
                loading={loading}
                onLogin={goLogin}
                onRegister={goRegister}
            />

            {/* ============ CTA BANNER ============ */}
            <Reveal as="div" className="ph-cta-banner">
                <div className="ph-cta-content">
                    <Title level={2} className="ph-cta-title">
                        Don't miss what's next.
                    </Title>
                    <Paragraph className="ph-cta-sub">
                        Create your Alumni account to register for events, get reminders,
                        and stay connected with the OCC community.
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
            {/* Unchanged from PublicHomePage.js on purpose — Quick Links
                here still only need to get someone back Home; the four
                Events sections are reachable from the dropdown/nav above,
                same as requested. */}
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

export default PublicEventsPage;