import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Grid } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import { useSchedule } from "../hooks/useSchedule";
import { useScheduleData, useCoursesForDay } from "../hooks/useScheduleData";
import { MapDisplay } from "../components/map";
import { DayCourseView } from "../components/map/DayCourseView";
import { DayOfTheWeek } from "../utils/calendar-utils";
import "./MapView.css";

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
                    <DayCourseView
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        selectedDayCourses={selectedDayCourses}
                    />
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
