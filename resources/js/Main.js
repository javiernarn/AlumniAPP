import "antd-css-utilities/utility.min.css";
import { ConfigProvider, Empty } from "antd";
import React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";
//import "../css/app.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "./assets/scss/app.scss";
// import "./assets/styles/main.css";
// import "./assets/styles/responsive.css";
import NoLayout from "./components/NoLayout";
import Pages404 from "./pages/ErrorPages/Pages404";
import Pages402 from "./pages/ErrorPages/Pages402";
import { useLoader } from "./components/shared/Loader";

import {
    adminRoutes,
    authRoutes,
    noLayoutRoutes,
    alumniRoutes,
} from "./routes";

const NonAuthmiddleware = ({
    component: Component,
    layout: Layout,
    ...rest
}) => (
    <Route
        {...rest}
        render={(props) => {
            const LayoutToUse = Layout || NoLayout; // Default to NoLayout if no layout is provided
            return (
                <LayoutToUse>
                    <Component {...props} />
                </LayoutToUse>
            );
        }}
    />
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: false,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function Main() {
    useLoader();
    return (
        <QueryClientProvider client={queryClient}>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: "#667eea",
                        colorBgContainer: "#f9fafb", // default background
                        borderRadius: 8, // rounded corners
                        fontSize: 14, // base font size
                    },
                    components: {
                        Table: {
                            headerBg: "#f3f4f6",
                            borderColor: "#e5e7eb",
                        },
                        Input: {
                            colorBgContainer: "#ffffff",
                            colorBorder: "#d1d5db",
                            borderRadius: 6,
                        },
                        Modal: {
                            colorBgElevated: "#ffffff",
                            borderRadiusLG: 12,
                        },
                    },
                }}
                renderEmpty={() => <Empty description="No Data" />}
            >
                <Router>
                    <Switch>
                        {/* Auth Routes */}
                        {authRoutes.map((route, idx) => (
                            <NonAuthmiddleware
                                path={route.path}
                                layout={route.layout || NoLayout}
                                component={route.component}
                                key={idx}
                                exact
                            />
                        ))}

                        {/* Admin Routes */}
                        {adminRoutes.map((route, idx) => (
                            <NonAuthmiddleware
                                path={route.path}
                                layout={route.layout}
                                component={route.component}
                                key={idx}
                                exact
                            />
                        ))}
                        {alumniRoutes.map((route, idx) => (
                            <NonAuthmiddleware
                                path={route.path}
                                layout={route.layout}
                                component={route.component}
                                key={idx}
                                exact
                            />
                        ))}

                        {/* Routes with no layout */}
                        {noLayoutRoutes.map((route, idx) => (
                            <NonAuthmiddleware
                                path={route.path}
                                layout={route.layout || NoLayout}
                                component={route.component}
                                key={idx}
                                exact
                            />
                        ))}

                        {/* Catch-all 404 Page */}
                        <Route component={Pages404} />
                        <Route component={Pages402} />
                    </Switch>
                </Router>
            </ConfigProvider>
        </QueryClientProvider>
    );
}

export default Main;

if (document.getElementById("app")) {
    ReactDOM.render(<Main />, document.getElementById("app"));
}
