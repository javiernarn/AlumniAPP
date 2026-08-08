import React from "react";
import { useHistory } from "react-router-dom";
import {
    Card,
    Col,
    Row,
    Button,
    Space,
    Empty,
    Avatar,
    Table,
    Tooltip,
    Popover,
    Tag,
} from "antd";
import { UserOutlined, PlusOutlined } from "@ant-design/icons";
import { Layout, ContentRemarks, HeaderTitle, Breadcrumb } from "~/components";
import { useFacultyDashboard } from "~/hooks";
import moment from "moment";
import { DIR_LOCATION } from "~/utils/constant";
import { useFacultyDashboardStore } from "~/states/facultyDashboardState";
import shallow from "zustand/shallow";
import { useMutation, useQueryClient, useQuery } from "react-query";
import axiosConfig from "~/utils/axiosConfig";
import { getCookie } from "~/utils/helper";

const DashboardPage = () => {
    const queryClient = useQueryClient();
    const [totalRating, setTotalRating] = React.useState(0);
    const [totalPanel, setTotalPanel] = React.useState(0);
    const [ratingAverage, setRatingAverage] = React.useState(0);
    const [remark, setRemark] = React.useState("");
    const [panelHasRating, setPanelHasRating] = React.useState(0);

    const [
        setSubmit,
        perPage,
        setClear,
        defenseSchedID,
        setDefenseSchedID,
        facultyPanelID,
        setFacultyPanelID,
        panelRating,
        setPanelRating,
        setRatingLength,
        setTotalFacultyRating,
        setThesisID,
        setDefenseThesisDetailsID
    ] = useFacultyDashboardStore(
        (state) => [
            state.setSubmit,
            state.perPage,
            state.setClear,
            state.defenseSchedID,
            state.setDefenseSchedID,
            state.facultyPanelID,
            state.setFacultyPanelID,
            state.panelRating,
            state.setPanelRating,
            state.setRatingLength,
            state.setTotalFacultyRating,
            state.setThesisID,
            state.setDefenseThesisDetailsID
        ],
        shallow
    );

    const history = useHistory();

    const { isLoading, data, isFetching } = useFacultyDashboard();

    const viewDetails = (details) => {
        history.push(
            `/admin/thesis-doc-details?id=${details?.id}&key=${btoa(
                details?.id
            )}`
        );
    };

    async function fetchFacultyRating(defenseThesisDetailsID, facultyPanelID) {
        const response = await axiosConfig.post(
            "/faculties/rating?defenseThesisDetailsID=" +
                defenseThesisDetailsID +
                "&facultyPanelID=" +
                facultyPanelID
        );
        setFacultyPanelID(facultyPanelID);
        setDefenseSchedID(defenseSchedID);
        setRatingLength(response?.data?.rating.length);
        setPanelRating(response?.data?.rating);
        setTotalFacultyRating(response?.data?.total_rating);
        setThesisID(response?.data?.thesis?.id);
        setDefenseThesisDetailsID(defenseThesisDetailsID)
    }
    
    async function getTotalRating(defenseSchedID) {
        const response = await axiosConfig.post(
            "/api/faculties/rating-thesis-sched?defenseSchedID=" +
                defenseSchedID
        );
        setTotalRating(response?.data?.rating_sum);
        setTotalPanel(response?.data?.total_panel);
        setPanelHasRating(response?.data?.total_panel_has_rating);
        setRatingAverage(totalRating / totalPanel);
    }

    let list_docs = [];
    let list_thesis_docs = Array.isArray(data?.docs) ? data?.docs : [];
    if (!isLoading) {
        for (let index = 0; index < list_thesis_docs.length; index++) {
            list_docs.push({
                key: index,
                doc_id: list_thesis_docs[index]?.id,
                created_at: moment(list_thesis_docs[index]?.updated_at).format(
                    "lll"
                ),
                uploaded:
                    list_thesis_docs[index].student?.fname +
                    " " +
                    list_thesis_docs[index].student?.lname,
                notes:
                    list_thesis_docs[index]?.notes !== "undefined"
                        ? list_thesis_docs[index]?.notes
                        : "",
                document: list_thesis_docs[index]?.document,
                document_name: list_thesis_docs[index].document_name,
                date_comment: list_thesis_docs[index]?.date_comment
                    ? moment(list_thesis_docs[index].date_comment).format("lll")
                    : "No comments yet",
                data: list_thesis_docs[index],
            });
        }
    }

    let schedule_list = [];
    let schedule_array = Array.isArray(data?.schedules) ? data?.schedules : [];
    if (!isLoading) {
        for (let index = 0; index < schedule_array.length; index++) {
            schedule_list.push({
                key: index,
                id: schedule_array[index]?.id,
                s_id: schedule_array[index]?.id,
                date: `${moment(
                    `${schedule_array[index]?.defense_thesis_details?.date_sched}`
                ).format("LL")}  ${
                    `${schedule_array[index]?.defense_thesis_details?.time}`
                }`,
                date2: `${moment(
                    `${schedule_array[index]?.date_sched}`
                ).format("LL")} - ${schedule_array[index]?.time}`,
                category: schedule_array[index]?.category.name,
                panelist: schedule_array[index]?.panels,
                thesis: schedule_array[index]?.thesis,
                documents: schedule_array[index]?.doc,
                rating_sum: schedule_array[index]?.rating_sum,
                total_panel_has_rating:schedule_array[index]?.total_panel_has_rating,
                total_panel: schedule_array[index]?.total_panel,
                data: schedule_array[index],
                defense_thesis_details: schedule_array[index]?.defense_thesis_details,
            });
        }
    }
    console.log('schedules' ,data?.schedules);
    let new_added_group_list = [];
    let new_added_group_array = Array.isArray(data?.newAddedgroups)
        ? data?.newAddedgroups
        : [];
    if (!isLoading) {
        for (let index = 0; index < new_added_group_array.length; index++) {
            new_added_group_list.push({
                key: index,
                name: new_added_group_array[index].group_name,
                proponents: new_added_group_array[index]?.students,
                data: new_added_group_array[index],
            });
        }
    }

    const columnsNewGroups = [
        {
            title: "Group Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Proponents",
            dataIndex: "proponents",
            key: "proponents",
            render: (students) => (
                <Space>
                    <Avatar.Group>
                        {Array.isArray(students) &&
                            students.map((item, i) => {
                                return (
                                    <Tooltip
                                        title={`${item.fname} ${item.mname}${
                                            item.mname ? "." : ""
                                        } ${item.lname}`}
                                        placement="top"
                                        key={i}
                                    >
                                        {item?.image ? (
                                            <Avatar
                                                className="avatar-content"
                                                size="small"
                                                src={`${DIR_LOCATION.profile}${item?.image}`}
                                                icon={<UserOutlined />}
                                            />
                                        ) : (
                                            <Avatar
                                                className="avatar-content"
                                                size="small"
                                                icon={<UserOutlined />}
                                            />
                                        )}
                                    </Tooltip>
                                );
                            })}
                    </Avatar.Group>
                </Space>
            ),
        },
    ];

    const columns = [
        {
            title: "Schedule ID",
            width: 150,
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Schedule",
            dataIndex: "date",
            key: "date",
        },
        {
            title: "Schedule Category",
            dataIndex: "category",
            key: "category",
        },
        // {
        //     title: "Defense Date & Time",
        //     dataIndex: "date",
        //     key: "date",
        // },
        {
            title: "Panelist",
            dataIndex: "panelist",
            key: "panelist",
            render: (panelist) => (
                <Space>
                    <Avatar.Group>
                        {Array.isArray(panelist) &&
                            panelist.map((obj2, i2) => (
                                <Tooltip title="Click to show ratings"
                                    color={`${
                                        parseInt(getCookie("userID")) ===
                                        obj2?.user_id
                                            ? "green"
                                            : "blue"
                                    }`}
                                >
                                    <Popover
                                        title={`${obj2?.fname} ${obj2?.lname}`}
                                        trigger="click"
                                        content={<ContentRemarks />}
                                        key={i2}
                                    >
                                        {obj2?.image ? (
                                            <Avatar
                                                className="avatar-content pointer-cursor"
                                                size="small"
                                                src={`${DIR_LOCATION.profile}${obj2?.image}`}
                                                icon={<UserOutlined />}
                                                onClick={() => {
                                                    fetchFacultyRating(
                                                        obj2?.defense_sched_details_id,
                                                        obj2?.user_id,
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <Avatar
                                                className="avatar-content pointer-cursor"
                                                size="small"
                                                icon={<UserOutlined />}
                                                onClick={() => {
                                                    fetchFacultyRating(
                                                        obj2?.defense_sched_details_id,
                                                        obj2?.user_id,
                                                    );
                                                }}
                                            />
                                        )}
                                    </Popover>
                                </Tooltip>
                        ))}
                    </Avatar.Group>
                </Space>
            ),
        },
        {
            title: "Thesis",
            dataIndex: "thesis",
            key: "thesis",
            render: (value) => (
                <Space>
                    <Tooltip color="blue" title="View Thesis">
                        <Button
                            onClick={() => viewThesisDetails(value)}
                            type="link"
                        >
                            {value?.thesis_name}
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: "Documents",
            dataIndex: "documents",
            key: "documents",
            render: (value) => (
                <Space>
                    <Tooltip color="blue" title="View Document">
                        <Button
                            onClick={() => viewDocument(value?.document)}
                            type="link"
                        >
                            {value?.document?.document_name}
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: "Remarks",
            dataIndex: "data",
            key: "data",
            render: (value) =>
                value?.total_panel_has_rating == value?.total_panel && (
                    <Tag color={value?.color}> {value?.remark}</Tag>
                ),
        },
    ];

    const columnsDocs = [
        {
            title: "Docment ID",
            dataIndex: "doc_id",
            key: "doc_id",
        },
        {
            title: "Date Uploaded",
            dataIndex: "created_at",
            key: "created_at",
        },
        {
            title: "Uploaded",
            key: "uploaded",
            dataIndex: "uploaded",
        },
        {
            title: "Notes",
            dataIndex: "notes",
            key: "notes",
        },
        {
            title: "Document Name",
            key: "document_name",
            dataIndex: "document_name",
        },
        // {
        //     title: "Date Comment",
        //     key: "date_comment",
        //     dataIndex: "date_comment",
        // },

        {
            title: "Action",
            key: "action",
            width: "100px",
            render: (value) => (
                <Space>
                    <Button
                        onClick={() => {
                            viewDetails(value?.data);
                        }}
                        type="link"
                    >
                        VIEW
                    </Button>
                </Space>
            ),
        },
    ];

    const viewDocument = (document) => {
        history.push(`/admin/document?details=${btoa(document?.document)}`);
    };

    const viewThesisDetails = (details) => {
        history.push(
            `/faculty/thesis-details?id=${details?.id}&key=${btoa(
                details?.id
            )}&back=${btoa("/faculty/thesis-details")}`
        );
    };

    return (
        <Layout breadcrumb={Breadcrumb.Faculty()}>
            <HeaderTitle title="Faculty Dashboard" />
            <Row gutter={[24, 0]}>
                <Col lg={24} sm={24} className="mb-24">
                    <Card
                        title="Assigned Panelist Schedules"
                        bordered={false}
                    >
                        {" "}
                        <div className="table-responsive">
                            <Table
                                loading={isFetching}
                                pagination={false}
                                columns={columns}
                                dataSource={schedule_list}
                                className="ant-border-space"
                            />
                        </div>
                    </Card>
                    <Card
                        title="Recent Uploaded Documents"
                        bordered={false}
                        className="top-spacer"
                    >
                        <div className="table-responsive">
                            <Table
                                columns={columnsDocs}
                                dataSource={list_docs}
                                pagination={false}
                                className="ant-border-space"
                                loading={isLoading}
                                locale={{ emptyText: <Empty /> }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col lg={24} sm={24} className="mb-24">
                    <Card
                        title="New Group Assigned"
                        bordered={false}
                        className="top-spacer"
                    >
                        <div className="table-responsive">
                            <Table
                                columns={columnsNewGroups}
                                dataSource={new_added_group_list}
                                pagination={false}
                                className="ant-border-space"
                                loading={isLoading}
                                locale={{ emptyText: <Empty /> }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
        </Layout>
    );
};

export default React.memo(DashboardPage);
