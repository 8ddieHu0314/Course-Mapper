import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Grid, Paper, Stack, SegmentedControl, Title } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import { useSchedule } from "../hooks/useSchedule";
import { MapDisplay } from "../components/MapDisplay";
import {
    organizeCoursesByDay,
    getMinMaxHours,
    generateHoursRange,
    getTotalMinutes,
    DayOfTheWeek,
} from "../utils/calendar-utils";
import {
    transformScheduledCoursesToCourseBlocks,
    getCourseMetadata,
} from "../utils/scheduleTransform";
import "./MapView.css";

const DAYS: DayOfTheWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const MapViewPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { schedule, loading: scheduleLoading } = useSchedule();
    const [selectedDay, setSelectedDay] = useState<DayOfTheWeek>("Monday");

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/");
        }
    }, [user, authLoading, navigate]);

    // Transform courses to calendar format and organize by day
    const scheduleData = useMemo(() => {
        if (!schedule || schedule.courses.length === 0) {
            return {
                schedule: {
                    Monday: [],
                    Tuesday: [],
                    Wednesday: [],
                    Thursday: [],
                    Friday: [],
                    Saturday: [],
                    Sunday: [],
                },
                minHour: 8,
                maxHour: 16,
                totalMinutes: 480,
                hours: generateHoursRange(8, 16),
            };
        }

        const courseBlocks = transformScheduledCoursesToCourseBlocks(schedule.courses);
        const organizedSchedule = organizeCoursesByDay(courseBlocks);
        const { minHour, maxHour } = getMinMaxHours(organizedSchedule);
        const totalMinutes = getTotalMinutes(minHour, maxHour);
        const hours = generateHoursRange(minHour, maxHour);

        return {
            schedule: organizedSchedule,
            minHour,
            maxHour,
            totalMinutes,
            hours,
        };
    }, [schedule]);

    // Get courses for the selected day with metadata
    const selectedDayCourses = useMemo(() => {
        if (!schedule) return [];

        const dayCourses = scheduleData.schedule[selectedDay] || [];
        return dayCourses.map((block) => {
            const metadata = getCourseMetadata(
                schedule.courses,
                block.code,
                selectedDay,
                block.timeStart
            );
            return { block, metadata };
        });
    }, [selectedDay, scheduleData, schedule]);

    if (authLoading || scheduleLoading || !user) {
        return <div>Loading...</div>;
    }

    if (!schedule) {
        return <div>No schedule found</div>;
    }

    const getDayAbbr = (): string => {
        if (selectedDay === "Monday") return "M";
        if (selectedDay === "Tuesday") return "T";
        if (selectedDay === "Wednesday") return "W";
        if (selectedDay === "Thursday") return "R";
        return "F";
    };

    return (
        <Container fluid p="md" style={{ height: "100vh" }}>
            <Grid style={{ height: "100%" }} gutter="md">
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
                                        {selectedDayCourses.map((item, idx) => {
                                            const courseCode = item.metadata?.subject && item.metadata?.catalogNbr
                                                ? `${item.metadata.subject} ${item.metadata.catalogNbr}`
                                                : item.block.code;

                                            const dayAbbr = getDayAbbr();
                                            const dayMeeting = item.metadata?.meetings.find(
                                                (m) => m.pattern.includes(dayAbbr)
                                            );

                                            const location = dayMeeting?.facilityDescr || dayMeeting?.bldgDescr;

                                            return (
                                                <Paper
                                                    key={idx}
                                                    p="sm"
                                                    withBorder
                                                    className="course-card"
                                                >
                                                    <div className="course-card-content">
                                                        <div className="course-title">{courseCode}</div>
                                                        <div className="course-time">
                                                            {item.block.timeStart} - {item.block.timeEnd}
                                                        </div>
                                                        {location && (
                                                            <div className="course-location">
                                                                📍 {location}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Paper>
                                            );
                                        })}
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
                    />
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default MapViewPage;
