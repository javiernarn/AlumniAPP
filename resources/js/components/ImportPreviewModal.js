import React, { useState, useEffect } from "react";
import {
    Modal,
    Table,
    Tag,
    Space,
    Statistic,
    Row,
    Col,
    Progress,
    Button,
    Alert,
    Card,
    Divider,
} from "antd";
import {
    DeleteOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    FileExcelOutlined,
} from "@ant-design/icons";

const ImportPreviewModal = ({
    previewData,
    previewVisible,
    onCancel,
    onConfirm,
}) => {
    const [rows, setRows] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    useEffect(() => {
        if (previewData?.data?.rows) {
            const rowsWithKeys = previewData.data.rows.map((row) => ({
                ...row,
                key: row.row_number,
            }));
            setRows(rowsWithKeys);
        }
    }, [previewData]);

    const handleRemove = (key) => {
        const newRows = rows.filter(row => row.key !== key);
        setRows(newRows);
   
    };

    const handleRemoveSelected = () => {
        const newRows = rows.filter(row => !selectedRowKeys.includes(row.key));
        setRows(newRows);
        setSelectedRowKeys([]);
    };

    const columns = [
        {
            title: "Row",
            dataIndex: "row_number",
            key: "row_number",
            width: 70,
            fixed: "left",
        },
        {
            title: "Student ID",
            dataIndex: "student_id",
            key: "student_id",
            width: 120,
        },
        {
            title: "Name",
            key: "name",
            render: (_, record) => (
                <span>
                    {record.fname} {record.lname}
                    {record.mname && ` ${record.mname}`}
                </span>
            ),
            width: 180,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 200,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => {
                const statusConfig = {
                    would_create: {
                        icon: <CheckCircleOutlined />,
                        color: "green",
                        text: "New",
                    },
                    would_update: {
                        icon: <SyncOutlined spin />,
                        color: "blue",
                        text: "Update",
                    },
                    error: {
                        icon: <CloseCircleOutlined />,
                        color: "red",
                        text: "Error",
                    },
                };
                return (
                    <Tag
                        icon={statusConfig[status].icon}
                        color={statusConfig[status].color}
                    >
                        {statusConfig[status].text}
                    </Tag>
                );
            },
        },
        {
            title: "Message",
            dataIndex: "message",
            key: "message",
            render: (text) => (
                <span
                    style={{
                        color: text?.includes("Valid") ? "#52c41a" : "#f5222d",
                        fontStyle: text?.includes("Valid")
                            ? "normal"
                            : "italic",
                    }}
                >
                    {text || "N/A"}
                </span>
            ),
        },
        {
            title: "Action",
            key: "action",
            width: 80,
            fixed: "right",
            render: (_, record) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(record.key)}
                />
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
        getCheckboxProps: (record) => ({
            disabled: record.status === "error",
        }),
    };

    // Calculate statistics based on current rows
    const summaryStats = {
        total: rows.length,
        valid: rows.filter(row => row.status !== "error").length,
        errors: rows.filter(row => row.status === "error").length,
        would_create: rows.filter(row => row.status === "would_create").length,
        would_update: rows.filter(row => row.status === "would_update").length,
    };

    const successPercent = summaryStats.total > 0
        ? Math.round((summaryStats.valid / summaryStats.total) * 100)
        : 0;

    return (
        <Modal
            title={
                <Space>
                    <FileExcelOutlined />
                    <span>Import Preview</span>
                    <Tag color={summaryStats.errors > 0 ? "orange" : "green"}>
                        {summaryStats.total} records
                    </Tag>
                </Space>
            }
            visible={previewVisible}
            width="90%"
            style={{ top: 20 }}
            onCancel={onCancel}
            footer={[
                <Button
                    key="remove"
                    danger
                    onClick={handleRemoveSelected}
                    disabled={selectedRowKeys.length === 0}
                    icon={<DeleteOutlined />}
                >
                    Remove Selected ({selectedRowKeys.length})
                </Button>,
                <Button key="back" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={() => onConfirm(rows)}
                    disabled={summaryStats.valid === 0}
                >
                    Confirm Import ({summaryStats.valid} records)
                </Button>,
            ]}
        >
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                    <Card size="small">
                        <Row gutter={[16, 16]} align="middle">
                            <Col span={24}>
                                <Progress
                                    percent={successPercent}
                                    status={
                                        summaryStats.errors > 0
                                            ? "exception"
                                            : "success"
                                    }
                                    strokeColor={{
                                        "0%": "#108ee9",
                                        "100%": "#87d068",
                                    }}
                                />
                            </Col>

                            {/** Responsive statistics layout */}
                            {[
                                {
                                    title: "Total",
                                    value: summaryStats.total,
                                    icon: <FileExcelOutlined />,
                                },
                                {
                                    title: "Valid",
                                    value: summaryStats.valid,
                                    color: "#52c41a",
                                    icon: <CheckCircleOutlined />,
                                },
                                {
                                    title: "Errors",
                                    value: summaryStats.errors,
                                    color: "#f5222d",
                                    icon: <CloseCircleOutlined />,
                                },
                                {
                                    title: "New",
                                    value: summaryStats.would_create,
                                    color: "#1890ff",
                                },
                                {
                                    title: "Updates",
                                    value: summaryStats.would_update,
                                    color: "#722ed1",
                                },
                            ].map((stat, index) => (
                                <Col
                                    key={index}
                                    xs={24}
                                    sm={12}
                                    md={8}
                                    lg={4}
                                    xl={4}
                                    style={{ textAlign: "center" }}
                                >
                                    <Statistic
                                        title={stat.title}
                                        value={stat.value}
                                        prefix={stat.icon}
                                        valueStyle={{
                                            color: stat.color || "inherit",
                                        }}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>
            </Row>

            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={rows}
                pagination={false}
                scroll={{ x: 1200, y: 500 }}
                rowClassName={(record) =>
                    record.status === "error" ? "error-row" : ""
                }
                bordered
                size="small"
            />

            {summaryStats.errors > 0 && (
                <Alert
                    message={`${summaryStats.errors} records contain errors and will be skipped`}
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            )}
        </Modal>
    );
};

export default ImportPreviewModal;