import { Text, Paper, Group, ActionIcon, Stack } from "@mantine/core";
import { ScheduledCourse, CornellClass, ClassSection, ScheduledCourseSection } from "@full-stack/types";
import { IconTrash } from "@tabler/icons-react";
import { SectionSelector } from "./SectionSelector";

interface ClassSectionData {
    enrollGroupIndex: number;
    classSectionIndex: number;
    classSection: ClassSection;
}

interface CourseDetailCardProps {
    course: ScheduledCourse;
    cornellClass: CornellClass | null;
    onRemove: () => void;
    onSectionChange: (
        course: ScheduledCourse,
        enrollGroupIndex: number,
        classSection: ClassSection
    ) => void;
    onMultiSectionChange: (
        course: ScheduledCourse,
        selectedIndices: string[],
        allClassSections: ClassSectionData[],
        primarySectionIndex: number
    ) => void;
}

/**
 * Flattens enroll groups into a single array of class sections
 */
function flattenClassSections(cornellClass: CornellClass | null): ClassSectionData[] {
    if (!cornellClass) return [];

    const sections: ClassSectionData[] = [];
    cornellClass.enrollGroups.forEach((eg, egIdx) => {
        eg.classSections.forEach((cs, csIdx) => {
            sections.push({
                enrollGroupIndex: egIdx,
                classSectionIndex: csIdx,
                classSection: cs,
            });
        });
    });
    return sections;
}

/**
 * Displays details for a single scheduled course with section selection
 */
export const CourseDetailCard = ({
    course,
    cornellClass,
    onRemove,
    onSectionChange,
    onMultiSectionChange,
}: CourseDetailCardProps) => {
    const allClassSections = flattenClassSections(cornellClass);

    return (
        <Paper p="md" withBorder>
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
                <ActionIcon color="red" variant="light" onClick={onRemove}>
                    <IconTrash size={16} />
                </ActionIcon>
            </Group>

            <SectionSelector
                course={course}
                allClassSections={allClassSections}
                onSectionChange={onSectionChange}
                onMultiSectionChange={onMultiSectionChange}
            />

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
};

