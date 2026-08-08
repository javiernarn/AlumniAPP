import React, { useState, useEffect } from "react";
import { Button, Tooltip } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const HeaderTitle = ({ children, title, action }) => {

    return (
        <div className="page-action-back">
            <div className="title">
                {action && (
                    <Tooltip title="back">
                        <Button
                            shape="circle"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => action()}
                        />
                    </Tooltip>
                )}
                 <h3>{title}</h3>
            </div>
            {/* <div>{children}</div> */}
        </div>
    );
};

export default React.memo(HeaderTitle);
