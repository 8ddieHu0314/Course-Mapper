import { Stack, Text, Select, Paper, Group, ActionIcon } from "@mantine/core";
import { ScheduledCourse, CornellClass, ClassSection } from "@full-stack/types";
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
        classSection: ClassSection
    ) => {
        const newMeetings = classSection.meetings.map((meeting) => ({
            pattern: meeting.pattern,
            timeStart: meeting.timeStart,
            timeEnd: meeting.timeEnd,
            bldgDescr: meeting.bldgDescr || "",
            facilityDescr: meeting.facilityDescr || "",
            instructors: meeting.instructors,
        }));

        onUpdateSection(course.id, enrollGroupIndex, newMeetings);
    };

    return (
        <Stack spacing="md" style={{ padding: "16px" }}>
            <Text size="lg" fw={700}>
                Selected Courses ({courses.length})
            </Text>
            {courses.length === 0 ? (
                <Text c="dimmed">No courses added yet</Text>
            ) : (
                courses.map((course) => {
                    const cornellClass = getCourseData?.(course);
                    const enrollGroups = cornellClass?.enrollGroups || [];
                    
                    // Flatten all class sections from all enroll groups
                    const allClassSections: Array<{ enrollGroupIndex: number; classSectionIndex: number; classSection: ClassSection }> = [];
                    enrollGroups.forEach((eg, egIdx) => {
                        eg.classSections.forEach((cs, csIdx) => {
                            allClassSections.push({
                                enrollGroupIndex: egIdx,
                                classSectionIndex: csIdx,
                                classSection: cs,
                            });
                        });
                    });

                    return (
                        <Paper key={course.id} p="md" withBorder>
                            <Group position="apart" mb="xs">
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

                            {allClassSections.length > 1 && (() => {
                                // Find the current section index by matching classSection and ssrComponent
                                const currentSectionIndex = allClassSections.findIndex(
                                    (sectionData) =>
                                        sectionData.enrollGroupIndex === course.enrollGroupIndex &&
                                        sectionData.classSection.section === course.classSection &&
                                        sectionData.classSection.ssrComponent === course.ssrComponent
                                );
                                const fallbackIndex = allClassSections.findIndex(
                                    (sd) => sd.enrollGroupIndex === course.enrollGroupIndex
                                );
                                const selectedValue = (currentSectionIndex >= 0 
                                    ? currentSectionIndex 
                                    : fallbackIndex >= 0 ? fallbackIndex : 0).toString();

                                return (
                                    <Select
                                        label="Section"
                                        value={selectedValue}
                                        onChange={(value) => {
                                            if (value) {
                                                const index = parseInt(value);
                                                const sectionData = allClassSections[index];
                                                if (sectionData) {
                                                    handleSectionChange(
                                                        course,
                                                        sectionData.enrollGroupIndex,
                                                        sectionData.classSection
                                                    );
                                                }
                                            }
                                        }}
                                        data={allClassSections.map((sectionData, idx) => {
                                            const { classSection } = sectionData;
                                            const meetingsStr = classSection.meetings
                                                .map(
                                                    (m) =>
                                                        `${m.pattern} ${m.timeStart}-${m.timeEnd}`
                                                )
                                                .join(", ");
                                            return {
                                                value: idx.toString(),
                                                label: `${classSection.ssrComponent} ${classSection.section} - ${meetingsStr}`,
                                            };
                                        })}
                                        size="sm"
                                        mt="xs"
                                    />
                                );
                            })()}

                            <Stack spacing="xs" mt="xs">
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

