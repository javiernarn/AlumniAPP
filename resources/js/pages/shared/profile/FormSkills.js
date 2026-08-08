import { Button, Form, Input, Drawer, Space, Select } from "antd";
import React, { useEffect ,useState} from "react";
import { useProfileStore } from "~/states/profileState";
import { useProfile } from "~/hooks";
import shallow from "zustand/shallow";
import { DebounceSelect } from "~/components";

const FormSkills = React.memo(({ submitForm }) => {
    const [form] = Form.useForm();
    const [value, setValue] = useState([]);
    const [
        visibleSkills,
        setVisibleSkills,
        editData,
        setEdit,
        isClear,
        setClear,
        isSubmit
    ] = useProfileStore(
        (state) => [
            state.visibleSkills,
            state.setVisibleSkills,
            state.editData,
            state.setEdit,
            state.isClear,
            state.setClear,
            state.isSubmit
        ],
        shallow
    );

    useEffect(() => {
        let skills_list = [];
        let skills =  editData?.skills_array|| [];
        for (let index = 0; index < skills.length; index++) {
            skills_list.push(skills[index]);
        }
        form.setFieldsValue({
            skills: skills_list,
        });
    }, [editData]);
   
    useEffect(() => {
        if (isClear) form.resetFields();
    }, [isClear])

    const options= [];
   
    let skills =  editData?.skills_array|| [];
    for (let index = 0; index < skills.length; index++) {
    // for (let i = 0; i < 36; i++) {
        options.push({
            value: skills[index] ,
            label: skills[index] ,}
        );
        
    }
    
    const handleChange = (value) => {
       //console.log(`selected ${value}`);
    };
    
   
    return (
        <Drawer
            title= "Edit Skills"
            width={500}
            open={visibleSkills}
            bodyStyle={{ paddingBottom: 80 }}
            onClose={() => {
                setVisibleSkills(false);
                setEdit(null);
            }}
            extra={
                <Space>
                    <Button onClick={() => {
                        setVisibleSkills(false);
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
                    name="skills"
                    rules={[
                        {
                            required: true,
                            message: "Please enter skills!",
                        },
                    ]}
                >
                    <Select
                        mode="tags"
                        style={{
                        width: '100%',
                        }}
                        value={value}
                        // placeholder="Select a adviser"
                        optionFilterProp="children"
                        //onChange={onChange}
                        onChange={(newValue) => {
                            setValue(newValue);
                            // console.log(value);
                        }}
                        // filterOption={(input, option) => option.children.toString().toLowerCase().includes(input.toLowerCase())}
                        options={options}
                    >
                        {/* {Array.isArray(editData?.skills) &&  editData?.skills.map((obj,i) =>{
                            return ( <Option key={i} value={obj?.id}>{obj?.skill}</Option>)
                        }) } */}
                    </Select>
                </Form.Item>
            </Form>
        </Drawer>
    );
});

export default React.memo(FormSkills);
