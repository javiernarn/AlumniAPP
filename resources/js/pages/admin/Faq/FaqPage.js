"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Row, Col, Card, Input, Typography, Collapse, Tag, Button, Empty, Tooltip, Space, Badge,
} from "antd"
import {
  SearchOutlined, QuestionCircleOutlined, AppstoreOutlined, UserOutlined, CalendarOutlined,
  PictureOutlined, SolutionOutlined, IdcardOutlined, SafetyCertificateOutlined, MessageOutlined,
  BulbOutlined, RocketOutlined, MailOutlined, CheckCircleOutlined, ThunderboltOutlined,
  ArrowRightOutlined, FireOutlined,
} from "@ant-design/icons"
import { Layout } from "~/components"
import logo from "~/assets/images/OCC_LOGO.png"
import ScrollProgressOrb from "../ScrollProgress/ScrollProgressOrb"
import "./FaqPage.css"

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

const CATEGORIES = [
  { key: "all", label: "All Topics", icon: <AppstoreOutlined /> },
  { key: "account", label: "Account & Login", icon: <SafetyCertificateOutlined /> },
  { key: "registration", label: "Registration", icon: <IdcardOutlined /> },
  { key: "profile", label: "Profile & Password", icon: <UserOutlined /> },
  { key: "alumni", label: "Alumni Directory", icon: <UserOutlined /> },
  { key: "events", label: "Events", icon: <CalendarOutlined /> },
  { key: "jobs", label: "Job Posts", icon: <SolutionOutlined /> },
  { key: "quizzes", label: "Quizzes & Feedback", icon: <BulbOutlined /> },
  { key: "gallery", label: "Gallery", icon: <PictureOutlined /> },
  { key: "support", label: "Help & Support", icon: <MessageOutlined /> },
]

const FAQS = [
  // ---------- ACCOUNT & LOGIN ----------
  { cat: "account", q: "How do I log in to the Alumni Tracing Management System?", a: "Go to the login page and enter the email and password you used during registration. The system supports a light and dark theme toggle, and your session is securely stored so you can resume where you left off.", tags: ["Login", "Theme", "Session"] },
  { cat: "account", q: "I forgot my password. How can I reset it?", a: "On the login form, click ‘Forgot Password’. Enter your registered email and the system will send a secure reset link so you can set a new password before returning to login.", tags: ["Password", "Recovery"] },
  { cat: "account", q: "Why was my login rejected?", a: "This is usually caused by an incorrect email or password. Double-check your credentials and try again. If your account is still being reviewed for verification, please wait for approval or reach out through the Messages page.", tags: ["Error", "Access"] },

  // ---------- REGISTRATION ----------
  { cat: "registration", q: "How do I register as an alumnus?", a: "Open the Alumni Registration page and complete each step: Personal Info, Academic Info, Career Info, Documents, and Review & Submit. The form validates your inputs as you go, and a progress indicator shows how close you are to finishing.", tags: ["Sign Up", "Onboarding"] },
  { cat: "registration", q: "What information do I need to prepare before registering?", a: "Have your full name, contact details, course (e.g. BSIT, BSED, BEED, BSBA), graduation year, current employment status, valid ID documents, and a clear profile photo ready. Optional links such as LinkedIn or GitHub can also be added.", tags: ["Profile", "Requirements"] },
  { cat: "registration", q: "What happens after I submit my registration?", a: "Your submitted details and documents are placed under review for verification. Once approved, you'll be able to log in and access your full alumni account.", tags: ["Verification", "Status"] },
  { cat: "registration", q: "Can I edit my profile after registering?", a: "After logging in, you can edit your Contact Information and Career Information anytime. For security reasons, changes to your Profile Photo and Documents are handled by the Alumni Office — send a request through the Messages page.", tags: ["Profile", "Update"] },

  // ---------- PROFILE & PASSWORD ----------
  { cat: "profile", q: "How do I view my alumni profile?", a: "After logging in, open the Profile page from the user menu. It displays your Basic Information (name, email, and membership date), along with your Personal, Contact, Academic, and Professional Information in organized sections. Click 'View Full Details' to see your Profile Photo and uploaded Documents.", tags: ["Profile", "View"] },
  { cat: "profile", q: "How can I edit my personal and professional information?", a: "On the Profile page, click the Edit button to switch into edit mode. You can update your name, birth date, gender, bio, contact details, address, academic info (student ID, graduation year, honors, thesis), and professional info (company, job title, industry, years of experience, salary range, work location). Click Save to apply changes or Cancel to discard them.", tags: ["Edit", "Update"] },
  { cat: "profile", q: "What happens when I click Save on my profile?", a: "Your edited values are sent securely to the server and your profile is refreshed automatically. If everything is valid, you’ll see a success message. If something is wrong (e.g. invalid email or missing required field), validation messages will guide you to fix it.", tags: ["Save", "Validation"] },
  { cat: "profile", q: "Does the Profile page support dark mode?", a: "Yes. The Profile page syncs with the global theme. If you switch to the dark theme from anywhere in the app, your preference is stored securely and applied automatically the next time you log in.", tags: ["Theme", "Dark Mode"] },
  { cat: "profile", q: "How do I change my password?", a: "From your Profile page, click the Change Password option. A secure panel will open where you enter your current password, your new password, and a confirmation. The system shows a real-time strength meter (Weak / Medium / Strong) as you type.", tags: ["Password", "Security"] },
  { cat: "profile", q: "What are the password requirements?", a: "Your new password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number. A checklist shows which requirements you’ve already met as you type.", tags: ["Password", "Rules"] },
  { cat: "profile", q: "Why does my new password get rejected even if it’s long?", a: "Length alone isn’t enough. Make sure it also contains an uppercase letter (A–Z), a lowercase letter (a–z), and a number (0–9). The confirmation field must also match exactly.", tags: ["Password", "Error"] },
  { cat: "profile", q: "Is my password change secure?", a: "Yes. Passwords are never stored in plain text. Your current password is verified before any change is made, and the form automatically clears sensitive fields after closing.", tags: ["Security", "Privacy"] },

  // ---------- ALUMNI DIRECTORY ----------
  { cat: "alumni", q: "How can I browse other alumni?", a: "Open the Alumni page to browse fellow graduates, organized by course. You can search by name and filter by employment status to find and reconnect with batchmates.", tags: ["Directory", "Search"] },
  { cat: "alumni", q: "Why does the system ask for my employment status?", a: "Keeping your employment and career information up to date helps the Alumni Office understand where graduates are today and share opportunities and updates that are relevant to you.", tags: ["Profile", "Employment"] },

  // ---------- EVENTS ----------
  { cat: "events", q: "How do I view upcoming alumni events?", a: "The Events page lists all upcoming activities such as job fairs, reunions, and seminars. Each event card shows the date, time, location, and number of registered attendees.", tags: ["Events", "Calendar"] },
  { cat: "events", q: "How can I join an event?", a: "Open an event from the list and click 'Register Now'. You’ll see a confirmation once you're registered, and the event will show as 'Registered' in the list.", tags: ["RSVP", "Participation"] },
  { cat: "events", q: "Can I cancel my event registration?", a: "If you registered by mistake or can no longer attend, reach out to the Alumni Office through the Messages page and they can assist you.", tags: ["Cancel", "Support"] },

  // ---------- JOB POSTS ----------
  { cat: "jobs", q: "Where can I find job opportunities?", a: "The Job Posts page shows verified openings shared by the institution and partner companies. You can search, filter by industry, and view full details such as salary range, location, and required qualifications.", tags: ["Career", "Jobs"] },
  { cat: "jobs", q: "Are the job postings verified?", a: "Yes. All job listings are reviewed and published by the Alumni Office before they appear on the Job Posts page, so you can browse them with confidence.", tags: ["Verified", "Trust"] },

  // ---------- QUIZZES & FEEDBACK ----------
  { cat: "quizzes", q: "What are the quizzes for?", a: "After logging in, you may be asked to complete two short activities — a rating-style quiz and an image-based quiz. These help the Alumni Office learn about your experience and improve programs and services for graduates.", tags: ["Survey", "Feedback"] },
  { cat: "quizzes", q: "Do I need to complete the quizzes?", a: "Yes, they only take a few minutes. A reminder will appear after login until both quizzes are completed.", tags: ["Reminder", "Quiz"] },
  { cat: "quizzes", q: "Are my quiz answers kept private?", a: "Your responses are linked to your account for record-keeping, but they are handled confidentially and used only to improve alumni programs and services.", tags: ["Privacy", "Quiz"] },

  // ---------- GALLERY ----------
  { cat: "gallery", q: "What is the Gallery section for?", a: "The Gallery showcases highlights from alumni events, reunions, seminars, and milestones. You can browse images and view them in full screen.", tags: ["Media", "Photos"] },
  { cat: "gallery", q: "Can I submit photos to the Gallery?", a: "The Gallery is curated by the Alumni Office. If you'd like to share photos from an event, send them through the Messages page and the team will consider adding them.", tags: ["Upload", "Support"] },

  // ---------- SUPPORT ----------
  { cat: "support", q: "How can I report a bug or request a feature?", a: "Use the Messages page to reach out to the Alumni Office. Please include a short description and, if possible, a screenshot — it helps resolve issues faster.", tags: ["Bug", "Feedback"] },
  { cat: "support", q: "Is my data safe in this system?", a: "Yes. The system uses secure authentication and encrypted storage to protect your account and personal information. Only authorized staff can access your records.", tags: ["Security", "Privacy"] },
  { cat: "support", q: "Does the system work on mobile devices?", a: "Absolutely. The interface is fully responsive — registration, events, jobs, gallery, and quizzes all adapt to phones and tablets, with the same dark/light theme support.", tags: ["Mobile", "Responsive"] },
]

const FaqPage = () => {
  const [revealed, setRevealed] = useState(false)
  const [activeCat, setActiveCat] = useState("all")
  const [query, setQuery] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 60)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FAQS.filter((f) => {
      const matchCat = activeCat === "all" || f.cat === activeCat
      if (!matchCat) return false
      if (!q) return true
      return (
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        (f.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [activeCat, query])

  const countsByCat = useMemo(() => {
    const map = { all: FAQS.length }
    FAQS.forEach((f) => { map[f.cat] = (map[f.cat] || 0) + 1 })
    return map
  }, [])

  const highlight = (text) => {
    const q = query.trim()
    if (!q) return text
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig")
    const parts = text.split(re)
    return parts.map((p, i) =>
      re.test(p) ? (
        <mark key={i} className="faq-mark">{p}</mark>
      ) : (
        <React.Fragment key={i}>{p}</React.Fragment>
      ),
    )
  }

  return (
    <Layout>
      <div className={`faq-page ${revealed ? "is-revealed" : ""}`}>
        {/* <div className="faq-container"> */}
        {/* <div className="faq-wrapper">  */}
 <ScrollProgressOrb />
        {/* ============ HERO ============ */}
        <section className="faq-hero">
          <div className="faq-hero__bg" aria-hidden>
            <span className="blob blob-1" />
            <span className="blob blob-2" />
            <span className="blob blob-3" />
            <div className="dot-grid" />
          </div>

          <div className="faq-hero__content">
            <div className="faq-hero__brand">
              <img src={logo} alt="OCC Logo" className="faq-hero__logo" />
              <div className="faq-hero__brand-meta">
                <Tag className="faq-chip" icon={<QuestionCircleOutlined />}>
                  HELP CENTER
                </Tag>
                <Text className="faq-hero__eyebrow">
                  Alumni Tracing Management System
                </Text>
              </div>
            </div>

            <Title className="faq-hero__title">
              Got a question?{" "}
              <span className="grad-text">We’ve got answers.</span>
            </Title>

            <Paragraph className="faq-hero__lead">
              Browse the most asked questions from fellow alumni — from
              registration and your profile to events, job posts, quizzes,
              and the gallery.
            </Paragraph>

            <div className="faq-search">
              <Input
                size="large"
                allowClear
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a question, keyword, or topic…"
                prefix={<SearchOutlined className="faq-search__icon" />}
                className="faq-search__input"
              />
              <Tag className="faq-search__hint">
                <ThunderboltOutlined /> {filtered.length} match
                {filtered.length === 1 ? "" : "es"}
              </Tag>
            </div>

            <div className="faq-pills">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  className={`faq-pill ${activeCat === c.key ? "is-active" : ""}`}
                  onClick={() => setActiveCat(c.key)}
                >
                  <span className="faq-pill__icon">{c.icon}</span>
                  <span className="faq-pill__label">{c.label}</span>
                  <Badge
                    count={countsByCat[c.key] || 0}
                    showZero
                    overflowCount={99}
                    className="faq-pill__badge"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ============ MAIN GRID ============ */}
        <section className="faq-section">
          <Row gutter={[24, 24]}>
            {/* Sidebar */}
            <Col xs={24} md={8} lg={7}>
              <Card className="faq-sidebar">
                <div className="faq-sidebar__header">
                  <Title level={5} className="faq-sidebar__title">
                    <AppstoreOutlined /> Categories
                  </Title>
                  <Text className="faq-sidebar__sub">
                    Filter by what you need.
                  </Text>
                </div>

                <ul className="faq-cats">
                  {CATEGORIES.map((c) => (
                    <li
                      key={c.key}
                      className={`faq-cat ${activeCat === c.key ? "is-active" : ""}`}
                      onClick={() => setActiveCat(c.key)}
                    >
                      <span className="faq-cat__icon">{c.icon}</span>
                      <span className="faq-cat__label">{c.label}</span>
                      <span className="faq-cat__count">
                        {countsByCat[c.key] || 0}
                      </span>
                      <ArrowRightOutlined className="faq-cat__arrow" />
                    </li>
                  ))}
                </ul>

                <div className="faq-tip">
                  <BulbOutlined className="faq-tip__icon" />
                  <div>
                    <Text strong className="faq-tip__title">Pro tip</Text>
                    <Text className="faq-tip__text">
                      Try keywords like “password”, “event”, or “job” for
                      faster results.
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Questions */}
            <Col xs={24} md={16} lg={17}>
              <div className="faq-list-header">
                <div>
                  <Tag className="section-chip">FREQUENTLY ASKED</Tag>
                  <Title level={3} className="faq-list-title">
                    {CATEGORIES.find((c) => c.key === activeCat)?.label || "All Topics"}
                  </Title>
                  <Text className="faq-list-sub">
                    {filtered.length} question
                    {filtered.length === 1 ? "" : "s"} found
                    {query ? ` for “${query}”` : ""}
                  </Text>
                </div>
                <Tooltip title="Reset filters">
                  <Button
                    className="faq-reset"
                    onClick={() => { setQuery(""); setActiveCat("all") }}
                  >
                    Reset
                  </Button>
                </Tooltip>
              </div>

              {filtered.length === 0 ? (
                <Card className="faq-empty-card">
                  <Empty
                    description={
                      <span>
                        No questions matched <b>“{query}”</b>. Try a
                        different keyword or category.
                      </span>
                    }
                  />
                </Card>
              ) : (
                <Collapse
                  accordion
                  bordered={false}
                  expandIconPosition="end"
                  className="faq-collapse"
                  defaultActiveKey={["k-0"]}
                >
                  {filtered.map((f, i) => (
                    <Panel
                      key={`k-${i}`}
                      header={
                        <div className="faq-panel-head">
                          <span className="faq-panel-num">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="faq-panel-q">
                            {highlight(f.q)}
                          </span>
                        </div>
                      }
                      className="faq-panel"
                    >
                      <Paragraph className="faq-answer">
                        {highlight(f.a)}
                      </Paragraph>
                      {f.tags?.length ? (
                        <Space wrap size={[6, 6]} className="faq-tags">
                          {f.tags.map((t) => (
                            <Tag key={t} className="faq-tag">#{t}</Tag>
                          ))}
                        </Space>
                      ) : null}
                    </Panel>
                  ))}
                </Collapse>
              )}
            </Col>
          </Row>
        </section>

        {/* ============ CONTACT CTA ============ */}
        <section className="faq-section faq-section--close">
          <Card className="faq-cta">
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={16}>
                <Tag className="section-chip section-chip--accent">
                  <FireOutlined /> STILL STUCK?
                </Tag>
                <Title level={3} className="faq-cta__title">
                  Can’t find the answer you’re looking for?
                </Title>
                <Paragraph className="faq-cta__text">
                  Reach out to the Alumni Office. Our team will get back to
                  you with the help you need — whether it’s account access,
                  event details, or technical issues.
                </Paragraph>
              </Col>
              <Col xs={24} md={8} className="faq-cta__actions">
                <Button
                  type="primary"
                  size="large"
                  icon={<MailOutlined />}
                  className="btn-primary-grad"
                  href="/messages"
                >
                  Contact Support
                </Button>
                <Button
                  size="large"
                  icon={<RocketOutlined />}
                  className="btn-ghost"
                  href="/about"
                >
                  Visit About Page
                </Button>
              </Col>
            </Row>

            <div className="faq-cta__meta">
              <span><CheckCircleOutlined /> Avg. reply within 24 hours</span>
              <span><SafetyCertificateOutlined /> Secure </span>
              <span><MessageOutlined /> occ.antiquina.joneejohn@gmail.com</span>
            </div>
          </Card>
        </section>

      </div>
      {/* </div> */}
      {/* </div>  */}
    </Layout>
  )
}

export default FaqPage