import { Button, Form, Input, Drawer, Space } from "antd";
import React, { useEffect } from "react";
import { useProfileStore } from "~/states/profileState";
import { useProfile } from "~/hooks";
import shallow from "zustand/shallow";

const FormPersonalDetail = React.memo(({ submitForm }) => {
    const [form] = Form.useForm();
    const [
        visiblePersonalDetails,
        setVisiblePersonalDetails,
        editData,
        setEdit,
        isClear,
        setClear,
        isSubmit
    ] = useProfileStore(
        (state) => [
            state.visiblePersonalDetails,
            state.setVisiblePersonalDetails,
            state.editData,
            state.setEdit,
            state.isClear,
            state.setClear,
            state.isSubmit
        ],
        shallow
    );

    useEffect(() => {
        form.setFieldsValue({
            fname: editData?.fname,
            mname: editData?.mname,
            lname: editData?.lname,
            dob: editData?.dob,
            email: editData?.email,
            phone: editData?.phone,
            address: editData?.address,
        });
    }, [editData]);

    useEffect(() => {
        if (isClear) form.resetFields();
    }, [isClear])

    // onChangeNumber = (e) => {
    //     const { value } = e.target;
    //     const reg = /^-?(0|[1-9][0-9]*)(\.[0-9]*)?$/;
    //     if ((!Number.isNaN(value) && reg.test(value)) || value === '' || value === '-') {
    //      this.props.onChange(value);
    //     }
    //    }
    // const onChangeNumber = e => {
    //     alert(e.target)
    //     const { value } = e.target;
    //     const reg = /^-?(0|[1-9][0-9]*)(\.[0-9]*)?$/;
    //     if ((!Number.isNaN(value) && reg.test(value)) || value === '' || value === '-') {
    //      this.props.onChangeNumber(value);
    //     }
    // }
    return (
        <Drawer
            title={`${editData ? "Edit Personal Details" : "Edit Personal Details"}`}
            width={500}
            open={visiblePersonalDetails}
            bodyStyle={{ paddingBottom: 80 }}
            onClose={() => {
                setVisiblePersonalDetails(false);
                setEdit(null);
            }}
            extra={
                <Space>
                    <Button onClick={() => {
                        setVisiblePersonalDetails(false);
                        setEdit(null);
                    }}>Cancel</Button>
                    <Button
                        key="submit"
                        type="primary"
                        loading={isSubmit}
                        onClick={form.submit}
                    >
                        Save
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                name="form-student"
                onFinish={(params) => submitForm(params)}
                layout="vertical"
            >
                <Form.Item
                    label="First Name"
                    name="fname"
                    rules={[
                        {
                            required: true,
                            message: "Please input your First Name!",
                        },
                    ]}
                >
                    <Input placeholder="First Name" />
                </Form.Item>
                <Form.Item
                    label="Middle Name"
                    name="mname"
                    rules={[
                        {
                            required: true,
                            message: "Please input your Middle Name!",
                        },
                    ]}
                >
                    <Input placeholder="Middle Name" />
                </Form.Item>
                <Form.Item
                    label="Last Name"
                    name="lname"
                    rules={[
                        {
                            required: true,
                            message: "Please input your Last Name!",
                        },
                    ]}
                >
                    <Input placeholder="Last Name" />
                </Form.Item>
                <Form.Item
                    label="Date of Birth"
                    name="dob"
                    rules={[
                        {
                            required: true,
                            message: "Please input your Date of Birth!",
                        },
                    ]}
                >
                    <Input placeholder="date of Birth" type="date" />
                </Form.Item>
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        {
                            required: true,
                            message: "Please input your email!",
                        },
                    ]}
                >
                    <Input placeholder="Email" type="email" />
                </Form.Item>
                <Form.Item
                    label="Mobile Number"
                    name="phone"
                    rules={[
                        {
                            required: true,
                            message: "Please input your mobile number!",
                        },
                    ]}
                >
                    <Input  placeholder="Mobile Number" 
                        onKeyPress={(event) => {
                            if (!/[0-9]/.test(event.key)) {
                                event.preventDefault();
                                }
                        }}
                    />
                </Form.Item>
                <Form.Item
                    label="Address"
                    name="address"
                    rules={[
                        {
                            required: true,
                            message: "Please input your address!",
                        },
                    ]}
                >
                    <Input placeholder="address" type="text" />
                </Form.Item>
            </Form>
        </Drawer>
    );
});

export default React.memo(FormPersonalDetail);
