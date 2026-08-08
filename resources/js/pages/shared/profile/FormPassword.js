import { Button, Form, Input, Drawer, Space } from "antd";
import React, { useEffect } from "react";
import { useProfileStore } from "~/states/profileState";
import { useProfile } from "~/hooks";
import shallow from "zustand/shallow";

const FormPassword = React.memo(({ submitForm }) => {
    const [form] = Form.useForm();
    const [
        visiblePassword,
        setVisiblePassword,
        editData,
        setEdit,
        isClear2,
        setClear2,
        isSubmit2,
        setSubmit2
    ] = useProfileStore(
        (state) => [
            state.editData,
            state.setEdit,
            state.isClear,
            state.setClear,
            state.visiblePassword,
            state.setVisiblePassword,
            state.isSubmit2,
            state.setSubmit2
        ],
        shallow
    );

    useEffect(() => {
        
    }, [editData]);

    useEffect(() => {
        if (isClear2) form.resetFields();
    }, [isClear2])

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
    // console.log('isSubmit',isSubmit)
    return (
        <Drawer
            title="Update Password"
            width={500}
            open={visiblePassword}
            bodyStyle={{ paddingBottom: 80 }}
            onClose={() => {
                setVisiblePassword(false);
                setEdit(null);
            }}
            extra={
                <Space>
                    <Button onClick={() => {
                        setVisiblePassword(false);
                        setEdit(null);
                    }}>Cancel</Button>
                    <Button
                        key="submit"
                        type="primary"
                        loading={isSubmit2}
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
                onFinish={(params) => {setSubmit2(true);submitForm(params)}}
                layout="vertical"
            >
                <Form.Item
                    label="Current Password"
                    name="user_curr_pass"
                    rules={[
                        {
                            required: true,
                            message: "Please input your current password!",
                        },
                    ]}
                >
                    <Input placeholder="current password" type="password" />
                </Form.Item>
                <Form.Item
                    label="New Password"
                    name="new_pass"
                    rules={[
                        {
                            required: true,
                            message: "Please input your new password!",
                        },
                    ]}
                >
                    <Input placeholder="new password" type="password" />
                </Form.Item>
            </Form>
        </Drawer>
    );
});

export default React.memo(FormPassword);
