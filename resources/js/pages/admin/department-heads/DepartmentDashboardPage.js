"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Card,
    Row,
    Col,
    Statistic,
    Tag,
    Typography,
    Space,
    Select,
    Table,
    Progress,
    Avatar,
    Button,
    List,
    Input,
    Modal,
} from "antd";
import {
    TeamOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
    RiseOutlined,
    FolderOutlined,
    SearchOutlined,
    PrinterOutlined,
} from "@ant-design/icons";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    BarChart,
    Bar,
    LabelList,
    LineChart,
    Line,
} from "recharts";
import { Layout, AlumniDetails } from "~/components";
import {
    useDepartmentHeadDashboard,
    useDepartmentHeadAlumni,
} from "~/hooks/useDepartmentHeads";
import moment from "moment";
import logo from "~/assets/images/OCC_LOGO.png";
import "./DepartmentDashboard.css";
import secureLocalStorage from "react-secure-storage";

const { Title, Text } = Typography;
const { Option } = Select;

const courseFolders = [
    {
        id: 1,
        code: "BSIT",
        name: "Bachelor of Science in Information Technology",
        color: "#f5222d",
    },
    {
        id: 2,
        code: "BSEd",
        name: "Bachelor in Teacher Education",
        color: "#1890ff",
    },
    {
        id: 3,
        code: "BEED",
        name: "Bachelor of Elementary Education",
        color: "#1890ff",
    },
    {
        id: 4,
        code: "BSBA",
        name: "Bachelor of Science in Business Administration",
        color: "#faad14",
    },
];

const CourseFolderModal = ({ visible, onCancel, course, alumni }) => {
    const [folderSearch, setFolderSearch] = useState("");
    const [folderEmploymentFilter, setFolderEmploymentFilter] = useState("all");
    const [printPreviewVisible, setPrintPreviewVisible] = useState(false);

    // Filter alumni by course_id and search/employment filters
    const filteredCourseAlumni = useMemo(() => {
        let filtered = alumni.filter((a) => a.course_id === course?.id);

        // Apply search filter
        if (folderSearch) {
            const searchLower = folderSearch.toLowerCase();
            filtered = filtered.filter((a) => {
                const firstName = a?.first_name?.toLowerCase() || "";
                const lastName = a?.last_name?.toLowerCase() || "";
                return (
                    firstName.includes(searchLower) ||
                    lastName.includes(searchLower)
                );
            });
        }

        // Apply employment status filter
        if (folderEmploymentFilter !== "all") {
            const statusMap = {
                employed: 1,
                unemployed: 2,
                under_employed: 3,
            };
            filtered = filtered.filter(
                (a) =>
                    a.employment_status_id ===
                    statusMap[folderEmploymentFilter],
            );
        }

        return filtered;
    }, [alumni, course?.id, folderSearch, folderEmploymentFilter]);

    const getEmploymentStatusTag = (statusId) => {
        const config = {
            1: {
                color: "green",
                text: "Employed",
                icon: <CheckCircleOutlined />,
            },
            2: {
                color: "red",
                text: "Unemployed",
                icon: <ClockCircleOutlined />,
            },
            3: {
                color: "orange",
                text: "Under Employed",
                icon: <ExclamationCircleOutlined />,
            },
        };
        const statusConfig = config[statusId] || {
            color: "default",
            text: "Unknown",
        };
        return (
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {statusConfig.text}
            </Tag>
        );
    };

    const handlePrint = () => {
        setPrintPreviewVisible(true);
    };

    const handleActualPrint = () => {
        window.print();
    };

    if (!course) return null;

    return (
        <>
            <Modal
                title={
                    <Space>
                        <FolderOutlined style={{ color: course.color }} />
                        <span>
                            {course.code} - {course.name}
                        </span>
                    </Space>
                }
                open={visible}
                onCancel={onCancel}
                width={1200}
                footer={[
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                    >
                        Print Preview
                    </Button>,
                    <Button key="close" onClick={onCancel}>
                        Close
                    </Button>,
                ]}
            >
                <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="large"
                >
                    {/* Search and Filter Controls */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Input
                                placeholder="Search alumni by name..."
                                prefix={<SearchOutlined />}
                                value={folderSearch}
                                onChange={(e) =>
                                    setFolderSearch(e.target.value)
                                }
                                size="large"
                                allowClear
                            />
                        </Col>
                        <Col span={12}>
                            <Select
                                value={folderEmploymentFilter}
                                onChange={setFolderEmploymentFilter}
                                style={{ width: "100%" }}
                                size="large"
                                placeholder="Employment Status"
                            >
                                <Option value="all">
                                    <Tag color="default">All Employment</Tag>
                                </Option>
                                <Option value="employed">
                                    <Tag color="green">Employed</Tag>
                                </Option>
                                <Option value="unemployed">
                                    <Tag color="red">Unemployed</Tag>
                                </Option>
                                <Option value="under_employed">
                                    <Tag color="orange">Under Employed</Tag>
                                </Option>
                            </Select>
                        </Col>
                    </Row>

                    {/* Statistics */}
                    <Card>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Total Alumni"
                                    value={filteredCourseAlumni.length}
                                    prefix={<TeamOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Employed"
                                    value={
                                        filteredCourseAlumni.filter(
                                            (a) => a.employment_status_id === 1,
                                        ).length
                                    }
                                    valueStyle={{ color: "#52c41a" }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Unemployed"
                                    value={
                                        filteredCourseAlumni.filter(
                                            (a) => a.employment_status_id === 2,
                                        ).length
                                    }
                                    valueStyle={{ color: "#ff4d4f" }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Under Employed"
                                    value={
                                        filteredCourseAlumni.filter(
                                            (a) => a.employment_status_id === 3,
                                        ).length
                                    }
                                    valueStyle={{ color: "#faad14" }}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* Alumni List - Without View button */}
                    <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                        {filteredCourseAlumni.length === 0 ? (
                            <Card>
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "40px 0",
                                    }}
                                >
                                    <Title level={4}>No alumni found</Title>
                                    <Text type="secondary">
                                        No alumni match your search criteria for
                                        this course
                                    </Text>
                                </div>
                            </Card>
                        ) : (
                            <List
                                dataSource={filteredCourseAlumni}
                                renderItem={(alumnus) => (
                                    <List.Item key={alumnus.id}>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    size={50}
                                                    src={
                                                        alumnus.profile_image_url
                                                    }
                                                    icon={<UserOutlined />}
                                                />
                                            }
                                            title={
                                                <Space>
                                                    <span>
                                                        {alumnus.first_name}{" "}
                                                        {alumnus.last_name}
                                                    </span>
                                                </Space>
                                            }
                                            description={
                                                <Space
                                                    direction="vertical"
                                                    size="small"
                                                >
                                                    <Text type="secondary">
                                                        Class of{" "}
                                                        {
                                                            alumnus.graduation_year
                                                        }
                                                    </Text>
                                                    {getEmploymentStatusTag(
                                                        alumnus.employment_status_id,
                                                    )}
                                                    {alumnus.current_company && (
                                                        <Text>
                                                            {alumnus.job_title}{" "}
                                                            at{" "}
                                                            {
                                                                alumnus.current_company
                                                            }
                                                        </Text>
                                                    )}
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </div>
                </Space>
            </Modal>

            {/* Print Preview Modal — forced light theme via wrapClassName */}
            <Modal
                title="Print Preview - A4 Layout"
                open={printPreviewVisible}
                onCancel={() => setPrintPreviewVisible(false)}
                width={900}
                wrapClassName="print-preview-modal"
                className="print-preview-modal"
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => setPrintPreviewVisible(false)}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handleActualPrint}
                    >
                        Print
                    </Button>,
                ]}
            >
                <div
                    id="printable-area"
                    data-print-theme="light"
                    style={{
                        padding: "40px",
                        backgroundColor: "#fff",
                        color: "#0f172a",
                        minHeight: "297mm",
                        width: "210mm",
                        margin: "0 auto",
                    }}
                >
                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: "30px",
                            borderBottom: "2px solid #000",
                            paddingBottom: "20px",
                        }}
                    >
                        <img
                            src={logo || "/placeholder.svg"}
                            alt="OCC Logo"
                            style={{
                                width: "80px",
                                height: "80px",
                                marginBottom: "10px",
                                objectFit: "contain",
                            }}
                        />
                        <Title level={2} style={{ margin: 0 }}>
                            Alumni Directory Report
                        </Title>
                        <Title
                            level={4}
                            style={{ margin: "10px 0", color: course.color }}
                        >
                            {course.code} - {course.name}
                        </Title>
                        <Text type="secondary">
                            Generated on: {moment().format("MMMM DD, YYYY")}
                        </Text>
                    </div>

                    {/* Print Statistics */}
                    <Card style={{ marginBottom: "20px" }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <div style={{ textAlign: "center" }}>
                                    <Title level={3}>
                                        {filteredCourseAlumni.length}
                                    </Title>
                                    <Text>Total Alumni</Text>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ textAlign: "center" }}>
                                    <Title
                                        level={3}
                                        style={{ color: "#52c41a" }}
                                    >
                                        {
                                            filteredCourseAlumni.filter(
                                                (a) =>
                                                    a.employment_status_id ===
                                                    1,
                                            ).length
                                        }
                                    </Title>
                                    <Text>Employed</Text>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ textAlign: "center" }}>
                                    <Title
                                        level={3}
                                        style={{ color: "#ff4d4f" }}
                                    >
                                        {
                                            filteredCourseAlumni.filter(
                                                (a) =>
                                                    a.employment_status_id ===
                                                    2,
                                            ).length
                                        }
                                    </Title>
                                    <Text>Unemployed</Text>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ textAlign: "center" }}>
                                    <Title
                                        level={3}
                                        style={{ color: "#faad14" }}
                                    >
                                        {
                                            filteredCourseAlumni.filter(
                                                (a) =>
                                                    a.employment_status_id ===
                                                    3,
                                            ).length
                                        }
                                    </Title>
                                    <Text>Under Employed</Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Print Table */}
                    <Table
                        dataSource={filteredCourseAlumni}
                        pagination={false}
                        size="small"
                        rowKey="id"
                        columns={[
                            {
                                title: "No.",
                                key: "index",
                                width: 50,
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: "Name",
                                key: "name",
                                render: (alumnus) =>
                                    `${alumnus.first_name} ${alumnus.last_name}`,
                            },
                            {
                                title: "Graduation Year",
                                dataIndex: "graduation_year",
                                key: "graduation_year",
                                width: 120,
                            },
                            {
                                title: "Employment Status",
                                key: "employment",
                                width: 150,
                                render: (alumnus) => {
                                    const statusMap = {
                                        1: "Employed",
                                        2: "Unemployed",
                                        3: "Under Employed",
                                    };
                                    return (
                                        statusMap[
                                            alumnus.employment_status_id
                                        ] || "N/A"
                                    );
                                },
                            },
                            {
                                title: "Company",
                                dataIndex: "current_company",
                                key: "current_company",
                                render: (text) => text || "N/A",
                            },
                            {
                                title: "Position",
                                dataIndex: "job_title",
                                key: "job_title",
                                render: (text) => text || "N/A",
                            },
                        ]}
                    />

                    {/* Print Footer */}
                    <div
                        style={{
                            marginTop: "40px",
                            paddingTop: "20px",
                            borderTop: "1px solid #d9d9d9",
                            textAlign: "center",
                        }}
                    >
                        <Text type="secondary">
                            This is an official document generated from the
                            Alumni Management System
                        </Text>
                    </div>
                </div>
            </Modal>

            <style jsx global>{`
                @media print {
                    /* Hide everything except printable area */
                    body * {
                        visibility: hidden !important;
                    }

                    /* Make printable area and its contents visible */
                    #printable-area,
                    #printable-area * {
                        visibility: visible !important;
                    }

                    /* Position and size the printable area correctly */
                    #printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        padding: 15mm !important;
                        margin: 0 !important;
                        background: #fff !important;
                        box-sizing: border-box !important;
                        z-index: 999999 !important;
                    }

                    /* Hide all modal elements */
                    .ant-modal-mask,
                    .ant-modal-wrap {
                        position: static !important;
                        background: none !important;
                    }

                    .ant-modal,
                    .ant-modal-content {
                        position: static !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: transparent !important;
                    }

                    .ant-modal-header,
                    .ant-modal-footer,
                    .ant-modal-close {
                        display: none !important;
                    }

                    .ant-modal-body {
                        padding: 0 !important;
                    }

                    /* Ensure colors print correctly */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* Print header styling */
                    #printable-area > div:first-child {
                        text-align: center !important;
                        margin-bottom: 20px !important;
                        border-bottom: 2px solid #000 !important;
                        padding-bottom: 15px !important;
                    }

                    #printable-area img {
                        width: 80px !important;
                        height: 80px !important;
                        display: block !important;
                        margin: 0 auto 10px auto !important;
                    }

                    /* Statistics card styling */
                    #printable-area .ant-card {
                        border: 1px solid #d9d9d9 !important;
                        box-shadow: none !important;
                        background: #fff !important;
                        margin-bottom: 15px !important;
                        page-break-inside: avoid !important;
                    }

                    #printable-area .ant-card-body {
                        padding: 16px !important;
                    }

                    /* Row and column layout for statistics */
                    #printable-area .ant-row {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        width: 100% !important;
                    }

                    #printable-area .ant-col {
                        display: block !important;
                        float: left !important;
                    }

                    #printable-area .ant-col-6 {
                        width: 25% !important;
                        flex: 0 0 25% !important;
                        max-width: 25% !important;
                    }

                    /* Typography colors */
                    #printable-area h1,
                    #printable-area h2,
                    #printable-area h3,
                    #printable-area h4,
                    #printable-area .ant-typography {
                        color: #000 !important;
                        margin: 0 !important;
                    }

                    /* Preserve colored statistics text */
                    #printable-area h3[style*="color: rgb(82, 196, 26)"],
                    #printable-area h3[style*="color: #52c41a"] {
                        color: #52c41a !important;
                    }

                    #printable-area h3[style*="color: rgb(245, 34, 45)"],
                    #printable-area h3[style*="color: #f5222d"] {
                        color: #f5222d !important;
                    }

                    #printable-area h3[style*="color: rgb(250, 173, 20)"],
                    #printable-area h3[style*="color: #faad14"] {
                        color: #faad14 !important;
                    }

                    /* Table styling */
                    #printable-area table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                    }

                    #printable-area .ant-table {
                        font-size: 10px !important;
                    }

                    #printable-area .ant-table-container {
                        border: 1px solid #d9d9d9 !important;
                    }

                    #printable-area .ant-table-thead > tr > th {
                        background: #fafafa !important;
                        border-bottom: 1px solid #d9d9d9 !important;
                        padding: 8px 6px !important;
                        font-weight: 600 !important;
                        font-size: 10px !important;
                        color: #000 !important;
                    }

                    #printable-area .ant-table-tbody > tr > td {
                        border-bottom: 1px solid #d9d9d9 !important;
                        padding: 6px !important;
                        font-size: 9px !important;
                        color: #000 !important;
                        background: #fff !important;
                    }

                    #printable-area .ant-table-tbody > tr {
                        page-break-inside: avoid !important;
                    }

                    /* Tags styling */
                    #printable-area .ant-tag {
                        font-size: 8px !important;
                        padding: 0 4px !important;
                        line-height: 16px !important;
                        border: 1px solid !important;
                    }

                    /* Page setup */
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }

                    html,
                    body {
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }
                }
            `}</style>
        </>
    );
};

const DepartmentDashboardPage = () => {
    const [year, setSelectedYear] = useState("all");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    const [courseFolderVisible, setCourseFolderVisible] = useState(false);
    // Removed selectedCourse state, use course from dashboardData instead

    const [employmentTrend, setEmploymentTrend] = useState([]);
    const [industryDistribution, setIndustryDistribution] = useState([]);
    const [salaryProgression, setSalaryProgression] = useState([]);
    const [topEmployers, setTopEmployers] = useState([]);

    const {
        data: dashboardData,
        isLoading,
        refetch,
    } = useDepartmentHeadDashboard(year);
    const { data: alumniList = [] } = useDepartmentHeadAlumni();

    const alumni = dashboardData?.alumni || [];
    const course = dashboardData?.course;

    const departmentCourseFolder = course
        ? {
              id: course.id,
              code: course.course_code,
              name: course.course_name,
              color:
                  course.id === 1
                      ? "#f5222d"
                      : course.id === 2
                        ? "#1890ff"
                        : course.id === 3
                          ? "#1890ff"
                          : course.id === 4
                            ? "#faad14"
                            : "#667eea",
          }
        : null;

    useEffect(() => {
        const intervalId = setInterval(() => {
            refetch();
        }, 30000);
        return () => clearInterval(intervalId);
    }, [refetch]);

    useEffect(() => {
        if (!Array.isArray(alumni) || alumni.length === 0) {
            setEmploymentTrend([]);
            setIndustryDistribution([]);
            setSalaryProgression([]);
            setTopEmployers([]);
            return;
        }

        try {
            // Process Employment Trend by graduation year
            const trendData = {};
            const industryData = {};
            const employerData = {};
            const salaryByExperience = {};

            alumni.forEach((alum) => {
                const gradYear = alum.graduation_year;
                const statusId = alum.employment_status_id;
                const industry = alum.industry;
                const employer = alum.current_company;
                const yearsExperience = alum.years_experience;
                const salary = alum.salary_range;

                // Process trend data by graduation year
                if (gradYear) {
                    if (!trendData[gradYear]) {
                        trendData[gradYear] = {
                            employed: 0,
                            unemployed: 0,
                            underEmployed: 0,
                            total: 0,
                        };
                    }
                    trendData[gradYear].total++;
                    if (statusId === 1) trendData[gradYear].employed++;
                    else if (statusId === 2) trendData[gradYear].unemployed++;
                    else if (statusId === 3)
                        trendData[gradYear].underEmployed++;
                }

                // Process industry distribution
                if (industry) {
                    industryData[industry] = (industryData[industry] || 0) + 1;
                }

                // Process employer data
                if (employer) {
                    employerData[employer] = (employerData[employer] || 0) + 1;
                }

                // Process salary progression by experience
                if (yearsExperience && salary) {
                    const expKey = Math.floor(yearsExperience);
                    const salaryMatch = salary.match(/\d+/g);
                    if (salaryMatch && salaryMatch.length > 0) {
                        const avgSalary =
                            salaryMatch.reduce(
                                (sum, num) => sum + Number.parseInt(num),
                                0,
                            ) / salaryMatch.length;
                        const roundedSalary = Math.round(avgSalary);

                        if (!salaryByExperience[expKey]) {
                            salaryByExperience[expKey] = { total: 0, count: 0 };
                        }
                        salaryByExperience[expKey].total += roundedSalary;
                        salaryByExperience[expKey].count++;
                    }
                }
            });

            // Format employment trend
            const trendFormatted = Object.entries(trendData)
                .sort(([a], [b]) => a - b)
                .slice(-6) // Last 6 years
                .map(([year, data]) => ({
                    year: year,
                    employed:
                        data.total > 0
                            ? Math.round((data.employed / data.total) * 100)
                            : 0,
                    unemployed:
                        data.total > 0
                            ? Math.round((data.unemployed / data.total) * 100)
                            : 0,
                    underEmployed:
                        data.total > 0
                            ? Math.round(
                                  (data.underEmployed / data.total) * 100,
                              )
                            : 0,
                }));

            // Format industry distribution
            const industryColors = [
                "#1890ff",
                "#52c41a",
                "#faad14",
                "#722ed1",
                "#fa541c",
                "#13c2c2",
            ];
            const totalAlumni = alumni.length;
            const industryFormatted = Object.entries(industryData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([name, value], index) => ({
                    name,
                    value: Math.round((value / totalAlumni) * 100),
                    color: industryColors[index] || "#666666",
                }));

            // Format salary progression
            const salaryFormatted = Object.entries(salaryByExperience)
                .sort(([a], [b]) => a - b)
                .map(([years, data]) => ({
                    year: `${years} Year${years > 1 ? "s" : ""}`,
                    salary:
                        data.count > 0
                            ? Math.round(data.total / data.count)
                            : 0,
                    alumniCount: data.count,
                }));

            // Format top employers
            const topEmployersFormatted = Object.entries(employerData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([name, hires]) => ({
                    name,
                    hires,
                    trend: "up",
                }));

            setEmploymentTrend(trendFormatted);
            setIndustryDistribution(industryFormatted);
            setSalaryProgression(salaryFormatted);
            setTopEmployers(topEmployersFormatted);
        } catch (err) {
            console.error("Error processing alumni data:", err);
        }
    }, [alumni]);

    const stats = {
        total: alumni.length,
        employed: alumni.filter((a) => a.employment_status_id === 1).length,
        unemployed: alumni.filter((a) => a.employment_status_id === 2).length,
        underEmployed: alumni.filter((a) => a.employment_status_id === 3)
            .length,
    };

    const employmentRate =
        stats.total > 0 ? Math.round((stats.employed / stats.total) * 100) : 0;

    const pieData = [
        { name: "Employed", value: stats.employed, color: "#52c41a" },
        { name: "Unemployed", value: stats.unemployed, color: "#ff4d4f" },
        {
            name: "Under Employed",
            value: stats.underEmployed,
            color: "#faad14",
        },
    ].filter((item) => item.value > 0);

    const graduationYears = [
        ...new Set(alumniList.map((a) => a.graduation_year)),
    ].sort((a, b) => b - a);

    // Calculate average salary
    const averageSalary = (() => {
        let totalSalary = 0;
        let salaryCount = 0;
        alumni.forEach((alum) => {
            if (alum.salary_range) {
                const salaryMatch = alum.salary_range.match(/\d+/g);
                if (salaryMatch && salaryMatch.length > 0) {
                    const avgSalary =
                        salaryMatch.reduce(
                            (sum, num) => sum + Number.parseInt(num),
                            0,
                        ) / salaryMatch.length;
                    totalSalary += avgSalary;
                    salaryCount++;
                }
            }
        });
        return salaryCount > 0 ? Math.round(totalSalary / salaryCount) : 0;
    })();

    const handleView = (values) => {
        const previewData = {
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

    const handleOpenCourseFolder = () => {
        if (departmentCourseFolder) {
            setCourseFolderVisible(true);
        }
    };

    const getEmploymentStatusTag = (statusId) => {
        const config = {
            1: {
                color: "green",
                text: "Employed",
                icon: <CheckCircleOutlined />,
            },
            2: {
                color: "red",
                text: "Unemployed",
                icon: <ClockCircleOutlined />,
            },
            3: {
                color: "orange",
                text: "Under Employed",
                icon: <ExclamationCircleOutlined />,
            },
        };
        const statusConfig = config[statusId] || {
            color: "default",
            text: "Unknown",
        };
        return (
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {statusConfig.text}
            </Tag>
        );
    };

    const EmploymentTrendChart = () => (
        <Card className="dashboard-card">
            <Title level={4}>Employment Trend (Last 6 Years)</Title>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={employmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip
                        formatter={(value) => [`${value}%`, "Percentage"]}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="employed"
                        stackId="1"
                        stroke="#52c41a"
                        fill="#52c41a"
                        fillOpacity={0.6}
                        name="Employed"
                    />
                    <Area
                        type="monotone"
                        dataKey="underEmployed"
                        stackId="1"
                        stroke="#faad14"
                        fill="#faad14"
                        fillOpacity={0.6}
                        name="Under Employed"
                    />
                    <Area
                        type="monotone"
                        dataKey="unemployed"
                        stackId="1"
                        stroke="#ff4d4f"
                        fill="#ff4d4f"
                        fillOpacity={0.6}
                        name="Unemployed"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );

    const IndustryDistributionChart = () => (
        <Card className="dashboard-card">
            <Title level={4}>Industry Distribution</Title>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={industryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis />
                    <RechartsTooltip
                        formatter={(value) => [`${value}%`, "Percentage"]}
                    />
                    <Bar dataKey="value" name="Percentage">
                        {industryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                            dataKey="value"
                            position="top"
                            formatter={(value) => `${value}%`}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );

    const SalaryProgressionChart = () => (
        <Card className="dashboard-card">
            <Title level={4}>Average Salary Progression</Title>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salaryProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip
                        formatter={(value, name, props) => {
                            const { payload } = props;
                            const count = payload?.alumniCount || 1;
                            return [
                                `₱${value?.toLocaleString() || 0}${count > 1 ? ` (${count} Alumni)` : ""}`,
                                "Salary",
                            ];
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="salary"
                        stroke="#1890ff"
                        strokeWidth={3}
                        dot={{ fill: "#1890ff" }}
                        name="Salary"
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );

    const TopEmployersList = () => (
        <Card title="Top Employers" className="dashboard-card">
            {topEmployers.length > 0 ? (
                <List
                    dataSource={topEmployers}
                    renderItem={(item, index) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        style={{
                                            backgroundColor: [
                                                "#1890ff",
                                                "#52c41a",
                                                "#faad14",
                                                "#722ed1",
                                                "#fa541c",
                                                "#13c2c2",
                                            ][index % 6],
                                        }}
                                    >
                                        {item.name.charAt(0)}
                                    </Avatar>
                                }
                                title={item.name}
                                description={`${item.hires} alumni`}
                            />
                            <div>
                                <Tag color="green">
                                    <RiseOutlined /> Active
                                </Tag>
                            </div>
                        </List.Item>
                    )}
                />
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#999",
                    }}
                >
                    No employer data available
                </div>
            )}
        </Card>
    );

    const columns = [
        {
            title: "Name",
            key: "name",
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.profile_image_url}
                        icon={<UserOutlined />}
                    />
                    <Text strong>
                        {record.first_name} {record.last_name}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Graduation Year",
            dataIndex: "graduation_year",
            key: "graduation_year",
            sorter: (a, b) => a.graduation_year - b.graduation_year,
        },
        {
            title: "Employment Status",
            key: "employment_status",
            render: (_, record) =>
                getEmploymentStatusTag(record.employment_status_id),
            filters: [
                { text: "Employed", value: 1 },
                { text: "Unemployed", value: 2 },
                { text: "Under Employed", value: 3 },
            ],
            onFilter: (value, record) => record.employment_status_id === value,
        },
        {
            title: "Company",
            dataIndex: "current_company",
            key: "current_company",
            render: (text) => text || "N/A",
        },
        {
            title: "Position",
            dataIndex: "job_title",
            key: "job_title",
            render: (text) => text || "N/A",
        },
    ];

    if (isLoading) {
        return (
            <Layout>
                <div style={{ padding: "24px" }}>
                    <Card>
                        <div style={{ textAlign: "center", padding: "50px" }}>
                            <Progress type="circle" percent={30} />
                            <Title level={3} style={{ marginTop: 20 }}>
                                Loading Dashboard Data...
                            </Title>
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
           {/* Header — matches AlumniQuestionsPage hero */}
<div style={{ padding: "24px" }} className="department-dashboard">
    <Card
        className="dashboard-header-card"
        bordered={false}
        style={{ marginBottom: "24px" }}
    >
        <div className="dh-hero__bg" aria-hidden="true">
            <span className="dh-orb dh-orb-1" />
            <span className="dh-orb dh-orb-2" />
            <span className="dh-orb dh-orb-3" />
            <div className="dh-grid-overlay" />
        </div>

        <Row
            justify="space-between"
            align="middle"
            gutter={[16, 16]}
            className="dh-header-row"
        >
            <Col xs={24} md={16}>
                <span className="dh-header-chip">
                    <CheckCircleOutlined /> Department Overview
                </span>
                <Title level={2} className="dh-header-title">
                    Department{" "}
                    <span className="dh-grad">Dashboard</span>
                </Title>
                <Text className="dh-header-sub">
                    {course?.course_code
                        ? `${course.course_code} — ${course.course_name}`
                        : "Real-time alumni insights for your assigned department"}
                </Text>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "right" }}>
                <Select
                    className="dh-header-select"
                    value={year}
                    onChange={setSelectedYear}
                    style={{ width: 200 }}
                    placeholder="Filter by Year"
                >
                    <Option value="all">All Years </Option>
                    {graduationYears.map((y) => (
                        <Option key={y} value={y}>
                            {y}
                        </Option>
                    ))}
                </Select>
            </Col>
        </Row>
    </Card>


                <Card
                    title="My Course Folder"
                    style={{ marginBottom: "24px" }}
                    className="dashboard-card"
                >
                    <Row gutter={[16, 16]}>
                        {departmentCourseFolder ? (
                            <Col xs={24} sm={12} md={6}>
                                <Card
                                    hoverable
                                    style={{
                                        textAlign: "center",
                                        borderTop: `3px solid ${departmentCourseFolder.color}`,
                                        cursor: "pointer",
                                    }}
                                    onClick={handleOpenCourseFolder}
                                >
                                    <FolderOutlined
                                        style={{
                                            fontSize: 48,
                                            color: departmentCourseFolder.color,
                                            marginBottom: 16,
                                        }}
                                    />
                                    <Title level={4} style={{ margin: 0 }}>
                                        {departmentCourseFolder.code}
                                    </Title>
                                    <Text type="secondary">
                                        {alumni.length} Alumni
                                    </Text>
                                </Card>
                            </Col>
                        ) : (
                            <Col span={24}>
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "40px",
                                        color: "#999",
                                    }}
                                >
                                    No course assigned to your account
                                </div>
                            </Col>
                        )}
                    </Row>
                </Card>

                <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="metric-card">
                            <Statistic
                                title="Total Alumni"
                                value={stats.total}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="metric-card">
                            <Statistic
                                title="Employed"
                                value={stats.employed}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                                suffix={
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: "14px" }}
                                    >
                                        ({employmentRate}%)
                                    </Text>
                                }
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="metric-card">
                            <Statistic
                                title="Unemployed"
                                value={stats.unemployed}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: "#ff4d4f" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="metric-card">
                            <Statistic
                                title="Avg. Salary"
                                value={averageSalary}
                                valueStyle={{ color: "#722ed1" }}
                                formatter={(value) =>
                                    `₱${value.toLocaleString()}`
                                }
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                    <Col xs={24} md={12}>
                        <Card
                            title="Overall Employment Status"
                            className="dashboard-card"
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) =>
                                            `${name} ${(percent * 100).toFixed(0)}%`
                                        }
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <EmploymentTrendChart />
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                    <Col xs={24} md={12}>
                        <IndustryDistributionChart />
                    </Col>
                    <Col xs={24} md={12}>
                        <SalaryProgressionChart />
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                    <Col xs={24} md={12}>
                        <Card
                            title="Employment Rate"
                            className="dashboard-card"
                        >
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px 0",
                                }}
                            >
                                <Progress
                                    type="dashboard"
                                    percent={employmentRate}
                                    strokeColor={{
                                        "0%": "#108ee9",
                                        "100%": "#87d068",
                                    }}
                                    size={180}
                                />
                                <div style={{ marginTop: "16px" }}>
                                    <Title level={4}>
                                        {employmentRate}% Employment Rate
                                    </Title>
                                    <Text type="secondary">
                                        {stats.employed} out of {stats.total}{" "}
                                        alumni are employed
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <TopEmployersList />
                    </Col>
                </Row>

                {/* Alumni Table */}
                <Card
                    title={`${course?.course_code || "Department"} Alumni List`}
                    className="dashboard-card"
                >
                    <Table
                        columns={columns}
                        dataSource={alumni}
                        loading={isLoading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} alumni`,
                        }}
                    />
                </Card>

                <AlumniDetails
                    visible={isModalVisible}
                    onCancel={() => {
                        setIsModalVisible(false);
                        setPreviewData(null);
                    }}
                    onSubmit={() => {}}
                    previewData={previewData}
                    viewOnly={true}
                />

                <CourseFolderModal
                    visible={courseFolderVisible}
                    onCancel={() => {
                        setCourseFolderVisible(false);
                    }}
                    course={departmentCourseFolder}
                    alumni={alumni}
                />
            </div>
        </Layout>
    );
};

export default DepartmentDashboardPage;
