import React, { useEffect, useState } from "react";
import {
    Typography,
    Button
} from "antd";
import {
    ArrowLeftOutlined,
} from "@ant-design/icons";
import queryString from "query-string";
import { baseURL } from "~/utils/helper";
import ReactPDF from "@intelllex/react-pdf";
import SplitPane from "react-split-pane";
const { Title } = Typography;

const DocumentPage = (props) => {
    let params = queryString.parse(props.location.search);
    if (!params?.details) {
        window.location.href = "/404";
        return false;
    }
    let document = atob(params?.details);
   
    setTimeout(() => {
        window.scrollTo({ top: 0 });
        document.body.classList.add("hide-body-scroll");
    }, 0);
    const goBack = () => {
       // document.body.classList.remove("hide-body-scroll");
        history.go(-1);
        return false;
    };
    return (
        <div style={{ margin: 0 }}>
            {/* <ReactPDF
                url={`${baseURL()}/uploads/documents/${document}`}
                showProgressBar={true}
                showToolbox
            /> */}

            
            <div className="action-top">
                <div>
                    <Button
                        shape="circle"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => goBack()}
                    />
                    {/* <span style={{ marginLeft: 10 }}>
                        {details?.thesis?.thesis_name}
                    </span> */}
                </div>
               
            </div>
            <ReactPDF
                url={`${baseURL()}/uploads/documents/${document}`}
                showProgressBar={true}
                showToolbox
            />
           
            </div>
        
        
    );
};

export default React.memo(DocumentPage);
