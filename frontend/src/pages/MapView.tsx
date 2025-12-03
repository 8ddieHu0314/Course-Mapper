import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Grid, Paper, Stack, SegmentedControl, Title } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import { useSchedule } from "../hooks/useSchedule";
import { useScheduleData, useCoursesForDay } from "../hooks/useScheduleData";
import { MapDisplay } from "../components/map";
import { CourseCard } from "../components/course";
import { DayOfTheWeek } from "../utils/calendar-utils";
import "./MapView.css";

const DAYS: DayOfTheWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const MapViewPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { schedule, loading: scheduleLoading } = useSchedule();
    const [selectedDay, setSelectedDay] = useState<DayOfTheWeek>("Monday");

    // Use custom hooks for schedule data transformation
    const scheduleData = useScheduleData(schedule?.courses || []);
    const selectedDayCourses = useCoursesForDay(
        schedule?.courses || [],
        scheduleData,
        selectedDay
    );

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/");
        }
    }, [user, authLoading, navigate]);

    if (authLoading || scheduleLoading || !user) {
        return <div>Loading...</div>;
    }

    if (!schedule) {
        return <div>No schedule found</div>;
    }

    return (
        <Container fluid p="md" style={{ height: "100%", width: "100%", maxWidth: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
            <Grid style={{ flex: 1, width: "100%" }} gutter="md">
                {/* Left Side - Day Calendar */}
                <Grid.Col span={5} className="map-view-left">
                    <Paper p="md" withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <Stack spacing="md" style={{ flex: 1 }}>
                            <div>
                                <Title order={2}>Day View</Title>
                                <SegmentedControl
                                    value={selectedDay}
                                    onChange={(value) => setSelectedDay(value as DayOfTheWeek)}
                                    data={DAYS}
                                    fullWidth
                                    style={{ marginTop: "1rem" }}
                                />
                            </div>

                            {/* Course List for Selected Day */}
                            <div className="courses-list" style={{ flex: 1, overflowY: "auto" }}>
                                {selectedDayCourses.length > 0 ? (
                                    <Stack spacing="xs">
                                        {selectedDayCourses.map((item, idx) => (
                                            <CourseCard
                                                key={idx}
                                                block={item.block}
                                                metadata={item.metadata}
                                                day={selectedDay}
                                            />
                                        ))}
                                    </Stack>
                                ) : (
                                    <div className="no-courses">No classes on this day</div>
                                )}
                            </div>
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* Right Side - Google Maps */}
                <Grid.Col span={7} className="map-view-right">
                    <MapDisplay
                        courses={selectedDayCourses}
                        day={selectedDay}
                        allCourses={schedule.courses}
                    />
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default MapViewPage;
