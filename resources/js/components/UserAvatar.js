import React, { useState, useEffect } from "react";
import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

const UserAvatar = ({
    imageUrl,
    size = "default",
    alt = "User Avatar",
    shape = "circle",
    className = "",
    style = {},
}) => {
    const [isValidImage, setIsValidImage] = useState(false);

    useEffect(() => {
        if (!imageUrl) {
            setIsValidImage(false);
            return;
        }
        const img = new Image();
        img.src = imageUrl;

        img.onload = () => {
            setIsValidImage(true);
        };

        img.onerror = () => {
            setIsValidImage(false);
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [imageUrl]);

    return (
        <Avatar
            src={isValidImage ? imageUrl : undefined}
            size={size}
            alt={alt}
            shape={shape}
            className={className}
            style={{ ...style, backgroundColor: '#03A9F4' }}
            icon={!isValidImage ? <UserOutlined /> : undefined}
        />
    );
};

export default UserAvatar;
