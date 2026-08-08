"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import secureLocalStorage from "react-secure-storage";



const STORAGE_KEY = "app-theme";
const COOKIE_KEY = "atms-theme";
const COOKIE_MAX_AGE_DAYS = 365;

// Keep these in sync with the --bg values in FormLogin.css
const THEME_COLORS = {
    white: "#ffffff",
    black: "#0a0c12",
};

function readCookie(name) {
    const match = document.cookie.match(
        new RegExp("(?:^|; )" + name + "=([^;]*)"),
    );
    return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name, value, days) {
    const maxAge = days * 24 * 60 * 60;
    // SameSite=Lax + no Secure flag omission issue: Blade should be served
    // over HTTPS in production, so add Secure there. Adjust if you're
    // testing on plain http:// locally.
    document.cookie = `${name}=${encodeURIComponent(
        value,
    )}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function applyThemeToDocument(theme) {
    document.documentElement.setAttribute(
        "data-theme",
        theme === "white" ? "" : theme,
    );

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
    }
    meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.white);
}

function getInitialTheme() {
    if (typeof window === "undefined") return "white";

    // Prefer the plain cookie if present (fastest, already used for SSR
    // paint), fall back to secureLocalStorage, then system preference,
    // then white.
    const fromCookie = readCookie(COOKIE_KEY);
    if (fromCookie === "black" || fromCookie === "white") return fromCookie;

    try {
        const fromSecure = secureLocalStorage.getItem(STORAGE_KEY);
        if (fromSecure === "black" || fromSecure === "white") return fromSecure;
    } catch (e) {
        console.warn("Failed to read theme from secureLocalStorage", e);
    }

    if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
        return "black";
    }

    return "white";
}

export function useAppTheme() {
    const [theme, setThemeState] = useState(getInitialTheme);
    const broadcastRef = useRef(null);

    // Set up a BroadcastChannel for instant same-origin sync between tabs
    ///windows (works for the case where the PWA is opened in more than
    // one window at once — the "storage" event alone can be slow/absent
    // in some standalone PWA contexts).
    useEffect(() => {
        if (typeof BroadcastChannel === "undefined") return undefined;
        const channel = new BroadcastChannel("atms-theme-sync");
        broadcastRef.current = channel;

        channel.onmessage = (event) => {
            if (event.data === "black" || event.data === "white") {
                setThemeState(event.data);
            }
        };

        return () => channel.close();
    }, []);

    // Cross-tab sync fallback via the storage event (fires when another
    // tab calls secureLocalStorage.setItem, which under the hood calls
    // localStorage.setItem).
    useEffect(() => {
        const handleStorage = () => {
            try {
                const fromSecure = secureLocalStorage.getItem(STORAGE_KEY);
                if (fromSecure === "black" || fromSecure === "white") {
                    setThemeState((current) =>
                        current === fromSecure ? current : fromSecure,
                    );
                }
            } catch (e) {
                // ignore transient decrypt errors during the storage event
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // Whenever theme changes (from any source), paint it.
    useEffect(() => {
        applyThemeToDocument(theme);
    }, [theme]);

    const setTheme = useCallback((nextTheme) => {
        if (nextTheme !== "black" && nextTheme !== "white") return;

        setThemeState(nextTheme);

        try {
            secureLocalStorage.setItem(STORAGE_KEY, nextTheme);
        } catch (e) {
            console.warn("Failed to persist theme to secureLocalStorage", e);
        }

        writeCookie(COOKIE_KEY, nextTheme, COOKIE_MAX_AGE_DAYS);

        if (broadcastRef.current) {
            broadcastRef.current.postMessage(nextTheme);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === "white" ? "black" : "white");
    }, [theme, setTheme]);

    return { theme, setTheme, toggleTheme };
}

export default useAppTheme;