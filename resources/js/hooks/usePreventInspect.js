"use client"
// ============================================================
// usePreventInspect.js
// OCC Alumni — shared "prevent right-click / DevTools / browser zoom"
// guard, site-wide (desktop only). Same behavior as FormLogin.js,
// but centralized here so every Public*Page.js consumes ONE copy
// of the logic instead of six duplicated blocks.
//
// -----------------------------------------------------------------
// THIS IS NOT A SECURITY CONTROL — READ BEFORE RELYING ON IT
// -----------------------------------------------------------------
// Everything in this file (blocking right-click, F12/Ctrl+Shift+I,
// Ctrl+U, Ctrl+S, and browser zoom) is a client-side UX deterrent
// only. It is trivially bypassed: disabling JavaScript, opening
// DevTools via the browser's menu instead of a shortcut, using a
// browser extension, or simply calling the API directly with curl/
// Postman/any HTTP client all skip this entirely — none of it runs
// on the server, so none of it is enforced.
//
// Do not add any logic anywhere in this app — client or server —
// that assumes a page's content, images, or API responses are
// protected from inspection/copying because this hook is active.
// The actual security boundary for who can see what is Laravel's
// authentication + Policies (see app/Policies, app/Http/Middleware)
// and the API Resources that shape each response (app/Http/Resources)
// — this hook has no relationship to either. Treat it purely as a
// "make casual right-click-saving slightly less convenient" UX
// touch on public marketing/content pages, nothing more.
//
// -----------------------------------------------------------------
// HOW TO TURN IT OFF WHILE YOU DEBUG
// -----------------------------------------------------------------
// Flip the single flag below (or set the env var) instead of
// commenting the block out in every page file:
//
//   INSPECT_PROTECTION_ENABLED = false
//
// or, without touching code, add to your .env:
//
//   NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION=false
//
// Every page that imports from this file picks up the change
// automatically — right-click, F12/DevTools shortcuts, and the
// zoom lock all stop firing at once, everywhere, with no per-file
// edits and nothing left commented out in the page components.
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

export const INSPECT_PROTECTION_ENABLED =
    (typeof process !== "undefined" &&
        process.env?.NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION) === "false"
        ? false
        : true;
        
        // export const INSPECT_PROTECTION_ENABLED = false;

// Desktop-only breakpoint, matches the original per-page checks
// (window.innerWidth >= 992).
const DESKTOP_MIN_WIDTH = 992;

// ============================================================
// guardImageEvents — spread onto any <img>/media element that
// should resist right-click-save / drag-save. Becomes a no-op
// object automatically when protection is switched off above, so
// pages don't need their own "if disabled" checks.
// ============================================================
export const guardImageEvents = INSPECT_PROTECTION_ENABLED
    ? {
        onContextMenu: (e) => e.preventDefault(),
        onDragStart: (e) => e.preventDefault(),
        draggable: false,
    }
    : {};

// ============================================================
// usePreventInspect — drop into any Public*Page component:
//
//   const { zoomModalOpen, closeZoomModal } = usePreventInspect();
//   ...
//   <ZoomWarningModal open={zoomModalOpen} onClose={closeZoomModal} />
//
// Owns: contextmenu blocking, F12/Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S,
// Ctrl+scroll / Ctrl+plus/minus zoom blocking, and the
// devicePixelRatio-based fallback that also catches browser-menu
// zoom (View > Zoom In, etc).
// ============================================================
export default function usePreventInspect() {
    const [zoomModalOpen, setZoomModalOpen] = useState(false);
    const closeZoomModal = useCallback(() => setZoomModalOpen(false), []);

    useEffect(() => {
        if (!INSPECT_PROTECTION_ENABLED) return undefined;

        const disableContextMenu = (e) => {
            if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
                e.preventDefault();
            }
        };

        document.addEventListener("contextmenu", disableContextMenu);

        return () => {
            document.removeEventListener("contextmenu", disableContextMenu);
        };
    }, []);

    useEffect(() => {
        if (!INSPECT_PROTECTION_ENABLED) return undefined;
        if (window.innerWidth < DESKTOP_MIN_WIDTH) return undefined;

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

    return { zoomModalOpen, closeZoomModal };
}

// ============================================================
// ZoomWarningModal — identical markup/copy that used to be pasted
// at the bottom of every Public*Page.js. Renders nothing when
// protection is disabled so leftover state can never pop it open.
// ============================================================
export function ZoomWarningModal({ open, onClose }) {
    if (!INSPECT_PROTECTION_ENABLED) return null;

    return (
        <Modal
            className="zoom-warning-modal"
            open={open}
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
                    onClick={onClose}
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
    );
}