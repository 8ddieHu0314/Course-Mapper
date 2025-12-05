/**
 * Schedule Page
 * Main page for managing course schedules with timetable view
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Grid, Paper, Button, Modal, Text, Stack } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import { useSchedule } from "../hooks/useSchedule";
import { useCourseSelection } from "../hooks/useCourseSelection";
import { CourseSearch } from "../components/course";
import { Timetable, CoursePanel } from "../components/schedule";
import { ScheduledCourse } from "@full-stack/types";

const SchedulePage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const {
        schedule,
        loading: scheduleLoading,
        addCourse,
        updateCourseSection,
        updateSelectedSections,
        removeCourse,
    } = useSchedule();

    // Use the extracted course selection hook
    const {
        walkingWarning,
        setWalkingWarning,
        handleCourseSelect,
        getCourseData,
    } = useCourseSelection({ schedule, addCourse });

    // Redirect to home if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/");
        }
    }, [user, authLoading, navigate]);

    // Show loading state
    if (authLoading || scheduleLoading || !user) {
        return <div>Loading...</div>;
    }

    // Handler functions that wrap the schedule hook methods
    const handleUpdateSection = async (
        courseId: string,
        enrollGroupIndex: number,
        meetings: ScheduledCourse["meetings"]
    ) => {
        if (!schedule) return;
        try {
            await updateCourseSection(courseId, enrollGroupIndex, meetings);
        } catch (error) {
            console.error("Failed to update course:", error);
        }
    };

    const handleRemoveCourse = async (courseId: string) => {
        if (!schedule) return;
        try {
            await removeCourse(courseId);
        } catch (error) {
            console.error("Failed to remove course:", error);
        }
    };

    const handleUpdateSelectedSections = async (
        courseId: string,
        selectedSections: ScheduledCourse["selectedSections"]
    ) => {
        try {
            await updateSelectedSections(courseId, selectedSections);
        } catch (error) {
            console.error("Failed to update selected sections:", error);
        }
    };

    return (
        <Container fluid p="md" style={{ width: "100%", maxWidth: "100%" }}>
            <Stack spacing="md">
                <h1>Course Schedule</h1>

                <Paper p="md" withBorder>
                    <CourseSearch onSelect={handleCourseSelect} />
                </Paper>

                <Grid align="stretch">
                    <Grid.Col span={8}>
                        <Paper p="md" withBorder style={{ height: "100%" }}>
                            <Timetable courses={schedule?.courses || []} />
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Paper withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                            <CoursePanel
                                courses={schedule?.courses || []}
                                onRemoveCourse={handleRemoveCourse}
                                onUpdateSection={handleUpdateSection}
                                onUpdateSelectedSections={handleUpdateSelectedSections}
                                getCourseData={getCourseData}
                            />
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Stack>

            {/* Walking Time Warning Modal */}
            <Modal
                opened={walkingWarning?.show || false}
                onClose={() => setWalkingWarning(null)}
                title="Walking Time Warning"
            >
                <Stack spacing="md">
                    <Text>{walkingWarning?.message}</Text>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <Button variant="outline" onClick={walkingWarning?.onCancel}>
                            Cancel
                        </Button>
                        <Button onClick={walkingWarning?.onConfirm}>Proceed Anyway</Button>
                    </div>
                </Stack>
            </Modal>
        </Container>
    );
};

export default SchedulePage;
