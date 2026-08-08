import React, { useState, useEffect } from "react";
import { Button, Tooltip, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

const GroupsAvatar = ({ item, team_lead, DIR_LOCATION }) => {
    return (
        <Tooltip
            title={`${item.fname} ${item.mname}${item.mname ? "." : ""} ${
                item.lname
            }`}
            placement="top"
            color={team_lead === item.id ? "#f9b317" : ""}
        >
            {item?.image ? (
                <Avatar
                    className={`avatar-content ${
                        team_lead === item.id ? "team-lead-image" : ""
                    }`}
                    size="small"
                    src={`${DIR_LOCATION}${item?.image}`}
                    icon={<UserOutlined />}
                />
            ) : (
                <Avatar
                    className={`avatar-content ${
                        team_lead === item.id ? "team-lead-image" : ""
                    }`}
                    size="small"
                    icon={<UserOutlined />}
                />
            )}
        </Tooltip>
    );
};

export default React.memo(GroupsAvatar);
