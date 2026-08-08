import { Button, Form, Input, Drawer, Space, Upload, Avatar } from "antd";
import React, { useEffect, useState } from "react";
import { useProfileStore } from "~/states/profileState";
import { useProfile } from "~/hooks";
import shallow from "zustand/shallow";
// import ImgCrop from 'antd-img-crop';
import axiosConfig from "~/utils/axiosConfig";
import { UploadProfile } from "~/components";
const { Dragger } = Upload;

const FormPrimaryDetails = React.memo(({ submitForm }) => {
    const [form] = Form.useForm();
    const [imageOld,setImageOld] = useState(null);
    // const {  useState  } = React;
    const { TextArea } = Input;
    const [
        visiblePrimaryDetails,
        setVisiblePrimaryDetails,
        editData,
        setEdit,
        isClear,
        setClear,
        isSubmit,
        image,
        setImage,
        setSubmit,
    ] = useProfileStore(
        (state) => [
            state.visiblePrimaryDetails,
            state.setVisiblePrimaryDetails,
            state.editData,
            state.setEdit,
            state.isClear,
            state.setClear,
            state.isSubmit,
            state.image,
            state.setImage,
            state.setSubmit,
        ],
        shallow
    );

    useEffect(() => {
        form.setFieldsValue({
            about: editData?.about,
            password: editData?.user?.password,
        });

        if(editData?.image){
            setImageOld(DIR_LOCATION.profile+editData?.image);
        }else{
            setImageOld(null);
        }
    }, [editData]);

    useEffect(() => {
        if (isClear) form.resetFields();
    }, [isClear])
// console.log( editData);
    const propsPic = {
            // action: axiosConfig.post(`/update-profile`),
            multiple: false,
            maxCount: 1,
            accept:"image/*" ,
            beforeUpload: (file) => {  //console.log(file.size)
                const isPNG = file.type === 'image/*';
                const fsize = Math.round((file.size / 1024 / 1024)); 
                // if (!isPNG) {
                //     message.error(`${file.name} is not an image file`);
                //     return Upload.LIST_IGNORE;
                // }
                if (fsize > 10) {
                    message.error(`File size exceeds 10 MB`);
                    return Upload.LIST_IGNORE;
                }
                return false;
            },
            onChange: (info) => {
                // alert();
                // console.log('info',info.fileList);
                // let formData = new FormData();
                // formData.append("profile", info.fileList[0]?.originFileObj);
                // // formData.append("id", params?.id);
                // // formData.append("notes", params?.notes);
                // // formData.append("isSchedule", params?.isSchedule);
                // axiosConfig.post(`/update-profile`, formData)
                // .then((result) => {
                //     return result;
                // })
                // .catch((error) => {
                //     return {'error' : true, 'message' : error};
                // });
            },
        
    };

    const [fileList, setFileList] = useState([
       
      
    ]);

    const onChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        console.log('file',fileList);
    };
    const onPreview = async (file) => {
        let src = file.url;
        if (!src) {
          src = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file.originFileObj);
            reader.onload = () => resolve(reader.result);
          });
        }
        const image = new Image();
        image.src = src;
        const imgWindow = window.open(src);
        imgWindow?.document.write(image.outerHTML);
    };

    return (
        <Drawer
            title={`${editData ? "Edit Primary Details" : "Edit Primary Details"}`}
            width={500}
            open={visiblePrimaryDetails}
            bodyStyle={{ paddingBottom: 80 }}
            onClose={() => {
                setVisiblePrimaryDetails(false);
                setEdit(null);
            }}
            extra={
                <Space>
                    <Button onClick={() => {
                        setVisiblePrimaryDetails(false);
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
                    name="image"
                >
                    <UploadProfile imageOld={imageOld} updateImage={(image) => setImage(image)}  />
                  
                </Form.Item>
                {/* <Form.Item
                    name="image"
                >
                  <ImgCrop grid>
                    <Upload
                        listType="picture-card"
                        onChange={onChange}
                        onPreview={onPreview}
                    >
                        {'+ Upload'}
                    </Upload>
                    </ImgCrop>
                </Form.Item> */}
            </Form>
        </Drawer>
    );
});

export default React.memo(FormPrimaryDetails);
