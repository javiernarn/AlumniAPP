"use client"
import React, { useEffect, useRef, useState } from "react";
import { Typography } from "antd";
import {
    HomeOutlined,
    SunOutlined,
    MoonOutlined,
    MenuOutlined,
    CloseOutlined,
    EnvironmentOutlined,
    MailOutlined,
    PhoneOutlined,
    FacebookOutlined,
    TwitterOutlined,
    InstagramOutlined,
    CrownOutlined,
    CodeOutlined,
    FileTextOutlined,
    BarChartOutlined,
    TeamOutlined,
    BankOutlined,
    HeartOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import jbAvatar from "~/assets/images/team/jb-abrea.jpg";
import joneeAvatar from "~/assets/images/team/jonee-antiquina.jpg";
import shandyAvatar from "~/assets/images/team/shandy-padere.jpg";
import joshuaAvatar from "~/assets/images/team/joshua-tee.jpg";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePreventInspect, { ZoomWarningModal } from "~/hooks/usePreventInspect";
// Reuses every design token (--ph-accent, .ph-btn, .ph-card, .grad, etc.)
// already defined for the public site, same import pattern as
// InstallPwaPage.js / PublicOccServicesPage.js.
import "./PublicHomePage.css";
import "./PublicCreditsPage.css";

const { Title, Paragraph } = Typography;

// ============================================================
// Capstone team — one card per member. Swap `avatar: null` for an
// imported photo (same pattern as `logo` above, e.g.
// `import jbAvatar from "~/assets/images/team/jb-abrea.jpg"`) once
// real 2x2 photos are available; until then each card falls back to
// an initials avatar built purely in CSS (see .cred-avatar-fallback).
// ============================================================
const TEAM = [
    {
        id: "pm",
        name: "Abrea, JB Boy M.",
        role: "Project Manager",
        icon: <CrownOutlined />,
        avatar: jbAvatar,
        description:
            "Leads the ATMS capstone team end to end — setting the project direction, coordinating tasks across the group, and keeping the timeline, scope, and deliverables on track from proposal to defense.",
    },
    {
        id: "programmer",
        name: "Antiquina, Jonee John R.",
        role: "Programmer",
        icon: <CodeOutlined />,
        avatar: joneeAvatar,
        description:
            "Builds ATMS end to end — the Laravel backend and API, and the React front end for the admin, alumni, and public pages — turning the team's design and requirements into a working alumni portal.",
    },
    {
        id: "writer",
        name: "Padere, Shandy S.",
        role: "Technical Writer",
        icon: <FileTextOutlined />,
        avatar: shandyAvatar,
        description:
            "Documents the project — system specifications, user guides, and the capstone manuscript itself — so ATMS is as clearly explained on paper as it is functional on screen.",
    },
    {
        id: "analyst",
        name: "Tee, Joshua C.",
        role: "Analyst",
        icon: <BarChartOutlined />,
        avatar: joshuaAvatar,
        description:
            "Gathers and studies the project's requirements — interviewing stakeholders, mapping user needs, and shaping the use cases and data flow that ATMS is built around.",
    },
];

// Two-letter initials for the fallback avatar, e.g. "Abrea, JB Boy M." -> "JA"
const getInitials = (fullName) => {
    const [last, rest] = fullName.split(",").map((s) => s.trim());
    const first = (rest || "").split(" ")[0] || "";
    return `${(first[0] || "").toUpperCase()}${(last[0] || "").toUpperCase()}`;
};

// ============================================================
// PublicCreditsPage — public "Credits" page, reached from the Home
// page footer's new "ATMS" column. Same header/footer scaffold as
// InstallPwaPage.js / PublicContactPage.js so it reads as part of
// the same site. Mirrors the reference layout's intro + card grid
// shape, but the cards here are the capstone team instead of generic
// source categories.
// ============================================================
const PublicCreditsPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();
    const headerRef = useRef(null);

    useEffect(() => {
        document.title = "Credits | ATMS - Opol Community College";
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
        <div className={`ph-page cred-page ${isDark ? "dark" : "light"}`}>
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
                        Credits
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
                            Credits
                        </button>
                    </div>
                </div>
            </nav>

            {/* ============ BREADCRUMB + HERO ============ */}
            <section className="cred-hero">
                <div className="cred-breadcrumb">
                    <button onClick={goHome}><HomeOutlined /> Home</button>
                    <span>/</span>
                    <span className="cred-breadcrumb-current">Credits</span>
                </div>
                <Title level={1} className="cred-hero-title">
                    Credits
                </Title>
                <Paragraph className="cred-hero-lead">
                    <span className="grad">ATMS</span> wouldn't exist without the people
                    behind every feature — meet the team who researched, built, and
                    documented the Alumni Portal as their capstone project.
                </Paragraph>
            </section>

            {/* ============ TEAM GRID ============ */}
            <section className="ph-section cred-section">
                <div className="cred-team-grid">
                    {TEAM.map((member) => (
                        <div key={member.id} className="cred-card">
                            <div className="cred-avatar">
                                {member.avatar ? (
                                    <img src={member.avatar} alt={member.name} />
                                ) : (
                                    <span className="cred-avatar-fallback">
                                        {getInitials(member.name)}
                                    </span>
                                )}
                            </div>
                            <div className="cred-card-body">
                                <span className="cred-role-tag">
                                    {member.icon} {member.role}
                                </span>
                                <Title level={4} className="cred-card-name">
                                    {member.name}
                                </Title>
                                <Paragraph className="cred-card-desc">
                                    {member.description}
                                </Paragraph>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ SPECIAL THANKS ============ */}
            <section className="ph-section cred-section cred-thanks-section">
                <Title level={3} className="cred-thanks-title">
                    With Special Thanks To
                </Title>
                <div className="cred-thanks-grid">
                    <div className="cred-thanks-card">
                        <div className="cred-thanks-heading">
                            <BankOutlined /> OCC Administration
                        </div>
                        <Paragraph className="cred-thanks-p">
                            For supporting the development of the Alumni Portal and giving
                            the team the access needed to build it around real OCC data.
                        </Paragraph>
                    </div>
                    <div className="cred-thanks-card">
                        <div className="cred-thanks-heading">
                            <TeamOutlined /> Adviser &amp; Panel
                        </div>
                        <Paragraph className="cred-thanks-p">
                            For the guidance and feedback that shaped ATMS from a proposal
                            into a working capstone project.
                        </Paragraph>
                    </div>
                    <div className="cred-thanks-card">
                        <div className="cred-thanks-heading">
                            <HeartOutlined /> Fellow OCCians
                        </div>
                        <Paragraph className="cred-thanks-p">
                            To every alumnus who tested the portal, reported issues, and
                            gave feedback along the way — thank you.
                        </Paragraph>
                    </div>
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
                            <button onClick={scrollToTop} style={{ color: "var(--ph-accent)" }}>
                                Credits
                            </button>
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

export default React.memo(PublicCreditsPage);