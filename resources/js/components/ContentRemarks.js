import React, { useEffect } from "react";
import { Empty, Tag, Button, Layout, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useFacultyDashboardStore } from "~/states/facultyDashboardState";
import { useRatingThesisSched } from "~/hooks";
import shallow from "zustand/shallow";
import { getCookie, getStorage } from "~/utils/helper";
import { FormAddRatingConceptPaper } from "./index";
import { useMutation, useQueryClient } from "react-query";
import { ERROR_MESSAGE } from "~/utils/constant";

const ContentRemarks = () => {
    const queryClient = useQueryClient();
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
        addRatingConceptPaperForm,
        setAddRatingConceptPaperForm,
        addRatingConceptPaper,
        thesisID,
        setThesisID,
        ratingLength,
        totalFacultyRating,
        defenseThesisDetailsID,
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
            state.addRatingConceptPaperForm,
            state.setAddRatingConceptPaperForm,
            state.addRatingConceptPaper,
            state.thesisID,
            state.setThesisID,
            state.ratingLength,
            state.totalFacultyRating,
            state.defenseThesisDetailsID,
        ],
        shallow
    );

    const cur_user = getStorage("userID");
    //console.log(facultyPanelID);

    const mutation = useMutation(addRatingConceptPaper, {
        onSuccess: (data) => {
            setSubmit(false);
            if (data?.error) {
                message.error(ERROR_MESSAGE);
            } else {
                setClear(true);
                queryClient.invalidateQueries("faculties_dashboard");
                setAddRatingConceptPaperForm(false);
                message.success("Rating successfully added!");
            }
        },
    });

    return (
        <Layout>
            <div style={{ width: 350 }}>
                {ratingLength > 0 && (
                    <table className="table-content">
                        <tbody>
                            <tr>
                                <td>Research Topic</td>
                                <td className="score">
                                    {Array.isArray(panelRating) &&
                                        panelRating.map((obj2, i) => (
                                            <Tag color="green">
                                                {obj2?.research_topic}
                                            </Tag>
                                        ))}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Relevant Literature and Related Existing
                                    Application
                                </td>
                                <td className="score">
                                    {Array.isArray(panelRating) &&
                                        panelRating.map((obj2, i) => (
                                            <Tag color="green">
                                                {obj2?.relevant_literature}
                                            </Tag>
                                        ))}
                                </td>
                            </tr>
                            <tr>
                                <td>Issues and Gap</td>
                                <td className="score">
                                    {Array.isArray(panelRating) &&
                                        panelRating.map((obj2, i) => (
                                            <Tag color="green">
                                                {obj2?.issues_gap}
                                            </Tag>
                                        ))}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Possibe Solutions/Enhancement and Impact
                                </td>
                                <td className="score">
                                    {Array.isArray(panelRating) &&
                                        panelRating.map((obj2, i) => (
                                            <Tag color="green">
                                                {obj2?.possibe_solutions}
                                            </Tag>
                                        ))}
                                </td>
                            </tr>
                            <tr>
                                <td>Overall Concept Presentation</td>
                                <td className="score">
                                    {Array.isArray(panelRating) &&
                                        panelRating.map((obj2, i) => (
                                            <Tag color="green">
                                                {obj2?.overall_concept}
                                            </Tag>
                                        ))}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <b>Total Points</b>
                                </td>
                                <td className="score">
                                    <Tag color="green">
                                        {totalFacultyRating}
                                    </Tag>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <b>Remarks</b>
                                </td>
                                <td className="score">
                                    {totalFacultyRating >= 75 && (
                                        <Tag color="green">APPROVED</Tag>
                                    )}
                                    {totalFacultyRating < 75 && (
                                        <Tag color="red">DENIED</Tag>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2}>
                            Recommendations:
                            {Array.isArray(panelRating) &&
                                panelRating.map((obj2, i) => (
                                    <div className="recomendations-container">
                                        <p>
                                            {obj2?.recommendation}
                                            <br></br>
                                        </p>
                                    </div>
                                ))}
                                </td>
                                </tr>
                        </tbody>
                    </table>
                )}
                {ratingLength <= 0 && <Empty description="No ratings yet" />}

                {facultyPanelID == cur_user && ratingLength <= 0 && (
                    <div className="rating-button">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setAddRatingConceptPaperForm(true);
                                //setEdit(value?.data);
                            }}
                        >
                            Add Ratings
                        </Button>
                    </div>
                )}
            </div>
            <FormAddRatingConceptPaper
                submitForm={(params) => {
                    params.defenseThesisDetailsID = defenseThesisDetailsID;
                    params.facultyPanelID = facultyPanelID;
                    params.thesis_id = thesisID;
                    mutation.mutate(params);
                    setSubmit(true);
                }}
            />
        </Layout>
    );
};

export default React.memo(ContentRemarks);
