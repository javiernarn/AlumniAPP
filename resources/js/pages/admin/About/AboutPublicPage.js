"use client"
import { useEffect, useState, useRef } from "react"
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Divider,
  Button,
  Tooltip,
} from "antd"
import {
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  CalendarOutlined,
  SolutionOutlined,
  MessageOutlined,
  BellOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  BankOutlined,
  LineChartOutlined,
  GlobalOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons"
import logo from "~/assets/images/OCC_LOGO.png"
import { useAppTheme } from "~/hooks/useAppTheme"
import ScrollProgressOrb from "../ScrollProgress/ScrollProgressOrb"
import "./AboutPage.css"

const { Title, Text, Paragraph } = Typography

// ===== System feature catalog (Alumni-facing) =====
const FEATURES = [
  {
    icon: <SafetyCertificateOutlined />,
    title: "Secure Login & Registration",
    desc: "Create your alumni account through a guided, step-by-step registration — Personal Info, Academic Info, Career Info, Documents, and Review & Submit — with your details kept safe behind secure sign-in.",
    color: "#4f46e5",
  },
  {
    icon: <UserOutlined />,
    title: "My Profile Management",
    desc: "View and update your personal, contact, academic, and professional information anytime. Upload your profile photo and keep your details current so the Alumni Office can stay in touch.",
    color: "#0ea5e9",
  },
  {
    icon: <TeamOutlined />,
    title: "Alumni Directory",
    desc: "Browse fellow graduates organized by course, search by name, and filter by employment status to reconnect with batchmates and see who else is part of the alumni community.",
    color: "#10b981",
  },
  {
    icon: <CalendarOutlined />,
    title: "Events & Activities",
    desc: "See upcoming reunions, seminars, workshops, and job fairs with full details — date, time, venue, and available slots — and register to join with just a click.",
    color: "#ef4444",
  },
  {
    icon: <SolutionOutlined />,
    title: "Job & Career Opportunities",
    desc: "Browse verified job openings shared by the institution and its partners, complete with salary range, location, and requirements, to help you find your next career move.",
    color: "#06b6d4",
  },
  {
    icon: <MessageOutlined />,
    title: "Messaging with the Alumni Office",
    desc: "Send inquiries, requests, or concerns directly to the Alumni Office and receive responses right inside the system — no need for a separate email thread.",
    color: "#ec4899",
  },
  {
    icon: <BellOutlined />,
    title: "Real-Time Notifications",
    desc: "Get instant alerts for event registrations, profile updates, account status, and quiz reminders, so you never miss anything important.",
    color: "#f97316",
  },
  {
    icon: <PictureOutlined />,
    title: "Photo Gallery",
    desc: "Relive memories through photos from past alumni gatherings, reunions, and institutional activities in an easy-to-browse image gallery.",
    color: "#22c55e",
  },
  {
    icon: <QuestionCircleOutlined />,
    title: "Feedback Quizzes",
    desc: "Complete short rating and image-based quizzes so the Alumni Office can better understand your experience and improve programs and services for graduates.",
    color: "#a855f7",
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Account & Password Security",
    desc: "Change your password anytime with a real-time strength meter, or securely reset it through a verified email link if you ever forget it.",
    color: "#0f766e",
  },
]
// ===== Page descriptions (Alumni-facing) =====
const PAGES = [
  { name: "Login Page", desc: "Sign in securely with your registered email and password to access your alumni account." },
  { name: "Alumni Registration", desc: "A guided sign-up process where you submit your personal, academic, career, and document details for verification." },
  { name: "Home", desc: "Your starting point after logging in — quick access to the features and updates that matter to you." },
  { name: "My Profile", desc: "View and edit your personal, contact, academic, and professional information, plus manage your password." },
  { name: "Alumni Directory", desc: "Browse and search fellow graduates by course, name, or employment status to stay connected." },
  { name: "Events", desc: "Discover upcoming alumni activities and register to attend seminars, reunions, and other gatherings." },
  { name: "Job Posts", desc: "Explore job openings shared by the institution and partner companies and view full posting details." },
  { name: "Messages", desc: "Send and receive messages directly with the Alumni Office for any questions or concerns." },
  { name: "Notifications", desc: "Check alerts about your registrations, profile updates, account status, and reminders." },
  { name: "Gallery", desc: "Browse photos from alumni events, reunions, and institutional activities." },
  { name: "Quizzes", desc: "Answer short rating and image-based quizzes shared by the Alumni Office to give your feedback." },
  { name: "FAQ", desc: "Find quick answers to the most common questions about using the system." },
  { name: "About", desc: "Learn more about the purpose and features of the Alumni Tracing Management System." },
]

// ===== Goals =====
const GOALS = [
  { icon: <HeartOutlined />, text: "Maintain strong, lasting connections between alumni and the institution" },
  { icon: <GlobalOutlined />, text: "Open doors to career opportunities and professional networking for graduates" },
  { icon: <MessageOutlined />, text: "Make it easy to reach the Alumni Office and stay informed" },
  { icon: <LineChartOutlined />, text: "Keep alumni profiles simple and effortless to update" },
  { icon: <TeamOutlined />, text: "Help graduates reconnect with batchmates and their alma mater" },
  { icon: <ThunderboltOutlined />, text: "Provide a fast, secure, and mobile-friendly alumni experience" },
]
const AboutPublicPage = () => {
  const [revealed, setRevealed] = useState(false)

  const featuresRef = useRef(null)
  const pagesRef = useRef(null)
  const summaryRef = useRef(null)

    const handleBackToLogin = () => {
            window.location.href = "/login";
            return;
        }

          //  Prevent //
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

  // ============ THEME SYNC FROM FORMLOGIN ============
  // Now backed by the shared useAppTheme hook (same cookie + secureLocalStorage
  // + BroadcastChannel sync used by FormLogin), instead of a hand-rolled
  // localStorage listener.
  const { theme: currentTheme, toggleTheme } = useAppTheme();
  // ============ END THEME SYNC ============

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Same pattern as the currentView switch in FormLogin.js — set the
  // browser tab title for this public page.
  useEffect(() => {
    document.title = "Public About | Opol Community College"
  }, [])

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  
  return (
    <>
      <div className="page-theme-toggle">
        <button
          type="button"
          className="page-theme-toggle__btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {currentTheme === "black" ? (
            <MoonOutlined />
          ) : (
            <SunOutlined />
          )}
        </button>
        <style>{`
        /* ============ Theme toggle (synced with FormLogin) ============ */
        .page-theme-toggle {
            position: fixed; top: 20px; right: 20px; z-index: 1000;
        }
        .page-theme-toggle__btn {
            width: 48px; height: 48px;
            border-radius: 50%;
            display: inline-flex; align-items: center; justify-content: center;
            cursor: pointer;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #4f46e5;
            box-shadow: 0 4px 14px rgba(2, 6, 23, 0.10);
            transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                        box-shadow 0.25s ease, border-color 0.2s;
        }
        .page-theme-toggle__btn:hover {
            transform: rotate(-8deg) scale(1.05);
            border-color: #4f46e5;
            box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.10),
                        0 10px 28px rgba(2, 6, 23, 0.18);
        }
        .page-theme-toggle__btn .anticon { font-size: 20px; }
        [data-theme="black"] .page-theme-toggle__btn {
            background: #121620;
            border-color: #303746;
            color: #60a5fa;
            box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        }
`}</style>
      </div>
      <div className={`about-page ${revealed ? "is-revealed" : ""}`}>
        {/* <div className="page-container">
        
                  <div className="page-wrapper"> */}
                    
        <ScrollProgressOrb />

        <div className="back-to-login-section">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToLogin}
            className="back-to-login-btn"
          >
            Back to Login
          </Button>
        </div>

        {/* ============ HERO ============ */}
        <section className="about-hero">
          <div className="about-hero__bg" aria-hidden="true">
            <span className="orb orb-1" />
            <span className="orb orb-2" />
            <span className="orb orb-3" />
            <div className="grid-overlay" />
          </div>
          <div className="about-hero__content">
            <div className="about-hero__brand">
              <img src={logo} alt="OCC Logo" className="about-hero__logo" />
              <div className="about-hero__brand-meta">
                <Tag className="about-chip" icon={<CheckCircleOutlined />}>
                  Official Institutional Platform
                </Tag>
                <Text className="about-hero__eyebrow">About the System</Text>
              </div>
            </div>
            <Title level={1} className="about-hero__title">
              Alumni Tracing <span className="grad-text">Management System</span>
            </Title>
            <Paragraph className="about-hero__lead">
              A modern web-based platform built to keep you connected with
              your alma mater. Register and manage your profile, discover
              events and job opportunities, browse fellow graduates, and
              stay in touch with the Alumni Office — all in one secure
              place.
            </Paragraph>
            <Space size={12} wrap className="about-hero__cta">
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                className="btn-primary-grad"
                onClick={() => scrollToSection(featuresRef)}
              >
                Explore Features
              </Button>
              <Button
                size="large"
                icon={<ArrowRightOutlined />}
                className="btn-ghost"
                onClick={() => scrollToSection(pagesRef)}
              >
                System Overview
              </Button>
              <Button
                size="large"
                icon={<ArrowRightOutlined />}
                className="btn-ghost"
                onClick={() => scrollToSection(summaryRef)}
              >
                Summary
              </Button>
            </Space>
            {/* Quick stats */}
            <Row gutter={[16, 16]} className="about-hero__stats">
              <Col xs={12} md={6}>
                <div className="stat-card">
                  <BankOutlined className="stat-icon" />
                  <div>
                    <Text className="stat-value">10+</Text>
                    <Text className="stat-label">Alumni Features</Text>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="stat-card">
                  <TeamOutlined className="stat-icon" />
                  <div>
                    <Text className="stat-value">24/7</Text>
                    <Text className="stat-label">Anytime Access</Text>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="stat-card">
                  <SafetyCertificateOutlined className="stat-icon" />
                  <div>
                    <Text className="stat-value">100%</Text>
                    <Text className="stat-label">Secure Access</Text>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="stat-card">
                  <BellOutlined className="stat-icon" />
                  <div>
                    <Text className="stat-value">Real-time</Text>
                    <Text className="stat-label">Notifications</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </section>
        {/* ============ OVERVIEW ============ */}
        <section className="about-section">
          <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} lg={14}>
              <Card className="about-card about-card--overview" bordered={false}>
                <Tag className="section-chip">Overview</Tag>
                <Title level={2} className="section-title">
                  Connecting graduates with their institution.
                </Title>
                <Paragraph className="section-paragraph">
                  The Alumni Tracing Management System is your online home
                  base for staying connected with the school after
                  graduation. It gives you one place to manage your profile,
                  discover what's happening on campus, and keep in touch with
                  the Alumni Office.
                </Paragraph>
                <Paragraph className="section-paragraph">
                  After a simple registration process, you can maintain your
                  personal, academic, and professional information, browse
                  the alumni directory to find batchmates, register for
                  upcoming events, and explore job opportunities shared by
                  the institution and its partners.
                </Paragraph>
                <Paragraph className="section-paragraph">
                  The platform also keeps you engaged through messaging,
                  real-time notifications, a photo gallery of past
                  activities, and short feedback quizzes — all protected by
                  secure authentication so your information stays safe.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card className="about-card about-card--goals" bordered={false}>
                <Tag className="section-chip section-chip--accent">Our Goals</Tag>
                <Title level={3} className="section-title">
                  What this system aims to achieve
                </Title>
                <ul className="goals-list">
                  {GOALS.map((g, i) => (
                    <li key={i} className="goal-item" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="goal-icon">{g.icon}</span>
                      <Text className="goal-text">{g.text}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          </Row>
        </section>
        {/* ============ FEATURES ============ */}
        <section className="about-section" ref={featuresRef}>
          <div className="section-header">
            <Tag className="section-chip" onClick={() => scrollToSection(featuresRef)}
            >System Features</Tag>
            <Title level={2} className="section-title">
              Everything you need as an alumnus, in one place
            </Title>
            <Paragraph className="section-subtitle">
              A complete set of tools designed for graduates — built for
              clarity, speed, and reliability.
            </Paragraph>
          </div>
          <Row gutter={[20, 20]}>
            {FEATURES.map((f, i) => (
              <Col xs={24} sm={12} lg={8} key={f.title}>
                <Card
                  className="feature-card"
                  bordered={false}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="feature-icon"
                    style={{
                      background: `linear-gradient(135deg, ${f.color}22, ${f.color}11)`,
                      color: f.color,
                      boxShadow: `0 8px 20px ${f.color}22`,
                    }}
                  >
                    {f.icon}
                  </div>
                  <Title level={4} className="feature-title">{f.title}</Title>
                  <Paragraph className="feature-desc">{f.desc}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
        {/* ============ PAGES ============ */}
        <section className="about-section" ref={pagesRef}>
          <div className="section-header">
            <Tag className="section-chip" onClick={() => scrollToSection(pagesRef)}
            >Pages &amp; Modules</Tag>
            <Title level={2} className="section-title">
              Inside the platform
            </Title>
            <Paragraph className="section-subtitle">
              A quick guide to the pages you'll use as an alumnus of the
              Alumni Tracing Management System.
            </Paragraph>
          </div>
          <Row gutter={[16, 16]}>
            {PAGES.map((p, i) => (
              <Col xs={24} sm={12} lg={8} key={p.name}>
                <Tooltip title={p.desc} placement="top">
                  <div className="page-item" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="page-item__index">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="page-item__body">
                      <Text strong className="page-item__name">{p.name}</Text>
                      <Text className="page-item__desc">{p.desc}</Text>
                    </div>
                    <ArrowRightOutlined className="page-item__arrow" />
                  </div>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </section>
        {/* ============ CLOSING ============ */}
        <section className="about-section about-section--close">
          <Card className="about-closing" bordered={false}>
            <div className="about-closing__content">
              <Tag className="section-chip section-chip--accent" ref={summaryRef}
              >In Summary</Tag>
              <Title level={2} className="section-title">
                A reliable platform for alumni excellence.
              </Title>
              <Paragraph className="section-paragraph">
                The Alumni Tracing Management System makes it simple to stay
                connected with your alma mater — manage your profile, join
                events, discover job opportunities, and reach the Alumni
                Office — helping graduates and the institution grow
                together.
              </Paragraph>
              <Divider className="about-divider" />
              <Space size={12} wrap>
                <Tag className="tech-tag">Secure Authentication</Tag>
                <Tag className="tech-tag">Real-time Notifications</Tag>
                <Tag className="tech-tag">Responsive Design</Tag>
                <Tag className="tech-tag">Easy Profile Updates</Tag>
                <Tag className="tech-tag">Modern Web Platform</Tag>
              </Space>
            </div>
          </Card>
        </section>
      </div>
      {/* </div>
      </div> */}
    </>
  )
}
export default AboutPublicPage