import React from "react";
import { DashboardOutlined } from "@ant-design/icons";
import { Breadcrumb } from "antd";
import secureLocalStorage from "react-secure-storage";

let dashboardlink = "";
const role = secureLocalStorage.getItem("userRole");
if (role === "admin") {
    dashboardlink = "/admin-dashboard";
} else if (role === "student") {
    dashboardlink = "/student/dashboard";
} else if (role === "faculty") {
    dashboardlink = "/faculty/dashboard";
}

const SY = () => {
    return (
        <Breadcrumb>
            <Breadcrumb.Item><DashboardOutlined /> Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item> School Year</Breadcrumb.Item>
        </Breadcrumb>
    );
   
};

const College = () => {
    return (
        <Breadcrumb>
            <Breadcrumb.Item><DashboardOutlined /> Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item> College</Breadcrumb.Item>
        </Breadcrumb>
    );
};

const Department = () => {
    return (
        <Breadcrumb
            items={[
                {
                    href: dashboardlink,
                    title: <DashboardOutlined />,
                },
                {
                    title: "Departments",
                },
            ]}
        />
    );
};

const Faculty = (subs) => {
    const subItems = Array.isArray(subs) ? subs : [subs];

    return (
        <Breadcrumb>
            <Breadcrumb.Item><DashboardOutlined /> Dashboard</Breadcrumb.Item>
            {/* <Breadcrumb.Item>Faculties</Breadcrumb.Item> */}
            {subItems.map((item, idx) => (
                <Breadcrumb.Item key={idx}>{item}</Breadcrumb.Item>
            ))}
        </Breadcrumb>
    );
};

const Student = (subs) => {
    const subItems = Array.isArray(subs) ? subs : [subs];

    return (
        <Breadcrumb>
            <Breadcrumb.Item><DashboardOutlined /> Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>Students</Breadcrumb.Item>
            {subItems.map((item, idx) => (
                <Breadcrumb.Item key={idx}>{item}</Breadcrumb.Item>
            ))}
        </Breadcrumb>
    );
};

const Group = () => {
    return (
        <Breadcrumb>
            <Breadcrumb.Item><DashboardOutlined /> Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item> Groups</Breadcrumb.Item>
        </Breadcrumb>
    );
};

export default { SY, College, Department, Faculty, Group , Student };
