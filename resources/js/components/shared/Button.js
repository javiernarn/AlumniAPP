import React from "react";
import { Button as DefaultButton } from 'antd';

const  Button =  React.memo(({ label, ...props }) => {
    return (
        <DefaultButton {...props}>{label}</DefaultButton>
    );
});

export default Button