"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import { Typography, Row, Col, Spin, Empty, Select, Carousel } from "antd";
import {
    CalendarOutlined,
    PictureOutlined,
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
    EnvironmentOutlined,
    LockOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePublicGalleryData from "~/hooks/usePublicGalleryData";
import usePreventInspect, { guardImageEvents, ZoomWarningModal } from "~/hooks/usePreventInspect";
import { BASE_URL } from "~/utils/constant";
// Reuses every design token, header, footer, and .ph-card base style
// already defined for the homepage so this page looks like part of
// the same site instead of a bolt-on. Only the gallery-page-specific
// additions (year/month timeline, image swapper) live in
// PublicGalleryPage.css.
import "./PublicHomePage.css";
import ScrollProgressOrb from "../admin/ScrollProgress/ScrollProgressOrb"
import "./PublicGalleryPage.css";

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

// Gallery items can carry a single image_url or a full image_urls[]
// batch. Same helper as PublicHomePage.js.
const getImageList = (gallery) => {
    if (Array.isArray(gallery?.image_urls) && gallery.image_urls.length > 0) {
        return gallery.image_urls.map(buildImageUrl).filter(Boolean);
    }
    if (gallery?.image_url) {
        const single = buildImageUrl(gallery.image_url);
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
// Gallery image swapper — a single static cover image when there's
// only one photo, a lightweight auto-rotating carousel preview when
// there's more than one, and an icon placeholder when there are none
// at all. This is a preview only; it's not clickable.
// ============================================================
const GalleryImageSwapper = ({ images, title }) => {
    if (!images || images.length === 0) {
        return (
            <div className="pgal-media pgal-media-empty">
                <PictureOutlined />
            </div>
        );
    }

    // Cover image is a free preview only — it no longer opens anything
    // on click. Viewing the rest of the album is gated through the
    // Sign In / Create Account buttons in the card footer instead,
    // same convention as EventImageSwapper on PublicEventsPage.js.
    if (images.length === 1) {
        return (
            <div className="pgal-media">
                <img src={images[0]} alt={title} {...guardImageEvents} />
            </div>
        );
    }

    return (
        <div className="pgal-media pgal-media-carousel">
            <Carousel autoplay autoplaySpeed={3200} dots draggable>
                {images.map((src, idx) => (
                    <div key={idx} className="pgal-slide">
                        <img
                            src={src}
                            alt={`${title} - photo ${idx + 1}`}
                            {...guardImageEvents}
                        />
                    </div>
                ))}
            </Carousel>
            <span className="pgal-media-count">{images.length} photos</span>
        </div>
    );
};



// ============================================================
// One gallery card — title, event date, photo count, and a footer
// that gates the rest of the album behind sign-in. Anonymous
// visitors only ever see the single cover image; viewing every
// photo in the album (and downloading any of them) requires an
// Alumni account, the same rule PublicEventsPage.js applies to
// "Sign In to Register" / "Create Account" on upcoming events.
// ============================================================
const GalleryCard = ({ gallery, onLogin, onRegister, delayMs = 0 }) => {
    const images = getImageList(gallery);
    const eventDateLabel = formatDate(gallery.event_date || gallery.date);

    return (
        <Reveal className="pgal-card" style={{ transitionDelay: `${delayMs}ms` }}>
            <GalleryImageSwapper images={images} title={gallery.title} />

            <div className="pgal-card-body">
                <Title level={5} className="pgal-card-title">
                    {gallery.title || "Untitled Album"}
                </Title>

                <div className="pgal-card-facts">
                    <div className="pgal-fact">
                        <CalendarOutlined />
                        <span>{eventDateLabel}</span>
                    </div>
                    <div className="pgal-fact">
                        <PictureOutlined />
                        <span>{images.length} photo{images.length === 1 ? "" : "s"}</span>
                    </div>
                </div>

                <div className="pgal-card-footer">
                    <Paragraph className="pgal-status-msg">
                        <LockOutlined /> Sign in to view all {images.length || ""} photo
                        {images.length === 1 ? "" : "s"} in this album &amp; download
                    </Paragraph>
                    <div className="pgal-card-actions">
                        <button type="button" className="ph-btn ph-btn-solid" onClick={onLogin}>
                            Sign In to View All
                        </button>
                        <button type="button" className="ph-btn ph-btn-ghost" onClick={onRegister}>
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
        </Reveal>
    );
};

// ============================================================
// One month sub-group within a year section — a small heading plus
// a grid of GalleryCards for that month. Carries its own id/ref so
// /public-gallery?year=YYYY&month=M can scroll straight to it
// instead of only the top of the year.
// ============================================================
const MonthGroup = ({ year, month, monthLabel, galleries, onLogin, onRegister, monthRef }) => (
    <div
        className="pgal-month-group"
        id={`gallery-year-${year}-month-${month}`}
        ref={monthRef}
    >
        <div className="pgal-month-heading">
            <span className="pgal-month-label">{monthLabel}</span>
            <span className="pgal-month-count">
                {galleries.length} album{galleries.length === 1 ? "" : "s"}
            </span>
        </div>
        <Row gutter={[22, 22]}>
            {galleries.map((g, i) => (
                <Col xs={24} sm={12} lg={8} key={g.id || i}>
                    <GalleryCard gallery={g} onLogin={onLogin} onRegister={onRegister} delayMs={i * 60} />
                </Col>
            ))}
        </Row>
    </div>
);

// ============================================================
// One full year section — year heading, then every month within it
// that has at least one album.
// ============================================================
const YearSection = ({ yearRef, year, count, months, onLogin, onRegister, onMonthRef }) => (
    <section className="ph-section pgal-section" id={`gallery-year-${year}`} ref={yearRef}>
        <Reveal>
            <div className="ph-section-head">
                <div>
                    <Title level={2} className="ph-section-title">
                        {year}
                    </Title>
                    <Paragraph className="ph-section-sub">
                        {count} photo album{count === 1 ? "" : "s"} from {year}.
                    </Paragraph>
                </div>
            </div>
        </Reveal>

        {months.map((m) => (
            <MonthGroup
                key={m.month}
                year={year}
                month={m.month}
                monthLabel={m.monthLabel}
                galleries={m.galleries}
                onLogin={onLogin}
                onRegister={onRegister}
                monthRef={(el) => onMonthRef(year, m.month, el)}
            />
        ))}
    </section>
);

// ============================================================
// Deep-link landings can look like they "jump back up" a moment
// after arriving: album cover images, the multi-photo carousels, and
// even web fonts can all still be resizing things for a few hundred
// ms after the initial scrollIntoView, and every millimeter one of
// them grows ABOVE the target pushes the target further down the
// page — since the scroll position itself never moved, that reads
// as everything sliding back up and away from where we just landed.
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

const PublicGalleryPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [jumpValue, setJumpValue] = useState(undefined);
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();

    const { years, yearList, loading } = usePublicGalleryData();

    const headerRef = useRef(null);
    const yearRefs = useRef({});
    const monthRefs = useRef({});
    const stopSettleScrollRef = useRef(null);

    useEffect(() => {
        document.title = "Gallery | ATMS - Opol Community College";
    }, []);

    // Default the jump-to dropdown to the newest year once data arrives.
    useEffect(() => {
        if (!loading && yearList.length > 0 && jumpValue === undefined) {
            setJumpValue(yearList[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, yearList]);

    // Deep-link support for /public-gallery?year=YYYY(&month=M) — same
    // reasoning as PublicEventsPage.js: wait for `loading` to finish so
    // we scroll to the section's final, fully-rendered height. `month`
    // is 1-based in the URL (1 = January) to stay human-readable; it's
    // optional — with just `year` you land at the top of that year,
    // with both you land on that exact month's group of albums.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const year = params.get("year");
        const month = params.get("month");
        if (!year || loading) return undefined;
        const yearNum = Number(year);
        if (!yearRefs.current[yearNum]) return undefined;

        setJumpValue(yearNum);

        const monthIndex = month !== null && month !== "" ? Number(month) - 1 : null;
        const monthKey = monthIndex !== null ? `${yearNum}-${monthIndex}` : null;
        const getTarget = () =>
            (monthKey && monthRefs.current[monthKey]) || yearRefs.current[yearNum];

        const t = setTimeout(() => {
            stopSettleScrollRef.current?.();
            stopSettleScrollRef.current = scrollToSettled(getTarget);
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

    const goTo = (path) => {
        setMobileNavOpen(false);
        window.location.href = path;
    };

    const scrollToYear = useCallback((year) => {
        setMobileNavOpen(false);
        setJumpValue(year);
        yearRefs.current[year]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const navItems = [
        { label: "Home", onClick: () => goTo("/") },
        ...yearList.slice(0, 4).map((year) => ({
            label: String(year),
            onClick: () => scrollToYear(year),
        })),
    ];
    // Mobile burger panel groups every year under a "Gallery" label
    // instead of listing them flat beside Home (and isn't capped to 4
    // like the desktop nav needs to be for width reasons).

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
                        {/* Only "Home" from navItems — every year is the
                            same scrollToYear link but re-grouped under the
                            "Gallery" label right below, instead of sitting
                            flat beside Home like separate top-level pages.
                            Not capped to 4 here since the panel wraps. */}
                        <button
                            className="ph-mobile-panel-link"
                            onClick={navItems[0].onClick}
                            tabIndex={mobileNavOpen ? 0 : -1}
                        >
                            {navItems[0].label}
                        </button>

                        {yearList.length > 0 && (
                            <>
                                <span className="ph-mobile-panel-group-label">Gallery</span>
                                <div className="ph-mobile-panel-events-group">
                                    {yearList.map((year) => (
                                        <button
                                            key={year}
                                            className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                            onClick={() => scrollToYear(year)}
                                            tabIndex={mobileNavOpen ? 0 : -1}
                                        >
                                            <PictureOutlined /> {year}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ============ PAGE HERO ============ */}
            {/* Jump-to-year dropdown removed: years are already reachable
                from the header nav (desktop) and mobile burger menu. */}
            <section className="pgal-hero">
                <Reveal>
                    <div className="pgal-hero-eyebrow">
                        <PictureOutlined /> Alumni Association
                    </div>
                    <Title level={1} className="pgal-hero-title">
                        Alumni <span className="grad">Gallery</span>
                    </Title>
                    <Paragraph className="pgal-hero-lead">
                        A timeline of every photo album from OCC's reunions, seminars,
                        and gatherings — browse by year to relive the memories.
                    </Paragraph>

                </Reveal>
            </section>

            {/* ============ TIMELINE: ONE SECTION PER YEAR ============ */}
            {loading ? (
                <section className="ph-section pgal-section">
                    <div className="ph-state-box">
                        <Spin size="large" />
                        <Text>Loading gallery…</Text>
                    </div>
                </section>
            ) : years.length === 0 ? (
                <section className="ph-section pgal-section">
                    <div className="ph-state-box">
                        <Empty description="No gallery albums published yet. Check back soon!" />
                    </div>
                </section>
            ) : (
                years.map(({ year, count, months }) => (
                    <YearSection
                        key={year}
                        year={year}
                        count={count}
                        months={months}
                        onLogin={goLogin}
                        onRegister={goRegister}
                        onMonthRef={(y, m, el) => {
                            if (y === "Undated") return;
                            monthRefs.current[`${y}-${m}`] = el;
                        }}
                        yearRef={(el) => {
                            if (year !== "Undated") yearRefs.current[year] = el;
                        }}
                    />
                ))
            )}

            {/* ============ CTA BANNER ============ */}
            <Reveal as="div" className="ph-cta-banner">
                <div className="ph-cta-content">
                    <Title level={2} className="ph-cta-title">
                        Want the full-resolution photos?
                    </Title>
                    <Paragraph className="ph-cta-sub">
                        Create your Alumni account to download full-size photos, register
                        for upcoming events, and stay connected with the OCC community.
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
                here still only need to get someone back Home; every year
                is reachable from the dropdown/nav above, same as requested
                (matches PublicEventsPage.js's footer). */}
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

export default PublicGalleryPage;