import React, { useState, useEffect, useCallback } from "react";
import { Image, Button, message, Upload, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const UploadProfile = React.memo(({ imageOld, updateImage }) => {
    const [image, setImage] = useState('error');

    const getBase64 = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }, []);

    const handleBeforeUpload = async (file) => {
        const isValidType = file.type === "image/png" || file.type === "image/jpeg";
        const isValidSize = file.size / 1024 / 1024 <= 3;

        if (!isValidType) {
            message.error(`${file.name} is not a PNG or JPEG file`);
            return Upload.LIST_IGNORE;
        }

        if (!isValidSize) {
            message.error(`File size exceeds 3 MB`);
            return Upload.LIST_IGNORE;
        }

        updateImage(file);

        try {
            const base64 = await getBase64(file);
            setImage(base64);
        } catch (error) {
            message.error("Failed to read file");
        }

        return false; // Prevent automatic upload
    };

    useEffect(() => {
        if (imageOld) {   
            setImage(imageOld);
        } else {
            setImage('error');
        }
    }, [imageOld]);

    const uploadProps = {
        multiple: false,
        maxCount: 1,
        beforeUpload: handleBeforeUpload,
        showUploadList: false,
        accept: "image/png, image/jpeg",
    };
    
    return (
        <Space>
            <Image
                key={image} 
                width={80}
                height={80}
                src={image}
                fallback="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQDw4ODg0NDw0PEA0NDQ4NDw8NDg0PIBEWFhYRExUYHCggGBolGxUVITEtJSkrLi4uFyAzODMsNygtLisBCgoKDg0NEA0PDysZFRkrKy03Ny0rNys3Kzc3KystLSsrLSsrNysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAOEA4QMBIgACEQEDEQH/xAAbAAEAAwEBAQEAAAAAAAAAAAAAAQQFBgMCB//EADQQAQACAAMFAwkJAQAAAAAAAAABAgMFEQQSITFRQVJhFTNxgYKSobHBEyIjMkJykbLR8f/EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/EABYRAQEBAAAAAAAAAAAAAAAAAAABEf/aAAwDAQACEQMRAD8A/RAG2QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfW/ID5AAAAAAAAAAAABGoqRAIkAAAAAAAAAAAAAAAAAAAAAAACI1nSObR2TKrW43nSOyI5y98p2GIj7S3G08onshqM2qq4WX4VeVdZ6zqsVw6x+mP4fQivi2BSddaxx5qe0ZXSfyxuz4cl8BzW07HfD13o1jsmOTwdViUi0TWeUxpLntu2WcO2nOs8az4NSorAKgAAAAAAAAAAAAAAAAAAuZXs8XvxjWteMqUt3JcPTD3tONv+JVaEQkGVQJQACREK23bNF6zw4xxrPRaQDk56CzmOHFcW0RHPirN6AAgAAAAAAAAAAAAAAACHTbFXTDp2cIlzLqNl83T9tfklV7CEsqAAAAIlKJBi53H36z1idfHkzWpns8cP0W+jLVABpAAAAAAAAAAAAAAAAEOky7E3sKk+Gn8cHONbJMePvUnn+aOmiVWuISyoAAAAiUvm9tImZ5QDDzrE1xIr0j/FCHptWJvXtbrMzGvR5Q0iQFQAAAAAAAAAAAAAAAAfeBiTS0WjnD4Cq6jAxovWLRMeOnZL1c5sG2fZW7d2eEx9XQYWJFoiYnWJYV9gAAAMrN9r4Th158N75rGYbbGHWYjjedYjTsnrLAvaZmZmdZnmsiPlINIAAAAAAAAAAAAAAAAAAAAh7bPtV8P8s8Ok8YeQmK1tnzjsvX1wsxm2F3p923+OfDBu3zfDjXTWenCY+ali5riW100rHhzUEGD6veZmZmZmZ5oBUAAAAAAAAAAAAAAAAAAH1h4drTpWJn1L2wZbv8b6xXhMdZbOFgVrERWsRomqx8DKbTxtO74c1ymUYcc5vPriPo0BlVLyVhd2fek8l4Xdn3pXQFLyVhd2felHkrC7s+9K8Ao+SsLuz70p8lYXdn3pXQFHyVhd2fel82yjDnlN49ExPzhoBoyb5LH6cSfarqqY2WYtf070dazr8OboRdMclaJjhMTE9J4SOox9npeNL1ifHtj0Sw9uy+2Hxj71OvbHpWVFMBUAAAAAAAAAAIa2XZdyvf1Q8Mp2bftvTyr827EM2qmIARUJAAAAAAAAAAABExrwnkkBg5nsP2c79fyTzjuz/ig6u9ItE1mNYmNJhzW17POHeaz6YnrHY1KjxAVAAAAAABNKzMxEc5mIhC/k2DvYm9PKka+vs+pVbGybPGHSKx656z2y9gYUAAAAAAAAAAAAAAAAZ2dYG9TfjnTn+1ovjGpvVtXrEx8AcqIS2yAAAAAANvIq/ctPW2n8RH+sRv5NH4MeM2n46fRKsXgGVAAAAAAAAAAAAAAAAAAcrtFdL3jpa0fF8PXbPOYn77/2l5NsgAAAAADoco8zT2v7S550OUeZp7X9pSrFwBlQAAAAAAAAAAAAAAAAAHM7dH4uJ+6zwWcyjTGxPTE/CFZtAAQAAAAdBlHma+185BKsXQGVAAAAAAAAAAAAAAAARJAA53NfPX9n+sKoNoACAAP/2Q=="
                alt="Profile"
            />
            <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>
                    Click to Upload
                </Button>
            </Upload>
        </Space>
    );
});

export default UploadProfile;
