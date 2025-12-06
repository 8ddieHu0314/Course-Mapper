import { Paper, Stack, SegmentedControl, Title } from "@mantine/core";
import { SCHEDULE_CONFIG } from "../../config";
import { CourseCard } from "../../components/course";
import { CourseBlock, DayOfTheWeek } from "../../utils/calendar-utils";
import { ScheduledCourse } from "@full-stack/types";

interface DayCourseViewProps {
    selectedDay: DayOfTheWeek;
    setSelectedDay: (day: DayOfTheWeek) => void;
    selectedDayCourses: Array<{ block: CourseBlock; metadata: ScheduledCourse | null }>;
}

export const DayCourseView = ({ 
    selectedDay, 
    setSelectedDay, 
    selectedDayCourses 
}: DayCourseViewProps) => { 
    return (
        <Paper p="md" withBorder style={{ height: "100%", display: "flex", flexDirection: "column"}}>
            <Stack spacing="md" style={{ flex: 1 }}>
                <div>
                    <Title order={2}>Day View</Title>
                    <SegmentedControl
                        value={selectedDay}
                        onChange={(value) => setSelectedDay(value as DayOfTheWeek)}
                        data={[...SCHEDULE_CONFIG.WEEKDAYS]}
                        fullWidth
                        style={{ marginTop: "1rem", overflowX: "auto"}}
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
    );
};
