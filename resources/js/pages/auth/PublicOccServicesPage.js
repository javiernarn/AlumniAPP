"use client"
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Typography } from "antd";
import {
    HomeOutlined,
    SunOutlined,
    MoonOutlined,
    MenuOutlined,
    CloseOutlined,
    ExportOutlined,
    GlobalOutlined,
    IdcardOutlined,
    SolutionOutlined,
    AppstoreOutlined,
    TeamOutlined,
    EnvironmentOutlined,
    MailOutlined,
    PhoneOutlined,
    FacebookOutlined,
    TwitterOutlined,
    InstagramOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePreventInspect, { ZoomWarningModal } from "~/hooks/usePreventInspect";
// Reuses every design token (--ph-accent, .ph-btn, .ph-card, .grad, etc.)
// already defined for the public site so this page looks like part of
// the same site instead of a bolt-on screen — same import pattern as
// PublicEventsPage.js / PublicJobPostsPage.js / PublicPages404.js.
import "./PublicHomePage.css";
import "./PublicOccServicesPage.css";

const { Title, Paragraph, Text } = Typography;

// ============================================================
// OCC's family of systems. Every card uses the SAME OCC logo — these
// aren't different brands, they're different doors into the same
// campus, so the mark stays identical and only the name/description/
// link change. Update this list any time a system is added, renamed,
// or moves to a new domain; nothing else in this file needs to change.
//
// `tag` is the short badge shown on the card (who it's for).
// `icon` is a small accent glyph, purely decorative — it does NOT
// replace the OCC logo, which is what actually identifies the card.
// ============================================================
const OCC_SYSTEMS = [
    {
        id: "official",
        name: "OCC Official Website",
        tag: "Main Site",
        icon: <GlobalOutlined />,
        url: "https://www.occ.edu.ph",
        domain: "occ.edu.ph",
        description:
            "The official website of Opol Community College — school profile, programs offered, announcements, and general campus information.",
    },
    {
        id: "sis",
        name: "Student Information System",
        tag: "Enrolled Students",
        icon: <IdcardOutlined />,
        url: "https://www.sis.occph.com",
        domain: "sis.occph.com",
        description:
            "Where currently enrolled OCC students check grades, view class schedules, and manage their academic records online.",
    },
    {
        id: "admission",
        name: "Admission System",
        tag: "Applicants",
        icon: <SolutionOutlined />,
        url: "https://www.admission.occph.com",
        domain: "admission.occph.com",
        description:
            "For applicants taking the OCC entrance examination — registration, examination schedule, and results for incoming students.",
    },
    {
        id: "csdl",
        name: "CSDL Portal",
        tag: "Student Services",
        icon: <AppstoreOutlined />,
        url: "https://www.csdl.occph.com",
        domain: "csdl.occph.com",
        description:
            "A dedicated OCC student services portal. Visit the site directly to explore what it currently offers.",
    },
    {
        id: "alumni",
        name: "Alumni System",
        tag: "Alumni",
        icon: <TeamOutlined />,
        url: "https://www.alumni.occph.com",
        domain: "alumni.occph.com",
        description:
            "The OCC Alumni Association platform — reconnect with batchmates, and browse events, job posts, and the gallery.",
    },
];

// ============================================================
// Best-effort "is it up" check — runs entirely in the browser, no
// backend involved. Cross-origin responses can't be read by JS (CORS),
// so this uses `mode: "no-cors"` and only looks at whether the
// request resolved or rejected:
//   - resolves -> some server answered -> "up" (this does NOT mean it
//     returned a 200; a site returning a 500 still resolves here —
//     the browser genuinely cannot see the status code cross-origin)
//   - rejects/times out -> DNS failure, connection refused, or no
//     response in time -> "down"
// This is a reachability check, not a health check. For a real
// status-code-accurate check, that has to run server-side (no CORS
// restriction there) and be exposed as an endpoint this page calls.
// ============================================================
const STATUS_CHECK_TIMEOUT_MS = 8000;

const checkSystemReachable = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STATUS_CHECK_TIMEOUT_MS);
    try {
        await fetch(url, {
            method: "GET",
            mode: "no-cors",
            cache: "no-store",
            signal: controller.signal,
        });
        return "up";
    } catch {
        return "down";
    } finally {
        clearTimeout(timer);
    }
};

// ============================================================
// PublicOccServicesPage — a public directory of every OCC system,
// reached from the "OCC Services" link in the Home page footer.
// Purpose: give an alumnus a single page to hand to a son, daughter,
// niece, or nephew — "here's the school site, here's where you'll
// check your entrance exam, here's where you'll see your grades once
// you're in, here's the alumni system I use" — one recognizable OCC
// logo, five doors, no guessing which link is which.
// ============================================================
// ============================================================
// Deep-link landings can look like they "jump back up" a moment
// after arriving: the OCC logo images and web fonts can still be
// resizing things for a few hundred ms after the initial
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
// the same name in PublicEventsPage.js / PublicAnnouncementsPage.js —
// kept in sync with both.
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

const PublicOccServicesPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();
    const [statuses, setStatuses] = useState(() =>
        Object.fromEntries(
            OCC_SYSTEMS.map((s) => [s.id, { state: "checking", checkedAt: null }]),
        ),
    );
    const headerRef = useRef(null);
    // One ref per system card, keyed by system.id — lets the
    // ?system=<id> deep link (used by the header's OCC Services
    // dropdown on the Home page) scroll straight to the right card.
    const cardRefs = useRef({});
    const [highlightedId, setHighlightedId] = useState(null);
    const stopSettleScrollRef = useRef(null);

    useEffect(() => {
        document.title = "OCC Services | ATMS - Opol Community College";
    }, []);

    // ============ Check each system's reachability ============
    // Fires once on mount, and again any time the visitor hits
    // "Recheck". Each system is checked independently so a slow/down
    // one never blocks the others from reporting.
    const runStatusChecks = useCallback(() => {
        OCC_SYSTEMS.forEach((system) => {
            setStatuses((prev) => ({
                ...prev,
                [system.id]: { ...prev[system.id], state: "checking" },
            }));
            checkSystemReachable(system.url).then((state) => {
                setStatuses((prev) => ({
                    ...prev,
                    [system.id]: { state, checkedAt: new Date() },
                }));
            });
        });
    }, []);

    useEffect(() => {
        runStatusChecks();
    }, [runStatusChecks]);

    // ============ Floating header shadow on scroll ============
    // Also closes the mobile nav panel on scroll, same safety net as
    // PublicHomePage.js — see that file's comment for the full
    // rationale.
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
            setMobileNavOpen((open) => (open ? false : open));
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ============ Keep --ph-header-h in sync with the real header ============
    // Same measured-height pattern as PublicHomePage.js, so page content
    // padding lines up exactly with this page's own header instead of
    // relying on the CSS fallback value.
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

    // ============ Deep link: ?system=<id> ============
    // The header's "OCC Services" dropdown on the Home page sends
    // visitors here as /occ-services?system=sis (etc.) instead of
    // opening that system's external site directly — this page is
    // the one place with the "Visit Campus Website" button that
    // actually makes that jump, so landing on the right card first
    // means the visitor sees the description/status/domain before
    // clicking through.
    //
    // Even though these cards are static (no data loading gate like
    // Announcements/Events), the OCC logo images and web fonts can
    // still be resizing things for a bit after the initial scroll;
    // scrollToSettled() (above) keeps re-correcting position until
    // the page height stops changing, so the card doesn't appear to
    // "jump back up" a moment after landing.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const systemId = params.get("system");
        if (!systemId || !OCC_SYSTEMS.some((s) => s.id === systemId)) return undefined;

        setHighlightedId(systemId);
        // Small delay so the just-rendered cards exist in the DOM
        // before we start; the settle-scroll loop below then keeps
        // correcting position for a bit longer in case images or
        // fonts are still resizing things.
        const t = setTimeout(() => {
            stopSettleScrollRef.current?.();
            stopSettleScrollRef.current = scrollToSettled(
                () => cardRefs.current[systemId],
            );
        }, 150);
        const clearHighlight = setTimeout(() => setHighlightedId(null), 2600);
        return () => {
            clearTimeout(t);
            clearTimeout(clearHighlight);
            stopSettleScrollRef.current?.();
        };
    }, []);

    const goHome = useCallback(() => {
        window.location.href = "/";
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

    const scrollToTop = () => {
        setMobileNavOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className={`ph-page occsvc-page ${isDark ? "dark" : "light"}`}>
            {/* ============ HEADER ============ */}
            <header
                ref={headerRef}
                className={`ph-header ${scrolled ? "scrolled" : ""} ${isDark ? "dark" : "light"}`}
            >
                <div className="ph-brand" onClick={goHome} role="button" tabIndex={0}>
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
                    <button className="ph-nav-link" onClick={goHome}>
                        Home
                    </button>
                    <button className="ph-nav-link" style={{ color: "var(--ph-accent)", opacity: 1 }}>
                        OCC Services
                    </button>
                </nav>

                <div className="ph-header-actions">
                    <button
                        type="button"
                        className="ph-theme-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
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
            <nav
                className={`ph-mobile-panel ${mobileNavOpen ? "open" : ""}`}
                aria-hidden={!mobileNavOpen}
            >
                <div className="ph-mobile-panel-inner">
                    <div className="ph-mobile-panel-links">
                        <button
                            className="ph-mobile-panel-link"
                            onClick={goHome}
                            tabIndex={mobileNavOpen ? 0 : -1}
                        >
                            Home
                        </button>
                        <button
                            className="ph-mobile-panel-link"
                            style={{ color: "var(--ph-accent)" }}
                            tabIndex={mobileNavOpen ? 0 : -1}
                        >
                            OCC Services
                        </button>
                    </div>
                </div>
            </nav>

            {/* ============ INTRO ============ */}
            <section className="occsvc-intro">
                <div className="occsvc-intro-bg" aria-hidden="true" />
                <div className="occsvc-intro-inner">
                    <div className="occsvc-intro-eyebrow">
                        <GlobalOutlined /> One Campus &middot; Many Systems
                    </div>
                    <Title level={1} className="occsvc-intro-title">
                        Everything <span className="grad">OCC</span>, in one place.
                    </Title>
                    <Paragraph className="occsvc-intro-lead">
                        Opol Community College runs a few different online systems —
                        one for the school itself, one for entrance exams, one for
                        enrolled students, and one for alumni. They all carry the
                        same OCC mark because they're all part of the same campus;
                        this page is just a directory so you always land on the
                        right one.
                    </Paragraph>
                    <Paragraph className="occsvc-intro-sub">
                        Helping a son, daughter, niece, or nephew get started at
                        OCC? Send them this page. It's the fastest way to introduce
                        them to the school's official site, the entrance exam
                        portal, and the systems they'll use once they're a student —
                        no guessing which link is which.
                    </Paragraph>
                </div>
            </section>

            {/* ============ SERVICES GRID ============ */}
            <section className="ph-section occsvc-section">
                <div className="occsvc-status-row">
                    <span className="occsvc-status-note">
                        Status is a best-effort reachability check run from your
                        browser — it confirms a system is responding, not that
                        every page on it works.
                    </span>
                    <button
                        type="button"
                        className="ph-btn ph-btn-ghost occsvc-recheck-btn"
                        onClick={runStatusChecks}
                    >
                        <ReloadOutlined /> Recheck
                    </button>
                </div>

                <div className="occsvc-grid">
                    {OCC_SYSTEMS.map((system, i) => {
                        const status = statuses[system.id] || { state: "checking" };
                        return (
                            <div
                                key={system.id}
                                ref={(node) => {
                                    cardRefs.current[system.id] = node;
                                }}
                                className={`occsvc-card${
                                    highlightedId === system.id ? " occsvc-card-highlight" : ""
                                }`}
                                style={{ transitionDelay: `${i * 60}ms` }}
                            >
                                <div className="occsvc-card-top">
                                    <div className="occsvc-card-logo-wrap">
                                        <img src={logo} alt="OCC Logo" />
                                    </div>
                                    <span className="occsvc-card-tag">
                                        {system.icon} {system.tag}
                                    </span>
                                </div>

                                <span
                                    className={`occsvc-status-pill occsvc-status-${status.state}`}
                                    title={
                                        status.state === "up"
                                            ? "Responded to a request just now"
                                            : status.state === "down"
                                            ? "Didn't respond in time — it may be down, or just slow"
                                            : "Checking…"
                                    }
                                >
                                    <span className="occsvc-status-dot" />
                                    {status.state === "up"
                                        ? "Online"
                                        : status.state === "down"
                                        ? "Unreachable"
                                        : "Checking…"}
                                </span>

                                <div className="occsvc-card-body">
                                    <Title level={4} className="occsvc-card-title">
                                        {system.name}
                                    </Title>
                                    <Paragraph className="occsvc-card-desc">
                                        {system.description}
                                    </Paragraph>
                                    <span className="occsvc-card-domain">{system.domain}</span>
                                </div>

                                <a
                                    href={system.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ph-btn ph-btn-solid occsvc-card-cta"
                                >
                                    Visit Campus Website <ExportOutlined />
                                </a>
                            </div>
                        );
                    })}
                </div>
            </section>

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
                            <button onClick={goHome}>Home</button>
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

export default React.memo(PublicOccServicesPage);