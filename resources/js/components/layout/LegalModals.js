"use client";

/**
 * LegalModals
 * ─────────────────────────────────────────────────────────────
 * Privacy Policy & Terms of Service modals, previously inlined
 * inside index.js (MainLayout). Pulled out here so index.js
 * doesn't carry ~430 lines of static legal copy.
 *
 * Content lives in the PRIVACY_SECTIONS / TERMS_SECTIONS arrays
 * below and is rendered with a single .map() per modal, instead
 * of one hand-written <div><Title/><Paragraph/></div> block per
 * section — add/edit/reorder a clause by editing the array, not
 * by touching JSX.
 *
 * Usage (in index.js):
 *   import LegalModals from "./LegalModals";
 *   ...
 *   <LegalModals
 *       isPrivacyModalOpen={isPrivacyModalOpen}
 *       setIsPrivacyModalOpen={setIsPrivacyModalOpen}
 *       isTermsModalOpen={isTermsModalOpen}
 *       setIsTermsModalOpen={setIsTermsModalOpen}
 *   />
 * ─────────────────────────────────────────────────────────────
 */

import React from "react";
import { Modal, Button, Space, Typography, Divider, Alert } from "antd";
import {
    SafetyCertificateOutlined,
    IdcardOutlined,
    TrophyOutlined,
    EyeOutlined,
    GlobalOutlined,
    ClockCircleOutlined,
    UserOutlined,
    MailOutlined,
    CheckCircleOutlined,
    BookOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

// ─────────────────────────────────────────────────────────────
//  CONTENT MAPPING — Privacy Policy
// ─────────────────────────────────────────────────────────────
const PRIVACY_SECTIONS = [
    {
        icon: <SafetyCertificateOutlined />,
        heading: "1. Who We Are",
        body: (
            <>
                This Privacy Policy is issued by the{" "}
                <strong>Opol Community College Alumni Office</strong>, in
                coordination with the{" "}
                <strong>Guidance and Counseling Office</strong>, both based
                at ZONE C. Salva St, Opol, 9016 Misamis Oriental. Together
                they act as the Personal Information Controller (PIC) for
                the alumni registration and tracing system found at
                alumni.occph.com, and are responsible for the lawful, fair,
                and transparent processing of your personal data.
            </>
        ),
    },
    {
        icon: <IdcardOutlined />,
        heading: "2. Information We Collect",
        body: (
            <>
                When you register, we collect personal information that you
                voluntarily provide, including your full name, birth date,
                gender, contact number, email address, and home address. We
                also collect academic records (course, student ID number,
                graduation year, honors, thesis title) and professional
                information (employer, job title, industry, years of
                experience, and work location). Uploaded files such as your
                profile photo, student/alumni ID, government-issued ID,
                diploma, or transcript may constitute{" "}
                <strong>sensitive personal information</strong> under
                Section 3(l) of RA 10173 and are treated with heightened
                protection.
            </>
        ),
    },
    {
        icon: <TrophyOutlined />,
        heading: "3. Role of the Guidance and Counseling Office",
        body: (
            <>
                The <strong>Guidance Counselor</strong>, through the
                Guidance and Counseling Office, collects and processes
                alumni data as part of the College's institutional tracer
                study and career-tracking program. This includes your
                employment status, employer information, and feedback from
                the rating and image-based quizzes. This data helps the
                Guidance Office assess graduate outcomes, recommend career
                and further-education pathways, refer qualified alumni to
                job opportunities, and report aggregated, de-identified
                statistics to school administration and, where required, to
                the Commission on Higher Education (CHED). The Guidance
                Counselor accesses only the information reasonably
                necessary for these functions and is bound by the same
                confidentiality obligations as Alumni Office staff.
            </>
        ),
    },
    {
        icon: <EyeOutlined />,
        heading: "4. Purpose and Legal Basis for Processing",
        body: (
            <>
                Your data is processed based on your{" "}
                <strong>consent</strong> (RA 10173, Sec. 12(a) and Sec.
                13(a) for sensitive information), given when you tick the
                registration consent box, and is used to: maintain accurate
                alumni records; conduct tracer studies and
                career/employment tracking through the Guidance Counselor;
                facilitate alumni networking, events, and job postings;
                send official updates and notifications; and improve Alumni
                Office and Guidance Office programs and services. We do not
                use your data for any purpose incompatible with these
                declared purposes, and we never sell your personal data.
            </>
        ),
    },
    {
        icon: <GlobalOutlined />,
        heading: "5. Disclosure and Sharing of Information",
        body: (
            <>
                Access to your personal data is limited to authorized
                Alumni Office and Guidance and Counseling Office personnel
                who need it to perform their official functions. Your
                profile is visible to other verified alumni only for
                directory and networking purposes; sensitive documents
                (IDs, diploma, transcript) are never shown to other alumni.
                We may share limited employment or contact information with
                prospective employers or partner organizations only with
                your explicit, separate consent, for job-referral purposes.
                We may also disclose information when required by law,
                court order, or a lawful request from CHED or another
                government agency.
            </>
        ),
    },
    {
        icon: <SafetyCertificateOutlined />,
        heading: "6. Data Protection and Security Measures",
        body: (
            <>
                We implement organizational, physical, and technical
                security measures proportionate to the nature of the data
                we hold, consistent with the NPC's security standards.
                These include encrypted storage, secure authentication,
                access controls restricted to authorized personnel, and
                regular review of our systems. In the event of a personal
                data breach that poses real risk to you, we will notify the
                National Privacy Commission and affected data subjects in
                accordance with RA 10173 and its IRR.
            </>
        ),
    },
    {
        icon: <ClockCircleOutlined />,
        heading: "7. Data Retention",
        body: (
            <>
                Your personal data is retained for as long as you remain an
                active alumni member and for a reasonable period thereafter
                for institutional record-keeping, tracer studies, and
                accreditation reporting, or as required by applicable law
                and school policy. Data that is no longer necessary for
                these purposes will be securely disposed of or anonymized.
            </>
        ),
    },
    {
        icon: <UserOutlined />,
        heading: "8. Your Rights as a Data Subject",
        body: (
            <>
                Under Section 16 of RA 10173, you have the right to: be
                informed that your data is being processed; access your
                personal data; request correction of inaccurate data;
                object to or withdraw consent for processing; request
                erasure or blocking of data that is incomplete, outdated,
                or unlawfully obtained; data portability; and to be
                indemnified for damages arising from unlawful processing.
                To exercise any of these rights, please contact the Alumni
                Office or Guidance and Counseling Office through the
                Messages page of this system, or visit our office at ZONE
                C. Salva St, Opol, 9016 Misamis Oriental. We will act on
                verified requests within a reasonable period, consistent
                with NPC guidelines.
            </>
        ),
    },
    {
        icon: <MailOutlined />,
        heading: "9. Complaints and Contact",
        body: (
            <>
                If you believe your personal data has been processed
                unlawfully, you may raise your concern with the Alumni
                Office first. You also have the right to file a complaint
                with the <strong>National Privacy Commission</strong> (
                <a
                    href="https://www.privacy.gov.ph"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    www.privacy.gov.ph
                </a>
                ) if the matter is not resolved to your satisfaction. We
                will notify you of any material changes to this Privacy
                Policy and, where required, seek your renewed consent
                before implementing them.
            </>
        ),
    },
];

// ─────────────────────────────────────────────────────────────
//  CONTENT MAPPING — Terms of Service
// ─────────────────────────────────────────────────────────────
const TERMS_SECTIONS = [
    {
        icon: <CheckCircleOutlined />,
        heading: "1. Acceptance of Terms",
        body: (
            <>
                These Terms of Service govern your use of the Opol
                Community College Alumni Information System
                (alumni.occph.com), operated by the{" "}
                <strong>Alumni Office</strong> in coordination with the{" "}
                <strong>Guidance and Counseling Office</strong>. By
                registering as an alumni member, you agree to comply with
                these Terms and all applicable Philippine laws, including
                the Data Privacy Act of 2012 (RA 10173). If you do not
                agree with any part of these Terms, please do not complete
                the registration process.
            </>
        ),
    },
    {
        icon: <IdcardOutlined />,
        heading: "2. Eligibility and Accurate Information",
        body: (
            <>
                Registration is open to individuals who have studied at or
                graduated from Opol Community College. You agree to
                provide accurate, current, and complete information,
                including truthful academic records and valid
                identification documents, and to update such information
                as necessary. Submitting false, fraudulent, or misleading
                information, including falsified IDs or academic
                documents, may result in denial or termination of your
                alumni membership and, where applicable, referral to
                appropriate authorities.
            </>
        ),
    },
    {
        icon: <TrophyOutlined />,
        heading: "3. Guidance Office Tracer Study and Career Tracking",
        body: (
            <>
                By registering, you acknowledge that the Guidance Counselor
                may contact you regarding tracer studies, employment
                surveys, and career or further-education opportunities, and
                may use your employment and feedback data (including quiz
                responses) to support institutional planning,
                accreditation, and reporting to the College and, where
                required, CHED. Participation in optional surveys and
                quizzes helps the College improve programs for current and
                future students but does not affect your standing as a
                registered alumnus.
            </>
        ),
    },
    {
        icon: <GlobalOutlined />,
        heading: "4. Use of Services",
        body: (
            <>
                Alumni services are provided for networking, professional
                development, job referrals, events, and maintaining your
                connection with Opol Community College. You agree not to
                use these services for any unlawful purpose, to harass or
                spam other members, to misrepresent your identity, or to
                engage in any activity that could harm the College's
                reputation, the Alumni or Guidance Office, or other
                members' experience.
            </>
        ),
    },
    {
        icon: <BookOutlined />,
        heading: "5. Intellectual Property",
        body: (
            <>
                All content provided through the alumni platform, including
                text, graphics, logos, and software, is the property of
                Opol Community College or its content suppliers and is
                protected under the Intellectual Property Code of the
                Philippines (RA 8293). You may not reproduce, distribute,
                or create derivative works from this content without prior
                written permission.
            </>
        ),
    },
    {
        icon: <SafetyCertificateOutlined />,
        heading: "6. Data Privacy",
        body: (
            <>
                Your use of this system is also governed by our Privacy
                Policy, which explains how the Alumni Office and Guidance
                and Counseling Office collect, use, and protect your
                personal data in compliance with RA 10173. By agreeing to
                these Terms, you confirm that you have read and understood
                the Privacy Policy.
            </>
        ),
    },
    {
        icon: <ClockCircleOutlined />,
        heading: "7. Modifications and Termination",
        body: (
            <>
                We reserve the right to modify these Terms at any time.
                Material changes will be posted on the platform and, where
                required by law, we will seek your renewed consent.
                Continued use of alumni services after changes take effect
                constitutes acceptance of the modified Terms. We may
                suspend or terminate your account for violations of these
                Terms or of the Privacy Policy.
            </>
        ),
    },
    {
        icon: <MailOutlined />,
        heading: "8. Limitation of Liability and Governing Law",
        body: (
            <>
                Alumni services are provided on an "as is" basis. Opol
                Community College makes no warranties, express or implied,
                regarding the accuracy, reliability, or availability of the
                services, and shall not be liable for indirect, incidental,
                or consequential damages arising from your use of the
                system, except as required by law. These Terms are
                governed by the laws of the Republic of the Philippines.
                For questions, concerns, or to exercise your rights under
                these Terms, please contact the Alumni Office through the
                Messages page or visit us at ZONE C. Salva St, Opol, 9016
                Misamis Oriental.
            </>
        ),
    },
];

// ─────────────────────────────────────────────────────────────
//  Reusable section renderer — one .map() drives both modals
// ─────────────────────────────────────────────────────────────
const renderSections = (sections) => (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {sections.map((section) => (
            <div key={section.heading}>
                <Title level={5}>
                    {section.icon} {section.heading}
                </Title>
                <Paragraph>{section.body}</Paragraph>
            </div>
        ))}
    </Space>
);

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────
const LegalModals = ({
    isPrivacyModalOpen,
    setIsPrivacyModalOpen,
    isTermsModalOpen,
    setIsTermsModalOpen,
}) => {
    return (
        <>
            {/* Privacy Policy Modal */}
            <Modal
                title={
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <SafetyCertificateOutlined
                            style={{ fontSize: "20px", color: "#1890ff" }}
                        />
                        <span>Privacy Policy</span>
                    </div>
                }
                open={isPrivacyModalOpen}
                onCancel={() => setIsPrivacyModalOpen(false)}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => setIsPrivacyModalOpen(false)}
                    >
                        Close
                    </Button>,
                ]}
                width={700}
                centered
                styles={{
                    body: { maxHeight: "60vh", overflowY: "auto" },
                }}
            >
                <Divider />

                <Alert
                    message="Compliant with the Data Privacy Act of 2012 (Republic Act No. 10173)"
                    description="Opol Community College processes your personal data in accordance with RA 10173, its Implementing Rules and Regulations, and the issuances of the National Privacy Commission (NPC)."
                    type="info"
                    showIcon
                    icon={<SafetyCertificateOutlined />}
                    style={{ marginBottom: 16 }}
                />

                {renderSections(PRIVACY_SECTIONS)}
            </Modal>

            {/* Terms of Service Modal */}
            <Modal
                title={
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <IdcardOutlined
                            style={{ fontSize: "20px", color: "#1890ff" }}
                        />
                        <span>Terms of Service</span>
                    </div>
                }
                open={isTermsModalOpen}
                onCancel={() => setIsTermsModalOpen(false)}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => setIsTermsModalOpen(false)}
                    >
                        Close
                    </Button>,
                ]}
                width={700}
                centered
                styles={{
                    body: { maxHeight: "60vh", overflowY: "auto" },
                }}
            >
                <Divider />

                {renderSections(TERMS_SECTIONS)}
            </Modal>
        </>
    );
};

export default LegalModals;