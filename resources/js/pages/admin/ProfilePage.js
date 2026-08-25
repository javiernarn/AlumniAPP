import React, { useState, useEffect, useRef } from "react";
import { Layout, AlumniDetails, CardSkeletonGrid, HeroSkeleton } from "~/components";
import useProfile from "~/hooks/useProfile";
import {
    Card,
    Row,
    Col,
    Typography,
    Avatar,
    Tag,
    Divider,
    Button,
    Space,
    Descriptions,
    Empty,
    Input,
    DatePicker,
    Select,
    message,
    Tooltip,
    Modal,
} from "antd";
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    EditOutlined,
    BookOutlined,
    SaveOutlined,
    CloseOutlined,
    KeyOutlined,
    IdcardOutlined,
    BankOutlined,
    TrophyOutlined,
    SolutionOutlined,
    DollarOutlined,
    ApartmentOutlined,
    ProfileOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    GlobalOutlined,
    ClockCircleOutlined,
    LockOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import axiosConfig from "~/utils/axiosConfig";
import moment from "moment";
import { industryOptions } from "~/utils/constant";
import "./PorfilePage.css";
import secureLocalStorage from "react-secure-storage";
import ChangePasswordModal from "./ChangePasswordModal";

import logobg from "~/assets/images/occ_edit_test.png";


const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ============ CAREER INFO EDIT LOCK CONFIG ============
const CAREER_EDIT_LOCK_DAYS = 60; // 2 months

const ProfilePage = () => {
    const { data: profile, loading, refetch } = useProfile();
    const [previewData, setPreviewData] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [detailedProfile, setDetailedProfile] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedValues, setEditedValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [viewOnly, setViewOnly] = useState(true);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const careerSectionRef = useRef(null);

    // ============ CAREER EDIT LOCK STATES ============
    const [careerConfirmVisible, setCareerConfirmVisible] = useState(false);
    const [careerLockedVisible, setCareerLockedVisible] = useState(false);
    const [careerLockInfo, setCareerLockInfo] = useState({
        lastEditedAt: null,
        unlockAt: null,
        remaining: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    });

  

    useEffect(() => {
        message.config({
            top: 80,
            duration: 3,
            maxCount: 3,
            prefixCls: "ant-message",
        });
    }, []);
  
    useEffect(() => {
        const t = setTimeout(() => setIsRevealed(true), 40);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (profile?.alumni) {
            transformProfileData(profile.alumni);
        } else if (profile) {
            transformProfileData(profile);
        }
    }, [profile]);

    const transformProfileData = (profileData) => {
        const enhancedProfile = {
            basicInfo: {
                name: profileData?.first_name || "Not provided",
                email: profileData.email || "Not provided",
                role: "alumni",
                status: profileData?.status || "pending",
                memberSince: profileData?.graduation_year,
                lastUpdated: profileData.updated_at
                    ? new Date(profileData.updated_at).toLocaleDateString()
                    : "N/A",
            },
            personalInfo: {
                firstName: profileData.first_name || "Not provided",
                lastName: profileData.last_name || "Not provided",
                middleName: profileData.middle_name || "Not provided",
                displayName:
                    profileData.first_name + " " + profileData.last_name ||
                    "Not provided",
                avatar: profileData.image || null,
                dateOfBirth:
                    (profileData === null || profileData === void 0
                        ? void 0
                        : profileData.birth_date) || "Not provided",
                gender:
                    (profileData === null || profileData === void 0
                        ? void 0
                        : profileData.gender) || "Not provided",
                nationality: "Filipino",
            },
            contactInfo: {
                email: profileData.email || "Not provided",
                phone: profileData.phone || "Not provided",
                alternatePhone: "Not provided",
                address: profileData.address || "Not provided",
                socialMedia: {
                    linkedin: "Not provided",
                    twitter: "Not provided",
                    facebook: "Not provided",
                },
            },
            professionalInfo: {
                currentCompany: profileData.current_company || "Not provided",
                jobTitle: profileData.job_title || "Not provided",
                industry: profileData.industry || "Not provided",
                yearsExperience: profileData.years_experience || "Not provided",
                salaryRange: profileData.salary_range || "Not provided",
                workLocation: profileData.work_location || "Not provided",
                previousCompanies: Array.isArray(profileData.previous_companies)
                    ? profileData.previous_companies
                    : [profileData.previous_companies || "Not provided"],
            },
            academicInfo: {
                studentId: profileData.student_id || "Not provided",
                admissionYear: profileData.enrollment_year || "Not provided",
                graduationYear: profileData.graduation_year || "Not provided",
                honors: Array.isArray(profileData.honors)
                    ? profileData.honors.join(", ")
                    : profileData.honors || "Not provided",
                thesisTitle: profileData.thesis_title || "Not provided",
                continueEducation: !!profileData.continue_education,
            },
            additionalInfo: {
                bio: profileData?.bio || "No biography provided yet.",
                academic_achievements:
                    profileData?.academic_achievements || "Not provided",
                extracurricular: profileData?.extracurricular || "Not provided",
                career_goals: profileData?.career_goals || "Not provided",
            },
        };

        setDetailedProfile(enhancedProfile);
    };

    if (loading) {
        return (
            <Layout>
                <div
                    className={`profile-page ${isRevealed ? "is-revealed" : ""}`}
                >
                    <div
                        className="profile-orb profile-orb-1"
                        aria-hidden="true"
                    />
                    <div
                        className="profile-orb profile-orb-2"
                        aria-hidden="true"
                    />
                    <div className="profile-page-loading-skeleton">
                        <HeroSkeleton />
                        <CardSkeletonGrid variant="list" count={4} columns={{ xs: 24, lg: 12 }} rows={4} />
                    </div>
                </div>
            </Layout>
        );
    }

    // ============ CAREER LOCK HELPERS ============
    // ============ CAREER LOCK HELPERS ============
    const getCareerLockState = () => {
        const lastEdited = profile?.alumni?.career_last_edited_at;

        if (!lastEdited) {
            return { locked: false, lastEditedAt: null, unlockAt: null };
        }

        const lastEditedAt = moment(lastEdited);
        const unlockAt = lastEditedAt
            .clone()
            .add(CAREER_EDIT_LOCK_DAYS, "days");
        const locked = moment().isBefore(unlockAt);

        return { locked, lastEditedAt, unlockAt };
    };

    const computeRemaining = (unlockAt) => {
        const now = moment();
        const ms = Math.max(0, unlockAt.diff(now));
        const dur = moment.duration(ms);
        return {
            days: Math.floor(dur.asDays()),
            hours: dur.hours(),
            minutes: dur.minutes(),
            seconds: dur.seconds(),
        };
    };

    useEffect(() => {
        if (!careerLockedVisible || !careerLockInfo.unlockAt) return;
        const tick = () => {
            const remaining = computeRemaining(careerLockInfo.unlockAt);
            setCareerLockInfo((prev) => ({ ...prev, remaining }));
            if (
                remaining.days === 0 &&
                remaining.hours === 0 &&
                remaining.minutes === 0 &&
                remaining.seconds === 0
            ) {
                setCareerLockedVisible(false);
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [careerLockedVisible, careerLockInfo.unlockAt]);

    const handleCareerEditClick = () => {
        const { locked, lastEditedAt, unlockAt } = getCareerLockState();
        if (locked) {
            setCareerLockInfo({
                lastEditedAt,
                unlockAt,
                remaining: computeRemaining(unlockAt),
            });
            setCareerLockedVisible(true);
            return;
        }
        setCareerConfirmVisible(true);
    };

    const confirmEnterEditMode = () => {
        setCareerConfirmVisible(false);
        toggleEditMode();
        setTimeout(() => {
            careerSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 250);
    };
    // ============ END CAREER LOCK HELPERS ============

    const toggleEditMode = () => {
        if (!isEditMode) {
            setEditedValues({
                first_name: profile?.alumni?.first_name || "",
                last_name: profile?.alumni?.last_name || "",
                middle_name: profile?.alumni?.middle_name || "",
                suffix: profile?.alumni?.suffix || "",
                birth_date: profile?.alumni?.birth_date || "",
                gender: profile?.alumni?.gender || "",
                bio: profile?.alumni?.bio || "",
                email: profile?.alumni?.email || "",
                phone: profile?.alumni?.phone || "",
                address: profile?.alumni?.address || "",
                student_id: profile?.alumni?.student_id || "",
                graduation_year: profile?.alumni?.graduation_year || "",
                enrollment_year: profile?.alumni?.enrollment_year || "",
                honors: profile?.alumni?.honors || "",
                thesis_title: profile?.alumni?.thesis_title || "",
                continue_education:
                    profile?.alumni?.continue_education || false,
                current_company: profile?.alumni?.current_company || "",
                job_title: profile?.alumni?.job_title || "",
                industry: profile?.alumni?.industry || "",
                years_experience: profile?.alumni?.years_experience || "",
                salary_range: profile?.alumni?.salary_range || "",
                work_location: profile?.alumni?.work_location || "",
                previous_companies: profile?.alumni?.previous_companies || "",
            });
        }
        setIsEditMode(!isEditMode);
    };

    const handleFieldChange = (field, value) => {
        setEditedValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await axiosConfig.put(
                `/alumni/${profile?.alumni?.id}`,
                editedValues,
            );

            if (response.data?.success) {
                message.success({
                    content:
                        response.data.message ||
                        "Profile updated successfully!",
                    className: themedClass,
                });

                // Career lock timestamp is now stored in database

                await refetch();
                setIsEditMode(false);
            }
        } catch (error) {
            // axiosConfig interceptor will display modal automatically
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setEditedValues({});
        message.info({ content: "Edit cancelled", className: themedClass });
    };

    const handleEdit = () => {
        const values = profile.alumni;
        const previewData = {
            status: values.status,
            id: values.id,
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
                typeof values.honors === "string" && values.honors.trim() !== ""
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

        setPreviewData(previewData);
        setViewOnly(false);
        setIsModalVisible(true);
    };

    const handleView = () => {
        const values = profile.alumni;
        const previewData = {
            status: values.status,
            id: values.id,
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
                typeof values.honors === "string" && values.honors.trim() !== ""
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

        setPreviewData(previewData);
        setIsModalVisible(true);
    };

    // Profile completeness
    const completeness = (() => {
        if (!detailedProfile) return 0;
        const checks = [
            detailedProfile.personalInfo?.firstName,
            detailedProfile.personalInfo?.lastName,
            detailedProfile.personalInfo?.dateOfBirth,
            detailedProfile.contactInfo?.email,
            detailedProfile.contactInfo?.phone,
            detailedProfile.contactInfo?.address,
            detailedProfile.academicInfo?.studentId,
            detailedProfile.academicInfo?.graduationYear,
            detailedProfile.professionalInfo?.currentCompany,
            detailedProfile.professionalInfo?.jobTitle,
            detailedProfile.professionalInfo?.industry,
            detailedProfile.additionalInfo?.bio &&
                detailedProfile.additionalInfo.bio !==
                    "No biography provided yet.",
        ];
        const filled = checks.filter(
            (v) => v && v !== "Not provided" && v !== "N/A",
        ).length;
        return Math.round((filled / checks.length) * 100);
    })();

    return (
        <Layout>
            <div className={`profile-page ${isRevealed ? "is-revealed" : ""}`}>
                <div className="profile-page-container">
                    {/* ===== Decorative background orbs ===== */}
                    <div
                        className="profile-orb profile-orb-1"
                        aria-hidden="true"
                    />
                    <div
                        className="profile-orb profile-orb-2"
                        aria-hidden="true"
                    />

                   
                    <Card className="profile-hero-card" bordered={false}>
                      
                       {/* Cover banner */}
<img
    src={logobg}
    alt="Cover Banner"
    className="profile-cover-banner"
/>

                        {/* Avatar overlapping cover */}
                        <div className="profile-avatar-wrap">
                            <div
                                className="profile-avatar-ring"
                                aria-hidden="true"
                            />
                            <Avatar
                                size={160}
                                icon={<UserOutlined />}
                                src={profile?.alumni?.profile_image_url}
                                className="profile-avatar"
                                alt={
                                    detailedProfile?.personalInfo
                                        ?.displayName || "Alumni avatar"
                                }
                            />
                            <Tooltip title="Verified Alumni">
                                <span
                                    className="profile-avatar-badge"
                                    aria-label="Verified Alumni"
                                >
                                    <CheckCircleOutlined />
                                </span>
                            </Tooltip>
                        </div>

                        {/* Centered identity */}
                        <div className="profile-hero-body">
                            <Title level={2} className="profile-hero-name">
                                {detailedProfile?.personalInfo?.displayName}
                            </Title>
                            <Text className="profile-hero-studentid">
                                {detailedProfile?.academicInfo?.studentId ||
                                    "—"}
                            </Text>

                            {/* <div className="profile-hero-eyebrow">
                <span className="profile-eyebrow-dot" />
                Alumni Profile
              </div> */}

                            <Text className="profile-hero-email">
                                <MailOutlined />{" "}
                                {detailedProfile?.contactInfo?.email}
                            </Text>

                            <div className="profile-hero-tags">
                                <Tag className="profile-tag profile-tag-role">
                                    <UserOutlined />{" "}
                                    {detailedProfile?.basicInfo?.role}
                                </Tag>
                                <Tag className="profile-tag profile-tag-status">
                                    <CheckCircleOutlined />{" "}
                                    {detailedProfile?.basicInfo?.status}
                                </Tag>
                                <Tag className="profile-tag profile-tag-year">
                                    <CalendarOutlined /> Class of{" "}
                                    {detailedProfile?.basicInfo?.memberSince ||
                                        "—"}
                                </Tag>
                            </div>

                            {/* Profile completeness — full width below tags */}
                            <div
                                className="profile-meter profile-meter--v2"
                                role="progressbar"
                                aria-valuenow={completeness}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Profile completeness"
                            >
                                <div className="profile-meter-head">
                                    <span className="profile-meter-label">
                                        <TrophyOutlined /> Profile completeness
                                    </span>
                                    <strong>{completeness}%</strong>
                                </div>
                                <div className="profile-meter-track">
                                    <div
                                        className="profile-meter-fill"
                                        style={{ width: `${completeness}%` }}
                                    />
                                </div>
                                <Text className="profile-meter-hint">
                                    {completeness === 100
                                        ? "Your profile looks great — everything is filled in."
                                        : "Complete your profile to help us keep you connected."}
                                </Text>
                            </div>
                        </div>
                    </Card>

                    {/* ============ ACTION BUTTONS CARD ============ */}
                    <Card className="profile-actions-card" bordered={false}>
                        {!isEditMode ? (
                            <div className="profile-actions-grid">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={handleCareerEditClick}
                                    className="profile-btn profile-btn-primary"
                                >
                                    Edit Career Info
                                </Button>
                                <Button
                                    icon={<EyeOutlined />}
                                    onClick={() => handleView()}
                                    className="profile-btn profile-btn-ghost"
                                >
                                    View Full Details
                                </Button>
                                <Button
                                    icon={<KeyOutlined />}
                                    onClick={() =>
                                        setChangePasswordVisible(true)
                                    }
                                    className="profile-btn profile-btn-soft"
                                >
                                    Change Password
                                </Button>
                            </div>
                        ) : (
                            <div className="profile-actions-grid profile-actions-grid--edit">
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    loading={saving}
                                    className="profile-btn profile-btn-primary"
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    icon={<CloseOutlined />}
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="profile-btn profile-btn-ghost"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* ============ STATISTICS CARD ============ */}
                    <Card className="profile-stats-card" bordered={false}>
                        <div className="profile-stats-grid">
                            {/* <div className="profile-stat">
                <span className="profile-stat-icon">
                  <BookOutlined />
                </span>
                <div>
                  <Text className="profile-stat-label">Student ID</Text>
                  <Text className="profile-stat-value">
                    {detailedProfile?.academicInfo?.studentId || "—"}
                  </Text>
                </div>
              </div> */}
                            <div className="profile-stat">
                                <span className="profile-stat-icon">
                                    <BankOutlined />
                                </span>
                                <div>
                                    <Text className="profile-stat-label">
                                        Company
                                    </Text>
                                    <Text className="profile-stat-value">
                                        {detailedProfile?.professionalInfo
                                            ?.currentCompany || "—"}
                                    </Text>
                                </div>
                            </div>
                            <div className="profile-stat">
                                <span className="profile-stat-icon">
                                    <SolutionOutlined />
                                </span>
                                <div>
                                    <Text className="profile-stat-label">
                                        Role
                                    </Text>
                                    <Text className="profile-stat-value">
                                        {detailedProfile?.professionalInfo
                                            ?.jobTitle || "—"}
                                    </Text>
                                </div>
                            </div>
                            <div className="profile-stat">
                                <span className="profile-stat-icon">
                                    <ClockCircleOutlined />
                                </span>
                                <div>
                                    <Text className="profile-stat-label">
                                        Last Updated
                                    </Text>
                                    <Text className="profile-stat-value">
                                        {detailedProfile?.basicInfo
                                            ?.lastUpdated || "—"}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* ============ DETAIL CARDS ============ */}
                    <Row gutter={[24, 24]} className="profile-section-grid">
                        {/* Personal Information */}
                        <Col xs={24} lg={12}>
                            <Card
                                className="profile-card"
                                bordered={false}
                                title={
                                    <span className="profile-card-title">
                                        <span className="profile-card-icon profile-icon-indigo">
                                            <UserOutlined />
                                        </span>
                                        Personal Information
                                    </span>
                                }
                            >
                                <Descriptions
                                    column={1}
                                    size="small"
                                    className="profile-descriptions"
                                >
                                    <Descriptions.Item label="First Name">
                                        {
                                            detailedProfile?.personalInfo
                                                ?.firstName
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Middle Name">
                                        {
                                            detailedProfile?.personalInfo
                                                ?.middleName
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Last Name">
                                        {
                                            detailedProfile?.personalInfo
                                                ?.lastName
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Date of Birth">
                                        {detailedProfile?.personalInfo
                                            ?.dateOfBirth &&
                                        detailedProfile.personalInfo
                                            .dateOfBirth !== "Not provided"
                                            ? moment(
                                                  detailedProfile.personalInfo
                                                      .dateOfBirth,
                                              ).format("MMM DD, YYYY")
                                            : "Not provided"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Gender">
                                        {detailedProfile?.personalInfo?.gender}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Nationality">
                                        {
                                            detailedProfile?.personalInfo
                                                ?.nationality
                                        }
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        {/* Contact Information */}
                        <Col xs={24} lg={12}>
                            <Card
                                className="profile-card"
                                bordered={false}
                                title={
                                    <span className="profile-card-title">
                                        <span className="profile-card-icon profile-icon-cyan">
                                            <MailOutlined />
                                        </span>
                                        Contact Information
                                    </span>
                                }
                            >
                                <Descriptions
                                    column={1}
                                    size="small"
                                    className="profile-descriptions"
                                >
                                    <Descriptions.Item label="Email">
                                        {detailedProfile?.contactInfo?.email}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Phone">
                                        {detailedProfile?.contactInfo?.phone}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Address">
                                        {detailedProfile?.contactInfo?.address}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        {/* Academic Information */}
                        <Col xs={24} lg={12}>
                            <Card
                                className="profile-card"
                                bordered={false}
                                title={
                                    <span className="profile-card-title">
                                        <span className="profile-card-icon profile-icon-emerald">
                                            <BookOutlined />
                                        </span>
                                        Academic Information
                                    </span>
                                }
                            >
                                <Descriptions
                                    column={1}
                                    size="small"
                                    className="profile-descriptions"
                                >
                                    <Descriptions.Item label="Student ID">
                                        {
                                            detailedProfile?.academicInfo
                                                ?.studentId
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Admission Year">
                                        {
                                            detailedProfile?.academicInfo
                                                ?.admissionYear
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Graduation Year">
                                        {
                                            detailedProfile?.academicInfo
                                                ?.graduationYear
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Honors">
                                        {detailedProfile?.academicInfo?.honors}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Thesis Title">
                                        {
                                            detailedProfile?.academicInfo
                                                ?.thesisTitle
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Continuing Education">
                                        {detailedProfile?.academicInfo
                                            ?.continueEducation
                                            ? "Yes"
                                            : "No"}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        {/* Career Information */}
                        <Col xs={24} lg={12} ref={careerSectionRef}>
                            <Card
                                className="profile-card"
                                bordered={false}
                                title={
                                    <span className="profile-card-title">
                                        <span className="profile-card-icon profile-icon-amber">
                                            <ApartmentOutlined />
                                        </span>
                                        Career Information
                                    </span>
                                }
                            >
                                <Descriptions
                                    column={1}
                                    size="small"
                                    className="profile-descriptions"
                                >
                                    <Descriptions.Item label="Current Company">
                                        {isEditMode ? (
                                            <Input
                                                value={
                                                    editedValues.current_company
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "current_company",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter current company"
                                            />
                                        ) : (
                                            detailedProfile?.professionalInfo
                                                ?.currentCompany
                                        )}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Job Title">
                                        {isEditMode ? (
                                            <Input
                                                value={editedValues.job_title}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "job_title",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter job title"
                                            />
                                        ) : (
                                            detailedProfile?.professionalInfo
                                                ?.jobTitle
                                        )}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Industry">
                                        {isEditMode ? (
                                            <Select
                                                value={editedValues.industry}
                                                placeholder="Select or type industry"
                                                style={{ width: "100%" }}
                                                showSearch
                                                allowClear
                                                onChange={(value) =>
                                                    handleFieldChange(
                                                        "industry",
                                                        value,
                                                    )
                                                }
                                                onBlur={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    if (
                                                        value &&
                                                        !industryOptions.includes(
                                                            value,
                                                        ) &&
                                                        value !== "Not Provided"
                                                    ) {
                                                        handleFieldChange(
                                                            "industry",
                                                            value,
                                                        );
                                                    }
                                                }}
                                                filterOption={(input, option) =>
                                                    option?.children
                                                        .toLowerCase()
                                                        .includes(
                                                            input.toLowerCase(),
                                                        )
                                                }
                                            >
                                                <Option
                                                    key="none"
                                                    value="Not Provided"
                                                >
                                                    Prefer not to say
                                                </Option>
                                                {industryOptions.map(
                                                    (industry) => (
                                                        <Option
                                                            key={industry}
                                                            value={industry}
                                                        >
                                                            {industry}
                                                        </Option>
                                                    ),
                                                )}
                                            </Select>
                                        ) : (
                                            detailedProfile?.professionalInfo
                                                ?.industry
                                        )}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Years of Experience">
                                        {isEditMode ? (
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={
                                                    editedValues.years_experience
                                                }
                                                onChange={(e) => {
                                                    let value = e.target.value;
                                                    if (
                                                        value === "" ||
                                                        (Number(value) >= 1 &&
                                                            Number(value) <= 10)
                                                    ) {
                                                        handleFieldChange(
                                                            "years_experience",
                                                            value,
                                                        );
                                                    }
                                                }}
                                                placeholder="Enter years of experience (1-10)"
                                            />
                                        ) : (
                                            detailedProfile?.professionalInfo
                                                ?.yearsExperience
                                        )}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Annual Salary Range ₱">
                                        {isEditMode ? (
                                            <Select
                                                value={
                                                    editedValues.salary_range ||
                                                    undefined
                                                }
                                                onChange={(value) =>
                                                    handleFieldChange(
                                                        "salary_range",
                                                        value,
                                                    )
                                                }
                                                placeholder="Select annual salary range"
                                                style={{ width: "100%" }}
                                            >
                                                <Option value="0-150000">
                                                    ₱0 - ₱150,000 per year
                                                </Option>
                                                <Option value="150001-300000">
                                                    ₱150,001 - ₱300,000 per year
                                                </Option>
                                                <Option value="300001-500000">
                                                    ₱300,001 - ₱500,000 per year
                                                </Option>
                                                <Option value="500001-750000">
                                                    ₱500,001 - ₱750,000 per year
                                                </Option>
                                                <Option value="750001-1000000">
                                                    ₱750,001 - ₱1,000,000 per
                                                    year
                                                </Option>
                                                <Option value="1000001-1250000">
                                                    ₱1,000,001 - ₱1,250,000 per
                                                    year
                                                </Option>
                                                <Option value="1250001-1500000">
                                                    ₱1,250,001 - ₱1,500,000 per
                                                    year
                                                </Option>
                                                <Option value="prefer_not_to_say">
                                                    Prefer not to say
                                                </Option>
                                            </Select>
                                        ) : (
                                            detailedProfile?.professionalInfo
                                                ?.salaryRange
                                        )}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Work Location">
                                        {isEditMode ? (
                                            <Input
                                                value={
                                                    editedValues.work_location
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "work_location",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter work location"
                                            />
                                        ) : (
                                            detailedProfile?.professionalInfo
                                                ?.workLocation
                                        )}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Previous Companies">
                                        {isEditMode ? (
                                            <TextArea
                                                value={
                                                    editedValues.previous_companies
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "previous_companies",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter previous companies (comma separated)"
                                                rows={2}
                                            />
                                        ) : Array.isArray(
                                              detailedProfile?.professionalInfo
                                                  ?.previousCompanies,
                                          ) ? (
                                            detailedProfile.professionalInfo.previousCompanies.join(
                                                ", ",
                                            )
                                        ) : (
                                            detailedProfile?.professionalInfo
                                                ?.previousCompanies
                                        )}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        {/* Additional Information */}
                        <Col xs={24}>
                            <Card
                                className="profile-card profile-card-wide"
                                bordered={false}
                                title={
                                    <span className="profile-card-title">
                                        <span className="profile-card-icon profile-icon-violet">
                                            <ProfileOutlined />
                                        </span>
                                        Additional Information
                                    </span>
                                }
                            >
                                <Descriptions
                                    column={1}
                                    size="small"
                                    layout="vertical"
                                    colon={false}
                                    className="profile-descriptions profile-descriptions-vertical"
                                >
                                    <Descriptions.Item label="Bio">
                                        {detailedProfile?.additionalInfo?.bio}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Academic Achievements">
                                        {
                                            detailedProfile?.additionalInfo
                                                ?.academic_achievements
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Extracurricular Activities">
                                        {
                                            detailedProfile?.additionalInfo
                                                ?.extracurricular
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Career Goals">
                                        {
                                            detailedProfile?.additionalInfo
                                                ?.career_goals
                                        }
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        {/* ============ INFO UPDATE NOTICE ============ */}
                        <Col xs={24}>
                            <div className="profile-info-notice" role="note">
                                <div className="profile-info-notice-icon">
                                    <InfoCircleOutlined />
                                </div>
                                <div className="profile-info-notice-text">
                                    <strong>Need to update your information?</strong>{" "}
                                    For security reasons, changes to your profile must be verified. Please contact your administrator to request updates or corrections to your details.
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Modals */}
                    <AlumniDetails
                        visible={isModalVisible}
                        onCancel={() => setIsModalVisible(false)}
                        onSubmit={(data) => {
                            // console.log("Updated profile data:", data);
                            setIsModalVisible(false);
                        }}
                        previewData={previewData}
                        viewOnly={viewOnly}
                        refetchAlumni={refetch}
                        viewOwnProfile={true}
                    />
                    <ChangePasswordModal
                        visible={changePasswordVisible}
                        onCancel={() => setChangePasswordVisible(false)}
                        userEmail={profile?.alumni?.email || profile?.email}
                    />

                    {/* ============ CAREER EDIT CONFIRMATION MODAL ============ */}
                    <Modal
                        title={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <InfoCircleOutlined
                                    style={{ color: "#f59e0b" }}
                                />
                                Heads up before you edit your Career Info
                            </span>
                        }
                        open={careerConfirmVisible}
                        onCancel={() => setCareerConfirmVisible(false)}
                        onOk={confirmEnterEditMode}
                        okText="Continue to Edit"
                        cancelText="Cancel"
                        centered
                        maskClosable={false}
                       
                    >
                        <Paragraph style={{ marginBottom: 8 }}>
                            Please review your{" "}
                            <strong>Career Information</strong> carefully before
                            saving.
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 8 }}>
                            Once you save your changes, this section will be{" "}
                            <strong>locked for 60 days (about 2 months)</strong>{" "}
                            and cannot be edited again until that period ends.
                        </Paragraph>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            This helps us keep your career records accurate and
                            consistent. Do you want to continue?
                        </Paragraph>
                    </Modal>

                    {/* ============ CAREER EDIT LOCKED MODAL ============ */}
                    <Modal
                        title={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <LockOutlined style={{ color: "#4f46e5" }} />
                                Career Info is currently locked
                            </span>
                        }
                        open={careerLockedVisible}
                        onCancel={() => setCareerLockedVisible(false)}
                        footer={[
                            <Button
                                key="ok"
                                type="primary"
                                onClick={() => setCareerLockedVisible(false)}
                            >
                                Got it
                            </Button>,
                        ]}
                        centered
                      
                    >
                        <Paragraph style={{ marginBottom: 8 }}>
                            You recently updated your Career Information on{" "}
                            <strong>
                                {careerLockInfo.lastEditedAt
                                    ? careerLockInfo.lastEditedAt.format(
                                          "MMMM D, YYYY [at] h:mm A",
                                      )
                                    : "—"}
                            </strong>
                            .
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 12 }}>
                            For data accuracy, this section can only be edited{" "}
                            <strong>
                                once every {CAREER_EDIT_LOCK_DAYS} days
                            </strong>
                            .
                        </Paragraph>

                        <div
                            style={{
                                background: "rgba(79, 70, 229, 0.08)",
                                border: "1px solid rgba(79, 70, 229, 0.25)",
                                borderRadius: 12,
                                padding: "14px 16px",
                                marginBottom: 12,
                            }}
                        >
                            <Text
                                strong
                                style={{ display: "block", marginBottom: 8 }}
                            >
                                <ClockCircleOutlined /> Time remaining before
                                you can edit again:
                            </Text>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 14,
                                    flexWrap: "wrap",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                <span>
                                    <strong>
                                        {careerLockInfo.remaining.days}
                                    </strong>{" "}
                                    days
                                </span>
                                <span>
                                    <strong>
                                        {careerLockInfo.remaining.hours}
                                    </strong>{" "}
                                    hours
                                </span>
                                <span>
                                    <strong>
                                        {careerLockInfo.remaining.minutes}
                                    </strong>{" "}
                                    minutes
                                </span>
                                <span>
                                    <strong>
                                        {careerLockInfo.remaining.seconds}
                                    </strong>{" "}
                                    seconds
                                </span>
                            </div>
                        </div>

                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            You'll be able to edit again on{" "}
                            <strong>
                                {careerLockInfo.unlockAt
                                    ? careerLockInfo.unlockAt.format(
                                          "MMMM D, YYYY [at] h:mm A",
                                      )
                                    : "—"}
                            </strong>
                            .
                        </Paragraph>
                    </Modal>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;