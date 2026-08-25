"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Typography, Row, Col, Empty, Dropdown } from "antd";
import {
    CalendarOutlined,
    EnvironmentOutlined,
    SoundOutlined,
    IdcardOutlined,
    PictureOutlined,
    SolutionOutlined,
    TeamOutlined,
    BankOutlined,
    ArrowRightOutlined,
    MenuOutlined,
    CloseOutlined,
    SunOutlined,
    MoonOutlined,
    MailOutlined,
    PhoneOutlined,
    FacebookOutlined,
    TwitterOutlined,
    InstagramOutlined,
    RightOutlined,
    DownOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    StarOutlined,
    FileOutlined,
    NotificationOutlined,
    PushpinFilled,
    GlobalOutlined,
    AppstoreOutlined,
    ExportOutlined,
} from "@ant-design/icons";
import logo from "~/assets/images/site-logo.png";
import { CardSkeletonGrid } from "~/components";


import heroVisualEvents from "~/assets/images/feature-events.png";
import heroVisualAlumni from "~/assets/images/feature-alumni.png";
import heroVisualJobs from "~/assets/images/feature-jobs.png";
import heroVisualGallery from "~/assets/images/feature-gallery.png";

import { useAppTheme } from "~/hooks/useAppTheme";
import usePreventInspect, { guardImageEvents, ZoomWarningModal } from "~/hooks/usePreventInspect";
import usePublicHomeData from "~/hooks/usePublicHomeData";
import usePublicGalleryData from "~/hooks/usePublicGalleryData";
import { normalizeJobType } from "~/hooks/usePublicJobPostsData";
import usePublicAnnouncementsData, {
    ANNOUNCEMENT_CATEGORIES,
} from "~/hooks/usePublicAnnouncementsData";
import { BASE_URL } from "~/utils/constant";
import "./PublicHomePage.css";
import ScrollProgressOrb from "../admin/ScrollProgress/ScrollProgressOrb"

const { Title, Paragraph } = Typography;

// ============================================================
// Words that cycle inside the hero pill, mirrors the "Connect /
// Engage / Thrive" rotator from the reference design.
// ============================================================
const ROTATING_WORDS = ["Connect", "Engage", "Thrive", "Belong", "Grow"];

// ============================================================
// Options behind the header's "Events" dropdown. Picking one takes
// the visitor straight to that section on the dedicated events page
// (/public-events?section=...) — the homepage's own inline Upcoming
// Events preview further down is reached only via the footer's
// "Events" Quick Link, per the "footer stays Home-events-only" rule.
// ============================================================
// ============================================================
// Options behind the header's "Announcements" dropdown. Picking one
// takes the visitor straight to that category on the dedicated
// announcements page (/public-announcements?category=...) — same
// pattern as the Events/Job Posts dropdowns below. The homepage's own
// inline "Latest Announcements" preview further down always shows the
// 6 most recent across every category, regardless of which one is
// picked here.
// ============================================================
const ANNOUNCEMENTS_SECTIONS = ANNOUNCEMENT_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
    icon: <NotificationOutlined />,
}));

const EVENTS_SECTIONS = [
    { value: "upcoming", label: "Upcoming", icon: <ClockCircleOutlined /> },
    { value: "ongoing", label: "Ongoing", icon: <CheckCircleOutlined /> },
    { value: "completed", label: "Completed", icon: <CheckCircleOutlined /> },
    { value: "featured", label: "Featured", icon: <StarOutlined /> },
];

// ============================================================
// Options behind the header's "Job Posts" dropdown. Picking one takes
// the visitor straight to that Type section on the dedicated job
// posts page (/public-job-posts?type=...) — same pattern as the
// Events dropdown above. The homepage's own inline "Career
// Opportunities" preview further down is still reachable via
// scrolling or the "View All Jobs" button, which now also opens the
// full page instead of gating straight to /login.
// ============================================================
const JOB_SECTIONS = [
    { value: "full-time", label: "Full-time", icon: <CheckCircleOutlined /> },
    { value: "part-time", label: "Part-time", icon: <ClockCircleOutlined /> },
    { value: "contract", label: "Contract", icon: <FileOutlined /> },
];

// ============================================================
// Options behind the header's "OCC Services" dropdown — OCC's family
// of systems (kept in sync with OCC_SYSTEMS in
// PublicOccServicesPage.js; update both lists together if a system is
// added, renamed, or moves to a new domain). Picking a system opens
// that campus site directly in a new tab, since these are separate
// domains outside this app. A "View All Systems" item at the bottom
// still takes the visitor to the full /occ-services directory page,
// for the side-by-side comparison with live status checks.
// ============================================================
const OCC_SYSTEMS = [
    {
        id: "official",
        label: "OCC Official Website",
        tag: "Main Site",
        icon: <GlobalOutlined />,
        url: "https://www.occ.edu.ph",
    },
    {
        id: "sis",
        label: "Student Information System",
        tag: "Enrolled Students",
        icon: <IdcardOutlined />,
        url: "https://www.sis.occph.com",
    },
    {
        id: "admission",
        label: "Admission System",
        tag: "Applicants",
        icon: <SolutionOutlined />,
        url: "https://www.admission.occph.com",
    },
    {
        id: "csdl",
        label: "CSDL Portal",
        tag: "Student Services",
        icon: <AppstoreOutlined />,
        url: "https://www.csdl.occph.com",
    },
    {
        id: "alumni",
        label: "Alumni System",
        tag: "Alumni",
        icon: <TeamOutlined />,
        url: "https://www.alumni.occph.com",
    },
];

// ============================================================
// Taglines that crossfade inside the center "OCC" badge overlaying
// the 4-image showcase grid (Events / Alumni / Jobs / Gallery).
// ============================================================
const ALUMNI_TAGLINES = [
    "Where Legacy Lives",
    "Excellence Beyond Boundaries",
    "Connection for Life",
    "Empowering Minds",
    "Transforming Futures",
];

// ============================================================
// Small helper — builds an absolute URL for images that come back
// from the API as relative storage paths. Mirrors buildImageUrl()
// used in AdminAlumniJobPostPage.js so uploaded event / gallery /
// job images resolve the same way everywhere in the app.
// ============================================================
const buildImageUrl = (imagePath) => {
    try {
        if (!imagePath) return null;
        const base = String(BASE_URL || "").replace(/\/$/, "");
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath;
        }
        if (imagePath.startsWith("data:")) return imagePath;
        const raw = String(imagePath);
        const noLeading = raw.replace(/^\/+/, "");
        if (raw.startsWith("/storage/")) return `${base}${raw}`;
        if (noLeading.startsWith("storage/")) return `${base}/${noLeading}`;
        return `${base}/storage/${noLeading}`;
    } catch {
        return null;
    }
};

const formatDate = (value) => {
    if (!value) return "";
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });
    } catch {
        return "";
    }
};

const stripHtml = (value) => {
    if (!value) return "";
    return String(value).replace(/<[^>]*>/g, "").trim();
};

// ------------------------------------------------------------
// Gallery items can carry a single image_url or a full image_urls[]
// batch (an alumni event album, for instance, uploaded as one gallery
// entry with several photos inside it). These two helpers give the
// full photo list for a gallery card and how many photos are in it,
// so the grid can show a "3+" style badge instead of only ever
// showing the first photo with no indication there are more.
// ------------------------------------------------------------
const getGalleryImageList = (gallery) => {
    if (Array.isArray(gallery?.image_urls) && gallery.image_urls.length > 0) {
        return gallery.image_urls;
    }
    if (gallery?.image_url) return [gallery.image_url];
    return [];
};

const getGalleryImageCount = (gallery) => getGalleryImageList(gallery).length;

// ============================================================
// Reveal-on-scroll wrapper — lightweight IntersectionObserver based
// fade/slide-up, same easing family as the rest of the app.
// ============================================================
const Reveal = ({ children, as: As = "div", className = "", ...rest }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <As
            ref={ref}
            className={`ph-reveal ${visible ? "is-visible" : ""} ${className}`}
            {...rest}
        >
            {children}
        </As>
    );
};

// ============================================================
// Image protection helpers — best-effort deterrents against casual
// right-click-save / long-press-save / drag-save. None of this can
// make an image un-screenshottable (nothing can), but it removes the
// easy "Save Image As…" paths so downloading a full-quality photo
// stays a signed-in, logged action rather than a right-click away.
// Real downloads live behind /login, same as everything else here.
// ============================================================
// ============================================================
// Gallery lightbox — tapping/clicking a thumbnail no longer sends
// visitors to /login; it opens this zoomed preview instead. On desktop
// the thumbnail shows a zoom-in cursor as the affordance; on both
// desktop and mobile, clicking/tapping the enlarged image itself
// toggles a closer zoom level in place.
// ============================================================
const GalleryLightbox = ({ item, onClose }) => {
    const [zoomed, setZoomed] = useState(false);

    useEffect(() => {
        setZoomed(false);
    }, [item]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    if (!item) return null;

    return (
        <div className="ph-lightbox-overlay" onClick={onClose}>
            <button
                type="button"
                className="ph-lightbox-close"
                onClick={onClose}
                aria-label="Close preview"
            >
                <CloseOutlined />
            </button>
            <div
                className="ph-lightbox-content"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={item.src}
                    alt={item.title || "Alumni memory"}
                    className={`ph-lightbox-img ${zoomed ? "is-zoomed" : ""}`}
                    onClick={() => setZoomed((z) => !z)}
                    {...guardImageEvents}
                />
                <div className="ph-lightbox-caption">
                    <span className="ph-lightbox-title">
                        {item.title || "Alumni memory"}
                    </span>
                    {item.publishedLabel && (
                        <span className="ph-lightbox-date">{item.publishedLabel}</span>
                    )}
                </div>
                <span className="ph-lightbox-hint">
                    Tap the photo to {zoomed ? "zoom out" : "zoom in"} &middot; Sign in to download
                </span>
            </div>
        </div>
    );
};

const PublicHomePage = () => {
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    const isDark = currentTheme === "black";

    const [scrolled, setScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [rotatorIndex, setRotatorIndex] = useState(0);
    const [rotatorText, setRotatorText] = useState("");
    const [rotatorTyping, setRotatorTyping] = useState(true);
    const [lightboxItem, setLightboxItem] = useState(null);
    const { zoomModalOpen, closeZoomModal } = usePreventInspect();

    const {
        events,
        eventsLoading,
        gallery,
        galleryLoading,
        jobs,
        jobsLoading,
    } = usePublicHomeData();

    // Powers ONLY the header's "Gallery" dropdown (year -> month picker).
    // The teaser grid further down the page still uses `gallery` from
    // usePublicHomeData above (latest 8, no year/month grouping needed
    // there) — same separation of concerns as usePublicGalleryData's own
    // file header explains.
    const { years: galleryYears } = usePublicGalleryData();

    // Powers the homepage's "Latest Announcements" teaser: the 6 most
    // recent active announcements across every category, pinned first.
    // The full, per-category breakdown only lives on /public-announcements.
    const { latest: latestAnnouncements, loading: announcementsLoading } =
        usePublicAnnouncementsData();

    const heroRef = useRef(null);
    const announcementsRef = useRef(null);
    const eventsRef = useRef(null);
    const galleryRef = useRef(null);
    const jobsRef = useRef(null);
    const headerRef = useRef(null);

    // ============ Lock scroll while the gallery lightbox is open ============
    useEffect(() => {
        if (lightboxItem) {
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
        return undefined;
    }, [lightboxItem]);

    // ============ Page title ============
    useEffect(() => {
        document.title = "Home | ATMS - Opol Community College";
    }, []);


    // ============ Floating header shadow on scroll ============
    // Force-closes the mobile nav panel on scroll, same as
    // PublicEventsPage.js / PublicGalleryPage.js / PublicJobPostsPage.js /
    // PublicOccServicesPage.js. Note: this was previously removed because
    // it broke scrolling through the categories/sections list while the
    // panel was open on a phone — if that resurfaces, the panel is also
    // reachable via its own "Close" (X) button in the header.
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
            setMobileNavOpen((open) => (open ? false : open));
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ============ Keep --ph-header-h in sync with the real header ============
    // The header is position: fixed so it floats above the page on every
    // device (desktop, laptop, and mobile in both portrait and landscape).
    // Its actual rendered height changes with breakpoint, text wrapping,
    // and orientation, so instead of guessing pixel values in CSS, we
    // measure it live and publish it as a CSS variable. Page content
    // padding and the mobile nav panel's offset both read this variable,
    // so they always sit flush under the header with zero dead space and
    // no chance of drifting out of sync.
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

        // Fallback / extra safety net for browsers or edge cases where
        // ResizeObserver misses a change (e.g. some orientation-change
        // timing quirks on mobile Safari).
        window.addEventListener("resize", applyHeight);
        window.addEventListener("orientationchange", applyHeight);

        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener("resize", applyHeight);
            window.removeEventListener("orientationchange", applyHeight);
        };
    }, []);

    // ============ Hero word rotator (typewriter) ============
    useEffect(() => {
        const currentWord = ROTATING_WORDS[rotatorIndex % ROTATING_WORDS.length];
        let timeout;

        if (rotatorTyping) {
            if (rotatorText.length < currentWord.length) {
                timeout = setTimeout(() => {
                    setRotatorText(currentWord.slice(0, rotatorText.length + 1));
                }, 90);
            } else {
                timeout = setTimeout(() => setRotatorTyping(false), 1400);
            }
        } else {
            if (rotatorText.length > 0) {
                timeout = setTimeout(() => {
                    setRotatorText(rotatorText.slice(0, -1));
                }, 45);
            } else {
                setRotatorIndex((i) => (i + 1) % ROTATING_WORDS.length);
                setRotatorTyping(true);
            }
        }
        return () => clearTimeout(timeout);
    }, [rotatorText, rotatorTyping, rotatorIndex]);

    // (No more body-scroll lock: the mobile nav is now an in-flow panel
    // under the header, not a full-screen overlay, so the rest of the
    // page — including the footer — stays reachable by normal scrolling
    // while it's open.)

    // ============ Data: events, gallery, job posts ============
    // All three now come from usePublicHomeData() above — see that
    // file for the fetch logic and the note about securing the
    // underlying endpoints on the backend.

    const goLogin = useCallback(() => {
        window.location.href = "/login";
    }, []);

    const goRegister = useCallback(() => {
        window.location.href = "/register";
    }, []);

    // Full announcements page — one section per category. The header's
    // Announcements dropdown and the teaser's "View All" both land here.
    // Passing a category jumps straight to that section, e.g.
    // goToAnnouncements("maintenance") -> /public-announcements?category=maintenance
    const goToAnnouncements = useCallback((category) => {
        window.location.href = category
            ? `/public-announcements?category=${category}`
            : "/public-announcements";
    }, []);

    // Full events page — Upcoming / Ongoing / Completed / Featured.
    // "View All" and every event card's "Read More" both land here
    // instead of gating straight to /login, since browsing the full
    // events list is public; only registering requires an account.
    // Passing a section jumps straight to that part of the page, e.g.
    // goToEvents("ongoing") -> /public-events?section=ongoing
    const goToEvents = useCallback((section) => {
        window.location.href = section
            ? `/public-events?section=${section}`
            : "/public-events";
    }, []);

    // Full job posts page — Full-time / Part-time / Contract. "View All
    // Jobs" and the header's Job Posts dropdown both land here instead
    // of gating straight to /login, since browsing the full job list is
    // public; only applying requires an account.
    // Passing a type jumps straight to that section, e.g.
    // goToJobPosts("part-time") -> /public-job-posts?type=part-time
    const goToJobPosts = useCallback((type) => {
        window.location.href = type
            ? `/public-job-posts?type=${type}`
            : "/public-job-posts";
    }, []);

    // goToGallery(2026) -> /public-gallery?year=2026
    // goToGallery(2026, 6) -> /public-gallery?year=2026&month=6 (June)
    // goToGallery() -> /public-gallery (no filter, just the full page)
    // `month` is 1-based here to stay human-readable in the URL.
    const goToGallery = useCallback((year, month) => {
        if (!year) {
            window.location.href = "/public-gallery";
            return;
        }
        const params = new URLSearchParams({ year: String(year) });
        if (month) params.set("month", String(month));
        window.location.href = `/public-gallery?${params.toString()}`;
    }, []);

    const scrollToRef = (ref) => {
        setMobileNavOpen(false);
        ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const scrollToTop = () => {
        setMobileNavOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goTo = (path) => {
        setMobileNavOpen(false);
        window.location.href = path;
    };

    // Sends the visitor to the OCC Services directory page, scrolled
    // straight to the system they picked from the header dropdown.
    // The actual jump to that system's own external site still happens
    // from the "Visit Campus Website" button on that system's card —
    // this just gets them to the right card first.
    const goToOccSystem = (systemId) => {
        setMobileNavOpen(false);
        window.location.href = `/occ-services?system=${systemId}`;
    };

    // "Events" is no longer a plain scroll link — it opens the
    // Upcoming/Ongoing/Completed/Featured dropdown instead (rendered
    // separately, right after Home, in both the desktop nav and the
    // mobile panel below). The homepage's own inline events preview
    // is still reachable, but only from the footer's Events link.
    // "Gallery" works the same way now — see galleryDropdownMenu below —
    // so it's dropped from this flat list too.
    const navItems = [
        { label: "Home", onClick: scrollToTop },
        // { label: "Announcements", onClick: () => goTo("/") },
        // { label: "E-Newsletter", onClick: () => goTo("/") },
    ];

    // "Announcements" opens a category dropdown (General / Academic /
    // Event / Career / Urgent / Maintenance / Other) that jumps straight
    // to that section on /public-announcements, same pattern as Events.
    const announcementsDropdownMenu = {
        items: ANNOUNCEMENTS_SECTIONS.map((s) => ({
            key: s.value,
            label: s.label,
            icon: s.icon,
        })),
        onClick: ({ key }) => {
            setMobileNavOpen(false);
            goToAnnouncements(key);
        },
    };

    const eventsDropdownMenu = {
        items: EVENTS_SECTIONS.map((s) => ({
            key: s.value,
            label: s.label,
            icon: s.icon,
        })),
        onClick: ({ key }) => {
            setMobileNavOpen(false);
            goToEvents(key);
        },
    };

    // "Job Posts" works the same way as "Events" now — opening a
    // Full-time / Part-time / Contract dropdown that jumps straight to
    // that section on /public-job-posts, instead of a plain scroll link.
    const jobsDropdownMenu = {
        items: JOB_SECTIONS.map((s) => ({
            key: s.value,
            label: s.label,
            icon: s.icon,
        })),
        onClick: ({ key }) => {
            setMobileNavOpen(false);
            goToJobPosts(key);
        },
    };

    // "OCC Services" opens a dropdown listing every OCC system (Main
    // Site, SIS, Admission, CSDL, Alumni) — picking one jumps straight
    // to that system's own site in a new tab. "View All Systems" at
    // the bottom instead goes to the full /occ-services directory
    // page here in the app, which also shows live reachability status
    // for each one side by side.
    const occServicesDropdownMenu = {
        items: [
            ...OCC_SYSTEMS.map((s) => ({
                key: s.id,
                label: s.label,
                icon: s.icon,
            })),
            { type: "divider", key: "occ-services-div" },
            {
                key: "occ-services-view-all",
                label: "View All Systems",
                icon: <AppstoreOutlined />,
            },
        ],
        onClick: ({ key }) => {
            setMobileNavOpen(false);
            if (key === "occ-services-view-all") {
                goTo("/occ-services");
                return;
            }
            const system = OCC_SYSTEMS.find((s) => s.id === key);
            if (system) goToOccSystem(system.id);
        },
    };

    // ============================================================
    // "Gallery" header dropdown — Year, then Month within it, sourced
    // from usePublicGalleryData()'s year/month grouping. "Undated"
    // entries are left out here on purpose: there's nothing meaningful
    // to jump to for an album with no date, and the full gallery is
    // still one click away via "Gallery" itself when nothing has
    // loaded yet (see the plain-button fallback in the header below).
    // ============================================================
    const galleryNavYears = useMemo(() => {
        return (galleryYears || [])
            .filter((y) => y.year !== "Undated")
            .map((y) => ({
                year: y.year,
                months: (y.months || [])
                    .filter((m) => m.month !== "undated")
                    .map((m) => ({
                        monthNumber: m.month + 1, // 1-based, human-readable in the URL
                        label: m.monthLabel,
                    })),
            }));
    }, [galleryYears]);

    const galleryDropdownItems = useMemo(
        () =>
            galleryNavYears.map((y) => ({
                key: `gallery-year-${y.year}`,
                label: String(y.year),
                children: [
                    { key: `gallery-year-${y.year}-all`, label: `All of ${y.year}` },
                    ...(y.months.length
                        ? [{ type: "divider", key: `gallery-year-${y.year}-div` }]
                        : []),
                    ...y.months.map((m) => ({
                        key: `gallery-year-${y.year}-month-${m.monthNumber}`,
                        label: m.label,
                    })),
                ],
            })),
        [galleryNavYears],
    );

    // Parses keys like "gallery-year-2026" (-> year only), or
    // "gallery-year-2026-all" / "gallery-year-2026-month-6" (-> year +
    // month) and routes to /public-gallery with the matching params.
    const galleryDropdownMenu = {
        items: galleryDropdownItems,
        onClick: ({ key }) => {
            setMobileNavOpen(false);
            const match = String(key).match(/^gallery-year-(\d+)(?:-(all)|-month-(\d+))?$/);
            if (!match) return;
            const [, year, , month] = match;
            goToGallery(year, month ? Number(month) : undefined);
        },
    };

    return (
        <div className={`ph-page ${isDark ? "dark" : "light"}`}>
            <ScrollProgressOrb/>
            {/* ============ HEADER ============ */}
            <header
                ref={headerRef}
                className={`ph-header ${scrolled ? "scrolled" : ""} ${isDark ? "dark" : "light"}`}
            >
                <div className="ph-brand" onClick={scrollToTop} role="button" tabIndex={0}>
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
                    <button className="ph-nav-link" onClick={navItems[0].onClick}>
                        {navItems[0].label}
                    </button>

                    <Dropdown
                        menu={announcementsDropdownMenu}
                        trigger={["hover", "click"]}
                        placement="bottomLeft"
                        overlayClassName="ph-events-dropdown-overlay"
                    >
                        <button className="ph-nav-link ph-nav-link-dropdown" type="button">
                            Announcements <DownOutlined className="ph-nav-link-caret" />
                        </button>
                    </Dropdown>

                    <Dropdown
                        menu={eventsDropdownMenu}
                        trigger={["hover", "click"]}
                        placement="bottomLeft"
                        overlayClassName="ph-events-dropdown-overlay"
                    >
                        <button className="ph-nav-link ph-nav-link-dropdown" type="button">
                            Events <DownOutlined className="ph-nav-link-caret" />
                        </button>
                    </Dropdown>

                    {galleryDropdownItems.length > 0 ? (
                        <Dropdown
                            menu={galleryDropdownMenu}
                            trigger={["hover", "click"]}
                            placement="bottomLeft"
                            overlayClassName="ph-events-dropdown-overlay"
                        >
                            <button className="ph-nav-link ph-nav-link-dropdown" type="button">
                                Gallery <DownOutlined className="ph-nav-link-caret" />
                            </button>
                        </Dropdown>
                    ) : (
                        <button className="ph-nav-link" onClick={() => goToGallery()}>
                            Gallery
                        </button>
                    )}

                    {navItems.slice(1).map((item) => (
                        <button key={item.label} className="ph-nav-link" onClick={item.onClick}>
                            {item.label}
                        </button>
                    ))}

                    <Dropdown
                        menu={jobsDropdownMenu}
                        trigger={["hover", "click"]}
                        placement="bottomLeft"
                        overlayClassName="ph-events-dropdown-overlay"
                    >
                        <button className="ph-nav-link ph-nav-link-dropdown" type="button">
                            Job Posts <DownOutlined className="ph-nav-link-caret" />
                        </button>
                    </Dropdown>

                    <Dropdown
                        menu={occServicesDropdownMenu}
                        trigger={["hover", "click"]}
                        placement="bottomLeft"
                        overlayClassName="ph-events-dropdown-overlay"
                    >
                        <button className="ph-nav-link ph-nav-link-dropdown" type="button">
                            OCC Services <DownOutlined className="ph-nav-link-caret" />
                        </button>
                    </Dropdown>
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
                    {/* Sign In: stays in the header, right beside the theme
                        toggle, at every breakpoint — desktop, mobile
                        landscape, and mobile portrait. */}
                    <button className="ph-btn ph-btn-ghost ph-header-signin" onClick={goLogin}>
                        Sign In
                    </button>
                    {/* Sign Up: stays in the header on desktop and mobile
                        landscape. Hidden on mobile portrait only, where
                        there isn't room beside the theme toggle, Sign In,
                        and burger icon. */}
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
            {/* Sits directly under the header, in normal document flow —
                not a full-screen drawer. While open it sticks to the same
                spot as the header itself as you scroll, and the page
                underneath (hero, sections, footer) stays fully scrollable
                and visible in both portrait and landscape. */}
            <nav
                className={`ph-mobile-panel ${mobileNavOpen ? "open" : ""}`}
                aria-hidden={!mobileNavOpen}
            >
                <div className="ph-mobile-panel-inner">
                    <div className="ph-mobile-panel-links">
                        <button
                            className="ph-mobile-panel-link"
                            onClick={navItems[0].onClick}
                            tabIndex={mobileNavOpen ? 0 : -1}
                        >
                            {navItems[0].label}
                        </button>

                        {/* Gallery / Job Posts sit right beside Home, on their
                            own row above the Events group, so they read as
                            top-level pages rather than Events sub-sections. */}
                        {navItems.slice(1).map((item) => (
                            <button
                                key={item.label}
                                className="ph-mobile-panel-link"
                                onClick={item.onClick}
                                tabIndex={mobileNavOpen ? 0 : -1}
                            >
                                {item.label}
                            </button>
                        ))}

                        <span className="ph-mobile-panel-group-label">Announcements</span>
                        <div className="ph-mobile-panel-events-group">
                            {ANNOUNCEMENTS_SECTIONS.map((s) => (
                                <button
                                    key={s.value}
                                    className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                    onClick={() => goToAnnouncements(s.value)}
                                    tabIndex={mobileNavOpen ? 0 : -1}
                                >
                                    {s.icon} {s.label}
                                </button>
                            ))}
                        </div>

                        <span className="ph-mobile-panel-group-label">Events</span>
                        <div className="ph-mobile-panel-events-group">
                            {EVENTS_SECTIONS.map((s) => (
                                <button
                                    key={s.value}
                                    className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                    onClick={() => goToEvents(s.value)}
                                    tabIndex={mobileNavOpen ? 0 : -1}
                                >
                                    {s.icon} {s.label}
                                </button>
                            ))}
                        </div>

                        <span className="ph-mobile-panel-group-label">Job Posts</span>
                        <div className="ph-mobile-panel-events-group">
                            {JOB_SECTIONS.map((s) => (
                                <button
                                    key={s.value}
                                    className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                    onClick={() => goToJobPosts(s.value)}
                                    tabIndex={mobileNavOpen ? 0 : -1}
                                >
                                    {s.icon} {s.label}
                                </button>
                            ))}
                        </div>

                        <span className="ph-mobile-panel-group-label">OCC Services</span>
                        <div className="ph-mobile-panel-events-group">
                            {OCC_SYSTEMS.map((s) => (
                                <button
                                    key={s.id}
                                    className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                    onClick={() => goToOccSystem(s.id)}
                                    tabIndex={mobileNavOpen ? 0 : -1}
                                >
                                    {s.icon} {s.label}
                                </button>
                            ))}
                            <button
                                className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                onClick={() => goTo("/occ-services")}
                                tabIndex={mobileNavOpen ? 0 : -1}
                            >
                                <AppstoreOutlined /> View All Systems
                            </button>
                        </div>

                        {galleryNavYears.length > 0 && (
                            <>
                                <span className="ph-mobile-panel-group-label">Gallery</span>
                                <div className="ph-mobile-panel-events-group">
                                    {galleryNavYears.map((y) => (
                                        <div key={y.year} className="ph-mobile-panel-gallery-year">
                                            <button
                                                className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                                onClick={() => {
                                                    setMobileNavOpen(false);
                                                    goToGallery(y.year);
                                                }}
                                                tabIndex={mobileNavOpen ? 0 : -1}
                                            >
                                                <PictureOutlined /> {y.year} — All
                                            </button>
                                            {y.months.map((m) => (
                                                <button
                                                    key={`${y.year}-${m.monthNumber}`}
                                                    className="ph-mobile-panel-link ph-mobile-panel-event-link"
                                                    style={{ paddingLeft: 34 }}
                                                    onClick={() => {
                                                        setMobileNavOpen(false);
                                                        goToGallery(y.year, m.monthNumber);
                                                    }}
                                                    tabIndex={mobileNavOpen ? 0 : -1}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {/* Sign In / Sign Up removed from the burger panel —
                        both now live in the header itself (beside the
                        theme toggle) on every mobile breakpoint. */}
                </div>
            </nav>

            {/* ============ HERO ============ */}
            <section className="ph-hero" ref={heroRef}>
                <div className="ph-hero-bg" aria-hidden="true" />
                <div className="ph-hero-inner">
                    <div className="ph-hero-copy">
                        <div className="ph-hero-eyebrow">
                            <EnvironmentOutlined /> Main Campus &middot; Opol, Misamis Oriental
                        </div>
                        <div className="ph-hero-rotator">
                            {rotatorText}
                            <span className="caret" />
                        </div>
                        <Title level={1} className="ph-hero-title">
                            Welcome home, <span className="grad">Alumni.</span>
                        </Title>
                        <Paragraph className="ph-hero-lead">
                            browse upcoming events, explore job
                            opportunities shared by the Alumni Association, and relive campus
                            memories through the gallery — all in one place.
                        </Paragraph>
                        <div className="ph-hero-cta">
                            <button className="ph-btn ph-btn-solid ph-btn-lg" onClick={goRegister}>
                                Get Started <ArrowRightOutlined />
                            </button>
                            <button
                                className="ph-btn ph-btn-warm ph-btn-lg"
                                onClick={() => scrollToRef(eventsRef)}
                            >
                                <SoundOutlined /> View Latest Events
                            </button>
                        </div>
                        <div className="ph-hero-stats">
                            <div className="ph-hero-stat">
                                <span className="ph-hero-stat-value">
                                    {eventsLoading ? "—" : `${events.length}+`}
                                </span>
                                <span className="ph-hero-stat-label">Upcoming Events</span>
                            </div>
                            <div className="ph-hero-stat">
                                <span className="ph-hero-stat-value">
                                    {jobsLoading ? "—" : `${jobs.length}+`}
                                </span>
                                <span className="ph-hero-stat-label">Job Opportunities</span>
                            </div>
                            <div className="ph-hero-stat">
                                <span className="ph-hero-stat-value">24/7</span>
                                <span className="ph-hero-stat-label">Anytime Access</span>
                            </div>
                        </div>
                    </div>

                    <div className="ph-hero-visual" aria-hidden="true">

                        <div className="ph-visual-block ph-visual-events">
                            <img src={heroVisualEvents} alt="Upcoming Events" {...guardImageEvents} />
                        </div>

                        <div className="ph-visual-block ph-visual-1">
                            <img src={heroVisualAlumni} alt="Alumni Directory" {...guardImageEvents} />
                        </div>

                        <div className="ph-visual-block ph-visual-2">
                            <img src={heroVisualJobs} alt="Job Posts" {...guardImageEvents} />
                        </div>

                        <div className="ph-visual-block ph-visual-gallery">
                            <img src={heroVisualGallery} alt="Photo Gallery" {...guardImageEvents} />
                        </div>

                        <div className="ph-visual-3">
                            <div className="ph-avatar-stack">
                                <span style={{ background: "#003366" }}>O</span>
                                <span style={{ background: "#FFD700", color: "#1a1a1a" }}>C</span>
                                <span style={{ background: "#CC0000" }}>C</span>
                                <span style={{ background: "#003366" }}>A</span>
                            </div>
                            <span className="ph-visual-3-text-wrap">
                                {ALUMNI_TAGLINES.map((tagline, i) => (
                                    <span
                                        key={tagline}
                                        className="ph-visual-3-text"
                                        style={{ animationDelay: `${i * 3}s` }}
                                    >
                                        {tagline}
                                    </span>
                                ))}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ ANNOUNCEMENTS ============ */}
            {/* Latest 6 active announcements across every category, pinned
                first — the full, per-category breakdown lives on the
                dedicated /public-announcements page (reached via "View All"
                below or the header's Announcements dropdown). */}
            <section className="ph-section" id="announcements" ref={announcementsRef}>
                <Reveal>
                    <div className="ph-section-head">
                        <div>
                            <Title level={2} className="ph-section-title">
                                Latest Announcements
                            </Title>
                            <Paragraph className="ph-section-sub">
                                News, updates, and notices from the OCC Alumni Association.
                            </Paragraph>
                        </div>
                        <button className="ph-btn ph-btn-ghost" onClick={() => goToAnnouncements()}>
                            View All <RightOutlined />
                        </button>
                    </div>
                </Reveal>

                <Row gutter={[22, 22]}>
                    {announcementsLoading ? (
                        <Col span={24}>
                            <CardSkeletonGrid
                                variant="gallery"
                                count={3}
                                columns={{ xs: 24, sm: 12, lg: 8 }}
                                gutter={[22, 22]}
                            />
                        </Col>
                    ) : latestAnnouncements.length === 0 ? (
                        <Col span={24}>
                            <div className="ph-state-box">
                                <Empty description="No announcements posted yet. Check back soon!" />
                            </div>
                        </Col>
                    ) : (
                        latestAnnouncements.map((a, i) => {
                            const img =
                                buildImageUrl(a.images?.[0]) || buildImageUrl(a.image_urls?.[0]);
                            return (
                                <Col xs={24} sm={12} lg={8} key={a.id || i}>
                                    <Reveal
                                        className="ph-card"
                                        style={{ transitionDelay: `${i * 60}ms` }}
                                        onClick={() => goToAnnouncements(a.category)}
                                    >
                                        <div className="ph-card-icon-wrap">
                                            {a.pinned && (
                                                <span
                                                    style={{
                                                        position: "absolute",
                                                        top: 8,
                                                        left: 8,
                                                        fontSize: 12,
                                                        color: "#FFD700",
                                                        zIndex: 2,
                                                    }}
                                                >
                                                    <PushpinFilled />
                                                </span>
                                            )}
                                            {img ? (
                                                <img src={img} alt={a.title} />
                                            ) : (
                                                <NotificationOutlined />
                                            )}
                                        </div>
                                        <div className="ph-card-body">
                                            <Title level={5} className="ph-card-title">
                                                {a.title}
                                            </Title>
                                            <Paragraph className="ph-card-desc">
                                                {stripHtml(a.content) ||
                                                    "Tap Read More for the full announcement."}
                                            </Paragraph>
                                            <span className="ph-card-published">
                                                Published:{" "}
                                                {formatDate(a.publish_date || a.created_at)}
                                            </span>
                                            <div className="ph-card-foot">
                                                <span className="ph-card-date">
                                                    <NotificationOutlined />{" "}
                                                    {ANNOUNCEMENT_CATEGORIES.find(
                                                        (c) => c.value === (a.category || "general"),
                                                    )?.label || "General"}
                                                </span>
                                                <span className="ph-card-link">
                                                    Read More <ArrowRightOutlined />
                                                </span>
                                            </div>
                                        </div>
                                    </Reveal>
                                </Col>
                            );
                        })
                    )}
                </Row>
            </section>

            {/* ============ EVENTS ============ */}
            <section className="ph-section" id="events" ref={eventsRef}>
                <Reveal>
                    <div className="ph-section-head">
                        <div>
                            <Title level={2} className="ph-section-title">
                                Upcoming Events
                            </Title>
                            <Paragraph className="ph-section-sub">
                                Stay in the loop on reunions, seminars, and gatherings
                                hosted by the Alumni Association.
                            </Paragraph>
                        </div>
                        <button className="ph-btn ph-btn-ghost" onClick={goToEvents}>
                            View All <RightOutlined />
                        </button>
                    </div>
                </Reveal>

                <Row gutter={[22, 22]}>
                    {eventsLoading ? (
                        <Col span={24}>
                            <CardSkeletonGrid
                                variant="gallery"
                                count={4}
                                columns={{ xs: 24, sm: 12 }}
                                gutter={[22, 22]}
                            />
                        </Col>
                    ) : events.length === 0 ? (
                        <Col span={24}>
                            <div className="ph-state-box">
                                <Empty description="No events posted yet. Check back soon!" />
                            </div>
                        </Col>
                    ) : (
                        events.map((ev, i) => {
                            const img =
                                buildImageUrl(ev.image_urls?.[0]) ||
                                buildImageUrl(ev.image);
                            return (
                                <Col xs={24} sm={12} key={ev.id || i}>
                                    <Reveal
                                        className="ph-card"
                                        style={{ transitionDelay: `${i * 60}ms` }}
                                        onClick={goToEvents}
                                    >
                                        <div className="ph-card-icon-wrap">
                                            {img ? (
                                                <img src={img} alt={ev.title} />
                                            ) : (
                                                <SoundOutlined />
                                            )}
                                        </div>
                                        <div className="ph-card-body">
                                            <Title level={5} className="ph-card-title">
                                                {ev.title}
                                            </Title>
                                            <Paragraph className="ph-card-desc">
                                                {stripHtml(ev.description) ||
                                                    "Tap Read More for full event details."}
                                            </Paragraph>
                                            {ev.created_at && (
                                                <span className="ph-card-published">
                                                    Published: {formatDate(ev.created_at)}
                                                </span>
                                            )}
                                            <div className="ph-card-foot">
                                                <span className="ph-card-date">
                                                    <CalendarOutlined />
                                                    {formatDate(ev.date || ev.event_date)}
                                                </span>
                                                <span className="ph-card-link">
                                                    Read More <ArrowRightOutlined />
                                                </span>
                                            </div>
                                        </div>
                                    </Reveal>
                                </Col>
                            );
                        })
                    )}
                </Row>
            </section>

            {/* ============ GALLERY ============ */}
            <section className="ph-section" id="gallery" ref={galleryRef}>
                <Reveal>
                    <div className="ph-section-head">
                        <div>
                            <Title level={2} className="ph-section-title">
                                Moments That Matter
                            </Title>
                            <Paragraph className="ph-section-sub">
                                Relive the spirit of OCC through snapshots from alumni
                                events, campus life, and reunions.
                            </Paragraph>
                        </div>
                        <button className="ph-btn ph-btn-ghost" onClick={() => goTo("/public-gallery")}>
                            View Full Gallery <RightOutlined />
                        </button>
                    </div>
                </Reveal>

                {galleryLoading ? (
                    <CardSkeletonGrid
                        variant="gallery"
                        count={8}
                        containerClassName="ph-gallery-grid"
                    />
                ) : gallery.length === 0 ? (
                    <div className="ph-state-box">
                        <Empty description="No photos uploaded yet." />
                    </div>
                ) : (
                    <div className="ph-gallery-grid">
                        {gallery.map((g, i) => {
                            const images = getGalleryImageList(g).map((p) =>
                                buildImageUrl(p),
                            );
                            const img = images[0];
                            const extraCount = images.length - 1;
                            const publishedLabel = g.created_at
                                ? `Published: ${formatDate(g.created_at)}`
                                : "";
                            return (
                                <Reveal
                                    as="div"
                                    key={g.id || i}
                                    className="ph-gallery-item"
                                    style={{ transitionDelay: `${i * 50}ms` }}
                                    onClick={() =>
                                        img &&
                                        setLightboxItem({
                                            src: img,
                                            title: g.title,
                                            publishedLabel,
                                        })
                                    }
                                >
                                    {img ? (
                                        <img
                                            src={img}
                                            alt={g.title || "Gallery photo"}
                                            {...guardImageEvents}
                                        />
                                    ) : (
                                        <div className="ph-card-icon-wrap" style={{ width: "100%", height: "100%" }}>
                                            <PictureOutlined />
                                        </div>
                                    )}
                                    {extraCount > 0 && (
                                        <span className="ph-gallery-count-badge">
                                            {extraCount}+
                                        </span>
                                    )}
                                    <div className="ph-gallery-overlay">
                                        <span className="ph-gallery-overlay-title">
                                            {g.title || "Alumni memory"}
                                        </span>
                                        {publishedLabel && (
                                            <span className="ph-gallery-overlay-date">
                                                {publishedLabel}
                                            </span>
                                        )}
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ============ GALLERY LIGHTBOX ============ */}
            {lightboxItem && (
                <GalleryLightbox
                    item={lightboxItem}
                    onClose={() => setLightboxItem(null)}
                />
            )}

            {/* ============ JOB POSTS ============ */}
            <section className="ph-section" id="jobs" ref={jobsRef}>
                <Reveal>
                    <div className="ph-section-head">
                        <div>
                            <Title level={2} className="ph-section-title">
                                Career Opportunities
                            </Title>
                            <Paragraph className="ph-section-sub">
                                Explore job openings shared by the institution and its
                                partner companies for OCC graduates.
                            </Paragraph>
                        </div>
                        <button className="ph-btn ph-btn-ghost" onClick={() => goToJobPosts()}>
                            View All Jobs <RightOutlined />
                        </button>
                    </div>
                </Reveal>

                <Row gutter={[22, 22]}>
                    {jobsLoading ? (
                        <Col span={24}>
                            <CardSkeletonGrid
                                variant="gallery"
                                count={4}
                                columns={{ xs: 24, sm: 12 }}
                                gutter={[22, 22]}
                            />
                        </Col>
                    ) : jobs.length === 0 ? (
                        <Col span={24}>
                            <div className="ph-state-box">
                                <Empty description="No job postings available right now." />
                            </div>
                        </Col>
                    ) : (
                        jobs.map((job, i) => {
                            const img = buildImageUrl(job.banner_image || job.banner_image_url);
                            return (
                                <Col xs={24} sm={12} key={job.id || i}>
                                    <Reveal
                                        className="ph-card"
                                        style={{ transitionDelay: `${i * 60}ms` }}
                                        onClick={() => goToJobPosts(normalizeJobType(job.job_type))}
                                    >
                                        <div className="ph-card-icon-wrap">
                                            {img ? (
                                                <img src={img} alt={job.title} />
                                            ) : (
                                                <BankOutlined />
                                            )}
                                        </div>
                                        <div className="ph-card-body">
                                            <div className="ph-job-meta">
                                                {job.job_type && (
                                                    <span className="ph-chip">{job.job_type}</span>
                                                )}
                                                {job.location && (
                                                    <span className="ph-chip">
                                                        <EnvironmentOutlined /> {job.location}
                                                    </span>
                                                )}
                                            </div>
                                            <Title level={5} className="ph-card-title">
                                                {job.title}
                                            </Title>
                                            <Paragraph className="ph-card-desc">
                                                {job.company
                                                    ? `Hiring at ${job.company}`
                                                    : stripHtml(job.description)}
                                            </Paragraph>
                                            <div className="ph-card-foot">
                                                <span className="ph-card-date">
                                                    <SolutionOutlined />
                                                    Published: {formatDate(job.created_at)}
                                                </span>
                                                <span className="ph-card-link">
                                                    Read More <ArrowRightOutlined />
                                                </span>
                                            </div>
                                        </div>
                                    </Reveal>
                                </Col>
                            );
                        })
                    )}
                </Row>
            </section>

            {/* ============ COMING SOON: E-NEWSLETTER ============ */}
            <section className="ph-section">
                <Reveal as="div" className="ph-soon-card">
                    <span className="ph-soon-badge">
                        <span className="ph-soon-pulse" />
                        Launching Soon
                    </span>
                    <Title level={2} className="ph-soon-title">
                        Stay Connected — <span className="grad">E-Newsletter</span>
                    </Title>
                    <Paragraph className="ph-soon-sub">
                        We're putting the finishing touches on a new way to keep every
                        OCC alumnus in the loop: a regular E-Newsletter, launching soon
                        right here on the Alumni portal.
                    </Paragraph>
                    <div className="ph-soon-actions">
                        <button type="button" className="ph-btn ph-btn-ghost ph-btn-lg ph-soon-btn" disabled>
                            <MailOutlined /> E-Newsletter
                            <span className="ph-soon-chip">Soon</span>
                        </button>
                    </div>
                </Reveal>
            </section>

            {/* ============ CTA BANNER ============ */}
            <Reveal as="div" className="ph-cta-banner">
                <div className="ph-cta-content">
                    <Title level={2} className="ph-cta-title">
                        Ready to reconnect with OCC?
                    </Title>
                    <Paragraph className="ph-cta-sub">
                        Create your Alumni account to  register
                        for events, apply to job posts, and stay connected with the
                        community you grew up with.
                    </Paragraph>
                    <div className="ph-cta-actions">
                        <button className="ph-btn ph-btn-white ph-btn-lg" onClick={goRegister}>
                            Create Account <ArrowRightOutlined />
                        </button>
                        <button className="ph-btn ph-btn-outline-white ph-btn-lg" onClick={goLogin}>
                            Sign In
                        </button>
                    </div>
                </div>
            </Reveal>

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
                            <button onClick={scrollToTop}>Home</button>
                            <button onClick={() => scrollToRef(announcementsRef)}>Announcements</button>
                            <button onClick={() => scrollToRef(eventsRef)}>Events</button>
                            <button onClick={() => scrollToRef(galleryRef)}>Gallery</button>
                            <button onClick={() => scrollToRef(jobsRef)}>Job Posts</button>
                            <button onClick={() => goTo("/public-about")}>About</button>
                            <button onClick={() => goTo("/public-faq")}>FAQs</button>
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

export default PublicHomePage;