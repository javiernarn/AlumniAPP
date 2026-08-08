"use client"
import React, { useEffect, useRef, useState } from "react";
import { Typography, message as antdMessage } from "antd";
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
    SendOutlined,
    UserOutlined,
    EditOutlined,
    MessageOutlined,
    ClockCircleOutlined,
    CheckCircleFilled,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { useAppTheme } from "~/hooks/useAppTheme";
import usePreventInspect, { ZoomWarningModal } from "~/hooks/usePreventInspect";
import { BASE_URL } from "~/utils/constant";
// Reuses every design token (--ph-accent, .ph-btn, .ph-card, .grad, etc.)
// already defined for the public site, same import pattern as
// InstallPwaPage.js / PublicOccServicesPage.js.
import "./PublicHomePage.css";
import "./PublicContactPage.css";

const { Title, Paragraph } = Typography;

// ============================================================
// Contact details — same values that used to live in the Home page
// footer's "Contact Us" column. That column is now a simple "ATMS"
// link list (Contact Us / Credits / Install PWA), and the actual
// address / email / phone live here instead, front and center on
// their own dedicated page.
// ============================================================
const CONTACT_ADDRESS = "ZONE C. Salva St, Opol, 9016 Misamis Oriental, Philippines";
const CONTACT_EMAIL = "occ.antiquina.joneejohn@gmail.com";
const CONTACT_PHONE = "0949 660 0923";

// ============================================================
// PublicContactPage — public "Contact Us" page, reached from the
// Home page footer's new "ATMS" column. Same header/footer scaffold
// as InstallPwaPage.js so it reads as part of the same site. The
// left column mirrors the footer's old contact block; the right
// column is a lightweight message form that hands off to the
// visitor's own email client via a mailto: link — no backend needed.
// ============================================================
const PublicContactPage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();
    const headerRef = useRef(null);

    const [form, setForm] = useState({ email: "", subject: "", message: "" });
    // Honeypot — stays empty & invisible for real visitors; only bots
    // that auto-fill every field end up populating it. Checked here
    // too so a filled honeypot never even reaches the API.
    const [website, setWebsite] = useState("");
    const [touched, setTouched] = useState(false);
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sentMessage, setSentMessage] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        document.title = "Contact Us | ATMS - Opol Community College";
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

    const updateField = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const isValid = form.email.trim() && form.subject.trim() && form.message.trim();

    // Posts straight to PublicContactController@send, which emails
    // RECIPIENT_EMAIL (same address shown below) with the visitor's
    // address set as Reply-To — see App\Mail\PublicContactMessage.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched(true);
        setErrorMsg("");
        if (!isValid || submitting) return;

        // Honeypot tripped — a real visitor never fills this field in,
        // so silently pretend success instead of tipping off the bot.
        if (website.trim()) {
            setSent(true);
            setSentMessage("Thanks! Your message has been sent — we'll get back to you soon.");
            return;
        }

        setSubmitting(true);
        try {
           const res = await fetch(`${BASE_URL}api/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: form.email.trim(),
                    subject: form.subject.trim(),
                    message: form.message.trim(),
                    website,
                }),
            });
            const data = await res.json().catch(() => null);

            if (res.ok && data?.success) {
                setSent(true);
                setSentMessage(data.message || "Thanks! Your message has been sent — we'll get back to you soon.");
                antdMessage.success("Message sent!");
            } else {
                const failMsg = data?.message || "Something went wrong sending your message. Please try again later.";
                setErrorMsg(failMsg);
                antdMessage.error(failMsg);
            }
        } catch (err) {
            const failMsg = "Couldn't reach the server. Please check your connection and try again.";
            setErrorMsg(failMsg);
            antdMessage.error(failMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`ph-page pcon-page ${isDark ? "dark" : "light"}`}>
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
                        Contact Us
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
                            Contact Us
                        </button>
                    </div>
                </div>
            </nav>

            {/* ============ BREADCRUMB + HERO ============ */}
            <section className="pcon-hero">
                <div className="pcon-breadcrumb">
                    <button onClick={goHome}><HomeOutlined /> Home</button>
                    <span>/</span>
                    <span className="pcon-breadcrumb-current">Contact Us</span>
                </div>
                <Title level={1} className="pcon-hero-title">
                    Get in <span className="grad">Touch</span>
                </Title>
                <Paragraph className="pcon-hero-lead">
                    Questions about the Alumni Portal, an event, or your account?
                    Reach the <strong>ATMS</strong> team directly below, or send a
                    message and we'll get back to you.
                </Paragraph>
            </section>

            {/* ============ CONTACT INFO + FORM ============ */}
            <section className="ph-section pcon-section">
                <div className="pcon-grid">
                    {/* ---- Left: contact information ---- */}
                    <div className="pcon-card pcon-info-card">
                        <div className="pcon-card-heading">
                            <EnvironmentOutlined /> Contact Information
                        </div>
                        <span className="pcon-card-sub">
                            Reach us through any of these channels.
                        </span>

                        <div className="pcon-info-list">
                            <div className="pcon-info-item">
                                <span className="pcon-info-icon"><EnvironmentOutlined /></span>
                                <div>
                                    <strong>Address</strong>
                                    <p>{CONTACT_ADDRESS}</p>
                                </div>
                            </div>
                            <div className="pcon-info-item">
                                <span className="pcon-info-icon"><MailOutlined /></span>
                                <div>
                                    <strong>Email</strong>
                                    <p>
                                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                                    </p>
                                </div>
                            </div>
                            <div className="pcon-info-item">
                                <span className="pcon-info-icon"><PhoneOutlined /></span>
                                <div>
                                    <strong>Phone</strong>
                                    <p>
                                        <a href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}>{CONTACT_PHONE}</a>
                                    </p>
                                </div>
                            </div>
                            <div className="pcon-info-item">
                                <span className="pcon-info-icon"><ClockCircleOutlined /></span>
                                <div>
                                    <strong>Office Hours</strong>
                                    <p>Monday – Friday, 8:00 AM – 5:00 PM</p>
                                </div>
                            </div>
                        </div>

                        <div className="pcon-social">
                            <a href="#" aria-label="Facebook"><FacebookOutlined /></a>
                            <a href="#" aria-label="Twitter"><TwitterOutlined /></a>
                            <a href="#" aria-label="Instagram"><InstagramOutlined /></a>
                        </div>
                    </div>

                    {/* ---- Right: message form ---- */}
                    <div className="pcon-card pcon-form-card">
                        <div className="pcon-card-heading">
                            <MessageOutlined /> Send us a Message
                        </div>
                        <span className="pcon-card-sub">
                            Required fields are marked with <span className="pcon-required">*</span>.
                        </span>
                        <Paragraph className="pcon-p">
                            Or you can send an email directly to{" "}
                            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                        </Paragraph>

                        {sent ? (
                            <div className="pcon-sent">
                                <CheckCircleFilled />
                                <div>
                                    <strong>{sentMessage || "Your message has been sent."}</strong>
                                    <p>
                                        Need to reach us another way? Email{" "}
                                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> directly.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="ph-btn ph-btn-ghost"
                                    onClick={() => {
                                        setSent(false);
                                        setSentMessage("");
                                        setForm({ email: "", subject: "", message: "" });
                                        setWebsite("");
                                        setTouched(false);
                                    }}
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form className="pcon-form" onSubmit={handleSubmit} noValidate>
                                {/* Honeypot — visually hidden from real visitors (see
                                    .pcon-honeypot in the CSS), never focusable via Tab.
                                    Bots that blanket-fill every input trip it; humans
                                    never see or touch it. */}
                                <label className="pcon-honeypot" aria-hidden="true">
                                    Website
                                    <input
                                        type="text"
                                        name="website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                    />
                                </label>

                                {errorMsg && <div className="pcon-error">{errorMsg}</div>}

                                <label className="pcon-field">
                                    <span className="pcon-label">
                                        <UserOutlined /> Email <span className="pcon-required">*</span>
                                    </span>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={updateField("email")}
                                        className={touched && !form.email.trim() ? "pcon-invalid" : ""}
                                    />
                                    <span className="pcon-hint">We'll only use this to reply to your message.</span>
                                </label>

                                <label className="pcon-field">
                                    <span className="pcon-label">
                                        <EditOutlined /> Subject <span className="pcon-required">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Short summary of what this is about"
                                        value={form.subject}
                                        onChange={updateField("subject")}
                                        className={touched && !form.subject.trim() ? "pcon-invalid" : ""}
                                    />
                                </label>

                                <label className="pcon-field">
                                    <span className="pcon-label">
                                        <MessageOutlined /> Message <span className="pcon-required">*</span>
                                    </span>
                                    <textarea
                                        rows={6}
                                        maxLength={1000}
                                        placeholder="Tell us what's on your mind. Include details or steps to reproduce if it's a problem with the portal."
                                        value={form.message}
                                        onChange={updateField("message")}
                                        className={touched && !form.message.trim() ? "pcon-invalid" : ""}
                                    />
                                    <span className="pcon-hint">{form.message.length} / 1000 characters</span>
                                </label>

                                <button
                                    type="submit"
                                    className="ph-btn ph-btn-solid pcon-submit"
                                    disabled={submitting}
                                >
                                    <SendOutlined /> {submitting ? "Sending…" : "Send Message"}
                                </button>
                            </form>
                        )}
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
                            <button onClick={scrollToTop} style={{ color: "var(--ph-accent)" }}>
                                Contact Us
                            </button>
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

export default React.memo(PublicContactPage);