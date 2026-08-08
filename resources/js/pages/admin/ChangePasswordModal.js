import React, { useState } from "react";
import {
    Drawer,
    Form,
    Input,
    Button,
    Typography,
    Card,
    Space,
    Progress,
    message,
    Row,
    Col,
} from "antd";
import {
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    KeyOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import axiosConfig from "~/utils/axiosConfig";
import "./ChangePasswordModal.css";

const { Title, Text } = Typography;

const ChangePasswordModal = ({ visible, onCancel, userEmail }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");

    const checks = {
        length: newPassword.length >= 8,
        upper: /[A-Z]/.test(newPassword),
        lower: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
    };

    const passedCount = Object.values(checks).filter(Boolean).length;
    const strengthPct = (passedCount / 4) * 100;
    const strengthColor =
        passedCount <= 2 ? "var(--danger, #ef4444)" : passedCount <= 3 ? "var(--warning, #f59e0b)" : "var(--success, #22c55e)";
    const strengthLabel =
        passedCount <= 2 ? "Weak" : passedCount <= 3 ? "Medium" : "Strong";

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const res = await axiosConfig.post("/profile/change-password", {
                current_password: values.current_password,
                new_password: values.new_password,
                new_password_confirmation: values.new_password_confirmation,
            });

            if (res.data?.success) {
                message.success(res.data.message || "Password changed successfully!");
                form.resetFields();
                setNewPassword("");
                onCancel();
            } else {
                message.error(res.data?.message || "Failed to change password.");
            }
        } catch (err) {
            const errMsg =
                err?.response?.data?.message ||
                "Failed to change password. Please try again.";
            const fieldErrors = err?.response?.data?.errors;

            if (fieldErrors) {
                const formErrors = Object.entries(fieldErrors).map(([name, msgs]) => ({
                    name,
                    errors: Array.isArray(msgs) ? msgs : [msgs],
                }));
                form.setFields(formErrors);
            }
            message.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setNewPassword("");
        onCancel();
    };

    const RequirementItem = ({ ok, text }) => (
        <div className="cp-requirement">
            {ok ? (
                <CheckCircleOutlined
                    key="ok"
                    style={{ color: "var(--success, #22c55e)", fontSize: 15 }}
                />
            ) : (
                <CloseCircleOutlined
                    key="no"
                    style={{ color: "#bfbfbf", fontSize: 15 }}
                />
            )}
            <Text style={{ color: ok ? "var(--success, #22c55e)" : "#8c8c8c", fontSize: 13 }}>
                {text}
            </Text>
        </div>
    );

    return (
        <Drawer
            open={visible}
            onClose={handleCancel}
            placement="right"
            width={520}
            className="change-password-modal change-password-drawer"
            destroyOnClose
            afterOpenChange={(open) => {
                if (!open) setNewPassword("");
            }}
            maskClosable={!loading}
            closable={false}
            title={
                <Space>
                    <KeyOutlined />
                    Change Password
                </Space>
            }
            extra={
                <Button
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                    disabled={loading}
                >
                    Close
                </Button>
            }
            bodyStyle={{ padding: 0 }}
        >
            {/* Gradient header */}
            <div className="cp-header">
                <div className="cp-header-icon">
                    <KeyOutlined />
                </div>
                <div className="cp-header-text">
                    <Title level={4} style={{ color: "#fff", margin: 0 }}>
                        Change Password
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                        Update your account password securely
                    </Text>
                </div>
            </div>

            <div className="cp-body">
                {userEmail && (
                    <Card size="small" className="cp-account-card">
                        <Space>
                            <SafetyCertificateOutlined style={{ color: "var(--accent, #4f46e5)", fontSize: 18 }} />
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Account</Text>
                                <div style={{ fontWeight: 600 }}>{userEmail}</div>
                            </div>
                        </Space>
                    </Card>
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        label="Current Password"
                        name="current_password"
                        rules={[{ required: true, message: "Please enter your current password" }]}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Enter current password"
                            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="New Password"
                        name="new_password"
                        rules={[
                            { required: true, message: "Please enter a new password" },
                            { min: 8, message: "Minimum 8 characters" },
                            {
                                pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/,
                                message: "Must include uppercase, lowercase, and number",
                            },
                        ]}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Enter new password"
                            onChange={(e) => setNewPassword(e.target.value)}
                            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>

                    {newPassword && (
                        <div className="cp-strength">
                            <div className="cp-strength-row">
                                <Text style={{ fontSize: 12 }}>Password strength</Text>
                                <Text strong style={{ color: strengthColor, fontSize: 12 }}>
                                    {strengthLabel}
                                </Text>
                            </div>
                            <Progress
                                percent={strengthPct}
                                showInfo={false}
                                strokeColor={strengthColor}
                                size="small"
                            />
                        </div>
                    )}

                    <Form.Item
                        label="Confirm New Password"
                        name="new_password_confirmation"
                        dependencies={["new_password"]}
                        rules={[
                            { required: true, message: "Please confirm your new password" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("new_password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Passwords do not match"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Re-enter new password"
                            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>

                    <Card size="small" className="cp-requirements-card" title="Password Requirements">
                        <Row gutter={[8, 8]}>
                            <Col xs={24} sm={12}><RequirementItem ok={checks.length} text="8+ characters" /></Col>
                            <Col xs={24} sm={12}><RequirementItem ok={checks.upper} text="Uppercase (A-Z)" /></Col>
                            <Col xs={24} sm={12}><RequirementItem ok={checks.lower} text="Lowercase (a-z)" /></Col>
                            <Col xs={24} sm={12}><RequirementItem ok={checks.number} text="Number (0-9)" /></Col>
                        </Row>
                    </Card>

                    <div className="cp-actions">
                        <Button size="large" onClick={handleCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            htmlType="submit"
                            loading={loading}
                            icon={<SafetyCertificateOutlined />}
                        >
                            Update Password
                        </Button>
                    </div>
                </Form>
            </div>
        </Drawer>
    );
};

export default ChangePasswordModal;
