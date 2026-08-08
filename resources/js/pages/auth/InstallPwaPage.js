"use client"
import React, { useEffect, useRef, useState } from "react";
import { Typography } from "antd";
import {
    HomeOutlined,
    SunOutlined,
    MoonOutlined,
    MenuOutlined,
    CloseOutlined,
    MobileOutlined,
    AndroidOutlined,
    AppleOutlined,
    ShareAltOutlined,
    PlusSquareOutlined,
    ThunderboltOutlined,
    DesktopOutlined,
    LinkOutlined,
    EnvironmentOutlined,
    MailOutlined,
    PhoneOutlined,
    FacebookOutlined,
    TwitterOutlined,
    InstagramOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import atmsHomeScreenMockup from "~/assets/images/atms-home-screen-installed.png";
import iosStepOpenSite from "~/assets/images/ios-step1-open-site.png";
import iosStepShareSheet from "~/assets/images/ios-step2-share-sheet.png";
import iosStepConfirmAdd from "~/assets/images/ios-step3-confirm-add.png";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePreventInspect, { ZoomWarningModal } from "~/hooks/usePreventInspect";
// Reuses every design token (--ph-accent, .ph-btn, .ph-card, .grad, etc.)
// already defined for the public site, same import pattern as
// PublicOccServicesPage.js / PublicEventsPage.js.
import "./PublicHomePage.css";
import "./InstallPwaPage.css";

const { Title, Paragraph } = Typography;

// ============================================================
// InstallPwaPage — a public "how do I install this as an app" guide,
// reached from the "Install PWA" link in the Home page footer (it
// replaced the old "OCC Services" quick link there, since OCC
// Services already has its own dedicated dropdown in the header).
// Same header/footer/hook scaffolding as PublicOccServicesPage.js so
// it reads as part of the same site rather than a bolt-on screen.
// ============================================================
const InstallPwaPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();
    const headerRef = useRef(null);

    useEffect(() => {
        document.title = "Install PWA | ATMS - Opol Community College";
    }, []);

    // ============ Floating header shadow on scroll ============
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
            setMobileNavOpen((open) => (open ? false : open));
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ============ Keep --ph-header-h in sync with the real header ============
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

    const goHome = () => {
        window.location.href = "/";
    };

    const goLogin = () => {
        window.location.href = "/login";
    };

    const goRegister = () => {
        window.location.href = "/register";
    };

    const goTo = (path) => {
        setMobileNavOpen(false);
        window.location.href = path;
    };

    const scrollToTop = () => {
        setMobileNavOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className={`ph-page pwa-page ${isDark ? "dark" : "light"}`}>
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
                        Install PWA
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
                            Install PWA
                        </button>
                    </div>
                </div>
            </nav>

            {/* ============ BREADCRUMB + HERO ============ */}
            <section className="pwa-hero">
                <div className="pwa-breadcrumb">
                    <button onClick={goHome}><HomeOutlined /> Home</button>
                    <span>/</span>
                    <span className="pwa-breadcrumb-current">Install PWA</span>
                </div>
                <Title level={1} className="pwa-hero-title">
                    Progressive Web App
                </Title>
                <Paragraph className="pwa-hero-lead">
                    Install the <span className="grad">ATMS</span> Alumni Portal on Android,
                    iOS, or your desktop for a faster, app-like experience.
                </Paragraph>
            </section>

            {/* ============ OVERVIEW ============ */}
            <section className="ph-section pwa-section">
                <div className="pwa-card pwa-overview">
                    <div className="pwa-card-heading">
                        <ThunderboltOutlined /> Overview
                    </div>
                    <div className="pwa-overview-body">
                        <div className="pwa-overview-mockup">
                            <img src={atmsHomeScreenMockup} alt="ATMS installed on a phone home screen" />
                        </div>
                        <div className="pwa-overview-text">
                            <Paragraph className="pwa-p">
                                A Progressive Web App (PWA) is a lightweight version of{" "}
                                <strong>ATMS</strong> you can install directly on your device
                                like a normal app. It loads faster, runs smoother, and lets you
                                reach the Alumni Portal — events, job posts, announcements, and
                                the gallery — with a single tap.
                            </Paragraph>
                            <Paragraph className="pwa-p">
                                The ATMS PWA works across iPhone, iPad, Android phones and
                                tablets, Windows, macOS, and Linux — same clean, app-like
                                portal, anywhere.
                            </Paragraph>
                            <a
                                href="https://occ-alumni.online/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pwa-link-chip"
                            >
                                <LinkOutlined /> occ-alumni.online
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ ANDROID ============ */}
            <section className="ph-section pwa-section">
                <div className="pwa-card">
                    <div className="pwa-card-heading">
                        <AndroidOutlined /> Android
                    </div>
                    <span className="pwa-card-sub">UI visible or full-screen.</span>
                    <Paragraph className="pwa-p">
                        Works best with Chrome, not tested on other browsers. It may take
                        around 30–60s for the install button to appear. You can only
                        install one PWA version at a time — delete the existing one if you
                        want to switch. See the{" "}
                        <a
                            href="https://support.google.com/chrome/answer/9658361"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Chrome PWA install guide
                        </a>{" "}
                        if it takes too long.
                    </Paragraph>
                </div>
            </section>

            {/* ============ iOS / iPadOS ============ */}
            <section className="ph-section pwa-section">
                <div className="pwa-card">
                    <div className="pwa-card-heading">
                        <AppleOutlined /> iOS / iPadOS
                    </div>
                    <span className="pwa-card-sub">Safari and most other iOS browsers</span>
                    <Paragraph className="pwa-p">
                        Open the site in your browser, tap the <strong>Share</strong> icon,
                        and select <strong>Add to Home Screen</strong>. This works on Safari
                        and most other iOS browsers, letting you access ATMS like a regular
                        app.
                    </Paragraph>

                    <div className="pwa-steps">
                        <div className="pwa-step-card">
                            <div className="pwa-step-card-shot">
                                <img src={iosStepOpenSite} alt="ATMS Alumni Portal open in Safari on iOS" />
                            </div>
                            <div className="pwa-step">
                                <span className="pwa-step-num"><ShareAltOutlined /></span>
                                <div>
                                    <strong>1. Tap Share</strong>
                                    <p>From the browser toolbar while on occ-alumni.online.</p>
                                </div>
                            </div>
                        </div>
                        <div className="pwa-step-card">
                            <div className="pwa-step-card-shot">
                                <img src={iosStepShareSheet} alt="iOS share sheet with Add to Home Screen option" />
                            </div>
                            <div className="pwa-step">
                                <span className="pwa-step-num"><PlusSquareOutlined /></span>
                                <div>
                                    <strong>2. Add to Home Screen</strong>
                                    <p>Pick it from the share sheet's list of actions.</p>
                                </div>
                            </div>
                        </div>
                        <div className="pwa-step-card">
                            <div className="pwa-step-card-shot">
                                <img src={iosStepConfirmAdd} alt="Confirm dialog to add ATMS to the home screen" />
                            </div>
                            <div className="pwa-step">
                                <span className="pwa-step-num"><MobileOutlined /></span>
                                <div>
                                    <strong>3. Confirm &amp; Add</strong>
                                    <p>Keep the name as is, then tap Add in the top corner.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ DESKTOP ============ */}
            <section className="ph-section pwa-section">
                <div className="pwa-card">
                    <div className="pwa-card-heading">
                        <DesktopOutlined /> Windows / macOS / Linux
                    </div>
                    <Paragraph className="pwa-p">
                        In Chrome or Edge, open occ-alumni.online, then use the install icon
                        in the address bar (or the browser menu → "Install ATMS…"). The
                        portal opens in its own app window from then on, separate from your
                        regular browser tabs.
                    </Paragraph>
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
                            <button onClick={scrollToTop} style={{ color: "var(--ph-accent)" }}>
                                Install PWA
                            </button>
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

export default React.memo(InstallPwaPage);