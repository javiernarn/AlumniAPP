import React, { useState, useCallback } from "react";
import { Modal, Upload, message, Button, Progress, Space } from "antd";
import ImgCrop from "antd-img-crop";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";

const ImageUploadModal = ({ visible, onClose, onUploadSuccess }) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);

    // Memoized handlers for better performance
    const onChange = useCallback(({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1)); // Only allow one image
    }, []);

    const onPreview = useCallback(async (file) => {
        let src = file.url;
        if (!src) {
            src = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file.originFileObj);
                reader.onload = () => resolve(reader.result);
            });
        }
        setPreviewImage(src);
        setPreviewVisible(true);
    }, []);

    const beforeUpload = useCallback((file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG files!');
            return false;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Image must be smaller than 5MB!');
            return false;
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    if (img.width > img.height) {
                        resolve(true);
                    } else {
                        message.error("Only landscape images are allowed (width > height).");
                        resolve(false);
                    }
                };
            };
        });
    }, []);

    const handleUpload = useCallback(async () => {
        if (fileList.length === 0) {
            message.warning("Please select an image before uploading.");
            return;
        }

        const file = fileList[0].originFileObj;
        if (!file) {
            message.error("No valid file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("metadata", JSON.stringify({
            filename: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        }));

        setProgress(0);
        setUploading(true);

        try {
            const response = await axios.post("/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (event) => {
                    const percent = Math.round((event.loaded * 100) / event.total);
                    setProgress(percent);
                },
            });

            message.success("Image uploaded successfully!");
            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }
            setFileList([]);
            onClose();
        } catch (error) {
            console.error("Upload error:", error);
            message.error(error.response?.data?.message || "Failed to upload image.");
        } finally {
            setUploading(false);
        }
    }, [fileList, onClose, onUploadSuccess]);

    const handleCancel = useCallback(() => {
        if (!uploading) {
            setFileList([]);
            onClose();
        }
    }, [uploading, onClose]);

    return (
        <>
            <Modal
                title="Upload Landscape Image"
                open={visible}
                onCancel={handleCancel}
                width={800}
                footer={[
                    <Space key="footer-buttons">
                        <Button 
                            key="cancel" 
                            onClick={handleCancel} 
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            key="upload"
                            type="primary"
                            loading={uploading}
                            onClick={handleUpload}
                            disabled={fileList.length === 0 || uploading}
                        >
                            {uploading ? `Uploading (${progress}%)` : "Upload"}
                        </Button>
                    </Space>
                ]}
            >
                <div style={{ marginBottom: 16 }}>
                    <p>Requirements:</p>
                    <ul>
                        <li>Landscape orientation (width {'>'} height)</li>
                        <li>JPG or PNG format</li>
                        <li>Max file size: 5MB</li>
                        <li>Aspect ratio will be cropped to 21:9</li>
                    </ul>
                </div>

                <ImgCrop 
                    rotate 
                    aspect={21 / 9}
                    modalTitle="Crop Image"
                    modalWidth={800}
                    quality={0.8}
                    fillColor="white"
                >
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={onChange}
                        onPreview={onPreview}
                        beforeUpload={beforeUpload}
                        accept="image/jpeg,image/png"
                        showUploadList={{
                            showPreviewIcon: true,
                            showRemoveIcon: true,
                            previewIcon: <EyeOutlined />,
                        }}
                        customRequest={() => {}} // Disable auto-upload
                    >
                        {fileList.length < 1 && (
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Add Image</div>
                            </div>
                        )}
                    </Upload>
                </ImgCrop>

                {uploading && (
                    <div style={{ marginTop: 24 }}>
                        <Progress 
                            percent={progress} 
                            status={progress === 100 ? 'success' : 'active'} 
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                    </div>
                )}
            </Modal>

            <Modal
                open={previewVisible}
                title="Image Preview"
                footer={null}
                onCancel={() => setPreviewVisible(false)}
                width="80vw"
                bodyStyle={{ padding: 0, textAlign: 'center' }}
            >
                <img 
                    alt="preview" 
                    style={{ 
                        maxWidth: '100%', 
                        maxHeight: '80vh',
                        display: 'block',
                        margin: '0 auto'
                    }} 
                    src={previewImage} 
                />
            </Modal>
        </>
    );
};

export default ImageUploadModal;