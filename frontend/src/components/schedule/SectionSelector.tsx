import { Text, Select, MultiSelect, Group, Badge } from "@mantine/core";
import { ScheduledCourse, ClassSection, ScheduledCourseSection } from "@full-stack/types";
import { toScheduledSection } from "../../utils/meetingTransform";

interface ClassSectionData {
    enrollGroupIndex: number;
    classSectionIndex: number;
    classSection: ClassSection;
}

interface SectionSelectorProps {
    course: ScheduledCourse;
    allClassSections: ClassSectionData[];
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
 * Helper to format a meeting time string
 */
function formatMeetingTimes(classSection: ClassSection): string {
    return classSection.meetings
        .map((m) => `${m.pattern} ${m.timeStart}-${m.timeEnd}`)
        .join(", ");
}

/**
 * Find the primary section index from the course
 */
function findPrimarySectionIndex(
    course: ScheduledCourse,
    allClassSections: ClassSectionData[]
): number {
    const isInMultiMode = course.selectedSections && course.selectedSections.length > 0;

    if (isInMultiMode && course.selectedSections && course.selectedSections.length > 0) {
        const primarySection = course.selectedSections[0];
        const idx = allClassSections.findIndex(
            (sectionData) =>
                sectionData.enrollGroupIndex === primarySection.enrollGroupIndex &&
                sectionData.classSectionIndex === primarySection.classSectionIndex &&
                sectionData.classSection.section === primarySection.section &&
                sectionData.classSection.ssrComponent === primarySection.ssrComponent
        );
        return idx >= 0 ? idx : 0;
    }

    // Use course fields to find the primary section
    let idx = allClassSections.findIndex(
        (sectionData) =>
            sectionData.enrollGroupIndex === course.enrollGroupIndex &&
            sectionData.classSection.section === course.classSection &&
            sectionData.classSection.ssrComponent === course.ssrComponent
    );

    if (idx < 0) {
        idx = allClassSections.findIndex(
            (sd) => sd.enrollGroupIndex === course.enrollGroupIndex
        );
    }

    return idx >= 0 ? idx : 0;
}

/**
 * Handles section selection for courses with multiple sections
 */
export const SectionSelector = ({
    course,
    allClassSections,
    onSectionChange,
    onMultiSectionChange,
}: SectionSelectorProps) => {
    if (allClassSections.length <= 1) return null;

    const isInMultiMode = course.selectedSections && course.selectedSections.length > 0;
    const primarySectionIndex = findPrimarySectionIndex(course, allClassSections);
    const selectedValue = primarySectionIndex.toString();

    // Get lecture sections for primary dropdown
    const lectureSections = allClassSections
        .filter((sectionData) => sectionData.classSection.ssrComponent.includes("LEC"))
        .map((sectionData) => ({
            value: allClassSections.indexOf(sectionData).toString(),
            label: `${sectionData.classSection.ssrComponent} ${sectionData.classSection.section} - ${formatMeetingTimes(sectionData.classSection)}`,
        }));

    // Get non-lecture sections for additional dropdown
    const additionalSections = allClassSections
        .map((sectionData, idx) => {
            if (sectionData.classSection.ssrComponent.includes("LEC")) return null;
            return {
                value: idx.toString(),
                label: `${sectionData.classSection.ssrComponent} ${sectionData.classSection.section} - ${formatMeetingTimes(sectionData.classSection)}`,
            };
        })
        .filter((item): item is { value: string; label: string } => item !== null);

    // Get currently selected additional sections
    const selectedAdditionalSections =
        course.selectedSections && course.selectedSections.length > 1
            ? course.selectedSections
                  .slice(1)
                  .map((section) => {
                      const idx = allClassSections.findIndex(
                          (s) =>
                              s.classSection.section === section.section &&
                              s.classSection.ssrComponent === section.ssrComponent &&
                              s.enrollGroupIndex === section.enrollGroupIndex
                      );
                      return idx >= 0 ? idx.toString() : "-1";
                  })
                  .filter((idx) => idx !== "-1")
            : [];

    return (
        <>
            <Select
                label={isInMultiMode ? "Primary Section (Lecture)" : "Section"}
                placeholder="Select a lecture section"
                value={selectedValue}
                onChange={(value) => {
                    if (value) {
                        const index = parseInt(value);
                        const sectionData = allClassSections[index];
                        if (sectionData) {
                            onSectionChange(
                                course,
                                sectionData.enrollGroupIndex,
                                sectionData.classSection
                            );
                        }
                    }
                }}
                data={lectureSections}
                size="sm"
                mt="xs"
            />

            {additionalSections.length > 0 && (
                <>
                    <Text size="sm" fw={500} mt="md" mb="xs">
                        Add Discussion/Recitation/Lab Sections:
                    </Text>
                    <MultiSelect
                        label="Additional Sections"
                        placeholder="Select discussion, recitation, or lab section"
                        maxSelectedValues={1}
                        value={selectedAdditionalSections}
                        onChange={(values) => {
                            onMultiSectionChange(
                                course,
                                values,
                                allClassSections,
                                primarySectionIndex
                            );
                        }}
                        data={additionalSections}
                        size="sm"
                        mt="xs"
                        searchable
                    />
                    {course.selectedSections && course.selectedSections.length > 0 && (
                        <Group spacing="xs" mt="xs">
                            {course.selectedSections.map((section, idx) => (
                                <Badge key={idx} size="lg" variant="light">
                                    {section.ssrComponent} {section.section}
                                </Badge>
                            ))}
                        </Group>
                    )}
                    <Text size="xs" c="dimmed" mt="xs">
                        💡 Click any course block on the calendar to toggle between selected sections
                    </Text>
                </>
            )}
        </>
    );
};

