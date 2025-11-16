import { Stack, Text, Button, Select, Paper, Group, ActionIcon } from "@mantine/core";
import { ScheduledCourse, CornellClass, EnrollGroup } from "@full-stack/types";
import { IconTrash } from "@tabler/icons-react";

interface CourseDetailsProps {
    courses: ScheduledCourse[];
    onRemoveCourse: (courseId: string) => void;
    onUpdateSection: (
        courseId: string,
        enrollGroupIndex: number,
        meetings: ScheduledCourse["meetings"]
    ) => void;
    getCourseData?: (course: ScheduledCourse) => CornellClass | null;
}

export const CourseDetails = ({
    courses,
    onRemoveCourse,
    onUpdateSection,
    getCourseData,
}: CourseDetailsProps) => {
    const handleSectionChange = (
        course: ScheduledCourse,
        enrollGroupIndex: number,
        enrollGroup: EnrollGroup
    ) => {
        const newMeetings = enrollGroup.meetings.map((meeting) => ({
            pattern: meeting.pattern,
            timeStart: meeting.timeStart,
            timeEnd: meeting.timeEnd,
            bldgDescr: meeting.bldgDescr,
            facilityDescr: meeting.facilityDescr,
            instructors: meeting.instructors,
        }));

        onUpdateSection(course.id, enrollGroupIndex, newMeetings);
    };

    return (
        <Stack gap="md" style={{ padding: "16px" }}>
            <Text size="lg" fw={700}>
                Selected Courses ({courses.length})
            </Text>
            {courses.length === 0 ? (
                <Text c="dimmed">No courses added yet</Text>
            ) : (
                courses.map((course) => {
                    const cornellClass = getCourseData?.(course);
                    const enrollGroups = cornellClass?.enrollGroups || [];

                    return (
                        <Paper key={course.id} p="md" withBorder>
                            <Group justify="space-between" mb="xs">
                                <div>
                                    <Text fw={600}>
                                        {course.subject} {course.catalogNbr}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {course.title}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {course.units} Credits
                                    </Text>
                                </div>
                                <ActionIcon
                                    color="red"
                                    variant="light"
                                    onClick={() => onRemoveCourse(course.id)}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Group>

                            {enrollGroups.length > 1 && (
                                <Select
                                    label="Section"
                                    value={course.enrollGroupIndex.toString()}
                                    onChange={(value) => {
                                        if (value) {
                                            const index = parseInt(value);
                                            const enrollGroup = enrollGroups[index];
                                            if (enrollGroup) {
                                                handleSectionChange(course, index, enrollGroup);
                                            }
                                        }
                                    }}
                                    data={enrollGroups.map((eg, idx) => ({
                                        value: idx.toString(),
                                        label: `${eg.ssrComponent} ${eg.classSection} - ${eg.meetings
                                            .map(
                                                (m) =>
                                                    `${m.pattern} ${m.timeStart}-${m.timeEnd}`
                                            )
                                            .join(", ")}`,
                                    }))}
                                    size="sm"
                                    mt="xs"
                                />
                            )}

                            <Stack gap="xs" mt="xs">
                                {course.meetings.map((meeting, idx) => (
                                    <Text key={idx} size="sm">
                                        {meeting.pattern} {meeting.timeStart} - {meeting.timeEnd}
                                        <br />
                                        {meeting.bldgDescr} {meeting.facilityDescr}
                                    </Text>
                                ))}
                            </Stack>
                        </Paper>
                    );
                })
            )}
        </Stack>
    );
};

