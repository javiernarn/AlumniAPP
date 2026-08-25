"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import { Typography, Row, Col, Empty, Select, Modal } from "antd";
import {
    NotificationOutlined,
    CalendarOutlined,
    PushpinFilled,
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
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { CardSkeletonGrid } from "~/components";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePreventInspect, { guardImageEvents, ZoomWarningModal } from "~/hooks/usePreventInspect";
import usePublicAnnouncementsData, {
    ANNOUNCEMENT_CATEGORIES,
} from "~/hooks/usePublicAnnouncementsData";
import { BASE_URL } from "~/utils/constant";
// Reuses every design token, header, footer, and .ph-card base style
// already defined for the homepage (same pattern PublicEventsPage.js
// uses) so this page looks like part of the same site instead of a
// bolt-on. Only the announcements-page-specific additions (jump-to
// dropdown, per-category sections, card layout) live in
// PublicAnnouncementsPage.css.
import "./PublicHomePage.css";
import ScrollProgressOrb from "../admin/ScrollProgress/ScrollProgressOrb"
import "./PublicAnnouncementsPage.css";

const { Title, Paragraph } = Typography;
const { Option } = Select;

// ============================================================
// Small helpers — copied to match PublicHomePage.js / PublicEventsPage.js
// exactly so this page renders images/dates/text identically.
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

const getAnnouncementImage = (a) => {
    if (Array.isArray(a?.images) && a.images.length > 0) {
        return buildImageUrl(a.images[0]);
    }
    if (Array.isArray(a?.image_urls) && a.image_urls.length > 0) {
        return buildImageUrl(a.image_urls[0]);
    }
    return null;
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

// Section copy per category — title shown above each category's card
// grid, e.g. "Announcements of Alumni — Academic".
const categoryCopy = (label) => ({
    title: `Announcements of Alumni — ${label}`,
    empty: `No ${label.toLowerCase()} announcements posted yet. Check back soon!`,
});

// ============================================================
// One announcement card — image (or big icon placeholder) on top,
// title/content/status/date below. Clicking opens the detail modal.
// ============================================================
const AnnouncementCard = ({ item, onOpen, delayMs = 0 }) => {
    const image = getAnnouncementImage(item);
    const category = item.category || "general";

    return (
        <Reveal
            className="ph-card pan-card"
            style={{ transitionDelay: `${delayMs}ms` }}
            onClick={() => onOpen(item)}
        >
            <div className="pan-media">
                {item.pinned && (
                    <span className="pan-pin-badge">
                        <PushpinFilled /> Pinned
                    </span>
                )}
                {image ? (
                    <img src={image} alt={item.title} {...guardImageEvents} />
                ) : (
                    <div className={`pan-media-empty pan-cat-${category}`}>
                        <NotificationOutlined />
                    </div>
                )}
            </div>

            <div className="pan-card-body">
                <div className="pan-card-tags">
                    <span className="pan-badge is-published">
                        <CheckCircleOutlined /> Published
                    </span>
                    <span className="pan-cat-tag">
                        {ANNOUNCEMENT_CATEGORIES.find((c) => c.value === category)?.label || "General"}
                    </span>
                </div>

                <Title level={5} className="pan-card-title">
                    {item.title || "Untitled Announcement"}
                </Title>

                <Paragraph className="pan-card-desc">
                    {stripHtml(item.content) || "Tap to read the full announcement."}
                </Paragraph>

                <div className="pan-card-footer">
                    <span className="pan-card-date">
                        <CalendarOutlined />
                        {formatDate(item.publish_date || item.created_at)}
                    </span>
                    <span className="pan-card-link">
                        Read More <ArrowRightOutlined />
                    </span>
                </div>
            </div>
        </Reveal>
    );
};

// ============================================================
// One full category section — title, count, and a grid of
// AnnouncementCards (or a loading/empty state). Same shape as
// EventSection in PublicEventsPage.js.
// ============================================================
const AnnouncementCategorySection = ({ category, sectionRef, loading, onOpen }) => {
    const copy = categoryCopy(category.label);

    return (
        <section
            className="ph-section pan-section"
            id={`announcements-${category.value}`}
            ref={sectionRef}
        >
            <Reveal>
                <div className="ph-section-head">
                    <div>
                        <Title level={2} className="ph-section-title">
                            {copy.title}
                            <span className="pan-section-count">
                                {loading ? "" : `${category.items.length}`}
                            </span>
                        </Title>
                    </div>
                </div>
            </Reveal>

            <Row gutter={[22, 22]}>
                {loading ? (
                    <Col span={24}>
                        <CardSkeletonGrid
                            variant="gallery"
                            count={6}
                            columns={{ xs: 24, sm: 12, lg: 8 }}
                            gutter={[22, 22]}
                        />
                    </Col>
                ) : category.items.length === 0 ? (
                    <Col span={24}>
                        <div className="ph-state-box">
                            <Empty description={copy.empty} />
                        </div>
                    </Col>
                ) : (
                    category.items.map((item, i) => (
                        <Col xs={24} sm={12} lg={8} key={item.id || i}>
                            <AnnouncementCard item={item} onOpen={onOpen} delayMs={i * 60} />
                        </Col>
                    ))
                )}
            </Row>
        </section>
    );
};

// ============================================================
// Deep-link landings can look like they "jump back up" a moment
// after arriving: announcement cover images and even web fonts can
// still be resizing things for a few hundred ms after the initial
// scrollIntoView, and anything that grows ABOVE the target pushes it
// further down the page — since the scroll position itself never
// moved, that reads as everything sliding back up and away from
// where we just landed.
//
// This re-issues scrollIntoView on a short interval until the page's
// total height stops changing (a few checks in a row with no change
// = layout has settled), then stops. It also backs off immediately
// if the visitor scrolls or touches the screen themselves, so it
// never fights a real, deliberate scroll. Identical to the helper of
// the same name in PublicEventsPage.js — kept in sync with it.
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

const PublicAnnouncementsPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [jumpValue, setJumpValue] = useState("all");
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();
    const [detailItem, setDetailItem] = useState(null);

    const { categories, loading } = usePublicAnnouncementsData();

    const headerRef = useRef(null);
    const sectionRefsMap = useRef({});
    const stopSettleScrollRef = useRef(null);

    useEffect(() => {
        document.title = "Announcements | ATMS - Opol Community College";
    }, []);

    // Deep-link support for /public-announcements?category=maintenance
    // (etc.) — this is how the homepage header's Announcements dropdown
    // lands a visitor directly on the right category section.
    //
    // This waits for `loading` to finish before scrolling at all — no
    // point scrolling to a still-empty, spinner-sized section while
    // data hasn't arrived yet. But even once loading is false,
    // announcement cover images and web fonts can keep resizing
    // things for a bit longer; anything that grows ABOVE the target
    // section pushes it further down the page while the scroll
    // position stays put, which reads as the page "jumping back up"
    // right after landing. scrollToSettled() (above) handles that
    // part: it keeps re-correcting the scroll position until the page
    // height stops changing, then stops — see its own comment for
    // details. Same pattern as PublicEventsPage.js.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const category = params.get("category");
        if (!category || !sectionRefsMap.current[category]) return undefined;
        if (loading) return undefined;

        setJumpValue(category);
        // Small delay so the just-rendered cards exist in the DOM
        // before we start; the settle-scroll loop below then keeps
        // correcting position for a bit longer in case images or
        // fonts are still resizing things.
        const t = setTimeout(() => {
            stopSettleScrollRef.current?.();
            stopSettleScrollRef.current = scrollToSettled(
                () => sectionRefsMap.current[category]?.current,
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
    // PublicHomePage.js / PublicEventsPage.js.
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

    const scrollToTop = () => {
        setMobileNavOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goTo = (path) => {
        setMobileNavOpen(false);
        window.location.href = path;
    };

    const scrollToCategory = useCallback((value) => {
        setMobileNavOpen(false);
        setJumpValue(value);
        if (value === "all") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        sectionRefsMap.current[value]?.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, []);

    const navItems = [
        { label: "Home", onClick: () => goTo("/") },
        // { label: "Events", onClick: () => goTo("/public-events") },
    ];

    return (
        <div className={`ph-page ${isDark ? "dark" : "light"}`}>
            <ScrollProgressOrb />
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
                    <button className="ph-btn ph-btn-ghost ph-header-signin" onClick={() => goTo("/login")}>
                        Sign In
                    </button>
                    <button className="ph-btn ph-btn-solid ph-header-signup" onClick={() => goTo("/register")}>
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
                        {navItems.map((item) => (
                            <button
                                key={item.label}
                                className="ph-mobile-panel-link"
                                onClick={item.onClick}
                                tabIndex={mobileNavOpen ? 0 : -1}
                            >
                                {item.label}
                            </button>
                        ))}

                        <span className="ph-mobile-panel-group-label">Categories</span>
                        <div className="ph-mobile-panel-events-group">
                            {ANNOUNCEMENT_CATEGORIES.map((c) => (
                                <button
                                    key={c.value}
                                    className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                    onClick={() => scrollToCategory(c.value)}
                                    tabIndex={mobileNavOpen ? 0 : -1}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ============ PAGE HERO / JUMP-TO DROPDOWN ============ */}
            <section className="pan-hero">
                <Reveal>
                    <div className="pan-hero-eyebrow">
                        <NotificationOutlined /> Alumni Association
                    </div>
                    <Title level={1} className="pan-hero-title">
                        Announcements of <span className="grad">Alumni</span>
                    </Title>
                    <Paragraph className="pan-hero-lead">
                        Everything the OCC Alumni Association has posted — organized by
                        category so you can jump straight to what matters to you.
                    </Paragraph>

                    <div className="pan-jump">
                        <label htmlFor="pan-jump-select" className="pan-jump-label">
                            All categories:
                        </label>
                        <Select
                            id="pan-jump-select"
                            className="pan-jump-select"
                            value={jumpValue}
                            onChange={scrollToCategory}
                            popupMatchSelectWidth={false}
                        >
                            <Option value="all">All categories</Option>
                            {ANNOUNCEMENT_CATEGORIES.map((c) => (
                                <Option key={c.value} value={c.value}>
                                    {c.label}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </Reveal>
            </section>

            {/* ============ ONE SECTION PER CATEGORY ============ */}
            {categories.map((category) => {
                if (!sectionRefsMap.current[category.value]) {
                    sectionRefsMap.current[category.value] = { current: null };
                }
                return (
                    <AnnouncementCategorySection
                        key={category.value}
                        category={category}
                        sectionRef={sectionRefsMap.current[category.value]}
                        loading={loading}
                        onOpen={setDetailItem}
                    />
                );
            })}

            {/* ============ CTA BANNER ============ */}
            <Reveal as="div" className="ph-cta-banner">
                <div className="ph-cta-content">
                    <Title level={2} className="ph-cta-title">
                        Never miss an update.
                    </Title>
                    <Paragraph className="ph-cta-sub">
                        Create your Alumni account to get notified the moment a new
                        announcement goes live.
                    </Paragraph>
                    <div className="ph-cta-actions">
                        <button className="ph-btn ph-btn-white ph-btn-lg" onClick={() => goTo("/register")}>
                            Create Account <ArrowRightOutlined />
                        </button>
                        <button className="ph-btn ph-btn-outline-white ph-btn-lg" onClick={() => goTo("/login")}>
                            Sign In
                        </button>
                    </div>
                </div>
            </Reveal>

            {/* ============ FOOTER ============ */}
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

            {/* ============ DETAIL MODAL ============ */}
            <Modal
                open={!!detailItem}
                onCancel={() => setDetailItem(null)}
                footer={null}
                title={detailItem?.title}
                centered
            >
                {detailItem && (
                    <div>
                        {getAnnouncementImage(detailItem) ? (
                            <img
                                src={getAnnouncementImage(detailItem)}
                                alt={detailItem.title}
                                style={{ width: "100%", borderRadius: 12, marginBottom: 16 }}
                                {...guardImageEvents}
                            />
                        ) : (
                            <div
                                className={`pan-media-empty pan-cat-${detailItem.category || "general"} pan-modal-media-empty`}
                            >
                                <NotificationOutlined />
                            </div>
                        )}
                        <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 12 }}>
                            <CalendarOutlined />{" "}
                            {formatDate(detailItem.publish_date || detailItem.created_at)}
                        </p>
                        <Paragraph>{stripHtml(detailItem.content)}</Paragraph>
                    </div>
                )}
            </Modal>

            <ZoomWarningModal open={zoomModalOpen} onClose={closeZoomModal} />
        </div>
    );
};

export default PublicAnnouncementsPage;