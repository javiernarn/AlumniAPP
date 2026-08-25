"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "~/utils/axiosConfig";
import { BASE_URL } from "~/utils/constant";
import { Layout } from "~/components";
import avatarGuidance from "~/assets/images/avatar_guidance.png";
import secureLocalStorage from "react-secure-storage";
import "./AdminAlumniMessages.css";
import useEmployeeStatus from "~/hooks/useEmployeeStatus";
import useCourses from "~/hooks/useCourses";
import AlumniDetails from "~/components/alumni/AlumniDetails";
import { message, Skeleton } from "antd";

const AdminAlumniMessages = () => {
    // Common state
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [longPressedMessageId, setLongPressedMessageId] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const imageInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const [sendToEmail, setSendToEmail] = useState(false);

    // Message action modal states (delete/edit like Messenger)
    const [showMessageActionModal, setShowMessageActionModal] = useState(false);
    const [actionMessageData, setActionMessageData] = useState(null);
    const [deleteMessageLoading, setDeleteMessageLoading] = useState(false);

    // Inline edit states (NEW - Messenger style)
    const [inlineEditMessageId, setInlineEditMessageId] = useState(null);
    const [inlineEditText, setInlineEditText] = useState("");
    const [inlineEditLoading, setInlineEditLoading] = useState(false);
    const inlineEditRef = useRef(null);

    // Delete confirmation modal state (NEW - Professional black theme)
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);

    // Timer for edit eligibility (force re-render every minute)
    const [, setTick] = useState(0);

    const EMOJI_REACTIONS = ["😍", "😂", "😮", "😢", "👍", "❤️"];

    // Edit time limit: 3 minutes in milliseconds
    const EDIT_TIME_LIMIT = 3 * 60 * 1000;

    // Role-based state
    const storedRole = secureLocalStorage.getItem("userRole");
    const isAdmin = storedRole === "admin";

    // Alumni-specific state
    const [isRestricted, setIsRestricted] = useState(false);
    const [alumniUnreadCount, setAlumniUnreadCount] = useState(0);
    const [alumniInfo, setAlumniInfo] = useState(null);

    // Admin-specific state
    const [allAlumni, setAllAlumni] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [activeTab, setActiveTab] = useState("alumni");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAlumniDetailsModal, setShowAlumniDetailsModal] = useState(false);
    const [alumniPreviewData, setAlumniPreviewData] = useState(null);
    const [alumniDetailsLoading, setAlumniDetailsLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);

    // Modal states for delete and restrict
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestrictModal, setShowRestrictModal] = useState(false);
    const [pendingDeleteAlumniId, setPendingDeleteAlumniId] = useState(null);
    const [pendingRestrictAlumni, setPendingRestrictAlumni] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // ==========================================================================
    // ENHANCEMENTS (additive — none of the existing logic above is modified)
    // ==========================================================================

    // --- Storage keys ---
    const ALUMNI_MESSAGE_DRAFT_KEY = "admin-alumni-message-draft";
    const ARCHIVED_CONVERSATIONS_KEY = "admin-archived-conversations";

    // --- Draft auto-save state ---
    const [draftRestorePrompt, setDraftRestorePrompt] = useState(null); // { alumniId, draft }
    const draftSaveTimerRef = useRef(null);
    const suspendDraftSaveRef = useRef(false);

    // --- Conversation switch protection ---
    const [pendingSwitch, setPendingSwitch] = useState(null); // { alumni_id, data }

    // --- Message search ---
    const [searchPanelOpen, setSearchPanelOpen] = useState(false);
    const [msgSearchQuery, setMsgSearchQuery] = useState("");
    const [searchResultIds, setSearchResultIds] = useState([]);
    const [searchActiveIndex, setSearchActiveIndex] = useState(0);

    // --- Archive system ---
    const [archivedIds, setArchivedIds] = useState([]);
    const [archivePrompt, setArchivePrompt] = useState(null); // alumni_id

    // --- Send confirmation ---
    const [sendConfirm, setSendConfirm] = useState(null); // { ts }

    // --- Typing indicator ---
    const [adminTyping, setAdminTyping] = useState(false);
    const typingTimerRef = useRef(null);

    // --- Bulk actions ---
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
    const [bulkConfirm, setBulkConfirm] = useState(null); // { action, count }
    const [bulkLoading, setBulkLoading] = useState(false);

    // --- Message recovery protection ---
    const [recoveryConfirm, setRecoveryConfirm] = useState(null); // { type, preview, count, alumniId }

    // ---------------------------------------------------------------------------
    // DRAFT AUTO-SAVE HELPERS
    // ---------------------------------------------------------------------------
    const draftKeyFor = (alumniId) => `${ALUMNI_MESSAGE_DRAFT_KEY}-${alumniId}`;

    const dataURLtoFile = (dataUrl, fileName) => {
        try {
            const arr = dataUrl.split(",");
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : "image/png";
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            return new File([u8arr], fileName || "draft-image.png", {
                type: mime,
            });
        } catch (err) {
            console.error("Failed to rebuild draft image:", err);
            return null;
        }
    };

    const draftHasContent = (text, preview, email) =>
        Boolean((text && text.trim()) || preview || email);

    const persistMessageDraft = (
        alumniId,
        { text, imagePreview: preview, sendToEmail: email },
    ) => {
        try {
            if (!alumniId) return;
            if (!draftHasContent(text, preview, email)) {
                secureLocalStorage.removeItem(draftKeyFor(alumniId));
                return;
            }
            secureLocalStorage.setItem(draftKeyFor(alumniId), {
                text: text || "",
                imagePreview: preview || null,
                sendToEmail: !!email,
                savedAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error("Failed to save message draft:", err);
        }
    };

    const loadMessageDraft = (alumniId) => {
        try {
            return alumniId
                ? secureLocalStorage.getItem(draftKeyFor(alumniId))
                : null;
        } catch (err) {
            console.error("Failed to load message draft:", err);
            return null;
        }
    };

    const clearMessageDraft = (alumniId) => {
        try {
            if (alumniId) secureLocalStorage.removeItem(draftKeyFor(alumniId));
        } catch (err) {
            console.error("Failed to clear message draft:", err);
        }
    };

    useEffect(() => {
        const setVH = () => {
            const h = window.visualViewport?.height ?? window.innerHeight;
            document.documentElement.style.setProperty("--app-vh", `${h}px`);
        };
        setVH();
        window.visualViewport?.addEventListener("resize", setVH);
        window.visualViewport?.addEventListener("scroll", setVH);
        window.addEventListener("orientationchange", setVH);
        window.addEventListener("resize", setVH);
        return () => {
            window.visualViewport?.removeEventListener("resize", setVH);
            window.visualViewport?.removeEventListener("scroll", setVH);
            window.removeEventListener("orientationchange", setVH);
            window.removeEventListener("resize", setVH);
        };
    }, []);

    // Debounced auto-save whenever the composer changes for the active conversation.
    useEffect(() => {
        if (!isAdmin || !selectedConversation) return;
        if (suspendDraftSaveRef.current) return;
        if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = setTimeout(() => {
            persistMessageDraft(selectedConversation.alumni_id, {
                text: newMessage,
                imagePreview,
                sendToEmail,
            });
        }, 600);
        return () => {
            if (draftSaveTimerRef.current)
                clearTimeout(draftSaveTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newMessage, imagePreview, sendToEmail, selectedConversation, isAdmin]);

    const hasUnsentChanges = () =>
        draftHasContent(newMessage, imagePreview, sendToEmail);

    const continueDraft = () => {
        if (!draftRestorePrompt) return;
        const { draft } = draftRestorePrompt;
        suspendDraftSaveRef.current = true;
        setNewMessage(draft.text || "");
        setSendToEmail(!!draft.sendToEmail);
        if (draft.imagePreview) {
            setImagePreview(draft.imagePreview);
            const file = dataURLtoFile(draft.imagePreview, "draft-image.png");
            if (file) setSelectedImage(file);
        }
        setDraftRestorePrompt(null);
        setTimeout(() => {
            suspendDraftSaveRef.current = false;
        }, 50);
    };

    const discardDraft = () => {
        if (!draftRestorePrompt) return;
        clearMessageDraft(draftRestorePrompt.alumniId);
        setDraftRestorePrompt(null);
        suspendDraftSaveRef.current = false;
    };

    // ---------------------------------------------------------------------------
    // CONVERSATION SWITCH PROTECTION
    // ---------------------------------------------------------------------------
    const applyConversationSelection = (alumniData) => {
        setSelectedConversation({
            alumni_id: alumniData.alumni_id,
            alumni_name: alumniData.alumni_name,
            alumni_email: alumniData.alumni_email,
            alumni_avatar: alumniData.alumni_avatar,
            is_restricted: alumniData.is_restricted,
        });
        setOpenDropdown(null);
    };

    const performConversationSwitch = (alumniData) => {
        suspendDraftSaveRef.current = true;
        setNewMessage("");
        setSendToEmail(false);
        clearImagePreview();
        setSearchPanelOpen(false);
        setMsgSearchQuery("");
        setSearchResultIds([]);
        setAdminTyping(false);
        applyConversationSelection(alumniData);

        const existingDraft = loadMessageDraft(alumniData.alumni_id);
        if (
            existingDraft &&
            draftHasContent(
                existingDraft.text,
                existingDraft.imagePreview,
                existingDraft.sendToEmail,
            )
        ) {
            setDraftRestorePrompt({
                alumniId: alumniData.alumni_id,
                draft: existingDraft,
            });
        } else {
            setTimeout(() => {
                suspendDraftSaveRef.current = false;
            }, 50);
        }
    };

    const confirmSwitchContinueEditing = () => setPendingSwitch(null);

    const confirmSwitchSaveDraft = () => {
        if (selectedConversation) {
            persistMessageDraft(selectedConversation.alumni_id, {
                text: newMessage,
                imagePreview,
                sendToEmail,
            });
        }
        const next = pendingSwitch;
        setPendingSwitch(null);
        if (next) performConversationSwitch(next.data);
    };

    const confirmSwitchDiscard = () => {
        if (selectedConversation)
            clearMessageDraft(selectedConversation.alumni_id);
        const next = pendingSwitch;
        setPendingSwitch(null);
        if (next) performConversationSwitch(next.data);
    };

    // ---------------------------------------------------------------------------
    // MESSAGE SEARCH
    // ---------------------------------------------------------------------------
    const scrollToMessageId = (id) => {
        const el = document.getElementById(`admin-msg-${id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    useEffect(() => {
        if (!searchPanelOpen) return;
        const q = msgSearchQuery.trim().toLowerCase();
        if (!q) {
            setSearchResultIds([]);
            setSearchActiveIndex(0);
            return;
        }
        const ids = messages
            .filter((m) => (m.message || "").toLowerCase().includes(q))
            .map((m) => m.id);
        setSearchResultIds(ids);
        setSearchActiveIndex(0);
        if (ids.length > 0) setTimeout(() => scrollToMessageId(ids[0]), 50);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [msgSearchQuery, searchPanelOpen, messages]);

    const gotoSearchResult = (dir) => {
        if (searchResultIds.length === 0) return;
        let next = searchActiveIndex + dir;
        if (next < 0) next = searchResultIds.length - 1;
        if (next >= searchResultIds.length) next = 0;
        setSearchActiveIndex(next);
        scrollToMessageId(searchResultIds[next]);
    };

    const toggleSearchPanel = () => {
        setSearchPanelOpen((open) => {
            const nextOpen = !open;
            if (!nextOpen) {
                setMsgSearchQuery("");
                setSearchResultIds([]);
                setSearchActiveIndex(0);
            }
            return nextOpen;
        });
    };

    const activeSearchId =
        searchResultIds.length > 0 ? searchResultIds[searchActiveIndex] : null;

    const highlightMatch = (text) => {
        const q = msgSearchQuery.trim();
        if (!searchPanelOpen || !q || !text) return text;
        try {
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const parts = text.split(new RegExp(`(${escaped})`, "gi"));
            return parts.map((part, i) =>
                part.toLowerCase() === q.toLowerCase() ? (
                    <mark key={i} className="msg-search-highlight">
                        {part}
                    </mark>
                ) : (
                    part
                ),
            );
        } catch {
            return text;
        }
    };

    // ---------------------------------------------------------------------------
    // ARCHIVE SYSTEM
    // ---------------------------------------------------------------------------
    useEffect(() => {
        try {
            const stored = secureLocalStorage.getItem(
                ARCHIVED_CONVERSATIONS_KEY,
            );
            if (Array.isArray(stored)) setArchivedIds(stored);
        } catch (err) {
            console.error("Failed to load archived conversations:", err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const persistArchived = (ids) => {
        try {
            secureLocalStorage.setItem(ARCHIVED_CONVERSATIONS_KEY, ids);
        } catch (err) {
            console.error("Failed to persist archived conversations:", err);
        }
    };

    const isArchived = (alumniId) => archivedIds.includes(alumniId);

    const archiveConversation = (alumniId) => {
        setArchivedIds((prev) => {
            if (prev.includes(alumniId)) return prev;
            const next = [...prev, alumniId];
            persistArchived(next);
            return next;
        });
    };

    const unarchiveConversation = (alumniId) => {
        setArchivedIds((prev) => {
            const next = prev.filter((id) => id !== alumniId);
            persistArchived(next);
            return next;
        });
    };

    const confirmArchive = () => {
        if (archivePrompt == null) return;
        archiveConversation(archivePrompt);
        message.success("Conversation archived");
        if (selectedConversation?.alumni_id === archivePrompt) {
            setSelectedConversation(null);
            setMessages([]);
        }
        setArchivePrompt(null);
    };

    // ---------------------------------------------------------------------------
    // TYPING INDICATOR (debounced)
    // ---------------------------------------------------------------------------
    const handleAdminTyping = () => {
        if (!isAdmin || !selectedConversation) return;
        if (!adminTyping) setAdminTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setAdminTyping(false), 1000);
    };

    useEffect(() => {
        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
    }, []);

    // ---------------------------------------------------------------------------
    // SEND CONFIRMATION (only for messages containing an image attachment)
    // ---------------------------------------------------------------------------
    const requestSendAdminMessage = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !selectedConversation)
            return;
        if (selectedImage) {
            setSendConfirm({ ts: Date.now() });
            return;
        }
        sendAdminMessage(e || { preventDefault: () => {} });
    };

    const confirmSendNow = () => {
        setSendConfirm(null);
        sendAdminMessage({ preventDefault: () => {} });
    };

    // ---------------------------------------------------------------------------
    // BULK CONVERSATION ACTIONS
    // ---------------------------------------------------------------------------
    const toggleBulkMode = () => {
        setBulkMode((m) => !m);
        setBulkSelectedIds([]);
    };

    const toggleBulkSelect = (alumniId) => {
        setBulkSelectedIds((prev) =>
            prev.includes(alumniId)
                ? prev.filter((id) => id !== alumniId)
                : [...prev, alumniId],
        );
    };

    const requestBulkAction = (action) => {
        if (bulkSelectedIds.length === 0) {
            message.info("Select at least one conversation");
            return;
        }
        setBulkConfirm({ action, count: bulkSelectedIds.length });
    };

    const executeBulkAction = async () => {
        if (!bulkConfirm) return;
        const { action } = bulkConfirm;
        const ids = [...bulkSelectedIds];
        setBulkLoading(true);
        try {
            if (action === "archive") {
                const next = Array.from(new Set([...archivedIds, ...ids]));
                setArchivedIds(next);
                persistArchived(next);
                message.success(`Archived ${ids.length} conversation(s)`);
            } else if (action === "delete") {
                await Promise.all(
                    ids.map((id) =>
                        axios
                            .delete(`/admin/messages/conversation/${id}`)
                            .catch((err) => err),
                    ),
                );
                setConversations((prev) =>
                    prev.filter((c) => !ids.includes(c.alumni_id)),
                );
                setAllAlumni((prev) =>
                    prev.map((a) =>
                        ids.includes(a.alumni_id)
                            ? {
                                  ...a,
                                  has_conversation: false,
                                  last_message: null,
                                  unread_count: 0,
                              }
                            : a,
                    ),
                );
                ids.forEach((id) => clearMessageDraft(id));
                if (
                    selectedConversation &&
                    ids.includes(selectedConversation.alumni_id)
                ) {
                    setSelectedConversation(null);
                    setMessages([]);
                }
                message.success(`Deleted ${ids.length} conversation(s)`);
            } else if (action === "restrict") {
                await Promise.all(
                    ids.map((id) =>
                        axios
                            .post(`/admin/messages/restrict/${id}`, {
                                restrict: true,
                            })
                            .catch((err) => err),
                    ),
                );
                setConversations((prev) =>
                    prev.map((c) =>
                        ids.includes(c.alumni_id)
                            ? { ...c, is_restricted: true }
                            : c,
                    ),
                );
                setAllAlumni((prev) =>
                    prev.map((a) =>
                        ids.includes(a.alumni_id)
                            ? { ...a, is_restricted: true }
                            : a,
                    ),
                );
                message.success(`Restricted ${ids.length} alumni`);
            } else if (action === "read") {
                await Promise.all(
                    ids.map((id) =>
                        axios
                            .post(`/admin/messages/${id}/mark-read`)
                            .catch((err) => err),
                    ),
                );
                setConversations((prev) =>
                    prev.map((c) =>
                        ids.includes(c.alumni_id)
                            ? { ...c, unread_count: 0 }
                            : c,
                    ),
                );
                setAllAlumni((prev) =>
                    prev.map((a) =>
                        ids.includes(a.alumni_id)
                            ? { ...a, unread_count: 0 }
                            : a,
                    ),
                );
                message.success(`Marked ${ids.length} conversation(s) as read`);
            }
        } catch (err) {
            console.error("Bulk action failed:", err);
            message.error("Some actions could not be completed");
        } finally {
            setBulkLoading(false);
            setBulkConfirm(null);
            setBulkSelectedIds([]);
            setBulkMode(false);
            fetchConversations();
            fetchAllAlumni();
        }
    };

    const bulkActionLabel = (action) => {
        switch (action) {
            case "delete":
                return "delete";
            case "restrict":
                return "restrict";
            case "read":
                return "mark as read";
            case "archive":
                return "archive";
            default:
                return action;
        }
    };

    // ---------------------------------------------------------------------------
    // READ RECEIPT HELPER
    // ---------------------------------------------------------------------------
    const formatReadReceipt = (msg) => {
        if (msg.isOptimistic) return "Sending…";
        if (!msg.is_read) return "Delivered";
        const ts = msg.read_at || msg.seen_at || msg.updated_at;
        if (!ts) return "Seen";
        try {
            const d = new Date(ts);
            return `Seen ${d.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })}`;
        } catch {
            return "Seen";
        }
    };

    const { data: employeeStatuses } = useEmployeeStatus();
    const { data: coursesData } = useCourses();

    const COURSE_MAP = [
        { id: 1, code: "BSIT" },
        { id: 2, code: "BSEd" },
        { id: 3, code: "BEED" },
        { id: 4, code: "BSBA" },
    ];

    // Admin info for alumni view
    const adminInfo = {
        name: "Ms. Annabelle Verula (Guidance Counselor)",
        email: "occ.verula.annabelle@gmail.com",
        avatar: avatarGuidance,
    };

    // ============================
    // HELPER: Check if message can be edited (within 3 minutes)
    // ============================
    const canEditMessage = useCallback((msg) => {
        if (!msg.created_at) return false;
        const createdAt = new Date(msg.created_at).getTime();
        const now = Date.now();
        return now - createdAt < EDIT_TIME_LIMIT;
    }, []);

    // ============================
    // HELPER: Check if edit indicator should be shown (within 3 minutes)
    // ============================
    const shouldShowEditIndicator = useCallback((msg) => {
        if (!msg.is_edited) return false;
        if (!msg.updated_at && !msg.created_at) return false;
        const editedAt = new Date(msg.updated_at || msg.created_at).getTime();
        const now = Date.now();
        return now - editedAt < EDIT_TIME_LIMIT;
    }, []);

    // ============================
    // Timer to force re-render for edit time limit
    // ============================
    useEffect(() => {
        const interval = setInterval(() => {
            setTick((t) => t + 1);
        }, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // ============================
    // HELPER FUNCTION TO GET IMAGE URL
    // ============================

    const downloadImage = async (imagePath) => {
        if (!imagePath) return;

        // imagePath from the lightbox is already a fully-resolved URL.
        // For raw storage paths passed from other call sites, resolve first.
        const imageUrl =
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://") ||
            imagePath.startsWith("blob:") ||
            imagePath.startsWith("data:")
                ? imagePath
                : getImageUrl(imagePath);

        if (!imageUrl) return;

        // Derive a sensible filename (strip query strings).
        const rawName =
            imageUrl.split("?")[0].split("/").pop() || "alumni-image";
        const fileName = decodeURIComponent(rawName) || "alumni-image";

        try {
            // Fetch as blob so the browser honours the `download` attribute
            // regardless of cross-origin restrictions. Credentials are included
            // so Laravel auth middleware allows the request.
            const response = await fetch(imageUrl, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Release the object URL after the download dialog fires.
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
        } catch (err) {
            console.error("Image download failed:", err);
            // Fallback: open in a new tab so the user can save manually.
            window.open(imageUrl, "_blank", "noopener,noreferrer");
            message.warning(
                "Could not download directly — opening in a new tab instead.",
            );
        }
    };

    // ============================
    // HELPER FUNCTION FOR IMAGE URL
    // ============================

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;

        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://") ||
            imagePath.startsWith("blob:") ||
            imagePath.startsWith("data:")
        ) {
            return imagePath;
        }

        const cleanPath = imagePath
            .replace(/^public\//, "")
            .replace(/^storage\//, "")
            .replace(/^\/+/, "");

        return `${BASE_URL}storage/${cleanPath}`;
    };

    const getEmploymentStatusLabel = useCallback(
        (statusId) => {
            if (!employeeStatuses) return "N/A";
            const status = employeeStatuses.find((s) => s.id === statusId);
            return status ? status.status_name : "N/A";
        },
        [employeeStatuses],
    );

    // NEW: classify employment label → color modifier class
    // employed = green, underemployed = orange, unemployed = red
    const getEmploymentClass = useCallback(
        (statusId) => {
            const label = (getEmploymentStatusLabel(statusId) || "")
                .toString()
                .toLowerCase();
            if (!label || label === "n/a") return "";
            if (label.includes("under")) return "employment-under";
            if (
                label.includes("unemp") ||
                label.includes("not employed") ||
                label.includes("jobless")
            )
                return "employment-unemp";
            if (
                label.includes("emp") ||
                label.includes("self") ||
                label.includes("freelanc") ||
                label.includes("work")
            )
                return "employment-emp";
            return "";
        },
        [getEmploymentStatusLabel],
    );

    const getCourseCode = useCallback((courseId) => {
        if (!courseId) return "N/A";
        const course = COURSE_MAP.find((c) => c.id === courseId);
        return course ? course.code : courseId;
    }, []);

    const getCourseName = useCallback(
        (courseCode) => {
            if (!coursesData || !courseCode) return courseCode || "N/A";
            const course = coursesData.find((c) => c.code === courseCode);
            return course ? course.name : courseCode;
        },
        [coursesData],
    );

    const getCourseColor = useCallback((courseCode) => {
        const colorMap = {
            BSIT: "#f5222d",
            BSEd: "#1890ff",
            BEED: "#1890ff",
            BSBA: "#faad14",
        };
        return colorMap[courseCode] || "#1890ff";
    }, []);

    // ============================
    // ALUMNI FUNCTIONS
    // ============================

    const fetchAlumniMessages = useCallback(async (silent = false) => {
        try {
            setError(null);
            const response = await axios.get("/alumni/messages", {
                suppressGenericModal: true, // the catch block below shows a specific message instead
            });

            if (response.data.success) {
                const messagesData = response.data.messages || [];
                setMessages(messagesData);
                setIsRestricted(response.data.is_restricted || false);
                setAlumniInfo(response.data.alumni_info || null);

                const reactionsMap = {};
                messagesData.forEach((msg) => {
                    if (msg.reactions && msg.reactions.length > 0) {
                        reactionsMap[msg.id] = msg.reactions.map(
                            (r) => r.emoji || r,
                        );
                    }
                });
                setMessageReactions(reactionsMap);

                await axios.post("/alumni/messages/mark-read");
                setAlumniUnreadCount(0);

                setTimeout(() => scrollToBottom(), 0);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            if (!silent) setError("Failed to load messages. Please try again.");
        } finally {
            setInitialLoading(false);
        }
    }, []);

    const fetchAlumniUnreadCount = useCallback(async (silent = false) => {
        try {
            const response = await axios.get("/alumni/messages/unread-count", {
                suppressGenericModal: true,
            });
            if (response.data.success) {
                setAlumniUnreadCount(response.data.unread_count || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, []);

    const sendAlumniMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || isRestricted || sending)
            return;

        const messageText = newMessage.trim();
        setNewMessage("");
        clearImagePreview();
        setSending(true);

        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            message: messageText,
            image_path: imagePreview,
            sender_type: "alumni",
            sender_id: alumniInfo?.id,
            created_at: new Date().toISOString(),
            is_read: false,
            isOptimistic: true,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom(), 0);

        try {
            const formData = new FormData();
            formData.append("message", messageText);
            if (selectedImage) formData.append("image", selectedImage);

            const response = await axios.post(
                "/alumni/messages/send",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );

            if (response.data.success) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === optimisticMessage.id
                            ? {
                                  ...response.data.data,
                                  sender_type:
                                      response.data.data.sender_type ||
                                      "alumni",
                              }
                            : msg,
                    ),
                );
                message.success("Message sent successfully");
            } else {
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== optimisticMessage.id),
                );
                setNewMessage(messageText);
                setError(response.data.message || "Failed to send message");
                message.error(
                    response.data.message || "Failed to send message",
                );
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) =>
                prev.filter((msg) => msg.id !== optimisticMessage.id),
            );
            setNewMessage(messageText);

            if (error.response?.status === 403) {
                setError("You are restricted from sending messages.");
                setIsRestricted(true);
                message.error("You are restricted from sending messages.");
            } else {
                setError("Failed to send message. Please try again.");
                message.error("Failed to send message. Please try again.");
            }
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // ============================
    // ADMIN FUNCTIONS
    // ============================

    const fetchAllAlumni = useCallback(async (silent = false) => {
        try {
            const response = await axios.get("/admin/alumni/all", {
                params: { search: searchQuery },
                suppressGenericModal: true, // the catch block below shows a specific toast instead
            });
            if (response.data.success) {
                // Rejected alumni accounts should not appear in the All Alumni list.
                const activeAlumni = (response.data.data || []).filter(
                    (a) => a.status !== "rejected",
                );
                setAllAlumni(activeAlumni);
            }
        } catch (error) {
            console.error("Failed to fetch alumni:", error);
            if (!silent) message.error("Failed to fetch alumni list");
        }
    }, [searchQuery]);

    const fetchConversations = useCallback(async (silent = false) => {
        try {
            const response = await axios.get("/admin/conversations", {
                params: { search: searchQuery },
                suppressGenericModal: true, // the catch block below shows a specific toast instead
            });

            if (response.data.success) {
                setConversations(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            if (!silent) message.error("Failed to fetch conversations");
        }
    }, [searchQuery]);

    const fetchAdminMessages = useCallback(async (alumniId, silent = false) => {
        try {
            if (!silent) setLoading(true);

            const response = await axios.get(`/admin/messages/${alumniId}`, {
                suppressGenericModal: true, // the catch block below shows a specific toast instead
            });

            if (response.data.success) {
                const messagesData = response.data.data || [];
                const sortedMessages = Array.isArray(messagesData)
                    ? messagesData.sort(
                          (a, b) =>
                              new Date(a.created_at) - new Date(b.created_at),
                      )
                    : [];

                setMessages((prev) => {
                    if (prev.length === 0) return sortedMessages;

                    const lastPrevId = prev[prev.length - 1]?.id;
                    const lastNewId =
                        sortedMessages[sortedMessages.length - 1]?.id;

                    if (lastPrevId === lastNewId) return prev;

                    return sortedMessages;
                });

                const reactionsMap = {};
                sortedMessages.forEach((msg) => {
                    if (msg.reactions && msg.reactions.length > 0) {
                        reactionsMap[msg.id] = msg.reactions.map(
                            (r) => r.emoji || r,
                        );
                    }
                });
                setMessageReactions(reactionsMap);

                if (response.data.alumni_info) {
                    setAlumniInfo(response.data.alumni_info);
                }

                await axios.post(`/admin/messages/${alumniId}/mark-read`);

                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.alumni_id === alumniId
                            ? { ...conv, unread_count: 0 }
                            : conv,
                    ),
                );

                setAllAlumni((prev) =>
                    prev.map((alum) =>
                        alum.alumni_id === alumniId
                            ? { ...alum, unread_count: 0 }
                            : alum,
                    ),
                );

                if (!silent) {
                    setTimeout(() => scrollToBottom(), 0);
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            if (!silent) {
                setMessages([]);
                message.error("Failed to fetch messages");
            }
        } finally {
            if (!silent) setLoading(false);
            setInitialLoading(false);
        }
    }, []);

    const sendAdminMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !selectedConversation)
            return;

        try {
            setSending(true);
            const formData = new FormData();
            formData.append("alumni_id", selectedConversation.alumni_id);
            formData.append("message", newMessage.trim());
            if (selectedImage) formData.append("image", selectedImage);
            formData.append("send_to_email", sendToEmail ? "1" : "0");

            const response = await axios.post(
                "/admin/messages/send",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    // Image uploads carry real file bytes over the wire on
                    // top of server-side processing (re-encoding, storage,
                    // optional email dispatch) — the default 15s API
                    // timeout is tuned for small JSON calls and was firing
                    // false-positive "timed out" errors on slower
                    // connections even when the message went through fine
                    // moments later. Give attachments more breathing room.
                    timeout: selectedImage ? 60000 : 15000,
                    // The catch block below already shows a specific,
                    // situation-aware message (and recovers gracefully on
                    // timeout) — suppress the generic global modal so the
                    // admin doesn't see two different error popups for the
                    // same failed send. Unlike `silent`, this still lets a
                    // 401 (session expired) redirect to login normally.
                    suppressGenericModal: true,
                },
            );

            if (response.data.success) {
                setMessages((prev) => [...prev, response.data.data]);
                setNewMessage("");
                setSendToEmail(false);
                clearImagePreview();
                if (selectedConversation)
                    clearMessageDraft(selectedConversation.alumni_id); // draft cleanup after send
                setAdminTyping(false); // clear typing indicator after send
                fetchConversations();
                fetchAllAlumni();
                setTimeout(() => scrollToBottom(), 0);
                message.success("Message sent successfully");
            } else {
                message.error(
                    response.data.message || "Failed to send message",
                );
            }
        } catch (error) {
            console.error("Failed to send message:", error);

            if (error.code === "ECONNABORTED") {
                // The client gave up waiting, but the server may well
                // still be processing (or may have already finished) —
                // don't tell the admin it "failed" and invite a
                // duplicate resend. Re-sync the thread shortly after so
                // the message appears on its own once it lands.
                message.warning(
                    "That's taking longer than expected — it may still go through. Checking for it now...",
                );
                clearImagePreview();
                setNewMessage("");
                if (selectedConversation) {
                    setTimeout(() => {
                        fetchAdminMessages(selectedConversation.alumni_id);
                        fetchConversations();
                    }, 5000);
                }
            } else {
                message.error("Failed to send message");
            }
        } finally {
            setSending(false);
        }
    };

    // Open restrict modal
    const openRestrictModal = (alumni) => {
        if (!alumni) return;

        // The conversation list & header pass a "conversation" object that often
        // doesn't carry course_id / employment_status_id. The All Alumni list
        // passes a full alumni row. Merge the two so the modal always has the
        // complete profile, regardless of where it was opened from.
        const fullAlumni =
            (Array.isArray(allAlumni) &&
                allAlumni.find((a) => a.alumni_id === alumni.alumni_id)) ||
            null;

        const merged = {
            ...(fullAlumni || {}),
            ...alumni, // keep live fields from caller (e.g. is_restricted just toggled)
            alumni_id: alumni.alumni_id ?? fullAlumni?.alumni_id,
            alumni_name:
                alumni.alumni_name ||
                fullAlumni?.alumni_name ||
                alumni.name ||
                fullAlumni?.name,
            course_id: alumni.course_id ?? fullAlumni?.course_id,
            employment_status_id:
                alumni.employment_status_id ?? fullAlumni?.employment_status_id,
            // Preserve any alternate field names the API might return
            course: alumni.course ?? fullAlumni?.course,
            course_name: alumni.course_name ?? fullAlumni?.course_name,
            courseName: alumni.courseName ?? fullAlumni?.courseName,
            employment_status:
                alumni.employment_status ?? fullAlumni?.employment_status,
            employmentStatus:
                alumni.employmentStatus ?? fullAlumni?.employmentStatus,
            employment: alumni.employment ?? fullAlumni?.employment,
        };

        // TEMP debug — remove once verified
        // console.log("Selected Alumni (restrict modal):", {
        //   fromCaller: alumni,
        //   fromAllAlumni: fullAlumni,
        //   merged,
        // })

        setPendingRestrictAlumni(merged);
        setShowRestrictModal(true);
    };

    // Confirm restrict action
    const confirmRestrictAlumni = async () => {
        if (!pendingRestrictAlumni) return;

        const alumniId = pendingRestrictAlumni.alumni_id;
        const newRestrictedState = !pendingRestrictAlumni.is_restricted;

        try {
            setModalLoading(true);
            const response = await axios.post(
                `/admin/messages/restrict/${alumniId}`,
                {
                    restrict: newRestrictedState,
                },
            );

            if (response.data.success) {
                message.success(
                    newRestrictedState
                        ? "Alumni has been restricted from messaging"
                        : "Alumni restriction has been removed",
                );

                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.alumni_id === alumniId
                            ? { ...conv, is_restricted: newRestrictedState }
                            : conv,
                    ),
                );
                setAllAlumni((prev) =>
                    prev.map((alum) =>
                        alum.alumni_id === alumniId
                            ? { ...alum, is_restricted: newRestrictedState }
                            : alum,
                    ),
                );
                if (selectedConversation?.alumni_id === alumniId) {
                    setSelectedConversation((prev) => ({
                        ...prev,
                        is_restricted: newRestrictedState,
                    }));
                }
            } else {
                message.error(
                    response.data.message || "Failed to update restriction",
                );
            }
        } catch (error) {
            console.error("Failed to restrict alumni:", error);
            message.error("Failed to update restriction");
        } finally {
            setModalLoading(false);
            setShowRestrictModal(false);
            setPendingRestrictAlumni(null);
        }
    };

    // Open delete modal
    const openDeleteModal = (alumniId) => {
        setPendingDeleteAlumniId(alumniId);
        setRecoveryConfirm(null); // reset recovery acknowledgement
        setShowDeleteModal(true);
    };

    // Confirm delete action
    const confirmDeleteConversation = async () => {
        if (!pendingDeleteAlumniId) return;

        try {
            setModalLoading(true);
            const response = await axios.delete(
                `/admin/messages/conversation/${pendingDeleteAlumniId}`,
            );
            if (response.data.success) {
                message.success("Conversation deleted successfully");
                clearMessageDraft(pendingDeleteAlumniId); // draft cleanup after deletion
                unarchiveConversation(pendingDeleteAlumniId); // remove from archive if present
                setConversations((prev) =>
                    prev.filter((c) => c.alumni_id !== pendingDeleteAlumniId),
                );
                setAllAlumni((prev) =>
                    prev.map((alum) =>
                        alum.alumni_id === pendingDeleteAlumniId
                            ? {
                                  ...alum,
                                  has_conversation: false,
                                  last_message: null,
                                  unread_count: 0,
                              }
                            : alum,
                    ),
                );
                if (selectedConversation?.alumni_id === pendingDeleteAlumniId) {
                    setSelectedConversation(null);
                    setMessages([]);
                }
            } else {
                message.error(
                    response.data.message || "Failed to delete conversation",
                );
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
            message.error("Failed to delete conversation");
        } finally {
            setModalLoading(false);
            setShowDeleteModal(false);
            setPendingDeleteAlumniId(null);
            setRecoveryConfirm(null);
        }
    };

    const handleViewAlumniProfile = async (alumni) => {
        try {
            setAlumniDetailsLoading(true);
            const response = await axios.get(`/alumni/${alumni.alumni_id}`);
            const values = response.data?.data || response.data;

            const previewData = {
                id: values.id,
                status: values.status,
                first_name: values.first_name,
                last_name: values.last_name,
                middle_name: values.middle_name,
                suffix: values.suffix,
                email: values.email,
                phone: values.phone,
                address: values.address,
                birth_date: values.birth_date,
                gender: values.gender,
                bio: values.bio,
                course_id: values.course_id,
                student_id: values.student_id,
                graduation_year: values.graduation_year,
                enrollment_year: values.enrollment_year,
                honors:
                    typeof values.honors === "string" &&
                    values.honors.trim() !== ""
                        ? JSON.parse(values.honors)
                        : Array.isArray(values.honors)
                          ? values.honors
                          : [],
                thesis_title: values.thesis_title,
                academic_achievements: values.academic_achievements,
                extracurricular: values.extracurricular,
                continue_education: values.continue_education,
                employment_status_id: values.employment_status_id,
                current_company: values.current_company,
                job_title: values.job_title,
                industry: values.industry,
                years_experience: values.years_experience,
                salary_range: values.salary_range,
                work_location: values.work_location,
                career_goals: values.career_goals,
                previous_companies: values.previous_companies,
                linkedin: values.linkedin,
                github: values.github,
                portfolio: values.portfolio,
                twitter: values.twitter,
                newsletter: values.newsletter,
                contactPermission: values.contactPermission,
                agreement: values.agreement,
                profileImage: values?.profile_image_url,
                idDocuments: values?.documents || [],
            };

            setAlumniPreviewData(previewData);
            setShowAlumniDetailsModal(true);
        } catch (error) {
            console.error("Failed to fetch alumni details:", error);
            message.error("Failed to fetch alumni details");
            const fallbackData = {
                ...alumni,
                employment_status_id: alumni.employment_status_id,
                course_id: alumni.course_id,
                honors: [],
                idDocuments: [],
            };
            setAlumniPreviewData(fallbackData);
            setShowAlumniDetailsModal(true);
        } finally {
            setAlumniDetailsLoading(false);
        }
    };

    const closeAlumniDetailsModal = () => {
        setShowAlumniDetailsModal(false);
        setAlumniPreviewData(null);
    };

    // ============================
    // COMMON FUNCTIONS
    // ============================

    const isLandscapeMobile = () =>
        window.innerWidth <= 992 &&
        window.screen.orientation
            ? window.screen.orientation.type.startsWith("landscape")
            : window.innerWidth > window.innerHeight;

    const scrollToBottom = () => {
        // Skip auto-scroll in landscape on mobile — the viewport is too short
        // and scrollIntoView jumps the whole page instead of staying inside the message area.
        if (isLandscapeMobile()) return;
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
            });
        }
    };

    const handleConversationClick = (alumniId, alumniData) => {
        // Conversation switch protection: warn if the current composer has unsent content.
        if (
            isAdmin &&
            selectedConversation &&
            selectedConversation.alumni_id !== alumniData.alumni_id &&
            hasUnsentChanges()
        ) {
            setPendingSwitch({
                alumni_id: alumniData.alumni_id,
                data: alumniData,
            });
            setOpenDropdown(null);
            return;
        }

        // No unsent changes (or same conversation): switch immediately and offer draft restore.
        performConversationSwitch(alumniData);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 24) {
            return date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } else if (diffHours < 48) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        }
    };

    const groupMessagesByDate = (messages) => {
        const groups = [];
        let currentDate = null;

        messages.forEach((msg) => {
            const msgDate = new Date(msg.created_at).toDateString();
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({ type: "date", date: msg.created_at });
            }
            groups.push({ type: "message", ...msg });
        });

        return groups;
    };

    const formatDateSeparator = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year:
                    date.getFullYear() !== today.getFullYear()
                        ? "numeric"
                        : undefined,
            });
        }
    };

    // ============================
    // IMAGE FUNCTIONS WITH VALIDATION
    // ============================

    const beforeUpload = (file) => {
        const isJpgOrPng =
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/jpg";
        if (!isJpgOrPng) {
            message.error("You can only upload JPG/PNG files!");
            return false;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error("Image must be smaller than 5MB!");
            return false;
        }
        return true;
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!beforeUpload(file)) {
                if (imageInputRef.current) imageInputRef.current.value = "";
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const clearImagePreview = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const openLightbox = (imagePath) => {
        setLightboxImage(getImageUrl(imagePath));
    };

    const closeLightbox = () => {
        setLightboxImage(null);
    };

    // ============================
    // REACTION FUNCTIONS
    // ============================

    const addReaction = async (messageId, emoji) => {
        try {
            const endpoint = isAdmin
                ? `/admin/messages/${messageId}/reactions`
                : `/messages/${messageId}/reactions`;

            const response = await axios.post(endpoint, { emoji });
            if (response.data.success) {
                setMessageReactions((prev) => ({
                    ...prev,
                    [messageId]: response.data.reactions || [],
                }));
            }
        } catch (error) {
            console.error("Error adding reaction:", error);
            message.error("Failed to add reaction");
        }
        setLongPressedMessageId(null);
        setShowEmojiPicker(false);
        setShowMessageActionModal(false);
    };

    const handleDoubleClick = (messageId) => {
        addReaction(messageId, "❤️");
    };

    const handleLongPressStart = (messageId, msgData) => {
        longPressTimerRef.current = setTimeout(() => {
            setLongPressedMessageId(messageId);
            setActionMessageData(msgData);
            setShowMessageActionModal(true);
            setShowEmojiPicker(true);
        }, 500);
    };

    const handleLongPressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleLongPress = (messageId, msgData) => {
        setLongPressedMessageId(messageId);
        setActionMessageData(msgData);
        setShowMessageActionModal(true);
        setShowEmojiPicker(true);
    };

    // ============================
    // MESSAGE DELETE/EDIT FUNCTIONS (UPDATED)
    // ============================

    const closeMessageActionModal = () => {
        setShowMessageActionModal(false);
        setShowEmojiPicker(false);
        setLongPressedMessageId(null);
        setActionMessageData(null);
    };

    // NEW: Open delete confirmation modal (black theme)
    const openDeleteConfirmModal = (msgData) => {
        setDeleteTargetMessage(msgData);
        setShowDeleteConfirmModal(true);
        setShowMessageActionModal(false);
    };

    // NEW: Close delete confirmation modal
    const closeDeleteConfirmModal = () => {
        setShowDeleteConfirmModal(false);
        setDeleteTargetMessage(null);
    };

    // UPDATED: Handle delete message with confirmation
    const handleDeleteMessage = async () => {
        if (!deleteTargetMessage) return;

        try {
            setDeleteMessageLoading(true);
            const endpoint = isAdmin
                ? `/admin/messages/${deleteTargetMessage.id}/delete`
                : `/alumni/messages/${deleteTargetMessage.id}/delete`;

            // Optimistic update
            const deletedId = deleteTargetMessage.id;
            setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));

            const response = await axios.delete(endpoint);

            if (response.data.success) {
                message.success("Message deleted for everyone");
                closeDeleteConfirmModal();

                if (isAdmin) {
                    fetchConversations();
                }
            } else {
                // Revert optimistic update
                fetchAdminMessages(selectedConversation?.alumni_id, true);
                message.error(
                    response.data.message || "Failed to delete message",
                );
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
            // Revert optimistic update
            if (isAdmin && selectedConversation) {
                fetchAdminMessages(selectedConversation.alumni_id, true);
            } else {
                fetchAlumniMessages();
            }
            message.error("Failed to delete message");
        } finally {
            setDeleteMessageLoading(false);
            closeDeleteConfirmModal();
        }
    };

    // NEW: Start inline edit (Messenger style)
    const startInlineEdit = (msgData) => {
        if (!msgData.message) {
            message.warning("Cannot edit image-only messages");
            return;
        }

        if (!canEditMessage(msgData)) {
            message.warning(
                "You can only edit messages within 3 minutes of sending",
            );
            return;
        }

        setInlineEditMessageId(msgData.id);
        setInlineEditText(msgData.message);
        setShowMessageActionModal(false);

        // Focus the input after render
        setTimeout(() => {
            if (inlineEditRef.current) {
                inlineEditRef.current.focus();
                inlineEditRef.current.setSelectionRange(
                    inlineEditRef.current.value.length,
                    inlineEditRef.current.value.length,
                );
            }
        }, 50);
    };

    // NEW: Cancel inline edit
    const cancelInlineEdit = () => {
        setInlineEditMessageId(null);
        setInlineEditText("");
    };

    // NEW: Save inline edit
    const saveInlineEdit = async () => {
        if (!inlineEditMessageId || !inlineEditText.trim()) return;

        try {
            setInlineEditLoading(true);
            const endpoint = isAdmin
                ? `/admin/messages/${inlineEditMessageId}/edit`
                : `/alumni/messages/${inlineEditMessageId}/edit`;

            // Optimistic update
            const editedId = inlineEditMessageId;
            const editedText = inlineEditText.trim();
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === editedId
                        ? {
                              ...msg,
                              message: editedText,
                              is_edited: true,
                              updated_at: new Date().toISOString(),
                          }
                        : msg,
                ),
            );

            const response = await axios.put(endpoint, {
                message: editedText,
            });

            if (response.data.success) {
                message.success("Message edited");
                cancelInlineEdit();
            } else {
                // Revert optimistic update
                if (isAdmin && selectedConversation) {
                    fetchAdminMessages(selectedConversation.alumni_id, true);
                } else {
                    fetchAlumniMessages();
                }
                message.error(
                    response.data.message || "Failed to edit message",
                );
            }
        } catch (error) {
            console.error("Failed to edit message:", error);
            // Revert optimistic update
            if (isAdmin && selectedConversation) {
                fetchAdminMessages(selectedConversation.alumni_id, true);
            } else {
                fetchAlumniMessages();
            }
            message.error("Failed to edit message");
        } finally {
            setInlineEditLoading(false);
        }
    };

    // Handle inline edit key press
    const handleInlineEditKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveInlineEdit();
        } else if (e.key === "Escape") {
            cancelInlineEdit();
        }
    };

    // Check if current user can edit/delete the message
    const canModifyMessage = (msg) => {
        if (isAdmin) {
            return msg.sender_type === "admin";
        } else {
            return msg.sender_type === "alumni";
        }
    };

    // ============================
    // EFFECTS
    // ============================

    useEffect(() => {
        if (isAdmin) {
            fetchAllAlumni();
            fetchConversations();
            setInitialLoading(false);
        } else {
            fetchAlumniMessages();
            fetchAlumniUnreadCount();
        }

        const interval = setInterval(() => {
            if (isAdmin) {
                fetchAllAlumni(true);
                fetchConversations(true);

                if (selectedConversation) {
                    fetchAdminMessages(selectedConversation.alumni_id, true);
                }
            } else {
                fetchAlumniMessages(true);
                fetchAlumniUnreadCount(true);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [
        isAdmin,
        selectedConversation,
        fetchAlumniMessages,
        fetchAlumniUnreadCount,
        fetchAllAlumni,
        fetchConversations,
        fetchAdminMessages,
    ]);

    useEffect(() => {
        if (isAdmin && selectedConversation) {
            fetchAdminMessages(selectedConversation.alumni_id);
            setTimeout(() => scrollToBottom(), 100);
        }
    }, [selectedConversation, isAdmin, fetchAdminMessages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
                setLongPressedMessageId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                openDropdown &&
                !e.target.closest(".actions-dropdown-container")
            ) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [openDropdown]);

    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    // ============================
    // COMPUTED VALUES
    // ============================

    const groupedMessages = groupMessagesByDate(messages);

    const baseList = activeTab === "alumni" ? allAlumni : conversations;
    // Archived conversations are hidden from active tabs and shown only in the Archive tab.
    const archivedConversations = conversations.filter((c) =>
        archivedIds.includes(c.alumni_id),
    );
    const currentList =
        activeTab === "archived"
            ? archivedConversations
            : (baseList || []).filter(
                  (item) => !archivedIds.includes(item.alumni_id),
              );

    const totalUnreadCount = conversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0,
    );

    // ============================
    // RENDER MESSAGE IMAGE COMPONENT
    // ============================

    const renderMessageImage = (imagePath, isOptimistic = false, imageUrlField = null) => {
        if (!imagePath && !imageUrlField) return null;

        // Message images live on the private disk — the backend now
        // sends a ready-to-use, authorized `image_url` alongside the
        // raw `image_path`. Prefer that; getImageUrl()'s storage/-path
        // reconstruction is only a fallback for optimistic/legacy values.
        const imageUrl = isOptimistic
            ? imagePath
            : imageUrlField || getImageUrl(imagePath);

        return (
            <div
                className="message-image-container"
                onClick={() => !isOptimistic && openLightbox(imageUrlField || imagePath)}
            >
                <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="Shared image"
                    className="message-image"
                    onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "flex";
                        }
                    }}
                    onLoad={(e) => {
                        e.target.style.display = "block";
                        if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "none";
                        }
                    }}
                />
                <div className="message-image-error">
                    <span className="error-icon">🖼️</span>
                    <span className="error-text">Image unavailable</span>
                </div>
                <div className="image-overlay">
                    <span className="zoom-icon">🔍</span>
                </div>
            </div>
        );
    };

    // ============================
    // RENDER MESSAGE ACTION MODAL (UPDATED)
    // ============================

    const renderMessageActionModal = () => {
        if (!showMessageActionModal || !actionMessageData) return null;

        const canModify = canModifyMessage(actionMessageData);
        const hasTextMessage =
            actionMessageData.message && actionMessageData.message.trim();
        const canEdit =
            canModify && hasTextMessage && canEditMessage(actionMessageData);

        return (
            <div
                className="message-action-modal-overlay"
                onClick={closeMessageActionModal}
            >
                <div
                    className="message-action-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Emoji Reactions Row */}
                    <div className="message-action-emoji-row">
                        {EMOJI_REACTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() =>
                                    addReaction(actionMessageData.id, emoji)
                                }
                                className="message-action-emoji-btn"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons - Only show for own messages */}
                    {canModify && (
                        <div className="message-action-buttons">
                            {/* Edit - Only for text messages within 3 minutes */}
                            {canEdit && (
                                <button
                                    className="message-action-btn edit"
                                    onClick={() =>
                                        startInlineEdit(actionMessageData)
                                    }
                                >
                                    <span className="action-icon">✏️</span>
                                    <span>Edit</span>
                                </button>
                            )}

                            {/* Delete/Unsend */}
                            <button
                                className="message-action-btn delete"
                                onClick={() =>
                                    openDeleteConfirmModal(actionMessageData)
                                }
                            >
                                <span className="action-icon">🗑️</span>
                                <span>Unsend for Everyone</span>
                            </button>
                        </div>
                    )}

                    {/* Cancel Button */}
                    <button
                        className="message-action-cancel"
                        onClick={closeMessageActionModal}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    };

    // ============================
    // RENDER DELETE CONFIRMATION MODAL (NEW - BLACK THEME)
    // ============================

    const renderDeleteConfirmModal = () => {
        if (!showDeleteConfirmModal || !deleteTargetMessage) return null;

        return (
            <div
                className="delete-confirm-modal-overlay"
                onClick={closeDeleteConfirmModal}
            >
                <div
                    className="delete-confirm-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="delete-confirm-icon">
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M3 6H5H21"
                                stroke="#ff4757"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
                                stroke="#ff4757"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M10 11V17"
                                stroke="#ff4757"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M14 11V17"
                                stroke="#ff4757"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h3 className="delete-confirm-title">Unsend Message?</h3>
                    <p className="delete-confirm-text">
                        This message will be removed for everyone in the chat.
                        This action cannot be undone.
                    </p>
                    <div className="delete-confirm-preview">
                        {deleteTargetMessage.message && (
                            <p className="preview-text">
                                "{deleteTargetMessage.message.substring(0, 50)}
                                {deleteTargetMessage.message.length > 50
                                    ? "..."
                                    : ""}
                                "
                            </p>
                        )}
                        {deleteTargetMessage.image_path &&
                            !deleteTargetMessage.message && (
                                <p className="preview-text">[Image]</p>
                            )}
                    </div>
                    <div className="delete-confirm-actions">
                        <button
                            className="delete-confirm-btn cancel"
                            onClick={closeDeleteConfirmModal}
                            disabled={deleteMessageLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="delete-confirm-btn delete"
                            onClick={handleDeleteMessage}
                            disabled={deleteMessageLoading}
                        >
                            {deleteMessageLoading ? (
                                <span className="delete-loading">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </span>
                            ) : (
                                "Unsend"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ============================
    // RENDER MODALS
    // ============================

    const renderDeleteModal = () => {
        if (!showDeleteModal) return null;

        // Recovery protection: show affected records & content preview when available.
        const isCurrent =
            selectedConversation?.alumni_id === pendingDeleteAlumniId;
        const affectedCount = isCurrent ? messages.length : null;
        const previewMsg =
            isCurrent && messages.length > 0
                ? messages[messages.length - 1]?.message
                : null;

        return (
            <div
                className="modal-overlay"
                onClick={() => !modalLoading && setShowDeleteModal(false)}
            >
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <span className="modal-icon danger">🗑️</span>
                        <h3>This Action Cannot Be Undone</h3>
                    </div>
                    <div className="modal-body">
                        <p>
                            Are you sure you want to permanently delete this
                            conversation?
                        </p>
                        {affectedCount != null && (
                            <p className="modal-info">
                                Affected records:{" "}
                                <strong>{affectedCount}</strong> message(s)
                            </p>
                        )}
                        {previewMsg && (
                            <p className="modal-info draft-preview">
                                Last message: “{previewMsg.slice(0, 120)}”
                            </p>
                        )}
                        <p className="modal-warning">
                            This action cannot be undone. All messages will be
                            permanently deleted.
                        </p>
                        <label className="recovery-ack-label">
                            <input
                                type="checkbox"
                                checked={!!recoveryConfirm}
                                onChange={(e) =>
                                    setRecoveryConfirm(e.target.checked)
                                }
                            />
                            <span>
                                I understand this will permanently delete the
                                conversation.
                            </span>
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button
                            className="modal-btn cancel"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setRecoveryConfirm(null);
                            }}
                            disabled={modalLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="modal-btn danger"
                            onClick={confirmDeleteConversation}
                            disabled={modalLoading || !recoveryConfirm}
                        >
                            {modalLoading ? "Deleting..." : "Confirm Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderRestrictModal = () => {
        if (!showRestrictModal || !pendingRestrictAlumni) return null;

        const isCurrentlyRestricted = pendingRestrictAlumni.is_restricted;

        // ---- Field fallbacks: support multiple shapes from different endpoints ----
        const resolvedCourseFromId =
            pendingRestrictAlumni.course_id != null
                ? getCourseName(getCourseCode(pendingRestrictAlumni.course_id))
                : null;

        const course =
            pendingRestrictAlumni.course_name ||
            pendingRestrictAlumni.courseName ||
            pendingRestrictAlumni.course ||
            (resolvedCourseFromId && resolvedCourseFromId !== "N/A"
                ? resolvedCourseFromId
                : null) ||
            "N/A";

        const resolvedEmploymentFromId =
            pendingRestrictAlumni.employment_status_id != null
                ? getEmploymentStatusLabel(
                      pendingRestrictAlumni.employment_status_id,
                  )
                : null;

        const employment =
            pendingRestrictAlumni.employment_status ||
            pendingRestrictAlumni.employmentStatus ||
            pendingRestrictAlumni.employment ||
            (resolvedEmploymentFromId && resolvedEmploymentFromId !== "N/A"
                ? resolvedEmploymentFromId
                : null) ||
            "N/A";

        const alumniName =
            pendingRestrictAlumni.alumni_name ||
            pendingRestrictAlumni.name ||
            "N/A";

        return (
            <div
                className="modal-overlay"
                onClick={() => !modalLoading && setShowRestrictModal(false)}
            >
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <span className="modal-icon">
                            {isCurrentlyRestricted ? "✅" : "🚫"}
                        </span>
                        <h3>
                            {isCurrentlyRestricted
                                ? "Remove Restriction?"
                                : "Restrict Messaging Access?"}
                        </h3>
                    </div>
                    <div className="modal-body">
                        {/* Enhanced alumni summary */}
                        <div className="restrict-alumni-summary">
                            <div className="restrict-summary-row">
                                <span className="restrict-summary-label">
                                    Alumni
                                </span>
                                <span className="restrict-summary-value">
                                    {alumniName}
                                </span>
                            </div>
                            <div className="restrict-summary-row">
                                <span className="restrict-summary-label">
                                    Course
                                </span>
                                <span className="restrict-summary-value">
                                    {course}
                                </span>
                            </div>
                            <div className="restrict-summary-row">
                                <span className="restrict-summary-label">
                                    Employment
                                </span>
                                <span className="restrict-summary-value">
                                    {employment}
                                </span>
                            </div>
                            <div className="restrict-summary-row">
                                <span className="restrict-summary-label">
                                    Current Status
                                </span>
                                <span
                                    className={`restrict-summary-value ${isCurrentlyRestricted ? "is-restricted" : "is-active"}`}
                                >
                                    {isCurrentlyRestricted
                                        ? "Restricted"
                                        : "Active"}
                                </span>
                            </div>
                        </div>
                        <p>
                            {isCurrentlyRestricted
                                ? `Are you sure you want to remove the messaging restriction for ${alumniName}?`
                                : `Are you sure you want to restrict ${alumniName} from sending messages?`}
                        </p>
                        <p className="modal-info modal-warning">
                            {isCurrentlyRestricted
                                ? "They will be able to send messages again after this action."
                                : "⚠️ This will block the alumni from sending any future messages until the restriction is removed."}
                        </p>
                    </div>
                    <div className="modal-actions">
                        <button
                            className="modal-btn cancel"
                            onClick={() => setShowRestrictModal(false)}
                            disabled={modalLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className={`modal-btn ${isCurrentlyRestricted ? "success" : "warning"}`}
                            onClick={confirmRestrictAlumni}
                            disabled={modalLoading}
                        >
                            {modalLoading
                                ? "Processing..."
                                : isCurrentlyRestricted
                                  ? "Remove Restriction"
                                  : "Restrict"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ============================
    // RENDER INLINE EDIT INPUT (NEW - Messenger style)
    // ============================

    const renderInlineEditInput = (msg) => {
        if (inlineEditMessageId !== msg.id) return null;

        return (
            <div className="inline-edit-container">
                <textarea
                    ref={inlineEditRef}
                    className="inline-edit-input"
                    value={inlineEditText}
                    onChange={(e) => setInlineEditText(e.target.value)}
                    onKeyDown={handleInlineEditKeyDown}
                    disabled={inlineEditLoading}
                    rows={1}
                    autoFocus
                />
                <div className="inline-edit-actions">
                    <button
                        className="inline-edit-btn cancel"
                        onClick={cancelInlineEdit}
                        disabled={inlineEditLoading}
                        title="Cancel (Esc)"
                    >
                        ✕
                    </button>
                    <button
                        className="inline-edit-btn save"
                        onClick={saveInlineEdit}
                        disabled={inlineEditLoading || !inlineEditText.trim()}
                        title="Save (Enter)"
                    >
                        {inlineEditLoading ? "..." : "✓"}
                    </button>
                </div>
                <span className="inline-edit-hint">
                    Press Enter to save, Esc to cancel
                </span>
            </div>
        );
    };

    // ============================
    // RENDER - ALUMNI VIEW
    // ============================

    if (!isAdmin) {
        return (
            <Layout>
                <div className="alumni-messages-container">
                    {/* Header */}
                    <div className="alumni-messages-header">
                        <div className="alumni-header-left">
                            <img
                                src={adminInfo.avatar || "/placeholder.svg"}
                                alt="Guidance Counselor"
                                className="admin-header-avatar"
                            />
                            <div className="alumni-header-info">
                                <h2>{adminInfo.name}</h2>
                                <span className="admin-status">Admin</span>
                            </div>
                        </div>
                        {alumniUnreadCount > 0 && (
                            <span className="alumni-unread-badge">
                                {alumniUnreadCount} new
                            </span>
                        )}
                    </div>

                    {/* Error notice */}
                    {error && (
                        <div className="alumni-error-notice">
                            <span>⚠️</span>
                            <p>{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="error-dismiss"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Restriction notice */}
                    {isRestricted && (
                        <div className="restriction-notice">
                            <span>🔒</span>
                            <p>
                                You are currently restricted from sending
                                messages. Please contact the administration for
                                assistance.
                            </p>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="alumni-messages-area">
                        {initialLoading ? (
                            <div className="alumni-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading messages...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="no-alumni-messages">
                                <div className="no-messages-icon">💬</div>
                                <h3>No messages yet</h3>
                                <p>
                                    Start a conversation with the Guidance
                                    Counselor by sending a message below.
                                </p>
                            </div>
                        ) : (
                            groupedMessages.map((groupedItem, index) => {
                                if (groupedItem.type === "date") {
                                    return (
                                        <div
                                            key={`date-${index}`}
                                            className="date-separator"
                                        >
                                            <span>
                                                {formatDateSeparator(
                                                    groupedItem.date,
                                                )}
                                            </span>
                                        </div>
                                    );
                                }

                                const isMyMessage =
                                    groupedItem.sender_type === "alumni";
                                const isEditing =
                                    inlineEditMessageId === groupedItem.id;

                                return (
                                    <div
                                        key={groupedItem.id}
                                        className={`alumni-message-wrapper ${isMyMessage ? "right" : "left"} ${groupedItem.isOptimistic ? "optimistic" : ""}`}
                                    >
                                        {!isMyMessage && (
                                            <div className="alumni-message-sender-header">
                                                <img
                                                    src={
                                                        adminInfo.avatar ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt="Guidance Counselor"
                                                    className="alumni-avatar"
                                                />
                                                <span className="alumni-sender-name">
                                                    Guidance Counselor (Admin)
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={`alumni-message ${isMyMessage ? "sent" : "received"} ${isEditing ? "editing" : ""}`}
                                            onDoubleClick={() =>
                                                !isEditing &&
                                                handleDoubleClick(
                                                    groupedItem.id,
                                                )
                                            }
                                            onMouseDown={() =>
                                                !isEditing &&
                                                handleLongPressStart(
                                                    groupedItem.id,
                                                    groupedItem,
                                                )
                                            }
                                            onMouseUp={handleLongPressEnd}
                                            onMouseLeave={handleLongPressEnd}
                                            onTouchStart={() =>
                                                !isEditing &&
                                                handleLongPressStart(
                                                    groupedItem.id,
                                                    groupedItem,
                                                )
                                            }
                                            onTouchEnd={handleLongPressEnd}
                                        >
                                            {renderMessageImage(
                                                groupedItem.image_path,
                                                groupedItem.isOptimistic,
                                                groupedItem.image_url,
                                            )}

                                            {isEditing
                                                ? renderInlineEditInput(
                                                      groupedItem,
                                                  )
                                                : groupedItem.message && (
                                                      <p>
                                                          {groupedItem.message}
                                                          {!!groupedItem.is_edited &&
                                                              shouldShowEditIndicator(
                                                                  groupedItem,
                                                              ) && (
                                                                  <span className="edited-indicator">
                                                                      {" "}
                                                                      (edited)
                                                                  </span>
                                                              )}
                                                      </p>
                                                  )}

                                            {/* Show reactions */}
                                            {messageReactions[groupedItem.id] &&
                                                messageReactions[groupedItem.id]
                                                    .length > 0 && (
                                                    <div className="message-reactions">
                                                        {messageReactions[
                                                            groupedItem.id
                                                        ].map(
                                                            (reaction, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="reaction-badge"
                                                                >
                                                                    {reaction}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                            {!isEditing && (
                                                <div className="alumni-message-meta">
                                                    <span className="alumni-message-time">
                                                        {formatTime(
                                                            groupedItem.created_at,
                                                        )}
                                                    </span>
                                                    {isMyMessage && (
                                                        <span className="alumni-read-status">
                                                            {groupedItem.isOptimistic
                                                                ? "⏳"
                                                                : groupedItem.is_read
                                                                  ? "✓✓"
                                                                  : "✓"}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input Form */}
                    <form
                        className="alumni-message-input-form"
                        onSubmit={sendAlumniMessage}
                    >
                        {imagePreview && (
                            <div className="image-preview">
                                <img
                                    src={imagePreview || "/placeholder.svg"}
                                    alt="Preview"
                                />
                                <button
                                    type="button"
                                    onClick={clearImagePreview}
                                    className="clear-image-btn"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <div className="message-input-wrapper">
                            <input
                                type="file"
                                ref={imageInputRef}
                                onChange={handleImageSelect}
                                accept="image/jpeg,image/png,image/jpg"
                                style={{ display: "none" }}
                            />
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="image-upload-btn"
                                title="Upload image (JPG/PNG only, max 5MB)"
                                disabled={isRestricted}
                            >
                                📂
                            </button>

                            <textarea
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={
                                    isRestricted
                                        ? "You are restricted from sending messages"
                                        : "Type a message..."
                                }
                                disabled={isRestricted || sending}
                                className="alumni-message-input"
                            />

                            <button
                                type="submit"
                                disabled={
                                    (!newMessage.trim() && !selectedImage) ||
                                    sending ||
                                    isRestricted
                                }
                                className="send-btn"
                            >
                                {sending ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lightbox — rendered via portal directly on <body> so it can
                    never be trapped inside Layout's header stacking context
                    (e.g. a transformed/contained ancestor) on mobile. */}
                {lightboxImage &&
                    createPortal(
                        <div className="image-lightbox" onClick={closeLightbox}>
                            <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="lightbox-close"
                                    onClick={closeLightbox}
                                    title="Close image"
                                    aria-label="Close image"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="lightbox-image-wrap">
                                <img
                                    src={lightboxImage || "/placeholder.svg"}
                                    alt="Full size"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>,
                        document.body
                    )}

                {/* Message Action Modal */}
                {renderMessageActionModal()}

                {/* Delete Confirmation Modal (Black Theme) */}
                {renderDeleteConfirmModal()}
            </Layout>
        );
    }

    // ============================
    // RENDER - ADMIN VIEW
    // ============================

    return (
        <Layout>
            <div className="messages-container">
                <div
                    className={`messages-layout ${selectedConversation ? "chat-open" : ""}`}
                >
                    {/* Sidebar - Alumni List / Conversations */}
                    <div className="conversations-sidebar">
                        <div className="conversations-header">
                            <h2>Messages</h2>
                            {totalUnreadCount > 0 && (
                                <span className="total-unread-badge">
                                    {totalUnreadCount}
                                </span>
                            )}
                        </div>

                        <div className="search-box">
                            <input
                                type="text"
                                placeholder={
                                    activeTab === "alumni"
                                        ? "Search alumni..."
                                        : "Search conversations..."
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="admin-tabs">
                            <button
                                className={`tab-btn ${activeTab === "alumni" ? "active" : ""}`}
                                onClick={() => setActiveTab("alumni")}
                            >
                                👥 All Alumni
                            </button>
                            <button
                                className={`tab-btn ${activeTab === "conversations" ? "active" : ""}`}
                                onClick={() => setActiveTab("conversations")}
                            >
                                💬 Conversations{" "}
                                {conversations.length > 0 &&
                                    `${conversations.length}`}
                            </button>
                            <button
                                className={`tab-btn ${activeTab === "archived" ? "active" : ""}`}
                                onClick={() => setActiveTab("archived")}
                            >
                                🗄️ Archive{" "}
                                {archivedConversations.length > 0 &&
                                    `${archivedConversations.length}`}
                            </button>
                        </div>

                        {/* Bulk conversation actions — compact pill + floating toolbar */}
                        {(activeTab === "conversations" ||
                            activeTab === "archived") && (
                            <>
                                {!bulkMode && (
                                    <button
                                        className="select-toggle"
                                        onClick={toggleBulkMode}
                                    >
                                        ☑ Select
                                    </button>
                                )}
                                <div
                                    className={`bulk-toolbar ${bulkMode ? "is-active" : ""}`}
                                    aria-hidden={!bulkMode}
                                >
                                    <div className="bulk-toolbar__header">
                                        <span className="bulk-toolbar__count">
                                            {bulkSelectedIds.length} selected
                                        </span>
                                        <button
                                            className="bulk-toolbar__cancel"
                                            onClick={toggleBulkMode}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="bulk-toolbar__actions">
                                        <button
                                            className="bulk-btn bulk-btn--primary"
                                            onClick={() =>
                                                requestBulkAction("read")
                                            }
                                        >
                                            Read
                                        </button>
                                        <button
                                            className="bulk-btn"
                                            onClick={() =>
                                                requestBulkAction("archive")
                                            }
                                        >
                                            Archive
                                        </button>
                                        <button
                                            className="bulk-btn bulk-btn--warn"
                                            onClick={() =>
                                                requestBulkAction("restrict")
                                            }
                                        >
                                            Restrict
                                        </button>
                                        <button
                                            className="bulk-btn bulk-btn--danger"
                                            onClick={() =>
                                                requestBulkAction("delete")
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div
                            className={`conversations-list ${activeTab === "alumni" ? "alumni-list-mode" : "conversations-list-mode"}`}
                        >
                            {loading && currentList.length === 0 ? (
                                <div className="conversation-skeleton-list">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="conversation-item">
                                            <Skeleton avatar active title={false} paragraph={{ rows: 2, width: ["60%", "40%"] }} />
                                        </div>
                                    ))}
                                </div>
                            ) : currentList.length === 0 ? (
                                <div className="no-conversations">
                                    <p>
                                        {activeTab === "alumni"
                                            ? "No alumni found"
                                            : "No conversations yet"}
                                    </p>
                                </div>
                            ) : activeTab === "alumni" ? (
                                /* ============================================
                   RESPONSIVE ALUMNI CARD RENDER (redesigned)
                   ============================================ */
                                <div className="alumni-cards-grid">
                                    {currentList.map((item) => {
                                        const __code = getCourseCode(
                                            item.course_id,
                                        );
                                        const __key = (__code || "")
                                            .toString()
                                            .toUpperCase();
                                        const isActive =
                                            selectedConversation?.alumni_id ===
                                            item.alumni_id;
                                        return (
                                            <article
                                                key={item.alumni_id}
                                                className={`alumni-card conversation-item ${isActive ? "active" : ""} ${item.unread_count > 0 ? "unread" : ""} ${item.is_restricted ? "is-restricted" : ""}`}
                                                onClick={() =>
                                                    handleConversationClick(
                                                        item.alumni_id,
                                                        item,
                                                    )
                                                }
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" ||
                                                        e.key === " "
                                                    ) {
                                                        e.preventDefault();
                                                        handleConversationClick(
                                                            item.alumni_id,
                                                            item,
                                                        );
                                                    }
                                                }}
                                            >
                                                <div className="alumni-card__media">
                                                    {item.alumni_avatar ? (
                                                        <img
                                                            src={
                                                                item.alumni_avatar ||
                                                                "/placeholder.svg"
                                                            }
                                                            alt={
                                                                item.alumni_name
                                                            }
                                                            className="alumni-card__avatar conversation-avatar-img"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="alumni-card__avatar alumni-card__avatar--initial conversation-avatar">
                                                            {item.alumni_name
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                    {!!item.is_restricted && (
                                                        <span
                                                            className="alumni-card__status-dot"
                                                            title="Restricted"
                                                        />
                                                    )}
                                                </div>

                                                <div className="alumni-card__body conversation-info">
                                                    <div className="alumni-card__head conversation-top">
                                                        <h4
                                                            className="alumni-card__name"
                                                            title={
                                                                item.alumni_name
                                                            }
                                                        >
                                                            {item.alumni_name}
                                                        </h4>
                                                        {item.last_message_time && (
                                                            <span className="alumni-card__time conversation-time">
                                                                {formatTime(
                                                                    item.last_message_time,
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="alumni-card__meta conversation-bottom">
                                                        <span
                                                            className={`alumni-card__chip alumni-employment ${getEmploymentClass(item.employment_status_id)}`}
                                                        >
                                                            {getEmploymentStatusLabel(
                                                                item.employment_status_id,
                                                            )}
                                                        </span>
                                                        <span
                                                            className={`alumni-card__chip alumni-course course-pill course-${__key.toLowerCase()}`}
                                                        >
                                                            {__code}
                                                        </span>
                                                        {!!item.is_restricted && (
                                                            <span className="alumni-card__chip restricted-badge">
                                                                Restricted
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="alumni-card__actions">
                                                    <button
                                                        className="alumni-card__btn view-details-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewAlumniProfile(
                                                                item,
                                                            );
                                                        }}
                                                        title="View alumni details"
                                                        aria-label={`View details for ${item.alumni_name}`}
                                                    >
                                                        <span
                                                            className="alumni-card__btn-icon"
                                                            aria-hidden="true"
                                                        >
                                                            👤
                                                        </span>
                                                        <span className="alumni-card__btn-label">
                                                            View Details
                                                        </span>
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                currentList.map((item) => (
                                    <div
                                        key={item.alumni_id}
                                        className={`conversation-item ${selectedConversation?.alumni_id === item.alumni_id ? "active" : ""} ${item.unread_count > 0 ? "unread" : ""} ${bulkMode && bulkSelectedIds.includes(item.alumni_id) ? "bulk-selected" : ""}`}
                                        onClick={() => {
                                            if (bulkMode) {
                                                toggleBulkSelect(
                                                    item.alumni_id,
                                                );
                                            } else {
                                                handleConversationClick(
                                                    item.alumni_id,
                                                    item,
                                                );
                                            }
                                        }}
                                    >
                                        {bulkMode && (
                                            <input
                                                type="checkbox"
                                                className="bulk-select-checkbox"
                                                checked={bulkSelectedIds.includes(
                                                    item.alumni_id,
                                                )}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleBulkSelect(
                                                        item.alumni_id,
                                                    );
                                                }}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        )}
                                        {item.alumni_avatar ? (
                                            <img
                                                src={
                                                    item.alumni_avatar ||
                                                    "/placeholder.svg"
                                                }
                                                alt={item.alumni_name}
                                                className="conversation-avatar-img"
                                            />
                                        ) : (
                                            <div className="conversation-avatar">
                                                {item.alumni_name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}

                                        <div className="conversation-info">
                                            <div className="conversation-top">
                                                <h4>{item.alumni_name}</h4>
                                                {item.last_message_time && (
                                                    <span className="conversation-time">
                                                        {formatTime(
                                                            item.last_message_time,
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="conversation-bottom">
                                                {item.last_message && (
                                                    <p className="last-message">
                                                        {item.last_message}
                                                    </p>
                                                )}
                                                {item.unread_count > 0 && (
                                                    <span className="unread-badge">
                                                        {item.unread_count} new
                                                    </span>
                                                )}
                                                {!!item.is_restricted && (
                                                    <span className="restricted-badge">
                                                        Restricted
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="actions-dropdown-container">
                                            <button
                                                className="actions-dropdown-trigger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdown(
                                                        openDropdown ===
                                                            item.alumni_id
                                                            ? null
                                                            : item.alumni_id,
                                                    );
                                                }}
                                                title="Actions"
                                            >
                                                ⋮
                                            </button>
                                            {openDropdown ===
                                                item.alumni_id && (
                                                <div className="actions-dropdown-menu">
                                                    <button
                                                        className="dropdown-menu-item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdown(
                                                                null,
                                                            );
                                                            handleViewAlumniProfile(
                                                                item,
                                                            );
                                                        }}
                                                    >
                                                        <span className="dropdown-icon">
                                                            👤
                                                        </span>
                                                        <span>
                                                            View Profile
                                                        </span>
                                                    </button>
                                                    <button
                                                        className="dropdown-menu-item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdown(
                                                                null,
                                                            );
                                                            openRestrictModal(
                                                                item,
                                                            );
                                                        }}
                                                    >
                                                        <span className="dropdown-icon">
                                                            {item.is_restricted
                                                                ? "✅"
                                                                : "🚫"}
                                                        </span>
                                                        <span>
                                                            {item.is_restricted
                                                                ? "Unrestrict"
                                                                : "Restrict"}
                                                        </span>
                                                    </button>
                                                    <button
                                                        className="dropdown-menu-item danger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdown(
                                                                null,
                                                            );
                                                            openDeleteModal(
                                                                item.alumni_id,
                                                            );
                                                        }}
                                                    >
                                                        <span className="dropdown-icon">
                                                            🗑️
                                                        </span>
                                                        <span>
                                                            Delete Conversation
                                                        </span>
                                                    </button>
                                                    <button
                                                        className="dropdown-menu-item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdown(
                                                                null,
                                                            );
                                                            if (
                                                                isArchived(
                                                                    item.alumni_id,
                                                                )
                                                            ) {
                                                                unarchiveConversation(
                                                                    item.alumni_id,
                                                                );
                                                                message.success(
                                                                    "Conversation unarchived",
                                                                );
                                                            } else {
                                                                setArchivePrompt(
                                                                    item.alumni_id,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <span className="dropdown-icon">
                                                            {isArchived(
                                                                item.alumni_id,
                                                            )
                                                                ? "📤"
                                                                : "🗄️"}
                                                        </span>
                                                        <span>
                                                            {isArchived(
                                                                item.alumni_id,
                                                            )
                                                                ? "Unarchive"
                                                                : "Archive"}
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="chat-area">
                        {selectedConversation ? (
                            <>
                                <div className="chat-header">
                                    <div className="chat-header-info">
                                        <button
                                            className="chat-back-btn"
                                            onClick={() =>
                                                setSelectedConversation(null)
                                            }
                                            title="Back to conversations"
                                            aria-label="Back to conversations"
                                        >
                                            <span aria-hidden="true">‹</span>
                                        </button>

                                        {selectedConversation.alumni_avatar ? (
                                            <img
                                                src={
                                                    selectedConversation.alumni_avatar ||
                                                    "/placeholder.svg"
                                                }
                                                alt={
                                                    selectedConversation.alumni_name
                                                }
                                                className="chat-avatar-img"
                                            />
                                        ) : (
                                            <div className="chat-avatar">
                                                {selectedConversation.alumni_name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <div className="chat-header-text">
                                            <h3>
                                                {
                                                    selectedConversation.alumni_name
                                                }
                                            </h3>
                                            <p className="alumni-email">
                                                {
                                                    selectedConversation.alumni_email
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="chat-header-actions">
                                        <button
                                            className={`chat-search-toggle ${searchPanelOpen ? "active" : ""}`}
                                            onClick={toggleSearchPanel}
                                            title="Search in conversation"
                                        >
                                            🔍
                                        </button>
                                        <button
                                            className={`restrict-btn ${selectedConversation.is_restricted ? "restricted" : ""}`}
                                            onClick={() =>
                                                openRestrictModal(
                                                    selectedConversation,
                                                )
                                            }
                                            title={
                                                selectedConversation.is_restricted
                                                    ? "Remove restriction"
                                                    : "Restrict alumni from messaging"
                                            }
                                        >
                                            {selectedConversation.is_restricted
                                                ? "Unrestrict"
                                                : "Restrict"}
                                        </button>
                                    </div>
                                </div>

                                {/* Message Search Panel */}
                                {searchPanelOpen && (
                                    <div className="message-search-panel">
                                        <input
                                            type="text"
                                            className="message-search-input"
                                            placeholder="Search in this conversation..."
                                            value={msgSearchQuery}
                                            autoFocus
                                            onChange={(e) =>
                                                setMsgSearchQuery(
                                                    e.target.value,
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    gotoSearchResult(
                                                        e.shiftKey ? -1 : 1,
                                                    );
                                                }
                                            }}
                                        />
                                        <span className="message-search-count">
                                            {msgSearchQuery.trim()
                                                ? searchResultIds.length > 0
                                                    ? `${searchActiveIndex + 1} / ${searchResultIds.length}`
                                                    : "0 results"
                                                : ""}
                                        </span>
                                        <button
                                            className="message-search-nav"
                                            onClick={() => gotoSearchResult(-1)}
                                            disabled={
                                                searchResultIds.length === 0
                                            }
                                            title="Previous result"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            className="message-search-nav"
                                            onClick={() => gotoSearchResult(1)}
                                            disabled={
                                                searchResultIds.length === 0
                                            }
                                            title="Next result"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            className="message-search-close"
                                            onClick={toggleSearchPanel}
                                            title="Close search"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {!!selectedConversation.is_restricted && (
                                    <div className="restricted-notice">
                                        <span>⚠️</span>
                                        <p>
                                            This alumni is restricted from
                                            sending messages. You can still send
                                            messages to them.
                                        </p>
                                    </div>
                                )}

                                <div className="messages-area">
                                    {loading ? (
                                        <div className="loading-messages">
                                            Loading messages...
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="no-messages">
                                            <p>
                                                No messages yet. Start the
                                                conversation!
                                            </p>
                                        </div>
                                    ) : (
                                        groupedMessages.map(
                                            (groupedItem, index) => {
                                                if (
                                                    groupedItem.type === "date"
                                                ) {
                                                    return (
                                                        <div
                                                            key={`date-${index}`}
                                                            className="date-separator"
                                                        >
                                                            <span>
                                                                {formatDateSeparator(
                                                                    groupedItem.date,
                                                                )}
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                const isAdminMessage =
                                                    groupedItem.sender_type ===
                                                    "admin";
                                                const isEditing =
                                                    inlineEditMessageId ===
                                                    groupedItem.id;

                                                return (
                                                    <div
                                                        key={groupedItem.id}
                                                        id={`admin-msg-${groupedItem.id}`}
                                                        className={`message-wrapper ${isAdminMessage ? "admin-side" : "alumni-side"} ${activeSearchId === groupedItem.id ? "search-active" : ""}`}
                                                    >
                                                        <div
                                                            className={`message-row ${isAdminMessage ? "admin-side" : "alumni-side"}`}
                                                        >
                                                            <div
                                                                className={`message-bubble ${isAdminMessage ? "admin-bubble" : "alumni-bubble"} ${isEditing ? "editing" : ""}`}
                                                                onDoubleClick={() =>
                                                                    !isEditing &&
                                                                    handleDoubleClick(
                                                                        groupedItem.id,
                                                                    )
                                                                }
                                                                onMouseDown={() =>
                                                                    !isEditing &&
                                                                    handleLongPressStart(
                                                                        groupedItem.id,
                                                                        groupedItem,
                                                                    )
                                                                }
                                                                onMouseUp={
                                                                    handleLongPressEnd
                                                                }
                                                                onMouseLeave={
                                                                    handleLongPressEnd
                                                                }
                                                                onTouchStart={() =>
                                                                    !isEditing &&
                                                                    handleLongPressStart(
                                                                        groupedItem.id,
                                                                        groupedItem,
                                                                    )
                                                                }
                                                                onTouchEnd={
                                                                    handleLongPressEnd
                                                                }
                                                            >
                                                                {renderMessageImage(
                                                                    groupedItem.image_path,
                                                                    groupedItem.isOptimistic,
                                                                    groupedItem.image_url,
                                                                )}

                                                                {isEditing
                                                                    ? renderInlineEditInput(
                                                                          groupedItem,
                                                                      )
                                                                    : groupedItem.message && (
                                                                          <p>
                                                                              {highlightMatch(
                                                                                  groupedItem.message,
                                                                              )}
                                                                              {!!groupedItem.is_edited &&
                                                                                  shouldShowEditIndicator(
                                                                                      groupedItem,
                                                                                  ) && (
                                                                                      <span className="edited-indicator">
                                                                                          {" "}
                                                                                          (edited)
                                                                                      </span>
                                                                                  )}
                                                                          </p>
                                                                      )}

                                                                {/* Show reactions */}
                                                                {messageReactions[
                                                                    groupedItem
                                                                        .id
                                                                ] &&
                                                                    messageReactions[
                                                                        groupedItem
                                                                            .id
                                                                    ].length >
                                                                        0 && (
                                                                        <div className="message-reactions">
                                                                            {messageReactions[
                                                                                groupedItem
                                                                                    .id
                                                                            ].map(
                                                                                (
                                                                                    reaction,
                                                                                    idx,
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        className="reaction-badge"
                                                                                    >
                                                                                        {
                                                                                            reaction
                                                                                        }
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                {!isEditing && (
                                                                    <div className="message-meta">
                                                                        <span className="message-time">
                                                                            {formatTime(
                                                                                groupedItem.created_at,
                                                                            )}
                                                                        </span>
                                                                        {isAdminMessage && (
                                                                            <span
                                                                                className="read-status"
                                                                                title={formatReadReceipt(
                                                                                    groupedItem,
                                                                                )}
                                                                            >
                                                                                {groupedItem.is_read
                                                                                    ? "✓✓"
                                                                                    : "✓"}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form
                                    className="message-input-form composer-v2"
                                    onSubmit={requestSendAdminMessage}
                                >
                                    {imagePreview && (
                                        <div className="image-preview">
                                            <img
                                                src={
                                                    imagePreview ||
                                                    "/placeholder.svg"
                                                }
                                                alt="Preview"
                                            />
                                            <button
                                                type="button"
                                                onClick={clearImagePreview}
                                                className="clear-image-btn"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    <div className="composer-stack">
                                        {/* TOP: text area so chat + typing stay visible */}
                                        <textarea
                                            ref={inputRef}
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                handleAdminTyping();
                                            }}
                                            placeholder="Type a message..."
                                            disabled={sending}
                                            className="alumni-message-input composer-textarea"
                                            rows={1}
                                        />

                                        {/* BOTTOM: actions row */}
                                        <div className="composer-actions">
                                            <input
                                                type="file"
                                                ref={imageInputRef}
                                                onChange={handleImageSelect}
                                                accept="image/jpeg,image/png,image/jpg"
                                                style={{ display: "none" }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    imageInputRef.current?.click()
                                                }
                                                className="image-upload-btn composer-icon-btn"
                                                title="Upload image (JPG/PNG only, max 5MB)"
                                                aria-label="Attach image"
                                            >
                                                📂
                                            </button>

                                            <label
                                                className="email-checkbox-label composer-email-toggle"
                                                title="Also send this message to the alumni's email"
                                            >
                                                <input
                                                    type="checkbox"
                                                    id="sendToEmail"
                                                    checked={sendToEmail}
                                                    onChange={(e) =>
                                                        setSendToEmail(
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <span className="email-checkbox-text">
                                                    <span
                                                        className="composer-email-icon"
                                                        aria-hidden="true"
                                                    >
                                                        ✉️
                                                    </span>
                                                    <span className="composer-email-label">
                                                        Notify via email
                                                    </span>
                                                </span>
                                            </label>

                                            <button
                                                type="submit"
                                                disabled={
                                                    (!newMessage.trim() &&
                                                        !selectedImage) ||
                                                    sending
                                                }
                                                className="send-btn composer-send-btn"
                                                aria-label="Send message"
                                            >
                                                {sending ? "…" : "➤"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                <div className="no-chat-icon">💬</div>
                                <h3>
                                    {activeTab === "alumni"
                                        ? "Select an alumni to view details or start messaging"
                                        : "Select a conversation to continue"}
                                </h3>
                                <p>
                                    {activeTab === "alumni"
                                        ? "Click on an alumni from the list to view their profile details"
                                        : "Choose a conversation from the list to view and send messages"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {showAlumniDetailsModal && alumniPreviewData && (
                    <AlumniDetails
                        visible={showAlumniDetailsModal}
                        onCancel={closeAlumniDetailsModal}
                        previewData={alumniPreviewData}
                        viewOnly={true}
                    />
                )}

                {/* Lightbox — rendered via portal directly on <body> so the
                    close/download buttons always sit above the admin
                    MainLayout header, even on mobile portrait. */}
                {lightboxImage &&
                    createPortal(
                        <div className="image-lightbox" onClick={closeLightbox}>
                            <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="lightbox-close"
                                    onClick={closeLightbox}
                                    title="Close image"
                                    aria-label="Close image"
                                >
                                    ×
                                </button>

                                {isAdmin && (
                                    <button
                                        className="lightbox-download"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            downloadImage(lightboxImage);
                                        }}
                                        title="Download image"
                                        aria-label="Download image"
                                    >
                                        ⬇
                                    </button>
                                )}
                            </div>

                            <div className="lightbox-image-wrap">
                                <img
                                    src={lightboxImage || "/placeholder.svg"}
                                    alt="Full size"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>,
                        document.body
                    )}

                {/* Delete Confirmation Modal */}
                {renderDeleteModal()}

                {/* Restrict Confirmation Modal */}
                {renderRestrictModal()}

                {/* Message Action Modal */}
                {renderMessageActionModal()}

                {/* Delete Confirmation Modal (Black Theme) */}
                {renderDeleteConfirmModal()}

                {/* ==== ENHANCEMENT MODALS (additive) ==== */}

                {/* Draft Restore Prompt */}
                {draftRestorePrompt && (
                    <div className="modal-overlay" onClick={discardDraft}>
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <span className="modal-icon">📝</span>
                                <h3>Unsent Message Found</h3>
                            </div>
                            <div className="modal-body">
                                <p>
                                    You have an unsent draft for this
                                    conversation. Would you like to continue
                                    where you left off?
                                </p>
                                {draftRestorePrompt.draft?.text && (
                                    <p className="modal-info draft-preview">
                                        “
                                        {draftRestorePrompt.draft.text.slice(
                                            0,
                                            140,
                                        )}
                                        {draftRestorePrompt.draft.text.length >
                                        140
                                            ? "…"
                                            : ""}
                                        ”
                                    </p>
                                )}
                                {draftRestorePrompt.draft?.imagePreview && (
                                    <p className="modal-info">
                                        📎 Includes an image attachment
                                    </p>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="modal-btn cancel"
                                    onClick={discardDraft}
                                >
                                    Discard Draft
                                </button>
                                <button
                                    className="modal-btn primary"
                                    onClick={continueDraft}
                                >
                                    Continue Draft
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conversation Switch Protection */}
                {pendingSwitch && (
                    <div
                        className="modal-overlay"
                        onClick={confirmSwitchContinueEditing}
                    >
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <span className="modal-icon">✉️</span>
                                <h3>Unsent Message</h3>
                            </div>
                            <div className="modal-body">
                                <p>
                                    You have an unsent message in the current
                                    conversation. What would you like to do
                                    before switching?
                                </p>
                            </div>
                            <div className="modal-actions modal-actions-stacked">
                                <button
                                    className="modal-btn cancel"
                                    onClick={confirmSwitchContinueEditing}
                                >
                                    Continue Editing
                                </button>
                                <button
                                    className="modal-btn primary"
                                    onClick={confirmSwitchSaveDraft}
                                >
                                    Save as Draft & Switch
                                </button>
                                <button
                                    className="modal-btn danger"
                                    onClick={confirmSwitchDiscard}
                                >
                                    Discard & Switch
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Send Confirmation (image attachments) */}
                {sendConfirm && (
                    <div
                        className="modal-overlay"
                        onClick={() => setSendConfirm(null)}
                    >
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <span className="modal-icon">📨</span>
                                <h3>Send Message?</h3>
                            </div>
                            <div className="modal-body">
                                {imagePreview && (
                                    <div className="send-confirm-preview">
                                        <img
                                            src={
                                                imagePreview ||
                                                "/placeholder.svg"
                                            }
                                            alt="Attachment preview"
                                        />
                                    </div>
                                )}
                                <p>
                                    Send this message
                                    {selectedImage
                                        ? " with the attached image"
                                        : ""}{" "}
                                    to{" "}
                                    <strong>
                                        {selectedConversation?.alumni_name}
                                    </strong>
                                    {selectedConversation?.alumni_email
                                        ? ` (${selectedConversation.alumni_email})`
                                        : ""}
                                    ?
                                </p>
                                {newMessage.trim() && (
                                    <p className="modal-info">
                                        “{newMessage.trim().slice(0, 140)}”
                                    </p>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="modal-btn cancel"
                                    onClick={() => setSendConfirm(null)}
                                    disabled={sending}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="modal-btn primary"
                                    onClick={confirmSendNow}
                                    disabled={sending}
                                >
                                    {sending ? "Sending..." : "Send Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Archive Confirmation */}
                {archivePrompt != null && (
                    <div
                        className="modal-overlay"
                        onClick={() => setArchivePrompt(null)}
                    >
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <span className="modal-icon">🗄️</span>
                                <h3>Archive Conversation?</h3>
                            </div>
                            <div className="modal-body">
                                <p>
                                    This conversation will be moved to the
                                    Archive tab. No messages will be deleted.
                                </p>
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="modal-btn cancel"
                                    onClick={() => setArchivePrompt(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="modal-btn primary"
                                    onClick={confirmArchive}
                                >
                                    Archive
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Action Confirmation */}
                {bulkConfirm && (
                    <div
                        className="modal-overlay"
                        onClick={() => !bulkLoading && setBulkConfirm(null)}
                    >
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <span className="modal-icon">⚙️</span>
                                <h3>Confirm Bulk Action</h3>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Are you sure you want to{" "}
                                    <strong>
                                        {bulkActionLabel(bulkConfirm.action)}
                                    </strong>{" "}
                                    <strong>{bulkConfirm.count}</strong>{" "}
                                    selected conversation(s)?
                                </p>
                                {bulkConfirm.action === "delete" && (
                                    <p className="modal-warning">
                                        This action cannot be undone.
                                    </p>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="modal-btn cancel"
                                    onClick={() => setBulkConfirm(null)}
                                    disabled={bulkLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`modal-btn ${bulkConfirm.action === "delete" ? "danger" : "primary"}`}
                                    onClick={executeBulkAction}
                                    disabled={bulkLoading}
                                >
                                    {bulkLoading ? "Processing..." : "Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminAlumniMessages;