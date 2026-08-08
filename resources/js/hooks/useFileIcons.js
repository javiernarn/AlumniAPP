import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';

const useFileIcons = () => {
  const getFileIcon = (extension) => {
    switch (extension.toLowerCase()) {
      case "pdf":
        return (
          <FilePdfOutlined
            style={{ marginRight: 8, color: "#ff4d4f" }}
          />
        );
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return (
          <FileImageOutlined
            style={{ marginRight: 8, color: "#52c41a" }}
          />
        );
      case "doc":
      case "docx":
        return (
          <FileWordOutlined
            style={{ marginRight: 8, color: "#1890ff" }}
          />
        );
      case "xls":
      case "xlsx":
        return (
          <FileExcelOutlined
            style={{ marginRight: 8, color: "#52c41a" }}
          />
        );
      default:
        return <FileOutlined style={{ marginRight: 8 }} />;
    }
  };

  return { getFileIcon };
};

export default useFileIcons;