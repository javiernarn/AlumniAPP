"use client"
import React, { useEffect, useState, useCallback } from "react";
import { Typography, Modal } from "antd";
import {
    HomeOutlined,
    SunOutlined,
    MoonOutlined,
    CompassOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { useAppTheme } from "~/hooks/useAppTheme";
// Reuses every design token (--ph-accent, .ph-btn, .grad, etc.) already
// defined for the public site so this page looks like part of the same
// site instead of a bolt-on antd <Result/> screen — same import pattern
// as PublicEventsPage.js / PublicJobPostsPage.js.
import "../auth/PublicHomePage.css";
import "./PublicPages404.css";

const { Title, Paragraph, Text } = Typography;

// How many seconds to show the "heading back to Home…" countdown
// before auto-redirecting. Kept short — long enough to read the
// message, short enough that an accidental typo (e.g.
// "/PublicHomePageshs") doesn't strand a visitor on a dead page.
const AUTO_REDIRECT_SECONDS = 10;

// ============================================================
// PublicPages404 — shown to anonymous/public visitors who land on a
// URL that doesn't match any public route (a typo like
// "/PublicHomePageshs", an old/removed link, etc.). Unlike
// pages/ErrorPages/Pages404.js (which sends signed-in users back to
// their role-based dashboard), this always points back to the public
// Home page "/" — there's no role to branch on for an anonymous
// visitor, and "/alumni" (Pages404's default) would just bounce them
// to a login wall, which isn't the right recovery for someone who
// only mistyped a public link.
// ============================================================
const PublicPages404 = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
    const [attemptedPath, setAttemptedPath] = useState("");
    const [zoomModalOpen, setZoomModalOpen] = useState(false);

    useEffect(() => {
        document.title = "Page Not Found | ATMS - Opol Community College";
        try {
            setAttemptedPath(window.location.pathname + window.location.search);
        } catch {
            setAttemptedPath("");
        }
    }, []);

    const goHome = useCallback(() => {
        window.location.href = "/";
    }, []);

    // ============ Prevent right-click, DevTools, and browser zoom
    // (site-wide pattern, same as FormLogin — desktop only) ============
    useEffect(() => {
        const disableContextMenu = (e) => {
            if (window.innerWidth >= 992) {
                e.preventDefault();
            }
        };

        document.addEventListener("contextmenu", disableContextMenu);

        return () => {
            document.removeEventListener("contextmenu", disableContextMenu);
        };
    }, []);

    useEffect(() => {
        if (window.innerWidth < 992) return;

        const showZoomModal = () => {
            setZoomModalOpen(true);
        };

        // Baseline devicePixelRatio, captured once on mount/refresh — see
        // FormLogin.js for the full rationale. We only react to it
        // CHANGING (an actual zoom action), never to its value on load.
        let baselineDPR = window.devicePixelRatio;

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            // Block Developer Tools
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
                (e.ctrlKey && key === "u") ||
                (e.ctrlKey && key === "s")
            ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl + 0 (allow reset zoom)
            if (e.ctrlKey && e.key === "0") {
                setTimeout(() => {
                    baselineDPR = window.devicePixelRatio;
                    setZoomModalOpen(false);
                }, 300);
                return;
            }

            // Block Zoom In / Out
            if (
                e.ctrlKey &&
                (
                    e.key === "+" ||
                    e.key === "-" ||
                    e.key === "=" ||
                    e.key === "_" ||
                    e.code === "NumpadAdd" ||
                    e.code === "NumpadSubtract"
                )
            ) {
                e.preventDefault();
                e.stopPropagation();
                showZoomModal();
                return false;
            }
        };

        // Block Ctrl + Mouse Wheel
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                showZoomModal();
                return false;
            }
        };

        // Catches browser-menu zoom (View > Zoom In, etc.) which doesn't
        // fire the handlers above. Only compares against the live
        // baseline, never on mount, so it won't false-trigger on load.
        const checkZoom = () => {
            const currentDPR = window.devicePixelRatio;
            if (currentDPR !== baselineDPR) {
                setZoomModalOpen(true);
            }
        };

        window.addEventListener("resize", checkZoom);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            window.removeEventListener("resize", checkZoom);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // Auto-redirect countdown — ticks down every second and sends the
    // visitor back to Home once it hits 0. Cancelled cleanly on
    // unmount so it never fires after the visitor has already
    // navigated away on their own (e.g. clicked "Back to Home Now").
    useEffect(() => {
        if (secondsLeft <= 0) {
            goHome();
            return undefined;
        }
        const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [secondsLeft, goHome]);

    return (
        <div className={`ph-page pp404-page ${isDark ? "dark" : "light"}`}>
            <div className="pp404-bg" aria-hidden="true" />

            <button
                type="button"
                className="ph-theme-btn pp404-theme-btn"
                onClick={toggleTheme}
                aria-label="Toggle theme"
            >
                {isDark ? <MoonOutlined /> : <SunOutlined />}
            </button>

            <div className="pp404-card">
                <div
                    className="pp404-brand"
                    onClick={goHome}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && goHome()}
                >
                    <img src={logo} alt="OCC Alumni Logo" />
                    <span className="pp404-brand-title">
                        <span style={{ color: "#003366", fontWeight: 900 }}>O</span>
                        <span style={{ color: "#FFD700", fontWeight: 900 }}>C</span>
                        <span style={{ color: "#CC0000", fontWeight: 900 }}>C</span>{" "}
                        <span style={{ color: "#003366", fontWeight: 900 }}>Alumni</span>
                    </span>
                </div>

                <div className="pp404-code">
                    4<span className="grad">0</span>4
                </div>

                <Title level={2} className="pp404-title">
                    Looks like this page wandered off campus.
                </Title>

                <Paragraph className="pp404-sub">
                    Sorry, the page you're looking for doesn't exist or may have been
                    moved. No worries — we'll take you back to the OCC Alumni homepage.
                </Paragraph>

                {attemptedPath && (
                    <div className="pp404-path">
                        <CompassOutlined /> You tried to visit:{" "}
                        <code>{attemptedPath}</code>
                    </div>
                )}

                <div className="pp404-actions">
                    <button type="button" className="ph-btn ph-btn-solid ph-btn-lg" onClick={goHome}>
                        <HomeOutlined /> Back to Home Now
                    </button>
                </div>

                <Text className="pp404-countdown">
                    Redirecting to Home in <strong>{secondsLeft}</strong>{" "}
                    second{secondsLeft === 1 ? "" : "s"}…
                </Text>
            </div>

            <Modal
                className="zoom-warning-modal"
                open={zoomModalOpen}
                title={
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            color: "#f59e0b",
                            fontWeight: 700,
                        }}
                    >
                        <ExclamationCircleOutlined style={{ color: "#f59e0b" }} />
                        Browser Zoom Detected
                    </span>
                }
                centered
                closable={false}
                maskClosable={false}
                keyboard={false}
                footer={[
                    <button
                        key="ok"
                        className="ph-btn ph-btn-solid"
                        onClick={() => setZoomModalOpen(false)}
                    >
                        OK
                    </button>,
                ]}
            >
                <p>
                    You are trying to <strong>zoom in</strong> or{" "}
                    <strong>zoom out</strong>.
                </p>
                <p>
                    This system is designed to work best at{" "}
                    <strong>100% browser zoom</strong>.
                </p>
                <p>
                    Please press <strong>Ctrl + 0</strong> to reset your browser
                    zoom to <strong>100%</strong>.
                </p>
            </Modal>
        </div>
    );
};

export default React.memo(PublicPages404);