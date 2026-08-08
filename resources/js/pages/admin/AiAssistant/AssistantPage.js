"use client";

import React, { useState, useRef, useEffect } from "react";
import { Typography, Input, Button, Tooltip } from "antd";
import {
    RobotOutlined,
    SendOutlined,
    UserOutlined,
    CalendarOutlined,
    IdcardOutlined,
    PhoneOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import { Layout } from "~/components";
import "./AssistantPage.css";

const { Title, Text, Paragraph } = Typography;

/* ── Quick topics shown in the sidebar & empty state ───────────────────
   Each one pre-fills a starter question for the alumni to send.
   Edit freely to match the FAQs you actually want to support. */
const QUICK_TOPICS = [
    {
        key: "events",
        label: "Upcoming events",
        icon: <CalendarOutlined />,
        question: "What upcoming alumni events do you have?",
    },
    {
        key: "membership",
        label: "Membership",
        icon: <IdcardOutlined />,
        question: "How do I renew or update my alumni membership?",
    },
    {
        key: "contact",
        label: "Contact & support",
        icon: <PhoneOutlined />,
        question: "How can I get in touch with the alumni office?",
    },
    {
        key: "general",
        label: "General questions",
        icon: <QuestionCircleOutlined />,
        question: "What can you help me with?",
    },
];

/* Small helper: current time as "3:45 PM" without pulling in a date lib */
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AiAssistant() {
    const [revealed, setRevealed] = useState(false);
    const [messages, setMessages] = useState([]); // { id, role: 'user'|'assistant', text, time }
    const [draft, setDraft] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => setRevealed(true), 30);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    /* ── Sending a message ──────────────────────────────────────────────
       This is frontend-only for now: it echoes a placeholder reply so
       the UI/UX can be reviewed before the backend exists. Once the API
       endpoint is ready, replace the body of `getAssistantReply` with a
       real request, e.g.:

           const res = await axiosConfig.post("/admin/ai-assistant/chat", {
               message: text,
           });
           return res.data.reply;

       and make this function async (it already is), keeping the same
       try/catch/finally shape below. */
    async function getAssistantReply(text) {
        await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600));
        return `This is a placeholder reply while the backend isn't connected yet. You asked: "${text}"`;
    }

    async function handleSend(overrideText) {
        const text = (overrideText ?? draft).trim();
        if (!text || isTyping) return;

        const userMessage = {
            id: Date.now(),
            role: "user",
            text,
            time: formatTime(new Date()),
        };
        setMessages((prev) => [...prev, userMessage]);
        setDraft("");
        setIsTyping(true);

        try {
            const reply = await getAssistantReply(text);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    text: reply,
                    time: formatTime(new Date()),
                },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    text: "Sorry, something went wrong. Please try again in a moment.",
                    time: formatTime(new Date()),
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function handleReset() {
        setMessages([]);
        setDraft("");
    }

    return (
        <Layout>
        <div className={`aia-root ${revealed ? "aia-revealed" : ""}`}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="aia-header">
                <div className="aia-header-left">
                    <div className="aia-header-icon">
                        <RobotOutlined />
                    </div>
                    <div>
                        <Title level={4} className="aia-title">
                            Alumni AI Assistant
                        </Title>
                        <Paragraph className="aia-subtitle">
                            Answers alumni questions about events, membership, and support.
                        </Paragraph>
                    </div>
                </div>
                <span className="aia-status-pill">
                    <span className="aia-status-dot" />
                    Online
                </span>
            </div>

            {/* ── Body: chat + sidebar ───────────────────────────────── */}
            <div className="aia-body">
                <div className="aia-chat-panel">
                    <div className="aia-chat-scroll" ref={scrollRef}>
                        {messages.length === 0 ? (
                            <div className="aia-empty-state">
                                <div className="aia-empty-icon">
                                    <RobotOutlined />
                                </div>
                                <Title level={5} className="aia-empty-title">
                                    Hi! How can I help today?
                                </Title>
                                <Paragraph className="aia-empty-text">
                                    Ask me about events, membership, or how to reach the
                                    alumni office — or pick a topic to get started.
                                </Paragraph>
                                <div className="aia-suggested-chips">
                                    {QUICK_TOPICS.map((topic) => (
                                        <button
                                            key={topic.key}
                                            type="button"
                                            className="aia-chip"
                                            onClick={() => handleSend(topic.question)}
                                        >
                                            {topic.icon}
                                            {topic.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`aia-message-row aia-message-row--${msg.role}`}
                                >
                                    <div className="aia-avatar">
                                        {msg.role === "assistant" ? (
                                            <RobotOutlined />
                                        ) : (
                                            <UserOutlined />
                                        )}
                                    </div>
                                    <div className={`aia-bubble aia-bubble--${msg.role}`}>
                                        {msg.text}
                                        <span className="aia-bubble-time">{msg.time}</span>
                                    </div>
                                </div>
                            ))
                        )}

                        {isTyping && (
                            <div className="aia-message-row aia-message-row--assistant">
                                <div className="aia-avatar">
                                    <RobotOutlined />
                                </div>
                                <div className="aia-bubble aia-bubble--assistant">
                                    <span className="aia-typing-dots">
                                        <span />
                                        <span />
                                        <span />
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="aia-composer">
                        <div className="aia-composer-input">
                            <Input.TextArea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your question..."
                                autoSize={{ minRows: 1, maxRows: 4 }}
                            />
                        </div>
                        <Tooltip title="Send">
                            <Button
                                className="aia-composer-send"
                                icon={<SendOutlined />}
                                onClick={() => handleSend()}
                                disabled={!draft.trim() || isTyping}
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* ── Sidebar ────────────────────────────────────────── */}
                <div className="aia-sidebar">
                    <div className="aia-sidebar-card">
                        <Text className="aia-sidebar-title">Quick topics</Text>
                        <div className="aia-topic-list">
                            {QUICK_TOPICS.map((topic) => (
                                <div
                                    key={topic.key}
                                    className="aia-topic-item"
                                    onClick={() => handleSend(topic.question)}
                                >
                                    <span className="aia-topic-icon">{topic.icon}</span>
                                    {topic.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="aia-sidebar-card">
                        <Text className="aia-sidebar-title">About</Text>
                        <Paragraph className="aia-sidebar-about-text">
                            This assistant helps alumni with common questions. For anything
                            it can't answer, it'll point you to the alumni office directly.
                        </Paragraph>
                        <Button
                            className="aia-sidebar-reset"
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            disabled={messages.length === 0}
                        >
                            Clear conversation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </Layout>
    );
}