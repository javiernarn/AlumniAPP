import React from "react";
import { Tooltip as TooltipComponent } from 'antd';

const  Tooltip =  React.memo(({ children, ...props }) => {
    return (
        <TooltipComponent {...props}>{children}</TooltipComponent>
    );
});

export default Tooltip