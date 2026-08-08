"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    SettingOutlined,
    SunOutlined,
    MoonOutlined,
    QuestionCircleOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import "./SettingsMenu.css";

/**
 * SettingsMenu
 * ─────────────────────────────────────────────────────────────
 * Replaces the old floating sun/moon theme-toggle button in the top-right
 * corner of the login screen with a single settings (gear) icon. Clicking
 * it opens an animated dropdown containing:
 *   1. Theme toggle (light / dark)
 *   2. FAQ
 *   3. About
 *
 * Theme toggle functionality:
 * The actual toggle logic (state, secureLocalStorage persistence, applying
 * data-theme, scatter-letter animation trigger, etc.) all still lives in
 * FormLogin.js exactly as before — this component only receives
 * `currentTheme` + `onThemeToggle` as props and calls them. Nothing about
 * how the theme itself works has changed, so none of the existing
 * connections/behaviour that depend on it can break.
 *
 * FAQ / About navigation bug fix:
 * These used to (elsewhere in the app) navigate with a hard
 * `window.location.href` redirect. That forces a full page reload, which
 * re-boots the whole app (including auth/session bootstrap) — for a
 * logged-in alumni user, that reboot could lose/lag the session check and
 * bounce them back to /login as "session expired". Here we use
 * react-router v5's `useHistory` + `history.push()` for a client-side route
 * change instead, so the current session/app state is never torn down just
 * to view FAQ/About.
 */
const SettingsMenu = ({ currentTheme, onThemeToggle }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const history = useHistory();

    // Close the dropdown on outside click or Escape key
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    // Client-side navigation only — never window.location.href here.
    // See file header note above re: the session-expired kick-out bug.
    const goTo = (path) => {
        setOpen(false);
        // history.push = client-side route change (react-router v5), no
        // full page reload — this is what avoids the session-expired
        // kick-out bug described in the file header above.
        history.push(path);
    };

    const handleThemeClick = () => {
        onThemeToggle();
        // keep the menu open so the user can see the icon/label flip
    };

    return (
        <div className="settings-menu" ref={menuRef}>
            <button
                type="button"
                className={`settings-menu__btn${open ? " is-open" : ""}`}
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Open settings menu"
            >
                <SettingOutlined />
            </button>

            <div
                className={`settings-menu__dropdown${open ? " is-open" : ""}`}
                role="menu"
                aria-hidden={!open}
            >
                <button
                    type="button"
                    className="settings-menu__item"
                    role="menuitem"
                    onClick={handleThemeClick}
                >
                    <span className="settings-menu__icon">
                        {currentTheme === "black" ? (
                            <SunOutlined />
                        ) : (
                            <MoonOutlined />
                        )}
                    </span>
                    <span className="settings-menu__label">
                        {currentTheme === "black" ? "Light Mode" : "Dark Mode"}
                    </span>
                </button>
                        
                <button
                    type="button"
                    className="settings-menu__item"
                    role="menuitem"
                    onClick={() => goTo("/public-faq")}
                >
                    <span className="settings-menu__icon">
                        <QuestionCircleOutlined />
                    </span>
                    <span className="settings-menu__label">FAQs</span>
                </button>

                <button
                    type="button"
                    className="settings-menu__item"
                    role="menuitem"
                    onClick={() => goTo("/public-about")}
                >
                    <span className="settings-menu__icon">
                        <InfoCircleOutlined />
                    </span>
                    <span className="settings-menu__label">About</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsMenu;