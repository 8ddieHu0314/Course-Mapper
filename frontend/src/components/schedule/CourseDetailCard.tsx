import { Text, Paper, Group, ActionIcon, Badge, Box } from "@mantine/core";
import { ScheduledCourse, CornellClass, ClassSection } from "@full-stack/types";
import { IconTrash, IconMapPin } from "@tabler/icons-react";
import { SectionSelector } from "./SectionSelector";
import { ClassSectionData } from "../../types/section";
import { flattenClassSections } from "../../utils/sectionUtils";

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
    
    const locations = [...new Set(
        course.meetings
            .map(m => m.bldgDescr || m.facilityDescr)
            .filter(Boolean)
    )];

    return (
        <Paper p="md" withBorder radius="md" shadow="xs">
            {/* Header */}
            <Group position="apart" align="flex-start">
                <Box style={{ flex: 1 }}>
                    <Group spacing="xs" align="center">
                        <Text fw={700} size="lg" style={{ letterSpacing: "-0.01em" }}>
                            {course.subject} {course.catalogNbr}
                        </Text>
                        <Badge size="sm" variant="light" color="blue">
                            {course.units} credits
                        </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={1} mt={2}>
                        {course.title}
                    </Text>
                </Box>
                <ActionIcon 
                    color="red" 
                    variant="subtle" 
                    onClick={onRemove}
                    size="sm"
                >
                    <IconTrash size={16} />
                </ActionIcon>
            </Group>

            {/* Location (if available) */}
            {locations.length > 0 && (
                <Group spacing={4} mt="xs">
                    <IconMapPin size={14} style={{ color: "var(--mantine-color-dimmed)" }} />
                    <Text size="xs" c="dimmed">
                        {locations.join(" · ")}
                    </Text>
                </Group>
            )}

            {/* Section Selector */}
            <SectionSelector
                course={course}
                allClassSections={allClassSections}
                onSectionChange={onSectionChange}
                onMultiSectionChange={onMultiSectionChange}
            />
        </Paper>
    );
};
