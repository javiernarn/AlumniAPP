import { useState } from "react";
import { Modal, Image } from "antd";
import {
    FilePdfOutlined,
    FileImageOutlined,
    FileOutlined,
    LinkOutlined,
} from "@ant-design/icons";

const useFileViewer = (FILE_URL) => {
    const [previewVisible, setPreviewVisible] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);

    const handleFileClick = (file, BASE_URL = '') => {
        const extension = file?.ext.toLowerCase();
        if (extension === "link") {
           window.open(file.file_link, '_blank');
           return
        }
        if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
            setCurrentFile({
                url: FILE_URL + file.file_link,
                type: "image",
            });
            setPreviewVisible(true);
        } else if (extension === "pdf") {
            setCurrentFile({
                url: BASE_URL +  file.url,
                type: "pdf",
            });
            setPreviewVisible(true);
        } else {
            window.open(file.url, "_blank");
        }
    };

    const renderFileIcon = (file) => {
        const extension = file?.ext.toLowerCase();
        if (extension === "link") {
            return (
                <LinkOutlined
                    style={{
                        color: "#faad14",
                    }}
                />
            );
        }
        if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
            return <FileImageOutlined style={{ color: "#52c41a" }} />;
        } else if (extension === "pdf") {
            return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
        }
        return <FileOutlined />;
    };

    const FileViewerModal = () => (
        <Modal
            open={previewVisible}
            footer={null}
            onCancel={() => setPreviewVisible(false)}
            width={currentFile?.type === "pdf" ? "90%" : "50%"}
            bodyStyle={{
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "80vh",
            }}
        >
            {currentFile?.type === "image" && (
                <div style={{ textAlign: "center" }}>
                    <Image
                        src={currentFile.url}
                        style={{ maxHeight: "80vh", maxWidth: "100%" }}
                        preview={false}
                    />
                </div>
            )}
            {currentFile?.type === "pdf" && (
                <iframe
                    src={currentFile.url}
                    style={{ width: "100%", height: "80vh", border: "none" }}
                    title="PDF Viewer"
                />
            )}
        </Modal>
    );

    return {
        handleFileClick,
        renderFileIcon,
        FileViewerModal,
    };
};

export default useFileViewer;
