// import React, { Component } from "react";
// import { Result, Button } from "antd";
// import { Layout } from "~/components"
// import { Link, useLocation } from "react-router-dom"
// import secureLocalStorage from "react-secure-storage"
// class Pages404 extends Component {
//     constructor() {
//         super();
//         this.state = {
//             //newCustomer: false
//         };
//     }

//     componentWillMount() {}

//     render() {


         
//         const role = secureLocalStorage.getItem("userRole")

//         let redirectLink = "/alumni"

//         if (role === "admin") {
//             redirectLink = "/admin-dashboard"
//         } else if (role === "department_head") {
//             redirectLink = "/department-dashboard"
//         } else if (role === "alumni") {
//             redirectLink = "/alumni"
//         }

        
//         return (
            
//             <React.Fragment>
//                 <div style={{ display: 'flex', alignItems: 'center' , justifyContent: 'center', height: '100vh' }} >
//                     <Result
//                         status="404"
//                         title="404"
//                         subTitle="Sorry, the page you visited does not exist."
//                         extra={
//                           <Link to={redirectLink}>
//                             <Button type="primary">Go Back</Button>
//                           </Link>
//                         }
//                     />
//                 </div>
//             </React.Fragment>
// );
//     }
// }

// export default Pages404;

import React, { useEffect } from "react";
import { Result, Button, Typography } from "antd";
import { Link } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { useAppTheme } from "~/hooks/useAppTheme";

const { Text } = Typography;

const Pages404 = () => {
    useEffect(() => {
        document.title = "Page Not Found | ATMS - Opol Community College";
    }, []);

    // ============ THEME SYNC ============
    // Shared hook — same source of truth as FormLogin.js, so the
    // theme stays in sync (BroadcastChannel + cookie + secureLocalStorage)
    // across tabs and pages instead of this page tracking its own copy.
    const { theme: currentTheme } = useAppTheme();

    const isDark = currentTheme === "black";

    const role = secureLocalStorage.getItem("userRole");

    let redirectLink = "/alumni";

    if (role === "admin") {
        redirectLink = "/home";
    } else if (role === "department_head") {
        redirectLink = "/department-dashboard";
    } else if (role === "alumni") {
        redirectLink = "/home";
    }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: isDark ? "#0a0a0a" : "#ffffff",
            }}
        >
         <Result
    status="404"
    title={
        <span
            style={{
                color: isDark ? "#ffffff" : "#000000",
            }}
        >
            404
        </span>
    }
    subTitle={
        <Text
            style={{
                color: isDark ? "#ffffff" : "#000000",
            }}
        >
            Sorry, the page you visited does not exist.
        </Text>
    }
    extra={
        <Link to={redirectLink}>
            <Button type="primary">Go Back</Button>
        </Link>
    }
/>
        </div>
    );
};

export default React.memo(Pages404);