"use client";

import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Alert, Modal, Checkbox } from "antd";
import {
    EyeInvisibleOutlined,
    EyeTwoTone,
    MailOutlined,
    UserOutlined,
    LockOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    MobileOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    DashboardOutlined,
    RocketOutlined,
    ArrowRightOutlined,
    BulbOutlined,
    ThunderboltOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useLoginStore } from "~/states/loginState";
import shallow from "zustand/shallow";
import { Button } from "./index";
import logo from "~/assets/images/site-logo.png";
import secureLocalStorage from "react-secure-storage";
import { useAppTheme } from "~/hooks/useAppTheme";
import "./FormLogin.css";
import { useRive, RiveComponent } from "@rive-app/react-canvas";
import SettingsMenu from "./SettingsMenu";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────

const Formlogin = () => {
    const [error, isSubmit, submitForm] = useLoginStore(
        (state) => [state.error, state.isSubmit, state.checkLogin],
        shallow,
    );
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    // Reveal animation
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setRevealed(true), 60);
        return () => clearTimeout(t);
    }, []);

    // ===== Remember Me (per-device, encrypted via react-secure-storage) =====
    const REMEMBER_KEY = "atms_remembered_credentials";
    const [loginForm] = Form.useForm();
    const [rememberMe, setRememberMe] = useState(false);

    // True when fields were pre-filled by Remember Me (not by a password manager).
    // The autofill poller checks this so it never auto-submits after a normal logout.
    const rememberMePrefilledRef = useRef(false);

    // Load saved credentials on mount
    useEffect(() => {
        try {
            const saved = secureLocalStorage.getItem(REMEMBER_KEY);
            if (saved && saved.email) {
                loginForm.setFieldsValue({
                    email: saved.email,
                    password: saved.password || "",
                });
                setRememberMe(true);
                // Mark that WE filled the fields — not the browser password manager
                rememberMePrefilledRef.current = true;
            }
        } catch (e) {
            console.warn("Failed to load remembered credentials", e);
        }
    }, []);

    // Wrap submit so we can persist credentials before delegating to the store
    const handleLoginSubmit = async (values) => {
        try {
            if (rememberMe) {
                secureLocalStorage.setItem(REMEMBER_KEY, {
                    email: values.email,
                    password: values.password,
                    savedAt: new Date().toISOString(),
                });
            } else {
                secureLocalStorage.removeItem(REMEMBER_KEY);
            }
        } catch (e) {
            console.warn("Failed to persist remembered credentials", e);
        }

        // Attempt normal login
        await submitForm(values);
    };

    // ─────────────────────────────────────────────────────────
    //  Autofill-detection: submit automatically when a password
    //  manager (iCloud Keychain, Google, Samsung, Chrome, Safari)
    //  fills both fields (these managers may use the device's own
    //  biometric unlock before autofilling, unrelated to this app).
    //  Polls every 300 ms for up to ~5 s after mount, then stops.
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        // Only run on the login view; don't interfere with other views.
        if (currentView !== "login") return;

        let attempts = 0;
        const MAX_ATTEMPTS = 17; // ~5 s at 300 ms

        const autoLogin = setInterval(() => {
            attempts++;

            // If Remember Me pre-filled the fields on this load, the poller
            // must not auto-submit — the user explicitly logged out and should
            // have to sign in manually (or use their password manager biometric).
            // Once the user clears a field and the flag is reset, normal
            // password-manager autofill detection resumes.
            if (rememberMePrefilledRef.current) {
                clearInterval(autoLogin);
                return;
            }

            const values = loginForm.getFieldsValue();

            if (values.email && values.password && !isSubmit) {
                loginForm.submit();
                clearInterval(autoLogin);
                return;
            }

            if (attempts >= MAX_ATTEMPTS) {
                clearInterval(autoLogin);
            }
        }, 300);

        return () => clearInterval(autoLogin);
    }, [currentView]); // re-arm whenever the user navigates back to login

    // Password Reset States
    const [currentView, setCurrentView] = useState("login");
    const [forgotEmail, setForgotEmail] = useState("");
    const [foundUser, setFoundUser] = useState(null);
    const [emailSent, setEmailSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [forgotError, setForgotError] = useState("");
    const [resetToken, setResetToken] = useState("");

    // Reset Password States
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [pendingModalOpen, setPendingModalOpen] = useState(false);
    const [rejectedModalOpen, setRejectedModalOpen] = useState(false);
    const [rejectedNotes, setRejectedNotes] = useState("");
    const [loginFormError, setLoginFormError] = useState("");
const [zoomModalOpen, setZoomModalOpen] = useState(false);

   // ==========================================================
// Prevent right-click, DevTools, and browser zoom (Desktop only)
// ==========================================================

// Disable right-click
// useEffect(() => {
//     const disableContextMenu = (e) => {
//         if (window.innerWidth >= 992) {
//             e.preventDefault();
//         }
//     };

//     document.addEventListener("contextmenu", disableContextMenu);

//     return () => {
//         document.removeEventListener("contextmenu", disableContextMenu);
//     };
// }, []);

// // Disable DevTools + Detect Zoom
// useEffect(() => {
//     if (window.innerWidth < 992) return;

//     const showZoomModal = () => {
//         setZoomModalOpen(true);
//     };

//     // ---------------------------------------------------------------
//     // Baseline devicePixelRatio.
//     //
//     // Captured ONCE, silently, the moment the user lands on (or
//     // refreshes) the login page. We never compare against a hardcoded
//     // "100%" — some displays/OS scaling settings never report exactly
//     // 1.0 even at true 100% browser zoom, which was what caused the
//     // modal to incorrectly pop up on every page load/refresh.
//     //
//     // From here on, the modal only opens when devicePixelRatio
//     // CHANGES relative to this baseline — i.e. the user actually
//     // zoomed in/out while on this page. A plain window resize (e.g.
//     // dragging the window edge) does not change devicePixelRatio, so
//     // it will not false-trigger either.
//     // ---------------------------------------------------------------
//     let baselineDPR = window.devicePixelRatio;

//     const handleKeyDown = (e) => {
//         const key = e.key.toLowerCase();

//         // ===============================
//         // Block Developer Tools
//         // ===============================
//         if (
//             e.key === "F12" ||
//             (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
//             (e.ctrlKey && key === "u") ||
//             (e.ctrlKey && key === "s")
//         ) {
//             e.preventDefault();
//             e.stopPropagation();
//             return false;
//         }

//         // ===============================
//         // Ctrl + 0 (Allow Reset Zoom)
//         // ===============================
//         if (e.ctrlKey && e.key === "0") {
//             setTimeout(() => {
//                 // Resetting zoom becomes the new "normal" baseline too.
//                 baselineDPR = window.devicePixelRatio;
//                 setZoomModalOpen(false);
//             }, 300);

//             return;
//         }

//         // ===============================
//         // Block Zoom In / Out
//         // ===============================
//         if (
//             e.ctrlKey &&
//             (
//                 e.key === "+" ||
//                 e.key === "-" ||
//                 e.key === "=" ||
//                 e.key === "_" ||
//                 e.code === "NumpadAdd" ||
//                 e.code === "NumpadSubtract"
//             )
//         ) {
//             e.preventDefault();
//             e.stopPropagation();

//             showZoomModal();

//             return false;
//         }
//     };

//     // Block Ctrl + Mouse Wheel
//     const handleWheel = (e) => {
//         if (e.ctrlKey) {
//             e.preventDefault();
//             e.stopPropagation();

//             showZoomModal();

//             return false;
//         }
//     };

//     // Catches browser-menu zoom (Ctrl+/Ctrl- bypass via mouse, e.g.
//     // View > Zoom In) which doesn't fire our keydown/wheel handlers.
//     // Only compares against the live baseline — never fires on mount.
//     const checkZoom = () => {
//         const currentDPR = window.devicePixelRatio;

//         if (currentDPR !== baselineDPR) {
//             setZoomModalOpen(true);
//         }
//     };

//     // Intentionally NOT calling checkZoom() here. Doing so was what
//     // made the modal appear on every page load/refresh — we only want
//     // to react to a live zoom action taken while the user is here.

//     window.addEventListener("resize", checkZoom);
//     document.addEventListener("keydown", handleKeyDown);
//     document.addEventListener("wheel", handleWheel, {
//         passive: false,
//     });

//     return () => {
//         window.removeEventListener("resize", checkZoom);
//         document.removeEventListener("keydown", handleKeyDown);
//         document.removeEventListener("wheel", handleWheel);
//     };
// }, []);

    const PENDING_MSG_MATCH =
        /pending approval|wait for administrator|notified via email/i;
    const isPendingApproval = (msg) =>
        typeof msg === "string" && PENDING_MSG_MATCH.test(msg);

    // Backend signals a rejected alumni login by returning a message that
    // starts with "REJECTED::" followed by the admin notes, e.g.:
    //   "REJECTED::Your submitted document is unreadable, please re-upload."
    const REJECTED_PREFIX = "REJECTED::";
    const isRejectedAccount = (msg) =>
        typeof msg === "string" && msg.startsWith(REJECTED_PREFIX);
    const extractRejectedNotes = (msg) =>
        typeof msg === "string" ? msg.slice(REJECTED_PREFIX.length).trim() : "";

    useEffect(() => {
        if (!error) return;
        if (isPendingApproval(error)) {
            setPendingModalOpen(true);
            return;
        }
        if (isRejectedAccount(error)) {
            setRejectedNotes(extractRejectedNotes(error));
            setRejectedModalOpen(true);
            return;
        }
        // Any other error → show inline alert above the Email field
        setLoginFormError(typeof error === "string" ? error : String(error));
    }, [error]);

    // Local dismissed flags
    const [dismissedError, setDismissedError] = useState(null);
    const [dismissedSessionAlert, setDismissedSessionAlert] = useState(false);

    useEffect(() => {
        if (error) setDismissedError(null);
    }, [error]);

    // ============ THEME SYSTEM ============
    // Now backed by the shared useAppTheme hook so the black/white
    // preference is app-wide (not just this component), synced across
    // tabs, and reflected in the browser/PWA chrome (theme-color meta,
    // status bar, manifest) — not just the login page's own DOM attribute.
    const { theme: currentTheme, toggleTheme } = useAppTheme();

    const handleThemeToggle = () => {
        toggleTheme();
        if (currentTheme === "white") {
            // We're switching TO black — currentTheme still reflects the
            // pre-toggle value at the moment this handler runs.
            setScatterLetters(generateScatterLetters());
            setAnimationKey((prev) => prev + 1);
        }
    };

    // Theme switcher — now rendered as a settings gear icon that opens a
    // dropdown (theme toggle + FAQ + About). The theme toggle logic itself
    // (handleThemeToggle/currentTheme above) is untouched — it's just passed
    // down as props, so there is a single source of truth and no risk of
    // desyncing/duplicating the toggle behaviour.
    const renderThemeSwitcher = () => (
        <SettingsMenu currentTheme={currentTheme} onThemeToggle={handleThemeToggle} />
    );



    const [isMobilePhone, setIsMobilePhone] = useState(false);
    const [showMobileNotice, setShowMobileNotice] = useState(true);


    const [isStandalonePWA, setIsStandalonePWA] = useState(false);

    useEffect(() => {
        const checkStandalone = () => {
            const displayModeStandalone =
                typeof window.matchMedia === "function" &&
                window.matchMedia("(display-mode: standalone)").matches;

            // iOS Safari doesn't support the display-mode media query the
            // same way; this is its own long-standing flag for "launched
            // from the home screen icon".
            const iosStandalone = window.navigator.standalone === true;

            // Android TWA / apps that launched via an installed intent.
            const androidTwa =
                document.referrer &&
                document.referrer.startsWith("android-app://");

            setIsStandalonePWA(
                Boolean(displayModeStandalone || iosStandalone || androidTwa),
            );
        };

        checkStandalone();

        // If display-mode flips while the page is open (rare, but possible
        // right after an install), hide the notice immediately instead of
        // waiting for a reload.
        let mql;
        if (typeof window.matchMedia === "function") {
            mql = window.matchMedia("(display-mode: standalone)");
            const handleChange = () => checkStandalone();
            if (mql.addEventListener) mql.addEventListener("change", handleChange);
            else if (mql.addListener) mql.addListener(handleChange);

            window.addEventListener("appinstalled", checkStandalone);

            return () => {
                if (mql.removeEventListener)
                    mql.removeEventListener("change", handleChange);
                else if (mql.removeListener) mql.removeListener(handleChange);
                window.removeEventListener("appinstalled", checkStandalone);
            };
        }
    }, []);

    useEffect(() => {
        const detectMobilePhone = () => {
            const userAgent =
                navigator.userAgent || navigator.vendor || window.opera;
            const isMobile =
                /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    userAgent,
                );
            const isTablet =
                /iPad|Android(?!.*Mobile)/i.test(userAgent) ||
                (navigator.maxTouchPoints > 0 && window.innerWidth >= 768);
            const isSmallScreen = window.innerWidth < 768;
            const isMobilePhoneDevice = isMobile && !isTablet && isSmallScreen;
            setIsMobilePhone(isMobilePhoneDevice);
        };

        detectMobilePhone();
        window.addEventListener("resize", detectMobilePhone);
        return () => window.removeEventListener("resize", detectMobilePhone);
    }, []);

    const getDeviceType = () => {
        const userAgent =
            navigator.userAgent || navigator.vendor || window.opera;
        if (/iPhone|iPod/i.test(userAgent)) return "iphone";
        if (/Android/i.test(userAgent)) return "android";
        return "other";
    };

    const handleRegisterRedirect = () => {
        window.location.href = "/register";
    };

    const maskEmail = (email) => {
        if (!email) return "";
        const [localPart, domain] = email.split("@");
        const maskedLocal =
            localPart.charAt(0) +
            "*".repeat(Math.max(localPart.length - 2, 1)) +
            localPart.charAt(localPart.length - 1);
        return `${maskedLocal}@${domain}`;
    };

    const maskName = (name) => {
        if (!name) return "";
        const parts = name.split(" ");
        return parts
            .map((part) => {
                if (part.length <= 1) return part;
                return part.charAt(0) + "*".repeat(part.length - 1);
            })
            .join(" ");
    };

    const handleFindAccount = async () => {
        if (!forgotEmail) {
            setForgotError("Please enter your email address");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forgotEmail)) {
            setForgotError("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        setForgotError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/password/find-account`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ email: forgotEmail }),
                },
            );
            const data = await response.json();

            if (response.ok && data.success) {
                setFoundUser({
                    fullName: data.data.full_name,
                    email: data.data.email,
                });
                setCurrentView("find-user");
            } else {
                setForgotError(
                    data.message || "No account found with this email address",
                );
            }
        } catch (err) {
            console.error("Find account error:", err);
            setForgotError(
                "Unable to connect to server. Please try again later.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendResetLink = async () => {
        setIsLoading(true);
        setForgotError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/password/send-reset-link`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ email: forgotEmail }),
                },
            );
            const data = await response.json();

            if (response.ok && data.success) {
                setEmailSent(true);
            } else {
                setForgotError(
                    data.message ||
                        "Failed to send reset link. Please try again.",
                );
            }
        } catch (err) {
            console.error("Send reset link error:", err);
            setForgotError(
                "Unable to connect to server. Please try again later.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            setForgotError("Please fill in all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            setForgotError("Passwords do not match");
            return;
        }
        if (!isPasswordValid()) {
            setForgotError("Password does not meet requirements");
            return;
        }

        setIsLoading(true);
        setForgotError("");

        try {
            const response = await fetch(`${API_BASE_URL}/password/reset`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: forgotEmail,
                    token: resetToken,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setResetSuccess(true);
            } else {
                setForgotError(
                    data.message ||
                        "Failed to reset password. The link may have expired.",
                );
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setForgotError(
                "Unable to connect to server. Please try again later.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const passwordsMatch =
        newPassword === confirmPassword && confirmPassword.length > 0;

    const isPasswordValid = () =>
        hasMinLength && hasUppercase && hasLowercase && hasNumber;

    const getPasswordStrength = () => {
        let strength = 0;
        if (hasMinLength) strength++;
        if (hasUppercase) strength++;
        if (hasLowercase) strength++;
        if (hasNumber) strength++;

        if (strength <= 1)
            return { label: "Weak", color: "#ef4444", percent: 25 };
        if (strength === 2)
            return { label: "Fair", color: "#f59e0b", percent: 50 };
        if (strength === 3)
            return { label: "Good", color: "#22c55e", percent: 75 };
        return { label: "Strong", color: "#16a34a", percent: 100 };
    };
    const passwordStrength = getPasswordStrength();

    const handleBackToLogin = () => {
        setCurrentView("login");
        setForgotEmail("");
        setFoundUser(null);
        setEmailSent(false);
        setForgotError("");
        setNewPassword("");
        setConfirmPassword("");
        setResetToken("");
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
        );
    };

    const handleTryAgain = () => {
        setCurrentView("forgot-password");
        setFoundUser(null);
        setEmailSent(false);
        setForgotError("");
    };

    const handleSuccessModalClose = () => {
        setIsRedirecting(true);
        setTimeout(() => {
            setIsRedirecting(false);
            setResetSuccess(false);
            handleBackToLogin();
        }, 1500);
    };


    useEffect(() => {
    switch (currentView) {
        case "forgot-password":
            document.title = "Forgot Password | ATMS - Opol Community College";
            break;

        case "find-user":
            document.title = "Account Recovery | ATMS - Opol Community College";
            break;

        case "reset-password":
            document.title = "Reset Password | ATMS - Opol Community College";
            break;

        default:
            document.title = "Login | ATMS - Opol Community College";
    }
}, [currentView]);

    /* =========================================================
     RENDER: LOGIN FORM
     ========================================================= */
    const renderLoginForm = () => (
        <div className="login-card">
            <div className="mobile-landscape-logo">
                <img src={logo || "/placeholder.svg"} alt="OCC Alumni Logo" />
            </div>

            <div className="login-card__header">
                <div className="login-card__logo">
                    <img
                        src={logo || "/placeholder.svg"}
                        alt="OCC Alumni Logo"
                    />
                </div>
                <span className="login-card__chip">
                    <SafetyCertificateOutlined /> Secure Sign-in
                </span>
                <h2 className="login-card__title">Welcome back</h2>
                <p className="login-card__subtitle">
                    Sign in to continue to your alumni workspace.
                </p>
            </div>

            {loginFormError && (
                <Alert
                    className="login-alert"
                    message={loginFormError}
                    type="error"
                    showIcon
                    onClick={() => setLoginFormError("")}
                    style={{ cursor: "pointer" }}
                />
            )}



            {!error && type === "session-expired" && !dismissedSessionAlert && (
                <Alert
                    className="login-alert"
                    message="Your session has expired."
                    type="error"
                    showIcon
                    onClick={() => setDismissedSessionAlert(true)}
                    style={{ cursor: "pointer" }}
                />
            )}

            <Form
                form={loginForm}
                name="normal_login"
                onFinish={handleLoginSubmit}
                layout="vertical"
                requiredMark={false}
            >
                <Form.Item
                    name="email"
                    label={<span className="login-label">Email Address</span>}
                    rules={[
                        { required: true, message: "Please input your Email!" },
                        {
                            type: "email",
                            message: "Please enter a valid email address.",
                        },
                    ]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="occ.last_name.first_name@gmail.com"
                        size="large"
                        className="login-input"
                        autoComplete="username email"
                        onChange={() => {
                            // User touched the field manually — lift the Remember Me
                            // guard so password-manager autofill can work next time.
                            rememberMePrefilledRef.current = false;
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={<span className="login-label">Password</span>}
                    rules={[
                        {
                            required: true,
                            message: "Please input your Password!",
                        },
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Enter your password"
                        size="large"
                        iconRender={(visible) =>
                            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                        className="login-input"
                        autoComplete="current-password"
                    />
                </Form.Item>

                {/* Remember Me + Forgot password row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: -4,
                        marginBottom: 10,
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    <Checkbox
                        checked={rememberMe}
                        onChange={(e) => {
                            const next = e.target.checked;
                            setRememberMe(next);
                            if (!next) {
                                try {
                                    secureLocalStorage.removeItem(REMEMBER_KEY);
                                } catch (err) {}
                            }
                        }}
                    >
                        <span
                            className="login-label"
                            style={{ fontWeight: 500 }}
                        >
                            Keep me signed in
                        </span>
                    </Checkbox>

                    <a
                        className="login-link"
                        onClick={() => setCurrentView("forgot-password")}
                    >
                        Forgot password?
                    </a>
                </div>

                <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmit}
                        label={
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <RocketOutlined /> Sign in
                            </span>
                        }
                        className="login-btn-primary"
                    />
                </Form.Item>
            </Form>

            <div className="login-divider-row">
                <span
                    className="login-link login-back-home-inline"
                    onClick={() => {
                        window.location.href = "/PublicHomePage";
                    }}
                >
                    Back to Home
                </span>

                <div className="login-divider">
                    <div className="line" />
                    <span>NEW HERE</span>
                    <div className="line" />
                </div>
            </div>

            <p className="login-register-text">
                Don't have an account?{" "}
                <a
                    href="/register"
                    className="login-link"
                    onClick={(e) => {
                        e.preventDefault();
                        handleRegisterRedirect();
                    }}
                >
                    Sign up here
                </a>
            </p>

            <div className="login-tip">
                <span className="icon">
                    <BulbOutlined />
                </span>
                <div className="meta">
                    <strong>Tip</strong>
                    <span>
                        Toggle the light / dark theme any time using the icon in
                        the top-right corner.
                    </span>
                </div>
            </div>
        </div>
    );

    /* =========================================================
     RENDER: FORGOT PASSWORD FORM
     ========================================================= */
    const renderForgotPasswordForm = () => (
        <div className="login-card">
            <div className="mobile-landscape-logo">
                <img src={logo || "/placeholder.svg"} alt="OCC Alumni Logo" />
            </div>
            <div className="login-card__header">
                <div className="login-card__logo">
                    <img
                        src={logo || "/placeholder.svg"}
                        alt="OCC Alumni Logo"
                    />
                </div>
                <span className="login-card__chip">
                    <MailOutlined /> Account Recovery
                </span>
                <h2 className="login-card__title">Forgot your password?</h2>
                <p className="login-card__subtitle">
                    No worries — enter your registered Gmail and we'll help you
                    recover your account.
                </p>
            </div>

            {forgotError && (
                <Alert
                    className="login-alert"
                    message={forgotError}
                    type="error"
                    showIcon
                    onClick={() => setForgotError("")}
                    style={{ cursor: "pointer" }}
                />
            )}

            <div style={{ marginBottom: 16 }}>
                <label className="login-label">
                    Gmail Address <span className="req">*</span>
                </label>
                <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your gmail"
                    size="large"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onPressEnter={handleFindAccount}
                    className="login-input"
                />
            </div>

            <Button
                type="primary"
                loading={isLoading}
                onClick={handleFindAccount}
                label={
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <UserOutlined /> Find my account
                    </span>
                }
                className="login-btn-primary"
            />

            <div className="login-divider">
                <div className="line" />
                <span>OR</span>
                <div className="line" />
            </div>

            <p className="login-register-text">
                Remember your password?{" "}
                <a className="login-link" onClick={handleBackToLogin}>
                    Sign in here
                </a>
            </p>

            <div className="login-tip">
                <span className="icon">
                    <BulbOutlined />
                </span>
                <div className="meta">
                    <strong>Tip</strong>
                    <span>
                        Your Gmail is the email address you use to log in to the
                        system.
                    </span>
                </div>
            </div>
        </div>
    );

    /* =========================================================
     RENDER: FIND USER / SEND RESET LINK
     ========================================================= */
    const renderFindUserForm = () => (
        <div className="login-card">
            <div className="mobile-landscape-logo">
                <img src={logo || "/placeholder.svg"} alt="OCC Alumni Logo" />
            </div>
            <div className="login-card__header">
                <div className="login-card__logo">
                    <img
                        src={logo || "/placeholder.svg"}
                        alt="OCC Alumni Logo"
                    />
                </div>
                <span className="login-card__chip">
                    <CheckCircleFilled /> Account Found
                </span>
                <h2 className="login-card__title">Reset your password</h2>
                <p className="login-card__subtitle">
                    We'll send a secure password reset link to your registered
                    email.
                </p>
            </div>

            {forgotError && (
                <Alert
                    className="login-alert"
                    message={forgotError}
                    type="error"
                    showIcon
                    onClick={() => setForgotError("")}
                    style={{ cursor: "pointer" }}
                />
            )}

            {emailSent && (
                <div className="login-success-box">
                    <div className="head">
                        <CheckCircleFilled />
                        <div>
                            <strong>Email Sent</strong>
                            <small>
                                We've emailed your password reset link.
                            </small>
                        </div>
                    </div>
                </div>
            )}

            <div className="login-success-box">
                <div className="head">
                    <CheckCircleFilled />
                    <div>
                        <strong>Account Found!</strong>
                        <div className="row">
                            {maskName(foundUser?.fullName)}
                        </div>
                        <div className="row">
                            <MailOutlined /> {maskEmail(foundUser?.email)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-info-box">
                <div className="head">
                    <span className="icon-wrap">
                        <MailOutlined />
                    </span>
                    <div>
                        <strong>Ready to reset your password?</strong>
                        <span>
                            Click the button below to receive a secure reset
                            link via email. The link will expire in 60 minutes.
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <button
                    type="button"
                    className="login-btn-ghost"
                    onClick={handleTryAgain}
                >
                    <ArrowRightOutlined
                        style={{ transform: "rotate(180deg)" }}
                    />{" "}
                    Try Again
                </button>
                <Button
                    type="primary"
                    loading={isLoading}
                    onClick={handleSendResetLink}
                    disabled={emailSent}
                    label={
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <MailOutlined />{" "}
                            {emailSent ? "Link Sent" : "Send Reset Link"}
                        </span>
                    }
                    className={`login-btn-primary ${emailSent ? "is-disabled" : ""}`}
                />
            </div>

            <div className="login-divider">
                <div className="line" />
                <span>OR</span>
                <div className="line" />
            </div>

            <p
                style={{
                    textAlign: "center",
                    margin: 0,
                    color: "var(--text-muted)",
                    fontSize: 14,
                }}
            >
                Remember your password?{" "}
                <a className="login-link" onClick={handleBackToLogin}>
                    Sign in here
                </a>
            </p>
        </div>
    );

    /* =========================================================
     RENDER: RESET PASSWORD FORM
     ========================================================= */
    const renderResetPasswordForm = () => (
        <div className="login-card">
            <div className="mobile-landscape-logo">
                <img src={logo || "/placeholder.svg"} alt="OCC Alumni Logo" />
            </div>
            <div className="login-card__header">
                <div className="login-card__logo">
                    <img
                        src={logo || "/placeholder.svg"}
                        alt="OCC Alumni Logo"
                    />
                </div>
                <span className="login-card__chip">
                    <LockOutlined /> Set New Password
                </span>
                <h2 className="login-card__title">Create a new password</h2>
                <p className="login-card__subtitle">
                    Set up a strong and secure password for your account.
                </p>
            </div>

            {forgotError && (
                <Alert
                    className="login-alert"
                    message={forgotError}
                    type="error"
                    showIcon
                    onClick={() => setForgotError("")}
                    style={{ cursor: "pointer" }}
                />
            )}

            <div style={{ marginBottom: 14 }}>
                <label className="login-label">
                    New Password <span className="req">*</span>
                </label>
                <Input
                    prefix={<LockOutlined />}
                    suffix={
                        <span
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{ cursor: "pointer" }}
                        >
                            {showNewPassword ? (
                                <EyeTwoTone />
                            ) : (
                                <EyeInvisibleOutlined />
                            )}
                        </span>
                    }
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    size="large"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="login-input"
                />

                {newPassword && (
                    <div className="login-strength">
                        <div className="login-strength__head">
                            <span>Password strength</span>
                            <span
                                className="val"
                                style={{ color: passwordStrength.color }}
                            >
                                {passwordStrength.label}
                            </span>
                        </div>
                        <div className="login-strength__bar">
                            <div
                                style={{
                                    width: `${passwordStrength.percent}%`,
                                    background: passwordStrength.color,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginBottom: 14 }}>
                <label className="login-label">
                    Confirm Password <span className="req">*</span>
                </label>
                <Input
                    prefix={<LockOutlined />}
                    suffix={
                        <span
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            style={{ cursor: "pointer" }}
                        >
                            {showConfirmPassword ? (
                                <EyeTwoTone />
                            ) : (
                                <EyeInvisibleOutlined />
                            )}
                        </span>
                    }
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    size="large"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="login-input"
                />

                {confirmPassword && (
                    <div
                        className={`login-match ${passwordsMatch ? "is-ok" : "is-bad"}`}
                    >
                        {passwordsMatch ? (
                            <CheckCircleFilled />
                        ) : (
                            <CloseCircleFilled />
                        )}
                        <span>
                            {passwordsMatch
                                ? "Passwords match"
                                : "Passwords do not match"}
                        </span>
                    </div>
                )}
            </div>

            <div className="login-req-card">
                <div className="login-req-card__title">
                    <LockOutlined /> Password Requirements
                </div>
                <div className="login-req-grid">
                    <div
                        className={`login-req-item ${hasMinLength ? "is-ok" : ""}`}
                    >
                        {hasMinLength ? (
                            <CheckCircleFilled />
                        ) : (
                            <CloseCircleFilled />
                        )}
                        <span>8+ characters</span>
                    </div>
                    <div
                        className={`login-req-item ${hasUppercase ? "is-ok" : ""}`}
                    >
                        {hasUppercase ? (
                            <CheckCircleFilled />
                        ) : (
                            <CloseCircleFilled />
                        )}
                        <span>Uppercase (A-Z)</span>
                    </div>
                    <div
                        className={`login-req-item ${hasLowercase ? "is-ok" : ""}`}
                    >
                        {hasLowercase ? (
                            <CheckCircleFilled />
                        ) : (
                            <CloseCircleFilled />
                        )}
                        <span>Lowercase (a-z)</span>
                    </div>
                    <div
                        className={`login-req-item ${hasNumber ? "is-ok" : ""}`}
                    >
                        {hasNumber ? (
                            <CheckCircleFilled />
                        ) : (
                            <CloseCircleFilled />
                        )}
                        <span>Number (0-9)</span>
                    </div>
                </div>
            </div>

            <Button
                type="primary"
                loading={isLoading}
                onClick={handleResetPassword}
                disabled={!isPasswordValid() || !passwordsMatch}
                label={
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <LockOutlined /> Reset Password
                    </span>
                }
                className={`login-btn-primary ${!isPasswordValid() || !passwordsMatch ? "is-disabled" : ""}`}
            />

            <div className="login-divider">
                <div className="line" />
                <span>OR</span>
                <div className="line" />
            </div>

            <p
                style={{
                    textAlign: "center",
                    margin: 0,
                    color: "var(--text-muted)",
                    fontSize: 14,
                }}
            >
                Remember your password?{" "}
                <a className="login-link" onClick={handleBackToLogin}>
                    Sign in here
                </a>
            </p>
        </div>
    );

    /* =========================================================
     MOBILE NOTICE
     ========================================================= */
    const renderMobilePhoneNotice = () => {
        if (!isMobilePhone || !showMobileNotice || isStandalonePWA) return null;
        const deviceType = getDeviceType();

        return (
            <div className="mobile-notice-overlay">
                <div className="mobile-notice-card">
                    <div className="icon-circle">
                        <MobileOutlined />
                    </div>
                    <h3>📱 Mobile Device Detected</h3>

                    <div className="info-box">
                        {deviceType === "iphone" ? (
                            <>
                                <p className="label">🍎 iPhone User</p>
                                <p className="body">
                                    For the best experience and to see all
                                    features, please{" "}
                                    <strong>
                                        rotate your phone to landscape mode
                                    </strong>{" "}
                                    (horizontal orientation).
                                </p>
                                <p className="body">
                                    Or install ATMS as an app: tap the{" "}
                                    <strong>Share</strong> icon in Safari's
                                    toolbar, then{" "}
                                    <strong>Add to Home Screen</strong>. This
                                    notice won't show again once it's
                                    installed.
                                </p>
                            </>
                        ) : deviceType === "android" ? (
                            <>
                                <p className="label">🤖 Android User</p>
                                <p className="body">
                                    For the best experience and to see all
                                    features, please{" "}
                                    <strong>request desktop site</strong> from
                                    your browser menu (tap the three dots →
                                    "Desktop site").
                                </p>
                                <p className="body">
                                    Or install ATMS as an app: tap the{" "}
                                    <strong>⋮ (three dots)</strong> menu in
                                    Chrome, then{" "}scroll down and tap{" "}
                                    <strong>Install ATMS</strong>. This
                                    notice won't show again once it's
                                    installed.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="label">📱 Mobile User</p>
                                <p className="body">
                                    For the best experience, please use{" "}
                                    <strong>landscape mode</strong> or{" "}
                                    <strong>request desktop site</strong> from
                                    your browser to see all features.
                                </p>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        className="login-btn-primary"
                        onClick={() => setShowMobileNotice(false)}
                        style={{ width: "100%" }}
                    >
                        Got it, Continue
                    </button>

                    <p className="hint">
                        This notice only appears on mobile phones.
                    </p>
                </div>
            </div>
        );
    };

    // ===== Portfolio-style particle background for .login-brand =====
    const brandParticlesRef = useRef(null);

    useEffect(() => {
        const canvas = brandParticlesRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let raf;
        let particles = [];
        let w = 0,
            h = 0;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            w = rect.width;
            h = rect.height;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = Math.min(90, Math.floor((w * h) / 14000));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.6 + 0.4,
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i],
                        b = particles[j];
                    const dx = a.x - b.x,
                        dy = a.y - b.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 120) {
                        ctx.strokeStyle = `rgba(167, 139, 250, ${0.18 * (1 - d / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                ctx.fillStyle = "rgba(186, 200, 255, 0.65)";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };

        resize();
        draw();
        const ro = new ResizeObserver(resize);
        if (canvas.parentElement) ro.observe(canvas.parentElement);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, []);

    /* =========================================================
     URL-driven reset entry
     ========================================================= */
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const email = params.get("email");

        if (token && email) {
            setCurrentView("reset-password");
            setForgotEmail(decodeURIComponent(email));
            setResetToken(token);
        }
    }, []);

    // Floating Interactive
    const { rive: floatingRive, RiveComponent: FloatingRiveComponent } =
        useRive({
            src: "/astro-assets/rive-files/floating-interactive.riv",
            autoplay: true,
            useDevicePixelRatio: true,
        });

    useEffect(() => {
        if (!floatingRive) return;

        const names = floatingRive.stateMachineNames;
        if (names?.length) {
            floatingRive.play(names[0]);
        } else {
            const anims = floatingRive.animationNames;
            if (anims?.length) floatingRive.play(anims[0]);
        }
    }, [floatingRive]);

    // Drag Background
    const { rive: dragBgRive, RiveComponent: DragBgRiveComponent } = useRive({
        src: "/astro-assets/rive-files/dragBg.riv",
        autoplay: true,
        useDevicePixelRatio: true,
    });

    useEffect(() => {
        if (!dragBgRive) return;

        const names = dragBgRive.stateMachineNames;
        if (names?.length) {
            dragBgRive.play(names[0]);
        } else {
            const anims = dragBgRive.animationNames;
            if (anims?.length) dragBgRive.play(anims[0]);
        }
    }, [dragBgRive]);

    const riveStageRef = useRef(null);

    const lookAtPoint = (cx, cy) => {
        const stage = riveStageRef.current;
        if (!stage) return;
        const canvas = stage.querySelector("canvas");
        if (!canvas) return;
        try {
            canvas.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX: cx,
                    clientY: cy,
                    bubbles: true,
                    pointerType: "mouse",
                }),
            );
            canvas.dispatchEvent(
                new MouseEvent("mousemove", {
                    clientX: cx,
                    clientY: cy,
                    bubbles: true,
                }),
            );
        } catch (_) {
            /* no-op */
        }
    };

    const lookAtElement = (el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        lookAtPoint(r.left + r.width / 2, r.top + r.height / 2);
    };

    const handleFeatureEnter = (e) => {
        lookAtPoint(e.clientX, e.clientY);
    };
    const handleFeatureMove = (e) => {
        lookAtPoint(e.clientX, e.clientY);
    };
    const handleFeatureLeave = (e) => {
        lookAtElement(e.currentTarget);
    };

    /* =========================================================
     ROOT RENDER
     ========================================================= */
    return (
        <>
            {renderMobilePhoneNotice()}
            {renderThemeSwitcher()}

            <div className={`login-page ${revealed ? "is-revealed" : ""}`}>
                <div className="login-page__rive" aria-hidden="true">
                    {/* <DragBgRiveComponent /> */}
                </div>
                <div className="login-shell">
                    {/* ============ LEFT: BRAND PANEL ============ */}
                    <aside className="login-brand">
                        <div className="login-brand__bg" aria-hidden="true">
                            <div className="lb-bg-gradient" />
                            <div className="lb-bg-grid" />
                            <div className="lb-bg-dotgrid" />

                            <canvas
                                ref={brandParticlesRef}
                                className="lb-bg-particles"
                            />

                            <div className="lb-orb lb-orb-1" />
                            <div className="lb-orb lb-orb-2" />
                            <div className="lb-orb lb-orb-3" />
                            <div className="lb-orb lb-orb-4" />

                            <div className="lb-light-beam" />
                        </div>

                        <div className="login-brand__top">
                            <span className="login-brand__chip">
                                <ThunderboltOutlined /> Official Institutional
                                Platform
                            </span>

                            <h1 className="login-brand__title">
                                Welcome to <br />
                                <span className="grad-text">
                                    Alumni Tracing Management
                                </span>
                            </h1>

                            <p className="login-brand__lead">
                                The ATMS is a comprehensive solution for
                                managing alumni information while promoting
                                continuous collaboration, professional growth,
                                and institutional excellence — empowering
                                graduates and institutions to grow together.
                            </p>

                            <div className="login-brand__features has-rive-center">
                                <div
                                    className="login-brand__rive login-brand__rive--center"
                                    ref={riveStageRef}
                                    aria-hidden="true"
                                >
                                    <FloatingRiveComponent />
                                </div>

                                <div
                                    className="login-brand__feature feat--tl"
                                    style={{ animationDelay: "0ms" }}
                                    onMouseEnter={handleFeatureEnter}
                                    onMouseMove={handleFeatureMove}
                                    onMouseLeave={handleFeatureLeave}
                                >
                                    <span className="icon">
                                        <TeamOutlined />
                                    </span>
                                    <div className="meta">
                                        <strong>Alumni Network</strong>
                                        <span>
                                            Stay in touch with classmates and
                                            faculty.
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="login-brand__feature feat--tr"
                                    style={{ animationDelay: "80ms" }}
                                    onMouseEnter={handleFeatureEnter}
                                    onMouseMove={handleFeatureMove}
                                    onMouseLeave={handleFeatureLeave}
                                >
                                    <span className="icon">
                                        <RocketOutlined />
                                    </span>
                                    <div className="meta">
                                        <strong>Career Boost</strong>
                                        <span>
                                            Job posts, events, and growth
                                            opportunities.
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="login-brand__feature feat--bl"
                                    style={{ animationDelay: "160ms" }}
                                    onMouseEnter={handleFeatureEnter}
                                    onMouseMove={handleFeatureMove}
                                    onMouseLeave={handleFeatureLeave}
                                >
                                    <span className="icon">
                                        <SafetyCertificateOutlined />
                                    </span>
                                    <div className="meta">
                                        <strong>Secure Access</strong>
                                        <span>
                                            Role-based authentication for every
                                            user.
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="login-brand__feature feat--br"
                                    style={{ animationDelay: "240ms" }}
                                    onMouseEnter={handleFeatureEnter}
                                    onMouseMove={handleFeatureMove}
                                    onMouseLeave={handleFeatureLeave}
                                >
                                    <span className="icon">
                                        <DashboardOutlined />
                                    </span>
                                    <div className="meta">
                                        <strong>Live Analytics</strong>
                                        <span>
                                            Real-time insights and tracer
                                            reports.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== Seamless Looping Features Marquee ===== */}
                        <div
                            className="login-brand__marquee"
                            aria-hidden="true"
                        >
                            <div className="login-brand__marquee-track">
                                {[
                                    "Photo Library",
                                    "Profile",
                                    "Events",
                                    "Alumni List",
                                    "Messages",
                                    "Job Postings",
                                    "Rating Quiz",
                                    "Image Quiz",
                                ]
                                    .concat([
                                        "Photo Library",
                                        "Profile",
                                        "Events",
                                        "Alumni List",
                                        "Messages",
                                        "Job Postings",
                                        "Rating Quiz",
                                        "Image Quiz",
                                    ])
                                    .map((name, i) => (
                                        <span
                                            key={i}
                                            className="login-brand__marquee-item"
                                        >
                                            <span className="login-brand__marquee-dot" />
                                            {name}
                                        </span>
                                    ))}
                            </div>
                        </div>

                        <div className="login-brand__footer">
                            <span className="dot" />
                            <span>
                                System status:{" "}
                                <strong>All services operational</strong>{" "}
                            </span>
                        </div>
                    </aside>

                    {/* ============ RIGHT: FORM PANEL ============ */}
                    <section className="login-form-panel">
                        {currentView === "login" && renderLoginForm()}
                        {currentView === "forgot-password" &&
                            renderForgotPasswordForm()}
                        {currentView === "find-user" && renderFindUserForm()}
                        {currentView === "reset-password" &&
                            renderResetPasswordForm()}
                    </section>
                </div>
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
        <Button
            key="ok"
            type="primary"
            onClick={() => setZoomModalOpen(false)}
            label="OK"
        />,
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
        Please press <strong>Ctrl + 0</strong> to reset your browser zoom
        to <strong>100%</strong>.
    </p>
</Modal>

            <Modal
                className="pending-approval-modal"
                open={pendingModalOpen}
                onCancel={() => setPendingModalOpen(false)}
                onOk={() => setPendingModalOpen(false)}
                okText="Got it"
                cancelButtonProps={{ style: { display: "none" } }}
                title={
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            color: "#ef4444",
                            fontWeight: 700,
                        }}
                    >
                        <SafetyCertificateOutlined
                            style={{ color: "#ef4444" }}
                        />
                        Account Pending Approval
                    </span>
                }
                centered
            >
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                    Your alumni account is pending approval. Please wait for
                    administrator approval. You will be notified via email once
                    your account has been approved.
                </p>
            </Modal>

            {/* ============ REJECTED ALUMNI MODAL ============ */}
            <Modal
                className="rejected-account-modal"
                open={rejectedModalOpen}
                onCancel={() => setRejectedModalOpen(false)}
                onOk={() => setRejectedModalOpen(false)}
                okText="I Understand"
                cancelButtonProps={{ style: { display: "none" } }}
                title={
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            color: "#ef4444",
                            fontWeight: 700,
                        }}
                    >
                        <CloseCircleFilled style={{ color: "#ef4444" }} />
                        Account Rejected
                    </span>
                }
                centered
            >
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                    We’re sorry, your alumni account registration has been
                    <strong> rejected</strong> by the administrator.
                </p>

                {rejectedNotes && (
                    <div
                        style={{
                            marginTop: 14,
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.25)",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 600,
                                color: "#ef4444",
                                marginBottom: 6,
                            }}
                        >
                            Administrator notes:
                        </p>
                        <p style={{ margin: 0, lineHeight: 1.6, color: "#1f2937", whiteSpace: "pre-wrap" }}>
                            {rejectedNotes}
                        </p>
                    </div>
                )}

                <p style={{ marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
                    For further clarification or questions regarding this decision,
                    please contact the <strong>Administrator Office</strong>
                </p>
            </Modal>


            {/* ============ SUCCESS MODAL ============ */}
            <Modal
                open={resetSuccess}
                footer={null}
                closable={false}
                centered
                width={420}
                className="login-success-modal"
            >
                <div className="login-success-modal__inner">
                    {isRedirecting ? (
                        <div
                            className={`signin-redirect ${currentTheme === "black" ? "dark" : "light"}`}
                        >
                            <span className="signin-redirect__chip">
                                <span className="pulse" />
                                Secure Session
                            </span>
                            <div className="signin-redirect__logo">
                                <img
                                    src={logo || "/placeholder.svg"}
                                    alt="OCC Alumni Logo"
                                />
                            </div>
                            <h3 className="signin-redirect__title">
                                Sign <span className="grad">In</span>
                            </h3>
                            <p className="signin-redirect__sub">
                                We're directing you to the login…
                            </p>
                            <div
                                className="signin-redirect__loader"
                                aria-hidden="true"
                            />
                            <div className="signin-redirect__loading-text">
                                Loading<span className="dot">.</span>
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="login-success-modal__icon">
                                <CheckCircleFilled />
                            </div>
                            <h3>Password Reset Successful!</h3>
                            <p>
                                Your password has been successfully changed.
                                Please sign in with your new password.
                            </p>
                            <Button
                                type="primary"
                                onClick={handleSuccessModalClose}
                                label={
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <RocketOutlined /> Sign In
                                    </span>
                                }
                                className="login-btn-primary"
                            />
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default Formlogin;