import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Grid, Paper, Button, Title } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import { useSchedule } from "../hooks/useSchedule";
import { Timetable } from "../components/Timetable";
import { DayMap } from "../components/DayMap";
import { getCoursesForDay } from "../utils/walkingTime";

const DayViewPage = () => {
    const { day } = useParams<{ day: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { schedule, loading: scheduleLoading } = useSchedule();

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/");
        }
    }, [user, authLoading, navigate]);

    if (authLoading || scheduleLoading || !user || !day) {
        return <div>Loading...</div>;
    }

    const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
    const dayCourses = schedule
        ? getCoursesForDay(schedule.courses, dayCapitalized)
        : [];

    return (
        <Container fluid style={{ padding: "20px", height: "100vh" }}>
            <div style={{ marginBottom: "16px" }}>
                <Button variant="outline" onClick={() => navigate("/schedule")} mb="md">
                    Back to Full Schedule
                </Button>
                <Title order={2}>{dayCapitalized} Schedule</Title>
            </div>

            <Grid style={{ height: "calc(100vh - 150px)" }}>
                <Grid.Col span={6}>
                    <Paper p="md" withBorder style={{ height: "100%", overflowY: "auto" }}>
                        <Timetable courses={dayCourses} />
                    </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Paper withBorder style={{ height: "100%" }}>
                        <DayMap courses={schedule?.courses || []} day={dayCapitalized} />
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default DayViewPage;

