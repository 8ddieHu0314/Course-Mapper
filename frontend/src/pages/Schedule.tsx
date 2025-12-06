import { useEffect, useMemo } from "react";
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

    // Calculate total credits - must be before early returns to follow Rules of Hooks
    const totalCredits = useMemo(() => {
        if (!schedule || !schedule.courses) return 0;
        const total = schedule.courses.reduce((sum, course) => {
            const units = parseFloat(course.units) || 0;
            return sum + (isNaN(units) ? 0 : units);
        }, 0);
        return isNaN(total) ? 0 : total;
    }, [schedule]);

    if (authLoading || scheduleLoading || !user) {
        return <div>Loading...</div>;
    }

    if (!schedule) {
        return <div>No schedule found</div>;
    }

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
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h1 style={{ margin: 0 }}>Course Schedule</h1>
                    <span
                        style={{
                            color: "#000",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "8px",
                            padding: "4px 12px",
                            fontSize: "16px",
                            fontWeight: "normal",
                        }}
                    >
                        {totalCredits} Credits
                    </span>
                </div>

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
