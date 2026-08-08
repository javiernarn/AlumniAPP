import { Button, Form, Input, Drawer, Space, Select } from "antd";
import React, { useEffect ,useState} from "react";
import { useProfileStore } from "~/states/profileState";
import shallow from "zustand/shallow";
const { TextArea } = Input;
const FormAbout = React.memo(({ submitForm }) => {
    const [form] = Form.useForm();
    const [value, setValue] = useState([]);
    const [
        visibleAbout,
        setVisibleAbout,
        editData,
        setEdit,
        isClear,
        setClear,
        isSubmit,
        setSubmit
    ] = useProfileStore(
        (state) => [
            state.visibleAbout,
            state.setVisibleAbout,
            state.editData,
            state.setEdit,
            state.isClear,
            state.setClear,
            state.isSubmit,
            state.setSubmit
        ],
        shallow
    );

    useEffect(() => {
        form.setFieldsValue({
            about: editData?.about,
        });
    }, [editData]);

    useEffect(() => {
        if (isClear) form.resetFields();
    }, [isClear])
   
    return (
        <Drawer
            title='About'
            width={500}
            open={visibleAbout}
            bodyStyle={{ paddingBottom: 80 }}
            onClose={() => {
                setVisibleAbout(false);
                setEdit(null);
            }}
            extra={
                <Space>
                    <Button onClick={() => {
                        setVisibleAbout(false);
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
                layout="vertical"
                onFinish={(params) => {setSubmit(true);submitForm(params)}}
                //onFinish={(params) => submitForm(params)}
            >
                <Form.Item
                    name="about"
                >
                   <TextArea rows={15} />
                </Form.Item>
                
            </Form>
        </Drawer>
    );
});

export default React.memo(FormAbout);
