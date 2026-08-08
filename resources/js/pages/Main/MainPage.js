import React, { useState, useEffect } from "react";
import { Typography } from "antd";
import { getStorage } from "../../utils/helper";
import logo from "~/assets/images/site-logo.png";
import secureLocalStorage from "react-secure-storage";
import { useAppTheme } from "~/hooks/useAppTheme";

const { Title, Text } = Typography;

const MainPage = () => {
    useEffect(() => {
        setTimeout(() => {
            if (!getStorage("userRole")) {
                // Not logged in yet — land on the public home page first
                // (with its own Sign In / Sign Up buttons in the header)
                // instead of dropping straight into the login form.
                window.location = "/PublicHomePage";
            } else {
                if (getStorage("userRole") === "admin") {
                    window.location = "/home";
                    return;
                }

                if (getStorage("userRole") === "alumni") {
                    window.location = "/home";
                    return;
                }
                if (getStorage("userRole") === "department_head") {
                    window.location = "/department-dashboard";
                    return;
                }
            }
        }, 3000);
    }, []);


    useEffect(() => {
    document.title = "Loading | ATMS - Opol Community College";
}, []);

///Prevent Right-Click and Developer Tools///
      useEffect(() => {
      const disableContextMenu = (e) => {
        e.preventDefault();
      };
    
      document.addEventListener("contextmenu", disableContextMenu);
    
      return () => {
        document.removeEventListener("contextmenu", disableContextMenu);
      };
    }, []);
    
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
          (e.ctrlKey && e.key === "u")
        ) {
          e.preventDefault();
          return false;
        }
      };
    
      document.addEventListener("keydown", handleKeyDown);
    
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, []);
    
    // ============ THEME SYNC (shared with FormLogin) ============
    // Uses the same useAppTheme hook as FormLogin so this page can never
    // drift out of sync with what was actually saved (cookie + secureLocalStorage
    // + BroadcastChannel, all handled centrally by the hook).
    const { theme: currentTheme } = useAppTheme();
    // ============ END THEME SYNC ============

    const isDark = currentTheme === "black";

    return (
        <>
            <style>{`
                :root {
                    --mp-accent: #4f46e5;
                    --mp-accent-2: #0ea5e9;
                    --mp-accent-3: #7c3aed;
                }
                .mp-wrapper {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    transition: background 0.4s ease, color 0.4s ease;
                    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto,
                        "Helvetica Neue", Arial, sans-serif;
                    padding: 24px;
                }
                .mp-wrapper.light {
                    color: #0b1220;
                    background:
                        radial-gradient(900px 500px at 100% -10%, rgba(14,165,233,0.12), transparent 60%),
                        radial-gradient(900px 500px at -10% 110%, rgba(124,58,237,0.12), transparent 60%),
                        #f4f7fb;
                }
                .mp-wrapper.dark {
                    color: #e7ecf3;
                    background:
                        radial-gradient(900px 500px at 100% -10%, rgba(14,165,233,0.16), transparent 60%),
                        radial-gradient(900px 500px at -10% 110%, rgba(124,58,237,0.18), transparent 60%),
                        #0a0c12;
                }

                /* Floating blobs */
                .mp-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.45;
                    pointer-events: none;
                    animation: mp-float 14s ease-in-out infinite;
                }
                .mp-blob-1 { width: 360px; height: 360px; background: #6366f1; top: -100px; left: -80px; }
                .mp-blob-2 { width: 420px; height: 420px; background: #06b6d4; bottom: -160px; right: -100px; animation-duration: 18s; }
                .mp-blob-3 { width: 260px; height: 260px; background: #a855f7; top: 40%; left: 60%; opacity: 0.32; animation-duration: 22s; }

                @keyframes mp-float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50%      { transform: translateY(-16px) scale(1.05); }
                }

                /* Center card */
                .mp-card {
                    position: relative;
                    z-index: 1;
                    text-align: center;
                    padding: 48px 40px;
                    border-radius: 26px;
                    max-width: 420px;
                    width: 100%;
                    animation: mp-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .mp-wrapper.light .mp-card {
                    background: rgba(255,255,255,0.85);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 28px 60px rgba(2, 6, 23, 0.12);
                }
                .mp-wrapper.dark .mp-card {
                    background: rgba(18, 22, 32, 0.82);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    border: 1px solid #242a36;
                    box-shadow: 0 28px 60px rgba(0,0,0,0.55);
                }

                .mp-chip {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 6px 14px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    background: rgba(79, 70, 229, 0.10);
                    border: 1px solid rgba(79, 70, 229, 0.28);
                    color: var(--mp-accent);
                    margin-bottom: 24px;
                }
                .mp-chip .pulse {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 0 0 rgba(34,197,94,0.6);
                    animation: mp-pulse 1.8s ease-in-out infinite;
                }
                @keyframes mp-pulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
                    50%     { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
                }

                /* Logo */
                .mp-logo-wrap {
                    width: 140px;
                    height: 140px;
                    margin: 0 auto 22px;
                    border-radius: 32px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                    position: relative;
                    background: linear-gradient(135deg,
                        rgba(79, 70, 229, 0.12),
                        rgba(14, 165, 233, 0.12),
                        rgba(124, 58, 237, 0.12));
                    border: 1px solid rgba(79, 70, 229, 0.20);
                    animation: mp-logo-float 3s ease-in-out infinite;
                }
                .mp-wrapper.dark .mp-logo-wrap {
                    background: linear-gradient(135deg,
                        rgba(99, 102, 241, 0.20),
                        rgba(14, 165, 233, 0.18),
                        rgba(168, 85, 247, 0.20));
                    border-color: rgba(99, 102, 241, 0.35);
                }
                .mp-logo-wrap::before {
                    content: ""; position: absolute; inset: -2px;
                    border-radius: 34px;
                    background: linear-gradient(135deg, var(--mp-accent), var(--mp-accent-3), var(--mp-accent-2));
                    z-index: -1;
                    opacity: 0.35;
                    filter: blur(14px);
                    animation: mp-glow 3s ease-in-out infinite;
                }
                .mp-logo-wrap img {
                    width: 100%; height: 100%; object-fit: contain;
                }
                @keyframes mp-logo-float {
                    0%,100% { transform: translateY(0); }
                    50%     { transform: translateY(-8px); }
                }
                @keyframes mp-glow {
                    0%,100% { opacity: 0.30; }
                    50%     { opacity: 0.55; }
                }

                /* Title */
                .mp-title {
                    font-size: 28px !important;
                    font-weight: 800 !important;
                    letter-spacing: -0.01em !important;
                    margin: 0 0 6px !important;
                    color: inherit !important;
                }
                .mp-title .grad {
                    background: linear-gradient(135deg, var(--mp-accent), var(--mp-accent-3) 50%, var(--mp-accent-2));
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent; color: transparent;
                }
                .mp-sub {
                    margin: 0 0 28px !important;
                    font-size: 14px !important;
                    opacity: 0.75;
                    color: inherit !important;
                }

                /* Loader bar */
                .mp-loader {
                    position: relative;
                    width: 100%;
                    height: 6px;
                    border-radius: 4px;
                    overflow: hidden;
                    background: rgba(148, 163, 184, 0.18);
                    margin-bottom: 12px;
                }
                .mp-loader::before {
                    content: "";
                    position: absolute; top: 0; left: 0; bottom: 0;
                    width: 40%;
                    border-radius: 4px;
                    background: linear-gradient(90deg, var(--mp-accent), var(--mp-accent-2), var(--mp-accent-3));
                    animation: mp-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    box-shadow: 0 0 12px rgba(79, 70, 229, 0.5);
                }
                @keyframes mp-slide {
                    0%   { left: -40%; }
                    100% { left: 100%; }
                }

                .mp-loading-text {
                    font-size: 12.5px;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    font-weight: 700;
                    opacity: 0.6;
                    color: inherit;
                }
                .mp-loading-text .dot {
                    display: inline-block;
                    animation: mp-blink 1.4s infinite;
                }
                .mp-loading-text .dot:nth-child(2) { animation-delay: 0.2s; }
                .mp-loading-text .dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes mp-blink {
                    0%, 80%, 100% { opacity: 0.3; }
                    40%           { opacity: 1; }
                }

                @keyframes mp-fade-up {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .mp-blob, .mp-logo-wrap, .mp-logo-wrap::before,
                    .mp-card, .mp-loader::before, .mp-loading-text .dot {
                        animation: none !important;
                    }
                }
            `}</style>

            <div className={`mp-wrapper ${isDark ? "dark" : "light"}`}>
                <span className="mp-blob mp-blob-1" />
                <span className="mp-blob mp-blob-2" />
                <span className="mp-blob mp-blob-3" />

                <div className="mp-card">
                    <span className="mp-chip">
                        <span className="pulse" />
                        Secure Session
                    </span>

                    <div className="mp-logo-wrap">
                        <img src={logo} alt="OCC Alumni Logo" />
                    </div>

                    <Title level={1} className="mp-title">
                        OCC <span className="grad">Alumni</span>
                    </Title>
                    <Text className="mp-sub">
                        Preparing your workspace, please wait…
                    </Text>

                    <div className="mp-loader" aria-hidden="true" />
                    <div className="mp-loading-text">
                        Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default React.memo(MainPage);