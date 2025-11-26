import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Grid, Paper, Button, Modal, Text, Stack } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import { useSchedule } from "../hooks/useSchedule";
import { CourseSearch } from "../components/CourseSearch";
import { Timetable } from "../components/Timetable";
import { CourseDetails } from "../components/CourseDetails";
import { CornellClass, ScheduledCourse } from "@full-stack/types";
import { checkWalkingTime, getCoursesForDay } from "../utils/walkingTime";

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
    const [courseDataCache, setCourseDataCache] = useState<
        Map<string, CornellClass>
    >(new Map());
    const [walkingWarning, setWalkingWarning] = useState<{
        show: boolean;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/");
        }
    }, [user, authLoading, navigate]);

    if (authLoading || scheduleLoading || !user) {
        return <div>Loading...</div>;
    }

    const handleCourseSelect = async (cornellClass: CornellClass) => {
        if (!schedule) return;

        // Cache course data
        setCourseDataCache((prev) => new Map(prev).set(cornellClass.crseId.toString(), cornellClass));

        // For now, select first enroll group and first class section (user can change later)
        const enrollGroupIndex = 0;
        const enrollGroup = cornellClass.enrollGroups[enrollGroupIndex];
        const classSection = enrollGroup.classSections[0];
        if (!classSection) {
            console.error("No class sections found");
            return;
        }

        // Check walking time for each day the course meets
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        let hasWarning = false;
        let warningMessage = "";

        for (const day of days) {
            const dayAbbr =
                day === "Monday"
                    ? "M"
                    : day === "Tuesday"
                    ? "T"
                    : day === "Wednesday"
                    ? "W"
                    : day === "Thursday"
                    ? "R"
                    : "F";

            const meeting = classSection.meetings.find((m) =>
                m.pattern.includes(dayAbbr)
            );
            if (!meeting) continue;

            // Find previous and next courses on this day
            const dayCourses = getCoursesForDay(schedule.courses, day);
            const sortedDayCourses = dayCourses.sort((a, b) => {
                const aMeeting = a.meetings.find((m) => m.pattern.includes(dayAbbr));
                const bMeeting = b.meetings.find((m) => m.pattern.includes(dayAbbr));
                if (!aMeeting || !bMeeting) return 0;
                return aMeeting.timeStart.localeCompare(bMeeting.timeStart);
            });

            const newCourseStart = meeting.timeStart;
            let previousCourse: typeof schedule.courses[0] | null = null;
            let nextCourse: typeof schedule.courses[0] | null = null;

            for (const course of sortedDayCourses) {
                const courseMeeting = course.meetings.find((m) =>
                    m.pattern.includes(dayAbbr)
                );
                if (!courseMeeting) continue;

                if (courseMeeting.timeEnd <= newCourseStart) {
                    previousCourse = course;
                } else if (courseMeeting.timeStart > newCourseStart && !nextCourse) {
                    nextCourse = course;
                    break;
                }
            }

            // Create temporary course object for checking
            const tempCourse: typeof schedule.courses[0] = {
                id: "temp",
                crseId: cornellClass.crseId.toString(),
                subject: cornellClass.subject,
                catalogNbr: cornellClass.catalogNbr,
                title: cornellClass.titleShort,
                classSection: classSection.section,
                ssrComponent: classSection.ssrComponent,
                classNbr: classSection.classNbr.toString(),
                enrollGroupIndex,
                meetings: classSection.meetings.map((m) => ({
                    pattern: m.pattern,
                    timeStart: m.timeStart,
                    timeEnd: m.timeEnd,
                    bldgDescr: m.bldgDescr || "",
                    facilityDescr: m.facilityDescr || "",
                    instructors: m.instructors,
                })),
                units: enrollGroup.unitsMinimum.toString(),
            };

            const check = await checkWalkingTime(
                previousCourse,
                tempCourse,
                nextCourse,
                day
            );

            if (check.insufficient) {
                hasWarning = true;
                warningMessage = check.message || "Insufficient walking time";
                break;
            }
        }

        if (hasWarning) {
            setWalkingWarning({
                show: true,
                message: warningMessage,
                onConfirm: async () => {
                    try {
                        await addCourse(cornellClass, enrollGroupIndex, 0);
                        setWalkingWarning(null);
                    } catch (error) {
                        console.error("Failed to add course:", error);
                    }
                },
                onCancel: () => {
                    setWalkingWarning(null);
                },
            });
        } else {
            try {
                await addCourse(cornellClass, enrollGroupIndex, 0);
            } catch (error) {
                console.error("Failed to add course:", error);
            }
        }
    };

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

    const getCourseData = (course: ScheduledCourse): CornellClass | null => {
        return courseDataCache.get(course.crseId.toString()) || null;
    };

    return (
        <Container fluid style={{ padding: "20px" }}>
            <Stack spacing="md">
                <h1>Course Schedule</h1>

                <Paper p="md" withBorder>
                    <CourseSearch onSelect={handleCourseSelect} />
                </Paper>

                <Grid>
                    <Grid.Col span={8}>
                        <Paper p="md" withBorder>
                            <Timetable
                                courses={schedule?.courses || []}
                                onRemoveCourse={handleRemoveCourse}
                            />
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Paper withBorder style={{ maxHeight: "80vh", overflowY: "auto" }}>
                            <CourseDetails
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

