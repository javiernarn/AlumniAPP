import React from "react";
import { FloatButton, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const FloatingButton = React.memo(({ label, ...props }) => {
    return (
        <div className="floating-button">
            <Tooltip placement="leftTop" title={label}>
                <FloatButton
                    icon={<PlusOutlined />}
                    type="primary"
                    {...props }
                />
            </Tooltip>
        </div>
    );
});

export default FloatingButton;
