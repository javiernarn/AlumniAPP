"use client";
import React, { useState, useEffect } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    Form,
    Input,
    Select,
    Upload,
    Avatar,
    Typography,
    Space,
    Divider,
    Steps,
    DatePicker,
    Radio,
    Checkbox,
    InputNumber,
    Switch,
    message,
    Tag,
    Progress,
    Tooltip,
    Alert,
    Modal,
    List,
    Image,
} from "antd";
import {
    UserOutlined,
    CameraOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    BookOutlined,
    TrophyOutlined,
    GlobalOutlined,
    LinkedinOutlined,
    GithubOutlined,
    TwitterOutlined,
    PlusOutlined,
    DeleteOutlined,
    IdcardOutlined,
    SafetyCertificateOutlined,
    EyeOutlined,
    UploadOutlined,
    FileImageOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ArrowLeftOutlined,
    ExclamationCircleOutlined,
    WarningOutlined,
    SunOutlined,
    MoonOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "./AlumniRegistration.css";
import axios from "~/utils/axiosConfig";
import useCourses from "~/hooks/useCourses";
import useEmployeeStatus from "~/hooks/useEmployeeStatus";
import { AlumniDetails } from "~/components";
import { industryOptions,  awardsOptions, latinHonors, BASE_URL } from "~/utils/constant";
import dayjs from "dayjs";
import logo from "~/assets/images/OCC_LOGO.png";
import secureLocalStorage from "react-secure-storage";
import { useAppTheme } from "~/hooks/useAppTheme";
import ScrollProgressOrb from "../admin/ScrollProgress/ScrollProgressOrb"

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

// Company/University Information
const companyInfo = {
    name: "Opol Community College Alumni Association",
    logo: logo,
    slogan: "Building tomorrow's leaders, one student at a time.",
    website: "alumni.occph.com",
    address: "ZONE C. Salva St, Opol, 9016 Misamis Oriental",
};

const courseOptions = [
    {
        value: "BSIT",
        label: "Bachelor of Science in Information Technology",
        college: "College of Computer Studies",
    },
    {
        value: "BSCS",
        label: "Bachelor of Science in Computer Science",
        college: "College of Computer Studies",
    },
    {
        value: "BSBA",
        label: "Bachelor of Science in Business Administration",
        college: "College of Business",
    },
    {
        value: "BSEd",
        label: "Bachelor of Science in Education",
        college: "College of Education",
    },
    {
        value: "BSN",
        label: "Bachelor of Science in Nursing",
        college: "College of Nursing",
    },
    {
        value: "BSA",
        label: "Bachelor of Science in Accountancy",
        college: "College of Business",
    },
    {
        value: "BSEE",
        label: "Bachelor of Science in Electrical Engineering",
        college: "College of Engineering",
    },
    {
        value: "BSME",
        label: "Bachelor of Science in Mechanical Engineering",
        college: "College of Engineering",
    },
    {
        value: "BSArch",
        label: "Bachelor of Science in Architecture",
        college: "College of Architecture",
    },
    {
        value: "BSPsych",
        label: "Bachelor of Science in Psychology",
        college: "College of Arts and Sciences",
    },
];

const employmentStatusOptions = [
    { value: "employed", label: "Employed", color: "green" },
    { value: "unemployed", label: "Unemployed", color: "red" },
    { value: "self-employed", label: "Self-Employed", color: "orange" },
    { value: "freelancer", label: "Freelancer", color: "blue" },
    { value: "graduate_student", label: "Graduate Student", color: "purple" },
    { value: "entrepreneur", label: "Entrepreneur", color: "cyan" },
    {
        value: "seeking_opportunities",
        label: "Seeking Opportunities",
        color: "gold",
    },
];

const ID_TYPES = [
    { value: "student_id", label: "Student ID Card", icon: <IdcardOutlined /> },
    { value: "alumni_id", label: "Alumni ID Card", icon: <UserOutlined /> },
    {
        value: "government_id",
        label: "Government ID",
        icon: <FileImageOutlined />,
    },
    { value: "diploma", label: "Diploma", icon: <SafetyCertificateOutlined /> },
    { value: "transcript", label: "Transcript", icon: <BookOutlined /> },
];

const statusColors = {
    Employed: "green",
    Unemployed: "red",
    "Under Employed": "orange",
};

const AlumniRegistration = () => {
    const { isLoading, data: courses, isFetching, refetch } = useCourses();
    const { data: statuses } = useEmployeeStatus();
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();

    // ===== Back-to-login confirmation =====
    // Defaults provided via <Form initialValues={...}>. We ignore these so an
    // untouched form is correctly treated as "empty".
    const DEFAULT_INITIAL_VALUES = {
        gender: "male",
        newsletter: true,
        contactPermission: true,
    };

    const hasAnyFilledField = () => {
        try {
            // 1) Uploaded profile image or ID documents count as user input
            if (profileImage) return true;
            if (Array.isArray(idDocuments) && idDocuments.length > 0)
                return true;

            const values = form.getFieldsValue(true) || {};

            return Object.entries(values).some(([key, v]) => {
                if (v === null || v === undefined) return false;

                // Ignore unchanged defaults from <Form initialValues={...}>
                if (
                    Object.prototype.hasOwnProperty.call(
                        DEFAULT_INITIAL_VALUES,
                        key,
                    ) &&
                    v === DEFAULT_INITIAL_VALUES[key]
                ) {
                    return false;
                }

                if (typeof v === "string") return v.trim() !== "";
                if (typeof v === "number") return true;
                if (typeof v === "boolean") return v === true;
                if (dayjs.isDayjs && dayjs.isDayjs(v)) return true;
                if (moment.isMoment && moment.isMoment(v)) return true;
                if (Array.isArray(v)) return v.length > 0;
                if (typeof v === "object") {
                    if (Array.isArray(v.fileList)) return v.fileList.length > 0;
                    return Object.keys(v).length > 0;
                }
                return Boolean(v);
            });
        } catch (e) {
            return false;
        }
    };

    const handleBackToLogin = () => {
        if (!hasAnyFilledField()) {
            window.location.href = "/login";
            return;
        }
        Modal.confirm({
            title: (
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <WarningOutlined style={{ color: "#f59e0b" }} />
                    Discard your registration?
                </span>
            ),
            content: (
                <div style={{ lineHeight: 1.6 }}>
                    <p style={{ margin: 0 }}>
                        You've already filled in some details. If you go back to
                        the login page now,{" "}
                        <strong>
                            all the information you entered will be lost
                        </strong>{" "}
                        and cannot be recovered.
                    </p>
                    <p
                        style={{
                            marginTop: 8,
                            marginBottom: 0,
                            color: "#5b6677",
                        }}
                    >
                        Are you sure you want to leave and discard your
                        progress?
                    </p>
                </div>
            ),
            icon: null,
            centered: true,
            okText: "Discard & Go to Login",
            okButtonProps: { danger: true },
            cancelText: "Continue Filling Up",
            onOk: () => {
                try {
                    form.resetFields();
                } catch (e) {}
                // Clear the actual draft key used by the auto-save effect (STORAGE_KEY)
                // as well as the legacy key, so "Discard" really discards.
                try {
                    secureLocalStorage.removeItem("alumni-registration-form");
                } catch (e) {}
                try {
                    secureLocalStorage.removeItem("alumni_registration_draft");
                } catch (e) {}
                // Reset local component state so nothing lingers if navigation is intercepted.
                setProfileImage(null);
                setIdDocuments([]);
                setCurrentStep(0);
                setSelectedGradYear(null);
                setIsUnemployed(false);
                window.location.href = "/login";
            },
        });
    };
    const [profileImage, setProfileImage] = useState(null);
    const [idDocuments, setIdDocuments] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [selectedGradYear, setSelectedGradYear] = useState(null);
    const [isUnemployed, setIsUnemployed] = useState(false);
    const [isAgreementModalVisible, setIsAgreementModalVisible] =
        useState(false);
    const [saveTimeout, setSaveTimeout] = useState(null);
    const [showImportantNotice, setShowImportantNotice] = useState(true);
    
useEffect(() => {
    document.title = "Alumni Registration | ATMS - Opol Community College";
}, []);
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

    // ================= SAVE FORM DATA =================
    const STORAGE_KEY = "alumni-registration-form";

    // Load saved data on refresh
    useEffect(() => {
        const savedData = secureLocalStorage.getItem(STORAGE_KEY);

        if (savedData) {
            try {
                const parsedData =
                    typeof savedData === "string"
                        ? JSON.parse(savedData)
                        : savedData;

                // Restore form fields
                form.setFieldsValue({
                    ...parsedData.formValues,

                    // restore date properly
                    birth_date: parsedData.formValues?.birth_date
                        ? dayjs(parsedData.formValues.birth_date)
                        : null,
                });

                // Restore states
                if (parsedData.profileImage) {
                    setProfileImage(parsedData.profileImage);
                }

                if (parsedData.idDocuments) {
                    setIdDocuments(parsedData.idDocuments);
                }

                if (parsedData.currentStep !== undefined) {
                    setCurrentStep(parsedData.currentStep);
                }

                if (parsedData.selectedGradYear) {
                    setSelectedGradYear(parsedData.selectedGradYear);
                }

                if (parsedData.isUnemployed !== undefined) {
                    setIsUnemployed(parsedData.isUnemployed);
                }
            } catch (error) {
                console.error("Error loading saved form data:", error);
            }
        }
    }, [form]);

    // Save form automatically whenever fields change
    const saveFormData = () => {
        try {
            const values = form.getFieldsValue(true);

            const dataToSave = {
                formValues: {
                    ...values,

                    // convert dayjs date to string
                    birth_date: values.birth_date
                        ? values.birth_date.format("YYYY-MM-DD")
                        : null,
                },

                profileImage,
                idDocuments,
                currentStep,
                selectedGradYear,
                isUnemployed,
            };

            secureLocalStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

            //     // ADD THIS HERE
            // message.destroy()
            // message.success(
            //   "Your registration data has been automatically saved.",
            //   0.5
            // )
        } catch (error) {
            console.error("Error saving form data:", error);
        }
    };

    // Auto-save when something changes
    useEffect(() => {
        saveFormData();
    }, [
        profileImage,
        idDocuments,
        currentStep,
        selectedGradYear,
        isUnemployed,
    ]);

    // ================= END SAVE FORM DATA =================
    // Add this after line 167 (const AlumniRegistration = () => {)

    // ============ THEME SYNC FROM FORMLOGIN ============
    // Now backed by the shared useAppTheme hook (same cookie + secureLocalStorage
    // + BroadcastChannel sync used by FormLogin), instead of a hand-rolled
    // localStorage listener.
    const { theme: currentTheme, toggleTheme } = useAppTheme();
    // ============ END THEME SYNC ============

    const steps = [
        {
            title: "Personal Info",
            icon: <UserOutlined />,
        },
        {
            title: "Academic Info",
            icon: <BookOutlined />,
        },
        {
            title: "Career Info",
            icon: <TrophyOutlined />,
        },
        {
            title: "Documents",
            icon: <FileImageOutlined />,
        },
        {
            title: "Review & Submit",
            icon: <SafetyCertificateOutlined />,
        },
    ];

    // Profile Image Upload
    const handleProfileImageUpload = (info) => {
        if (info.file.status === "uploading") {
            return;
        }
        if (info.file.status === "done") {
            getBase64(info.file.originFileObj, (url) => {
                setProfileImage(url);
                message.success("Profile image uploaded successfully!");
            });
        }
    };

    // ID Documents Upload
    const handleIdDocumentsUpload = (info, documentType) => {
        if (info.file.status === "uploading") {
            return;
        }
        if (info.file.status === "done") {
            getBase64(info.file.originFileObj, (url) => {
                const newDocument = {
                    id: Date.now(),
                    type: documentType,
                    url: url,
                    name: info.file.name,
                    status: "pending",
                    uploadDate: new Date().toISOString(),
                };

                setIdDocuments((prev) => {
                    const filtered = prev.filter(
                        (doc) => doc.type !== documentType,
                    );
                    return [...filtered, newDocument];
                });

                message.success(
                    `${ID_TYPES.find((doc) => doc.value === documentType)?.label} uploaded successfully!`,
                );
            });
        }
    };

    const getBase64 = (img, callback) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => callback(reader.result));
        reader.readAsDataURL(img);
    };

    const ALLOWED_IMAGE_MIMES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];
    const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];

    const verifyImageMagicBytes = (file) =>
        new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = (e) => {
                const bytes = new Uint8Array(e.target.result);
                if (bytes.length < 12) return resolve(false);
                // JPEG: FF D8 FF
                const isJpeg =
                    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
                // PNG: 89 50 4E 47 0D 0A 1A 0A
                const isPng =
                    bytes[0] === 0x89 &&
                    bytes[1] === 0x50 &&
                    bytes[2] === 0x4e &&
                    bytes[3] === 0x47 &&
                    bytes[4] === 0x0d &&
                    bytes[5] === 0x0a &&
                    bytes[6] === 0x1a &&
                    bytes[7] === 0x0a;
                // WEBP: "RIFF"...."WEBP"
                const isWebp =
                    bytes[0] === 0x52 &&
                    bytes[1] === 0x49 &&
                    bytes[2] === 0x46 &&
                    bytes[3] === 0x46 &&
                    bytes[8] === 0x57 &&
                    bytes[9] === 0x45 &&
                    bytes[10] === 0x42 &&
                    bytes[11] === 0x50;
                resolve(isJpeg || isPng || isWebp);
            };
            reader.onerror = () => resolve(false);
            reader.readAsArrayBuffer(file.slice(0, 16));
        });

    const beforeUpload = async (file) => {
        // 1) Extension / MIME quick check
        const ext = (file.name?.split(".").pop() || "").toLowerCase();
        const mimeOk = ALLOWED_IMAGE_MIMES.includes(file.type);
        const extOk = ALLOWED_IMAGE_EXTS.includes(ext);
        if (!mimeOk || !extOk) {
            message.error("Only JPG, PNG, or WEBP image files are allowed.");
            return Upload.LIST_IGNORE;
        }

        // 2) Size guard (5MB)
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error("Image must be smaller than 5MB!");
            return Upload.LIST_IGNORE;
        }

        // 3) Filename sanity — block suspicious double extensions / scripts
        const suspicious =
            /\.(exe|js|jsx|ts|tsx|php|sh|bat|cmd|html?|svg|pdf|zip|rar)(\.|$)/i;
        if (suspicious.test(file.name)) {
            message.error("This file name looks unsafe and was rejected.");
            return Upload.LIST_IGNORE;
        }

        // 4) Magic-byte verification — defeats files that lie about their type
        const realImage = await verifyImageMagicBytes(file);
        if (!realImage) {
            message.error(
                "File contents do not match a real image. Upload rejected.",
            );
            return Upload.LIST_IGNORE;
        }

        return true;
    };

    const profileUploadProps = {
        beforeUpload,
        accept: "image/jpeg,image/jpg,image/png,image/webp",
        multiple: false,
        maxCount: 1,
        customRequest: ({ file, onSuccess }) => {
            setTimeout(() => {
                onSuccess("ok");
            }, 0);
        },
        onChange: handleProfileImageUpload,
        showUploadList: false,
    };

    const idUploadProps = (documentType) => ({
        beforeUpload,
        accept: "image/jpeg,image/jpg,image/png,image/webp",
        multiple: false,
        maxCount: 1,
        customRequest: ({ file, onSuccess }) => {
            setTimeout(() => {
                onSuccess("ok");
            }, 0);
        },
        onChange: (info) => handleIdDocumentsUpload(info, documentType),
        showUploadList: false,
    });

    const removeDocument = (documentId) => {
        setIdDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        message.success("Document removed successfully!");
    };

    const updateDocumentStatus = (documentId, status) => {
        setIdDocuments((prev) =>
            prev.map((doc) =>
                doc.id === documentId ? { ...doc, status } : doc,
            ),
        );
    };

    const profileUploadButton = (
        <div className="upload-button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload Photo</div>
        </div>
    );

    const idUploadButton = (documentType) => (
        <div className="id-upload-button">
            <UploadOutlined />
            <div style={{ marginTop: 4, fontSize: "12px" }}>
                Upload{" "}
                {ID_TYPES.find((doc) => doc.value === documentType)?.label}
            </div>
        </div>
    );

  const handleNext = () => {
    form.validateFields()
        .then(() => {
            setCurrentStep(currentStep + 1);
        })
        .catch((errorInfo) => {
            // Required fields not filled — antd already paints them red.
            // Scroll to the first invalid field and show a message.
            if (errorInfo && errorInfo.errorFields && errorInfo.errorFields.length > 0) {
                const firstField = errorInfo.errorFields[0].name;
                try {
                    form.scrollToField(firstField, {
                        behavior: "smooth",
                        block: "center",
                    });
                } catch (e) {
                    // no-op
                }
                message.error(
                    "Please fill out all required fields highlighted in red before continuing."
                );
            }
        });
};

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handlePreview = async () => {
        // Check if agreement checkbox is checked
        const agreementValue = form.getFieldValue("agreement");
        if (!agreementValue) {
            setIsAgreementModalVisible(true);
            return;
        }

        setCurrentStep("all");
        setTimeout(() => {
            previewShow();
        }, 100);
    };

    const previewShow = async () => {
        const values = await form.validateFields();

        // Resolve the course_code from the courses list so AlumniDetails
        // can pick the correct header colour theme immediately.
        const selectedCourse = Array.isArray(courses)
            ? courses.find((c) => c.id === values.course_id)
            : null;
        const resolvedCourseCode = selectedCourse?.course_code || "";

        const previewData = {
            // Personal Information
            first_name: values.first_name,
            last_name: values.last_name,
            middle_name: values.middle_name,
            suffix: values.suffix,
            email: values.email,
            phone: values.phone,
            address: values.address,
            birth_date: values.birth_date
                ? values.birth_date.format("YYYY-MM-DD")
                : null,
            gender: values.gender,
            bio: values.bio,

            // Academic Information
            course_id: values.course_id,
            // Pass the resolved code so AlumniDetails theme lookup works
            // even before the server echoes back a nested course object.
            course_code: resolvedCourseCode,
            studentId: values.studentId,
            graduationYear: values.graduationYear,
            enrollmentYear: values.enrollmentYear,
            honors: values.honors || [],
            thesisTitle: values.thesisTitle,
            academicAchievements: values.academicAchievements,
            extracurricular: values.extracurricular,
            continueEducation: values.continueEducation,

            // Career Information
            employment_status_id: values.employment_status_id,
            currentCompany: values.currentCompany,
            jobTitle: values.jobTitle,
            industry: values.industry,
            yearsExperience: values.yearsExperience,
            salaryRange: values.salaryRange,
            workLocation: values.workLocation,
            careerGoals: values.careerGoals,
            previousCompanies: values.previousCompanies,

            // Social media
            linkedin: values.linkedin,
            github: values.github,
            portfolio: values.portfolio,
            twitter: values.twitter,

            // Preferences
            newsletter: values.newsletter,
            contactPermission: values.contactPermission,
            agreement: values.agreement,

            // Files
            profileImage,
            idDocuments,
        };
        setPreviewData(previewData);
        setIsModalVisible(true);
    };

    const calculateProgress = () => {
        return ((currentStep + 1) / steps.length) * 100;
    };

    const handleSubmit = async () => {
        let loadingMessage = null;

        try {
            setLoading(true);

            // Validate all form fields first
            const values = await form.validateFields();

            // Additional validation for documents
            if (!profileImage) {
                message.error("Please upload a profile photo");
                return;
            }

            if (idDocuments.length === 0) {
                message.error("Please upload at least one ID document");
                return;
            }

            // Show loading message
            loadingMessage = message.loading(
                "Submitting your application...",
                0,
            );

            const formData = new FormData();

            // Append all form fields with proper snake_case formatting
            const allFormValues = form.getFieldsValue(true);

            // Map field names from camelCase to snake_case
            const fieldMappings = {
                // Personal Information
                firstName: "first_name",
                lastName: "last_name",
                middleName: "middle_name",
                birthDate: "birth_date",
                profileImage: "profile_image",

                // Academic Information
                studentId: "student_id",
                graduationYear: "graduation_year",
                enrollmentYear: "enrollment_year",
                thesisTitle: "thesis_title",
                academicAchievements: "academic_achievements",
                continueEducation: "continue_education",

                // Career Information
                employmentStatus: "employment_status",
                currentCompany: "current_company",
                jobTitle: "job_title",
                yearsExperience: "years_experience",
                salaryRange: "salary_range",
                workLocation: "work_location",
                careerGoals: "career_goals",
                previousCompanies: "previous_companies",

                // Skills
                technicalSkills: "technical_skills",
                softSkills: "soft_skills",
                volunteerInterests: "volunteer_interests",
                willingToMentor: "willing_to_mentor",
                professionalInterests: "professional_interests",

                // Agreements
                contactPermission: "contact_permission",
            };

            // Format birthDate specifically
            const formattedValues = {
                ...allFormValues,
                birth_date: allFormValues.birth_date
                    ? allFormValues.birth_date.format("YYYY-MM-DD")
                    : null,
            };

            // Process each field
            Object.keys(formattedValues).forEach((key) => {
                const value = formattedValues[key];
                const snakeCaseKey = fieldMappings[key] || key;

                if (value === undefined || value === null || value === "") {
                    return; // Skip empty values
                }

                if (Array.isArray(value)) {
                    // Handle array fields (like honors, skills, etc.)
                    value.forEach((item, index) => {
                        if (item && item !== "") {
                            formData.append(
                                `${snakeCaseKey}[${index}]`,
                                item.toString(),
                            );
                        }
                    });
                } else if (typeof value === "boolean") {
                    // Handle boolean fields
                    formData.append(snakeCaseKey, value ? "1" : "0");
                } else if (typeof value === "object") {
                    // Handle object fields (stringify them)
                    try {
                        formData.append(snakeCaseKey, JSON.stringify(value));
                    } catch (error) {
                        console.warn(
                            `Could not stringify field ${snakeCaseKey}:`,
                            error,
                        );
                        formData.append(snakeCaseKey, value.toString());
                    }
                } else {
                    // Handle string/number fields
                    formData.append(snakeCaseKey, value.toString());
                }
            });

            // Append profile image
            if (profileImage) {
                try {
                    let profileBlob;
                    if (profileImage.startsWith("data:")) {
                        profileBlob = dataURLToBlobSync(profileImage);
                    } else {
                        profileBlob = profileImage;
                    }
                    formData.append(
                        "profile_image",
                        profileBlob,
                        "profile.jpg",
                    );
                } catch (error) {
                    console.error("Error processing profile image:", error);
                    throw new Error("Error processing profile image");
                }
            }

            // Append ID documents with metadata
            idDocuments.forEach((doc, index) => {
                try {
                    let documentBlob;

                    if (doc.url && doc.url.startsWith("data:")) {
                        documentBlob = dataURLToBlobSync(doc.url);
                    } else if (doc.file) {
                        documentBlob = doc.file;
                    } else {
                        console.warn(
                            `Document ${doc.type} has no valid file data`,
                        );
                        return;
                    }

                    // Append the actual file
                    formData.append(
                        `documents[${index}][file]`,
                        documentBlob,
                        doc.name || `document_${index}.jpg`,
                    );

                    // Append document metadata
                    formData.append(`documents[${index}][type]`, doc.type);
                    formData.append(
                        `documents[${index}][name]`,
                        doc.name || `document_${index}`,
                    );
                } catch (error) {
                    console.error(
                        `Error processing document ${doc.type}:`,
                        error,
                    );
                }
            });

            // Debug: Log form data (optional - remove in production)
            if (process.env.NODE_ENV === "development") {
                // console.log("FormData contents:")
                for (const [key, value] of formData.entries()) {
                    if (key.includes("file") || key.includes("image")) {
                        // console.log(key, `[File: ${value.name || "Blob"}]`)
                    } else {
                        // console.log(key, value)
                    }
                }
            }

            // Submit the form
            const response = await axios.post(
                BASE_URL + "api/alumni/register",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    timeout: 60000, // 60 seconds timeout
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total,
                        );

                        // Update progress in the message
                        if (percentCompleted < 100) {
                            message.destroy();
                            message.loading(
                                `Uploading... ${percentCompleted}%`,
                                0,
                            );
                        }
                    },
                },
            );

            // Clear loading message
            if (loadingMessage) {
                message.destroy();
            }

            if (response.data.success) {
                message.success(
                    response.data.message ||
                        "Alumni registration submitted successfully!",
                );

                secureLocalStorage.removeItem(STORAGE_KEY);

                // Reset form state
                form.resetFields();
                setProfileImage(null);
                setIdDocuments([]);
                setCurrentStep(0);
                setIsModalVisible(false);

                // Show success message with application ID if available
                if (response.data.application_id) {
                    Modal.success({
                        title: "Registration Successful!",
                        content: (
                            <div>
                                <p className="ant-typography">
                                    Your alumni registration has been submitted
                                    successfully.
                                </p>
                                <p className="ant-typography">
                                    <strong>Application ID:</strong>{" "}
                                    {response.data.application_id}
                                </p>
                                <p className="ant-typography">
                                    You will receive a confirmation email
                                    shortly.
                                </p>
                            </div>
                        ),
                        onOk() {
                            // Optional: Redirect to success page or dashboard
                            // console.log("Application ID:", response.data.application_id)
                        },
                    });
                }
            } else {
                message.error(
                    response.data.message ||
                        "Submission failed. Please try again.",
                );
            }
        } catch (error) {
            // Clear any existing loading messages
            if (loadingMessage) {
                message.destroy();
            }

            console.error("Submission error:", error);

            // Handle different types of errors
            if (error.errorFields) {
                // Form validation errors
                const firstError = error.errorFields[0];
                message.error(`Please check: ${firstError.errors[0]}`);

                // Optional: Scroll to the first error field
                const errorElement = document.querySelector(
                    ".ant-form-item-has-error",
                );
                if (errorElement) {
                    errorElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            } else if (error.response) {
                // Server responded with error status
                const serverError = error.response.data;

                // Handle Laravel validation errors
                if (serverError.errors) {
                    const firstErrorKey = Object.keys(serverError.errors)[0];
                    const firstErrorMessage =
                        serverError.errors[firstErrorKey][0];
                    message.error(firstErrorMessage);

                    // Log all validation errors for debugging
                    // console.log("Validation errors:", serverError.errors)
                } else {
                    message.error(
                        serverError.message ||
                            serverError.error ||
                            "Server error occurred. Please try again.",
                    );
                }

                // Handle specific HTTP status codes
                if (error.response.status === 413) {
                    message.error(
                        "File size too large. Please upload smaller files.",
                    );
                } else if (error.response.status === 429) {
                    message.error("Too many requests. Please try again later.");
                } else if (error.response.status === 422) {
                    // Validation errors are already handled above
                    // console.log("Validation error details:", serverError)
                } else if (error.response.status === 500) {
                    message.error("Server error. Please try again later.");
                }
            } else if (error.request) {
                // Network error - no response received
                message.error(
                    "Network error. Please check your internet connection and try again.",
                );
                console.error("Network error details:", error.request);
            } else if (error.code === "ECONNABORTED") {
                // Timeout error
                message.error("Request timeout. Please try again.");
            } else if (error.message) {
                // Other errors with message
                message.error(error.message);
            } else {
                // Unknown error
                message.error(
                    "An unexpected error occurred. Please try again.",
                );
            }

            // Log detailed error for debugging
            console.error("Detailed error:", {
                message: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status,
            });
        } finally {
            // Always execute - clean up loading states
            setLoading(false);

            // Ensure loading message is cleared
            if (loadingMessage) {
                message.destroy();
            }

            // Clear any other loading states if needed
            // console.log("Form submission process completed")
        }
    };

    // Helper function to convert data URL to Blob
    const dataURLToBlobSync = (dataURL) => {
        try {
            const arr = dataURL.split(",");
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }

            return new Blob([u8arr], { type: mime });
        } catch (error) {
            console.error("Error converting data URL to blob:", error);
            throw error;
        }
    };

    // Async version of dataURLToBlob
    const dataURLToBlob = async (dataURL) => {
        return dataURLToBlobSync(dataURL);
    };

    const getDocumentStatus = (status) => {
        const statusConfig = {
            pending: {
                color: "orange",
                text: "Pending Review",
                icon: <ClockCircleOutlined />,
            },
            approved: {
                color: "green",
                text: "Approved",
                icon: <CheckCircleOutlined />,
            },
            rejected: {
                color: "red",
                text: "Rejected",
                icon: <DeleteOutlined />,
            },
        };
        return statusConfig[status] || statusConfig.pending;
    };

    const PersonalInfoStep = () => (
        <div className="form-step">
            
            <Title level={3} style={{ marginBottom: 0 }}>
                Personal Information
            </Title>

            <Text
                type="secondary"
                style={{
                    display: "block",
                    marginBottom: 24,
                }}
            >
                Tell us about yourself
            </Text>

            <Divider />

            <Row gutter={[24, 16]}>
                <Col span={24} className="avatar-upload-section">
                    <div className="avatar-upload">
                        <Text strong>Profile Picture</Text>
                        <div className="avatar-upload-container">
                            <Upload
                                {...profileUploadProps}
                                className="avatar-uploader"
                            >
                                {profileImage ? (
                                    <div className="avatar-preview">
                                        <img
                                            src={
                                                profileImage ||
                                                "/placeholder.svg"
                                            }
                                            alt="avatar"
                                        />
                                        <div className="avatar-edit-overlay">
                                            <CameraOutlined />
                                            <div>Change Photo</div>
                                        </div>
                                    </div>
                                ) : (
                                    profileUploadButton
                                )}
                            </Upload>
                            {profileImage && (
                                <Button
                                    type="link"
                                    danger
                                    onClick={() => setProfileImage(null)}
                                    className="remove-photo-btn"
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                        <Text type="secondary" className="upload-hint">
                            Recommended: Square image, 500x500px, max 5MB
                        </Text>
                    </div>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="first_name"
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <UserOutlined />
                                First Name
                            </span>
                        }
                        rules={[
                            {
                                required: true,
                                message: "Please enter your first name",
                            },
                            {
                                pattern: /^[A-Za-z\s]+$/,
                                message: "First name must contain letters only",
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="Enter your first name"
                            onChange={(e) => {
                                let value = e.target.value;

                                // Remove numbers & special characters
                                value = value.replace(/[^A-Za-z\s]/g, "");

                                // Update the form value properly
                                form.setFieldsValue({ first_name: value });
                            }}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="last_name"
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <UserOutlined />
                                Last Name
                            </span>
                        }
                        rules={[
                            {
                                required: true,
                                message: "Please enter your last name",
                            },
                            {
                                pattern: /^[A-Za-z\s]+$/,
                                message: "Last name must contain letters only",
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="Enter your last name"
                            onChange={(e) => {
                                let value = e.target.value;

                                // Remove numbers & special characters
                                value = value.replace(/[^A-Za-z\s]/g, "");

                                // Update the form value properly
                                form.setFieldsValue({ last_name: value });
                            }}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="middle_name"
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <UserOutlined />
                                Middle Name {'(Optional)'}
                            </span>
                        }
                        rules={[
                            {
                                pattern: /^[A-Za-z\s]*$/,
                                message:
                                    "Middle name must contain letters only",
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="Enter your middle name"
                            onChange={(e) => {
                                let value = e.target.value;

                                // Remove any number or special characters
                                value = value.replace(/[^A-Za-z\s]/g, "");

                                // Update Ant Design form value properly
                                form.setFieldsValue({ middle_name: value });
                            }}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="suffix" label="Suffix">
                        <Select size="large" placeholder="Select suffix">
                            <Option value="">None</Option>
                            <Option value="Jr.">Jr.</Option>
                            <Option value="Sr.">Sr.</Option>
                            <Option value="II">II</Option>
                            <Option value="III">III</Option>
                            <Option value="IV">IV</Option>
                        </Select>
                    </Form.Item>
                </Col>
                {showImportantNotice && (
                    <Col span={24}>
                        <div className="alumni-important-notice" role="alert">
                            <button
                                type="button"
                                className="alumni-important-notice__close"
                                onClick={() => setShowImportantNotice(false)}
                                aria-label="Dismiss notice"
                            >
                                ×
                            </button>
                            <div className="alumni-important-notice__icon">
                                <WarningOutlined />
                            </div>
                            <div className="alumni-important-notice__body">
                                <div className="alumni-important-notice__title">
                                    Important Notice
                                </div>
                                <p className="alumni-important-notice__text">
                                    Your <strong>Email Address</strong> and{" "}
                                    <strong>Student ID Number</strong> must{" "}
                                    <strong>exactly match</strong> your records
                                    in the{" "}
                                    <strong>
                                        Student Information System (SIS)
                                    </strong>
                                    . We use these to verify you are a
                                    legitimate student / alumnus of Opol
                                    Community College.
                                </p>
                                <ul className="alumni-important-notice__list">
                                    <li>
                                        Use your <strong>@gmail.com</strong>{" "}
                                        account registered in SIS.
                                    </li>
                                    <li>
                                        Student ID format:{" "}
                                        <strong>YYYY-S-NNNNN</strong> (e.g.,{" "}
                                        <strong>2021-2-04062</strong>).
                                    </li>
                                    <li>
                                        Mismatched, fake, or invalid information
                                        will result in{" "}
                                        <strong>
                                            automatic account rejection
                                        </strong>
                                        .
                                    </li>
                                </ul>
                                <p className="alumni-important-notice__text">
                                    Forgot your email or Student ID?{" "}
                                    <a
                                        href="https://sis.occph.com/login"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="alumni-important-notice__link"
                                    >
                                        Recover them on SIS →
                                    </a>
                                </p>
                            </div>
                        </div>
                    </Col>
                )}
                <Col xs={24} sm={12}>
  <Form.Item
    name="email"
    label={
        <span
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
            }}
        >
            <MailOutlined />
            Email Address
        </span>
    }
    dependencies={["first_name", "last_name"]}
    rules={[
        {
            required: true,
            message: "Please enter your email",
        },
        {
            type: "email",
            message: "Please enter a valid email",
        },
        {
            validator: async (_, value) => {
                if (!value) return Promise.resolve();

                const firstName =
                    form.getFieldValue("first_name")?.trim() || "";
                const lastName =
                    form.getFieldValue("last_name")?.trim() || "";

                // First word of the first name only
                const firstWord = firstName
                    .split(/\s+/)[0]
                    .replace(/[^a-zA-Z]/g, "")
                    .toLowerCase();

                // Remove spaces from last name
                const cleanLastName = lastName
                    .replace(/\s+/g, "")
                    .toLowerCase();

                // Email format:
                // occ.lastname.firstword(optional letters/numbers)@gmail.com
                const emailRegex = new RegExp(
                    `^occ\\.${cleanLastName}\\.${firstWord}[a-zA-Z0-9]*@gmail\\.com$`,
                    "i"
                );

                if (!emailRegex.test(value.trim())) {
                    return Promise.reject(
                        new Error(
                            `Email must start with: occ.${cleanLastName}.${firstWord}@gmail.com`
                        )
                    );
                }

                try {
                    const res = await axios.get("check-email", {
                        params: {
                            email: value.trim(),
                        },
                        silent: true,
                    });

                    if (res.data.exists) {
                        return Promise.reject(
                            new Error("This email is already in use")
                        );
                    }

                    return Promise.resolve();
                } catch (err) {
                    console.error("Email validation error:", err);
                    return Promise.resolve();
                }
            },
        },
    ]}
    validateTrigger={["onBlur"]}
>
    <Input
        size="large"
        placeholder="occ.lastname.firstname@gmail.com"
    />
</Form.Item>

</Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="phone"
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <PhoneOutlined />
                                Phone Number
                            </span>
                        }
                        rules={[
                            {
                                required: true,
                                message: "Please enter your phone number",
                            },
                            {
                                pattern: /^09\d{9}$/,
                                message:
                                    "Phone number must be 11 digits and start with 09",
                            },
                            {
                                validator: async (_, value) => {
                                    if (!value) return Promise.resolve();

                                    const phoneRegex = /^(09|\+639)\d{9}$/;

                                    if (!phoneRegex.test(value)) {
                                        return Promise.reject(
                                            new Error(
                                                "Please enter a valid Philippine mobile number",
                                            ),
                                        );
                                    }

                                    try {
                                        const res = await axios.get(
                                            "check-phone",
                                            {
                                                params: {
                                                    phone: value,
                                                },

                                                silent: true,
                                            },
                                        );

                                        if (res.data.exists) {
                                            return Promise.reject(
                                                new Error(
                                                    "This phone number is already in use",
                                                ),
                                            );
                                        }

                                        return Promise.resolve();
                                    } catch (err) {
                                        console.error(
                                            "Phone validation error:",
                                            err,
                                        );

                                        return Promise.resolve();
                                    }
                                },
                            },
                        ]}
                        validateTrigger={["onBlur"]}
                    >
                        <Input
                            size="large"
                            maxLength={11}
                            onChange={(e) => {
                                // only allow numbers — BUT do not force starting with 09
                                const value = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 11);
                                form.setFieldsValue({ phone: value });
                            }}
                            placeholder="09XXXXXXXXX"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item
                        name="address"
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <EnvironmentOutlined />
                                Current Address
                            </span>
                        }
                        rules={[
                            {
                                required: true,
                                message: "Please enter your address",
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="Enter your complete address"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="birth_date"
                        label="Date of Birth | Only 2006 and Earlier Years Are Selectable"
                        rules={[
                            {
                                required: true,
                                message: "Please select your birth date",
                            },
                        ]}
                    >
                        <DatePicker
                            style={{ width: "100%" }}
                            size="large"
                            placeholder="Select your birth date"
                            disabledDate={(current) => {
                                const twentyYearsAgo = dayjs().subtract(
                                    20,
                                    "year",
                                );
                                return (
                                    current &&
                                    current.isAfter(twentyYearsAgo, "day")
                                );
                            }}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="gender"
                        label="Gender"
                        rules={[
                            {
                                required: true,
                                message: "Please select your gender",
                            },
                        ]}
                    >
                        <Radio.Group>
                            <Radio value="male">Male</Radio>
                            <Radio value="female">Female</Radio>
                            <Radio value="other">Other</Radio>
                            <Radio value="prefer_not_to_say">
                                Prefer not to say
                            </Radio>
                        </Radio.Group>
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item name="bio" label="Personal Bio">
                        <TextArea
                            rows={4}
                            placeholder="Tell us about yourself, your interests, and your background..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                {/* First Column - Password */}
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Please input your password!",
                            },
                            {
                                min: 6,
                                message:
                                    "Password must be at least 6 characters!",
                            },
                        ]}
                    >
                        <Input.Password
                            placeholder="Enter password"
                            size="large"
                        />
                    </Form.Item>
                </Col>

                {/* Second Column - Confirm Password */}
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Confirm Password"
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                            {
                                required: true,
                                message: "Please confirm your password!",
                            },

                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("password") === value
                                    ) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(
                                        new Error("Passwords do not match!"),
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            placeholder="Confirm password"
                            size="large"
                        />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const AcademicInfoStep = () => (
        <div className="form-step">
            <Title level={3}>Academic Information</Title>
            <Text type="secondary">
                Tell us about your educational background
            </Text>

            <Divider />

            <Row gutter={[24, 16]}>
                <Col xs={24}>
                    <Form.Item
                        name="course_id"
                        label="Course/Degree"
                        rules={[
                            {
                                required: true,
                                message: "Please select your course",
                            },
                        ]}
                    >
                        <Select
                            size="large"
                            placeholder="Select your course"
                            showSearch
                            optionFilterProp="children"
                            loading={isLoading}
                        >
                            {Array.isArray(courses) &&
                                courses.map((course) => (
                                    <Option key={course.id} value={course.id}>
                                        {course.course_code}(
                                        {course.course_name})
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>
                </Col>
                {showImportantNotice && (
                    <Col span={24}>
                        <div className="alumni-important-notice" role="alert">
                            <button
                                type="button"
                                className="alumni-important-notice__close"
                                onClick={() => setShowImportantNotice(false)}
                                aria-label="Dismiss notice"
                            >
                                ×
                            </button>
                            <div className="alumni-important-notice__icon">
                                <WarningOutlined />
                            </div>
                            <div className="alumni-important-notice__body">
                                <div className="alumni-important-notice__title">
                                    Important Notice
                                </div>
                                <p className="alumni-important-notice__text">
                                    Your <strong>Email Address</strong> and{" "}
                                    <strong>Student ID Number</strong> must{" "}
                                    <strong>exactly match</strong> your records
                                    in the{" "}
                                    <strong>
                                        Student Information System (SIS)
                                    </strong>
                                    . We use these to verify you are a
                                    legitimate student / alumnus of Opol
                                    Community College.
                                </p>
                                <ul className="alumni-important-notice__list">
                                    <li>
                                        Use your <strong>@gmail.com</strong>{" "}
                                        account registered in SIS.
                                    </li>
                                    <li>
                                        Student ID format:{" "}
                                        <strong>YYYY-S-NNNNN</strong> (e.g.,{" "}
                                        <strong>2021-2-04062</strong>).
                                    </li>
                                    <li>
                                        Mismatched, fake, or invalid information
                                        will result in{" "}
                                        <strong>
                                            automatic account rejection
                                        </strong>
                                        .
                                    </li>
                                </ul>
                                <p className="alumni-important-notice__text">
                                    Forgot your email or Student ID?{" "}
                                    <a
                                        href="https://sis.occph.com/login"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="alumni-important-notice__link"
                                    >
                                        Recover them on SIS →
                                    </a>
                                </p>
                            </div>
                        </div>
                    </Col>
                )}
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="studentId"
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <IdcardOutlined />
                               Student ID
                            </span>
                        }
                        extra="Just type the numbers. Dashes are automatically added."
                        rules={[
                            {
                                required: true,
                                message: "Please enter your student ID",
                            },
                            {
                                pattern: /^\d{4}-\d-\d{5}$/,
                                message:
                                    "Format must be YYYY-S-NNNNN (e.g., 2021-2-04062)",
                            },
                            {
                                validator: async (_, value) => {
                                    if (!value) return Promise.resolve();

                                    // Validate format first
                                    const studentIdRegex = /^\d{4}-\d-\d{5}$/;

                                    if (!studentIdRegex.test(value)) {
                                        return Promise.reject(
                                            new Error(
                                                "Format must be YYYY-S-NNNNN",
                                            ),
                                        );
                                    }

                                    try {
                                        const res = await axios.get(
                                            "check-student-id",
                                            {
                                                params: {
                                                    studentId: value,
                                                },

                                                // IMPORTANT
                                                silent: true,
                                            },
                                        );

                                        if (res.data.exists) {
                                            return Promise.reject(
                                                new Error(
                                                    "This student ID is already in use",
                                                ),
                                            );
                                        }

                                        return Promise.resolve();
                                    } catch (err) {
                                        console.error(
                                            "Student ID validation error:",
                                            err,
                                        );

                                        // Prevent annoying refresh/reset feeling
                                        return Promise.resolve();
                                    }
                                },
                            },
                        ]}
                        validateTrigger={["onBlur"]}
                    >
                        <Input
                            size="large"
                            placeholder="2021-2-04062"
                            maxLength={12}
                            onChange={(e) => {
                                let value = e.target.value;

                                // Remove all characters except numbers
                                value = value.replace(/[^0-9]/g, "");

                                // Apply formatting as YYYY-S-NNNNN
                                if (value.length > 4)
                                    value =
                                        value.slice(0, 4) +
                                        "-" +
                                        value.slice(4);
                                if (value.length > 6)
                                    value =
                                        value.slice(0, 6) +
                                        "-" +
                                        value.slice(6);

                                form.setFieldsValue({ studentId: value });
                            }}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="graduationYear"
                        label="Graduation Year (4th Year)"
                        rules={[
                            {
                                required: true,
                                message: "Please select graduation year",
                            },
                        ]}
                    >
                        <Select
                            size="large"
                            placeholder="Expected Graduation Year"
                            onChange={(value) => {
                                setSelectedGradYear(value);
                                form.setFieldsValue({
                                    enrollmentYear: value - 1,
                                }); // reset enrollment
                            }}
                        >
                            {Array.from({ length: 30 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
                                return (
                                    <Option key={year} value={year}>
                                        {year}
                                    </Option>
                                );
                            })}
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="enrollmentYear"
                        label="Enrollment Year (4th Year)"
                        rules={[
                            {
                                required: true,
                                message: "Please select your enrollment year",
                            },
                        ]}
                    >
                        <Select
                            size="large"
                            placeholder="Enrollment year"
                            disabled={!selectedGradYear}
                        >
                            {selectedGradYear && (
                                <Option value={selectedGradYear - 1}>
                                    {selectedGradYear - 1}
                                </Option>
                            )}
                        </Select>
                    </Form.Item>
                </Col>


<Col xs={24} sm={12}>
    <Form.Item name="honors" label="Honors/Awards">
        <Select
            mode="tags"
            size="large"
            placeholder="Add honors or choose awards received"
            tokenSeparators={[","]}
            onChange={(values) => {
                let newValues = [...values];

                // "None" is exclusive
                if (newValues.includes("None")) {
                    if (newValues[newValues.length - 1] === "None") {
                        newValues = ["None"];
                    } else {
                        newValues = newValues.filter(
                            (item) => item !== "None"
                        );
                    }
                }

                // Only one Latin Honor can exist
                const selectedLatinHonors = newValues.filter((item) =>
                    latinHonors.includes(item) && item !== "None"
                );

                if (selectedLatinHonors.length > 1) {
                    const latestLatinHonor =
                        selectedLatinHonors[selectedLatinHonors.length - 1];

                    newValues = newValues.filter(
                        (item) =>
                            !latinHonors.includes(item) ||
                            item === latestLatinHonor
                    );
                }

                form.setFieldsValue({
                    honors: newValues,
                });
            }}
        >
            {awardsOptions.map((award) => (
                <Option key={award} value={award}>
                    {award}
                </Option>
            ))}
        </Select>
    </Form.Item>
</Col>
                <Col xs={24}>
                    <Form.Item
                        name="thesisTitle"
                        label="Thesis/Capstone Title"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter your thesis or capstone project title",
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="Enter your thesis or capstone project title"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item
                        name="academicAchievements"
                        label="Academic Achievements"
                    >
                        <TextArea
                            rows={3}
                            placeholder="List any academic achievements, research projects, or notable accomplishments..."
                            maxLength={300}
                            showCount
                        />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item
                        name="extracurricular"
                        label="Extracurricular Activities"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Describe your involvement in clubs, organizations, sports, or other activities..."
                            maxLength={300}
                            showCount
                        />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item
                        name="continueEducation"
                        label="Plan to Continue Education?"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const CareerInfoStep = () => (
        <div className="form-step">
            <Title level={3}>Career Information</Title>
            <Text type="secondary">
                Tell us about your professional journey
            </Text>

            <Divider />

            <Row gutter={[24, 16]}>
                <Col xs={24}>
                    <Form.Item
                        name="employment_status_id"
                        label="Current Employment Status"
                        rules={[
                            {
                                required: true,
                                message: "Please select employment status",
                            },
                        ]}
                    >
                        <Select
                            size="large"
                            placeholder="Select your employment status"
                            onChange={(value) => {
                                const selected = statuses.find(
                                    (s) => s.id === value,
                                );

                                const unemployedSelected = selected?.status_name
                                    ?.toLowerCase()
                                    .includes("unemployed");

                                setIsUnemployed(unemployedSelected);

                                // Clear all fields when unemployed
                                if (unemployedSelected) {
                                    form.setFieldsValue({
                                        currentCompany: undefined,
                                        jobTitle: undefined,
                                        industry: undefined,
                                        yearsExperience: undefined,
                                        salaryRange: undefined,
                                        workLocation: undefined,
                                        careerGoals: undefined,
                                        previousCompanies: undefined,
                                    });
                                }
                            }}
                        >
                            {Array.isArray(statuses) &&
                                statuses.map((status) => (
                                    <Option key={status.id} value={status.id}>
                                        <Tag
                                            color={
                                                statusColors[
                                                    status.status_name
                                                ] || "default"
                                            }
                                        >
                                            {status.status_name}
                                        </Tag>
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>
                </Col>

                {!isUnemployed && (
                    <>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="currentCompany"
                                label="Current Company/Organization"
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter your current company"
                                    prefix={<GlobalOutlined />}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="jobTitle"
                                label="Job Title/Position"
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter your job title"
                                    prefix={<TrophyOutlined />}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="industry" label="Industry">
                                <Select
                                    size="large"
                                    disabled={isUnemployed}
                                    placeholder="Select industry"
                                >
                                    {industryOptions.map((industry) => (
                                        <Option key={industry} value={industry}>
                                            {industry}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="yearsExperience"
                                label="Years of Experience"
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    size="large"
                                    disabled={isUnemployed}
                                    min={1} // minimum 1
                                    max={10} // maximum 10
                                    step={1} // only whole numbers
                                    stringMode={false}
                                    parser={(value) => value.replace(/\D/g, "")} // remove non-numeric characters
                                    placeholder="0"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="salaryRange"
                                label="Current Annual Salary Range (PHP)"
                            >
                                <Select
                                    size="large"
                                    disabled={isUnemployed}
                                    placeholder="Select annual salary range"
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
                                        ₱750,001 - ₱1,000,000 per year
                                    </Option>
                                    <Option value="1000001-1250000">
                                        ₱1,000,001 - ₱1,250,000 per year
                                    </Option>
                                    <Option value="1250001-1500000">
                                        ₱1,250,001 - ₱1,500,000 per year
                                    </Option>
                                    <Option value="prefer_not_to_say">
                                        Prefer not to say
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="workLocation"
                                label="Work Location"
                            >
                                <Input
                                    size="large"
                                    disabled={isUnemployed}
                                    placeholder="City, State, Country"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24}>
                            <Form.Item
                                name="careerGoals"
                                label="Career Goals & Aspirations"
                            >
                                <TextArea
                                    rows={3}
                                    disabled={isUnemployed}
                                    placeholder="Describe your career goals and where you see yourself in the next 5 years..."
                                    maxLength={400}
                                    showCount
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24}>
                            <Form.Item
                                name="previousCompanies"
                                label="Previous Companies/Positions"
                            >
                                <TextArea
                                    rows={3}
                                    disabled={isUnemployed}
                                    placeholder="List your previous work experiences (Company - Position - Duration)..."
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                    </>
                )}

                <Divider />

                <Col xs={24}>
                    <Title level={5}>
                        <GlobalOutlined /> Social Media & Professional Links
                    </Title>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="linkedin" label="LinkedIn Profile">
                        <Input
                            size="large"
                            placeholder="https://linkedin.com/in/yourprofile"
                            prefix={<LinkedinOutlined />}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="github" label="GitHub Profile">
                        <Input
                            size="large"
                            placeholder="https://github.com/yourusername"
                            prefix={<GithubOutlined />}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="portfolio" label="Portfolio Website">
                        <Input
                            size="large"
                            placeholder="https://yourportfolio.com"
                            prefix={<GlobalOutlined />}
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="twitter" label="Twitter/X Profile">
                        <Input
                            size="large"
                            placeholder="https://twitter.com/yourusername"
                            prefix={<TwitterOutlined />}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const DocumentsStep = () => (
        <div className="form-step">
            <Title level={3}>Document Upload</Title>
            <Text type="secondary">
                Upload your identification documents for verification
            </Text>

            <Divider />

            <Alert
                message="Important"
                description="Please upload clear, readable images of your documents. All documents will be reviewed for verification purposes."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[24, 16]}>
                <Col span={24}>
                    <Card title="Required Documents" size="small">
                        <Row gutter={[16, 16]}>
                            {ID_TYPES.map((docType) => {
                                const uploadedDoc = idDocuments.find(
                                    (doc) => doc.type === docType.value,
                                );
                                return (
                                    <Col
                                        xs={24}
                                        sm={12}
                                        md={8}
                                        key={docType.value}
                                    >
                                        <Card
                                            className={`id-upload-card ${uploadedDoc ? "uploaded" : ""}`}
                                            size="small"
                                        >
                                            <div className="id-card-content">
                                                <div className="id-icon">
                                                    {docType.icon}
                                                </div>
                                                <div className="id-info">
                                                    <Text strong>
                                                        {docType.label}
                                                    </Text>
                                                    {uploadedDoc ? (
                                                        <div className="upload-status">
                                                            <Tag
                                                                color="green"
                                                                icon={
                                                                    <CheckCircleOutlined />
                                                                }
                                                            >
                                                                Uploaded
                                                            </Tag>
                                                            <div className="document-actions">
                                                                <Tooltip title="View Document">
                                                                    <Button
                                                                        type="link"
                                                                        icon={
                                                                            <EyeOutlined />
                                                                        }
                                                                        onClick={() => {
                                                                            Modal.info(
                                                                                {
                                                                                    title: docType.label,
                                                                                    content:
                                                                                        (
                                                                                            <Image
                                                                                                width="100%"
                                                                                                src={
                                                                                                    uploadedDoc.url ||
                                                                                                    "/placeholder.svg"
                                                                                                }
                                                                                                alt={
                                                                                                    docType.label
                                                                                                }
                                                                                            />
                                                                                        ),
                                                                                    icon: null,
                                                                                    width: 600,
                                                                                },
                                                                            );
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Remove Document">
                                                                    <Button
                                                                        type="link"
                                                                        danger
                                                                        icon={
                                                                            <DeleteOutlined />
                                                                        }
                                                                        onClick={() =>
                                                                            removeDocument(
                                                                                uploadedDoc.id,
                                                                            )
                                                                        }
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Upload
                                                            {...idUploadProps(
                                                                docType.value,
                                                            )}
                                                        >
                                                            {idUploadButton(
                                                                docType.value,
                                                            )}
                                                        </Upload>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Card>
                </Col>

                {/* Uploaded Documents List */}
                {idDocuments.length > 0 && (
                    <Col span={24}>
                        <Card title="Uploaded Documents" size="small">
                            <List
                                dataSource={idDocuments}
                                renderItem={(doc) => {
                                    const docType = ID_TYPES.find(
                                        (d) => d.value === doc.type,
                                    );
                                    const status = getDocumentStatus(
                                        doc.status,
                                    );

                                    return (
                                        <List.Item
                                            actions={[
                                                <Tooltip
                                                    title="View Document"
                                                    key="view"
                                                >
                                                    <Button
                                                        icon={<EyeOutlined />}
                                                        onClick={() => {
                                                            Modal.info({
                                                                title: docType?.label,
                                                                content: (
                                                                    <Image
                                                                        width="100%"
                                                                        src={
                                                                            doc.url ||
                                                                            "/placeholder.svg"
                                                                        }
                                                                        alt={
                                                                            docType?.label
                                                                        }
                                                                    />
                                                                ),
                                                                icon: null,
                                                                width: 600,
                                                            });
                                                        }}
                                                    />
                                                </Tooltip>,
                                                <Tooltip
                                                    title="Remove Document"
                                                    key="remove"
                                                >
                                                    <Button
                                                        danger
                                                        icon={
                                                            <DeleteOutlined />
                                                        }
                                                        onClick={() =>
                                                            removeDocument(
                                                                doc.id,
                                                            )
                                                        }
                                                    />
                                                </Tooltip>,
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={docType?.icon}
                                                title={
                                                    <Space>
                                                        <Text>
                                                            {docType?.label}
                                                        </Text>
                                                        <Tag
                                                            color={status.color}
                                                            icon={status.icon}
                                                        >
                                                            {status.text}
                                                        </Tag>
                                                    </Space>
                                                }
                                                description={
                                                    <Space
                                                        direction="vertical"
                                                        size={0}
                                                    >
                                                        <Text type="secondary">
                                                            File: {doc.name}
                                                        </Text>
                                                        <Text type="secondary">
                                                            Uploaded:{" "}
                                                            {moment(
                                                                doc.uploadDate,
                                                            ).format(
                                                                "MMM DD, YYYY HH:mm",
                                                            )}
                                                        </Text>
                                                    </Space>
                                                }
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );

    const ReviewSubmitStep = () => (
        <div className="form-step">
            <Title level={3}>Review & Submit</Title>
            <Text type="secondary">
                Please review your information before submitting
            </Text>

            <Divider />

            <Alert
                message="Almost Done!"
                description="Please review all your information carefully. Once submitted, you'll be able to update your profile later."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* Document Status Check */}
            <div className="document-status-check">
                <Space direction="vertical" style={{ width: "100%" }}>
                    <div className="status-item">
                        <CheckCircleOutlined
                            style={{
                                color: profileImage ? "#52c41a" : "#d9d9d9",
                            }}
                        />
                        <Text>
                            Profile Photo{" "}
                            {profileImage ? "Uploaded" : "Required"}
                        </Text>
                    </div>
                    <div className="status-item">
                        <CheckCircleOutlined
                            style={{
                                color:
                                    idDocuments.length > 0
                                        ? "#52c41a"
                                        : "#d9d9d9",
                            }}
                        />
                        <Text>
                            ID Documents{" "}
                            {idDocuments.length > 0 ? "Uploaded" : "Required"}
                        </Text>
                    </div>
                </Space>
            </div>

            <Divider />

            <div className="review-section">
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        handlePreview();
                    }}
                    size="large"
                    disabled={!profileImage || idDocuments.length === 0}
                >
                    Preview Full Application
                </Button>
                {(!profileImage || idDocuments.length === 0) && (
                    <Text
                        type="danger"
                        style={{ display: "block", marginTop: 8 }}
                    >
                        Please upload both profile photo and at least one ID
                        document to continue
                    </Text>
                )}
            </div>

            <Divider />

            <Row gutter={[24, 16]}>
                <Col xs={24}>
                    <Form.Item
                        name="agreement"
                        valuePropName="checked"
                        rules={[
                            {
                                required: true,
                                message: "Please agree to the terms",
                            },
                        ]}
                    >
                        <Checkbox>
                            I confirm that all information provided is accurate
                            and truthful. I agree to the{" "}
                            <a
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsPrivacyModalOpen(true);
                                }}
                                style={{
                                    marginLeft: 4,
                                    cursor: "pointer",
                                    color: "red",
                                    textDecoration: "underline",
                                }}
                            >
                                Privacy Policy
                            </a>{" "}
                            and{" "}
                            <a
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsTermsModalOpen(true);
                                }}
                                style={{
                                    marginLeft: 4,
                                    cursor: "pointer",
                                    color: "red",
                                    textDecoration: "underline",
                                }}
                            >
                                Terms of Service
                            </a>
                            .
                        </Checkbox>
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item name="newsletter" valuePropName="checked">
                        <Checkbox>
                            I would like to receive updates about alumni events,
                            news, and opportunities
                        </Checkbox>
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item name="contactPermission" valuePropName="checked">
                        <Checkbox>
                            I give permission to be contacted by the university
                            and other alumni for networking opportunities
                        </Checkbox>
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    return (
        <div className="alumni-registration">
             <ScrollProgressOrb />
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
            <Card className="registration-card">
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
                {/* ===== Modern Hero Header ===== */}
                <div className="company-header">
                    <div className="company-logo-section">
                        <Avatar
                            src={companyInfo.logo}
                            size={64}
                            shape="square"
                            className="company-logo"
                        />
                        <div className="company-info">
                            <Tag
                                className="ant-tag"
                                color="processing"
                                style={{ marginBottom: 8 }}
                            >
                                <SafetyCertificateOutlined /> Official Alumni
                                Portal
                            </Tag>
                            <Title level={2} className="company-name">
                                {companyInfo.name}
                            </Title>
                            <Text className="company-slogan">
                                {companyInfo.slogan}
                            </Text>
                            <div className="company-details">
                                <Space size={[16, 6]} wrap>
                                    <Space size={6}>
                                        <GlobalOutlined />
                                        <Text type="secondary">
                                            {companyInfo.website}
                                        </Text>
                                    </Space>
                                    <Space size={6}>
                                        <EnvironmentOutlined />
                                        <Text type="secondary">
                                            {companyInfo.address}
                                        </Text>
                                    </Space>
                                </Space>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Registration Title ===== */}
                <div className="registration-header">
                    <Title level={3}>Alumni Registration Portal</Title>
                    <Text type="secondary">
                        Join the {companyInfo.name} alumni network and stay
                        connected with classmates, mentors, and your university
                        community.
                    </Text>
                </div>

                <Divider />

                {/* Progress Bar */}
                <div className="progress-section">
                    <Progress
                        percent={calculateProgress()}
                        showInfo={false}
                        strokeColor={{
                            "0%": "#108ee9",
                            "100%": "#87d068",
                        }}
                    />
                    <Text type="secondary">
                        Step {currentStep + 1} of {steps.length}
                    </Text>
                </div>

                {/* Stepper */}
                <Steps current={currentStep} className="registration-steps">
                    {steps.map((step, index) => (
                        <Step key={index} title={step.title} icon={step.icon} />
                    ))}
                </Steps>

                <Divider />

                {/* Form Content */}
                <Form
                    form={form}
                    layout="vertical"
                    className="registration-form"
                    onValuesChange={saveFormData}
                    initialValues={{
                        gender: "male",
                        newsletter: true,
                        contactPermission: true,
                    }}
                >
                    {/* {currentStep === 0 && <PersonalInfoStep />}
                    {currentStep === 1 && <AcademicInfoStep />}
                    {currentStep === 2 && <CareerInfoStep />}
                    {currentStep === 3 && <DocumentsStep />}
                    {currentStep === 4 && <ReviewSubmitStep />} */}
                    {(currentStep === 0 || currentStep === "all") && (
                        <PersonalInfoStep />
                    )}
                    {(currentStep === 1 || currentStep === "all") && (
                        <AcademicInfoStep />
                    )}
                    {(currentStep === 2 || currentStep === "all") && (
                        <CareerInfoStep />
                    )}
                    {(currentStep === 3 || currentStep === "all") && (
                        <DocumentsStep />
                    )}
                    {(currentStep === 4 || currentStep === "all") && (
                        <ReviewSubmitStep />
                    )}
                </Form>

                {/* Navigation Buttons */}
                <Divider />

                <div className="navigation-buttons">
                    <Space size="large">
                        {currentStep > 0 && (
                            <Button size="large" onClick={handlePrev}>
                                Previous
                            </Button>
                        )}
                        {currentStep < steps.length - 1 && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleNext}
                            >
                                Next
                            </Button>
                        )}
                        {currentStep === steps.length - 1 && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={handlePreview}
                                disabled={
                                    !profileImage || idDocuments.length === 0
                                }
                            >
                                Submit Application
                            </Button>
                        )}
                    </Space>
                </div>

                {/* Footer */}
                <Divider />
                <div className="registration-footer">
                    <Space
                        direction="vertical"
                        align="center"
                        style={{ width: "100%" }}
                    >
                        {/* <Text type="secondary">{companyInfo.name} Alumni Association</Text> */}
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                            © 2025 {companyInfo.name}. All rights reserved.
                        </Text>
                    </Space>
                </div>
            </Card>

            <AlumniDetails
                visible={isModalVisible}
                onCancel={() => {
                    setCurrentStep(4);
                    setIsModalVisible(false);
                }}
                onSubmit={handleSubmit}
                previewData={previewData}
                loading={loading}
                viewOwnProfile={true}
            />

            <Modal
                title={
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <WarningOutlined
                            style={{ fontSize: "20px", color: "#ff4d4f" }}
                        />
                        <span>Agreement Required</span>
                    </div>
                }
                open={isAgreementModalVisible}
                onCancel={() => setIsAgreementModalVisible(false)}
                footer={[
                    <Button
                        key="ok"
                        type="primary"
                        onClick={() => setIsAgreementModalVisible(false)}
                    >
                        OK, I understand
                    </Button>,
                ]}
                centered
            >
                <div style={{ padding: "16px 0" }}>
                    <Alert
                        message="Please agree to the terms"
                        description={
                            <div>
                                <p style={{ marginBottom: 8 }}>
                                    You must check the agreement checkbox before
                                    submitting your application:
                                </p>
                                <p
                                    style={{
                                        fontStyle: "italic",
                                        color: "#595959",
                                    }}
                                >
                                    "I confirm that all information provided is
                                    accurate and truthful. I agree to the
                                    Privacy Policy and Terms of Service."
                                </p>
                            </div>
                        }
                        type="error"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                    />
                </div>
            </Modal>

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

                <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%" }}
                >
                    <div>
                        <Title level={5}>
                            <SafetyCertificateOutlined /> 1. Who We Are
                        </Title>
                        <Paragraph>
                            This Privacy Policy is issued by the{" "}
                            <strong>Opol Community College Alumni Office</strong>,
                            in coordination with the{" "}
                            <strong>Guidance and Counseling Office</strong>, both
                            based at ZONE C. Salva St, Opol, 9016 Misamis
                            Oriental. Together they act as the Personal
                            Information Controller (PIC) for the alumni
                            registration and tracing system found at
                            alumni.occph.com, and are responsible for the
                            lawful, fair, and transparent processing of your
                            personal data.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <IdcardOutlined /> 2. Information We Collect
                        </Title>
                        <Paragraph>
                            When you register, we collect personal information
                            that you voluntarily provide, including your full
                            name, birth date, gender, contact number, email
                            address, and home address. We also collect academic
                            records (course, student ID number, graduation
                            year, honors, thesis title) and professional
                            information (employer, job title, industry, years
                            of experience, and work location). Uploaded files
                            such as your profile photo, student/alumni ID,
                            government-issued ID, diploma, or transcript may
                            constitute{" "}
                            <strong>sensitive personal information</strong>{" "}
                            under Section 3(l) of RA 10173 and are treated with
                            heightened protection.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <TrophyOutlined /> 3. Role of the Guidance and
                            Counseling Office
                        </Title>
                        <Paragraph>
                            The <strong>Guidance Counselor</strong>, through the
                            Guidance and Counseling Office, collects and
                            processes alumni data as part of the College's
                            institutional tracer study and career-tracking
                            program. This includes your employment status,
                            employer information, and feedback from the
                            rating and image-based quizzes. This data helps
                            the Guidance Office assess graduate outcomes,
                            recommend career and further-education pathways,
                            refer qualified alumni to job opportunities, and
                            report aggregated, de-identified statistics to
                            school administration and, where required, to the
                            Commission on Higher Education (CHED). The
                            Guidance Counselor accesses only the information
                            reasonably necessary for these functions and is
                            bound by the same confidentiality obligations as
                            Alumni Office staff.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <EyeOutlined /> 4. Purpose and Legal Basis for
                            Processing
                        </Title>
                        <Paragraph>
                            Your data is processed based on your{" "}
                            <strong>consent</strong> (RA 10173, Sec. 12(a) and
                            Sec. 13(a) for sensitive information), given when
                            you tick the registration consent box, and is used
                            to: maintain accurate alumni records; conduct
                            tracer studies and career/employment tracking
                            through the Guidance Counselor; facilitate alumni
                            networking, events, and job postings; send
                            official updates and notifications; and improve
                            Alumni Office and Guidance Office programs and
                            services. We do not use your data for any purpose
                            incompatible with these declared purposes, and we
                            never sell your personal data.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <GlobalOutlined /> 5. Disclosure and Sharing of
                            Information
                        </Title>
                        <Paragraph>
                            Access to your personal data is limited to
                            authorized Alumni Office and Guidance and
                            Counseling Office personnel who need it to perform
                            their official functions. Your profile is visible
                            to other verified alumni only for directory and
                            networking purposes; sensitive documents (IDs,
                            diploma, transcript) are never shown to other
                            alumni. We may share limited employment or contact
                            information with prospective employers or partner
                            organizations only with your explicit, separate
                            consent, for job-referral purposes. We may also
                            disclose information when required by law, court
                            order, or a lawful request from CHED or another
                            government agency.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <SafetyCertificateOutlined /> 6. Data Protection
                            and Security Measures
                        </Title>
                        <Paragraph>
                            We implement organizational, physical, and
                            technical security measures proportionate to the
                            nature of the data we hold, consistent with the
                            NPC's security standards. These include encrypted
                            storage, secure authentication, access controls
                            restricted to authorized personnel, and regular
                            review of our systems. In the event of a personal
                            data breach that poses real risk to you, we will
                            notify the National Privacy Commission and
                            affected data subjects in accordance with RA
                            10173 and its IRR.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <ClockCircleOutlined /> 7. Data Retention
                        </Title>
                        <Paragraph>
                            Your personal data is retained for as long as you
                            remain an active alumni member and for a
                            reasonable period thereafter for institutional
                            record-keeping, tracer studies, and accreditation
                            reporting, or as required by applicable law and
                            school policy. Data that is no longer necessary
                            for these purposes will be securely disposed of or
                            anonymized.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <UserOutlined /> 8. Your Rights as a Data Subject
                        </Title>
                        <Paragraph>
                            Under Section 16 of RA 10173, you have the right
                            to: be informed that your data is being processed;
                            access your personal data; request correction of
                            inaccurate data; object to or withdraw consent for
                            processing; request erasure or blocking of data
                            that is incomplete, outdated, or unlawfully
                            obtained; data portability; and to be indemnified
                            for damages arising from unlawful processing. To
                            exercise any of these rights, please contact the
                            Alumni Office or Guidance and Counseling Office
                            through the Messages page of this system, or visit
                            our office at ZONE C. Salva St, Opol, 9016 Misamis
                            Oriental. We will act on verified requests within
                            a reasonable period, consistent with NPC
                            guidelines.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <MailOutlined /> 9. Complaints and Contact
                        </Title>
                        <Paragraph>
                            If you believe your personal data has been
                            processed unlawfully, you may raise your concern
                            with the Alumni Office first. You also have the
                            right to file a complaint with the{" "}
                            <strong>National Privacy Commission</strong> (
                            <a
                                href="https://www.privacy.gov.ph"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                www.privacy.gov.ph
                            </a>
                            ) if the matter is not resolved to your
                            satisfaction. We will notify you of any material
                            changes to this Privacy Policy and, where
                            required, seek your renewed consent before
                            implementing them.
                        </Paragraph>
                    </div>
                </Space>
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
                styles={{
                    body: { maxHeight: "60vh", overflowY: "auto" },
                }}
            >
                <Divider />

                <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%" }}
                >
                    <div>
                        <Title level={5}>
                            <CheckCircleOutlined /> 1. Acceptance of Terms
                        </Title>
                        <Paragraph>
                            These Terms of Service govern your use of the
                            Opol Community College Alumni Information System
                            (alumni.occph.com), operated by the{" "}
                            <strong>Alumni Office</strong> in coordination
                            with the <strong>Guidance and Counseling
                            Office</strong>. By registering as an alumni
                            member, you agree to comply with these Terms and
                            all applicable Philippine laws, including the Data
                            Privacy Act of 2012 (RA 10173). If you do not
                            agree with any part of these Terms, please do not
                            complete the registration process.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <IdcardOutlined /> 2. Eligibility and Accurate
                            Information
                        </Title>
                        <Paragraph>
                            Registration is open to individuals who have
                            studied at or graduated from Opol Community
                            College. You agree to provide accurate, current,
                            and complete information, including truthful
                            academic records and valid identification
                            documents, and to update such information as
                            necessary. Submitting false, fraudulent, or
                            misleading information, including falsified IDs
                            or academic documents, may result in denial or
                            termination of your alumni membership and, where
                            applicable, referral to appropriate authorities.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <TrophyOutlined /> 3. Guidance Office Tracer
                            Study and Career Tracking
                        </Title>
                        <Paragraph>
                            By registering, you acknowledge that the Guidance
                            Counselor may contact you regarding tracer
                            studies, employment surveys, and career or
                            further-education opportunities, and may use your
                            employment and feedback data (including quiz
                            responses) to support institutional planning,
                            accreditation, and reporting to the College and,
                            where required, CHED. Participation in optional
                            surveys and quizzes helps the College improve
                            programs for current and future students but does
                            not affect your standing as a registered alumnus.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <GlobalOutlined /> 4. Use of Services
                        </Title>
                        <Paragraph>
                            Alumni services are provided for networking,
                            professional development, job referrals, events,
                            and maintaining your connection with Opol
                            Community College. You agree not to use these
                            services for any unlawful purpose, to harass or
                            spam other members, to misrepresent your identity,
                            or to engage in any activity that could harm the
                            College's reputation, the Alumni or Guidance
                            Office, or other members' experience.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <BookOutlined /> 5. Intellectual Property
                        </Title>
                        <Paragraph>
                            All content provided through the alumni platform,
                            including text, graphics, logos, and software, is
                            the property of Opol Community College or its
                            content suppliers and is protected under the
                            Intellectual Property Code of the Philippines (RA
                            8293). You may not reproduce, distribute, or
                            create derivative works from this content without
                            prior written permission.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <SafetyCertificateOutlined /> 6. Data Privacy
                        </Title>
                        <Paragraph>
                            Your use of this system is also governed by our
                            Privacy Policy, which explains how the Alumni
                            Office and Guidance and Counseling Office collect,
                            use, and protect your personal data in compliance
                            with RA 10173. By agreeing to these Terms, you
                            confirm that you have read and understood the
                            Privacy Policy.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <ClockCircleOutlined /> 7. Modifications and
                            Termination
                        </Title>
                        <Paragraph>
                            We reserve the right to modify these Terms at any
                            time. Material changes will be posted on the
                            platform and, where required by law, we will seek
                            your renewed consent. Continued use of alumni
                            services after changes take effect constitutes
                            acceptance of the modified Terms. We may suspend
                            or terminate your account for violations of these
                            Terms or of the Privacy Policy.
                        </Paragraph>
                    </div>

                    <div>
                        <Title level={5}>
                            <MailOutlined /> 8. Limitation of Liability and
                            Governing Law
                        </Title>
                        <Paragraph>
                            Alumni services are provided on an "as is" basis.
                            Opol Community College makes no warranties,
                            express or implied, regarding the accuracy,
                            reliability, or availability of the services, and
                            shall not be liable for indirect, incidental, or
                            consequential damages arising from your use of
                            the system, except as required by law. These
                            Terms are governed by the laws of the Republic of
                            the Philippines. For questions, concerns, or to
                            exercise your rights under these Terms, please
                            contact the Alumni Office through the Messages
                            page or visit us at ZONE C. Salva St, Opol, 9016
                            Misamis Oriental.
                        </Paragraph>
                    </div>
                </Space>
            </Modal>
        </div>
    );
};

export default AlumniRegistration;