import { Select, Stack, Divider } from "@mantine/core";
import { ScheduledCourse, ClassSection } from "@full-stack/types";
import { ClassSectionData } from "../../types/section";
import {
    findPrimarySectionIndex,
    getSelectedAdditionalIndices,
} from "../../utils/sectionUtils";

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
 * Format meeting times concisely (e.g., "MWF 10:10-11:00")
 */
function formatMeetingTimes(classSection: ClassSection): string {
    return classSection.meetings
        .map((m) => `${m.pattern} ${m.timeStart}-${m.timeEnd}`)
        .join(", ");
}

/**
 * Get short component label (LEC → Lecture, DIS → Discussion, etc.)
 */
function getComponentLabel(ssrComponent: string): string {
    const labels: Record<string, string> = {
        "LEC": "Lecture",
        "DIS": "Discussion",
        "LAB": "Lab",
        "REC": "Recitation",
        "SEM": "Seminar",
        "STU": "Studio",
    };
    return labels[ssrComponent] || ssrComponent;
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

    const primarySectionIndex = findPrimarySectionIndex(course, allClassSections);
    const selectedValue = primarySectionIndex.toString();

    // Get lecture sections for primary dropdown
    const lectureSections = allClassSections
        .filter((sectionData) => sectionData.classSection.ssrComponent.includes("LEC"))
        .map((sectionData) => ({
            value: allClassSections.indexOf(sectionData).toString(),
            label: `${sectionData.classSection.section} · ${formatMeetingTimes(sectionData.classSection)}`,
        }));

    // Get non-lecture sections for additional dropdown
    const additionalSections = allClassSections
        .map((sectionData, idx) => {
            if (sectionData.classSection.ssrComponent.includes("LEC")) return null;
            const component = getComponentLabel(sectionData.classSection.ssrComponent);
            return {
                value: idx.toString(),
                label: `${component} ${sectionData.classSection.section} · ${formatMeetingTimes(sectionData.classSection)}`,
                group: component,
            };
        })
        .filter((item): item is { value: string; label: string; group: string } => item !== null);

    // Get currently selected additional sections using utility
    const selectedAdditionalSections = getSelectedAdditionalIndices(course, allClassSections);

    return (
        <Stack spacing="xs" mt="sm">
            <Divider 
                label="Select Sections" 
                labelPosition="left" 
                styles={{ label: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" } }}
            />
            
            {lectureSections.length > 0 && (
                <Select
                    placeholder="Select lecture"
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
                    size="xs"
                    styles={{
                        input: { fontFamily: "inherit" },
                    }}
                />
            )}

            {additionalSections.length > 0 && (
                <Select
                    placeholder="Select discussion/lab"
                    value={selectedAdditionalSections[0] || null}
                    onChange={(value) => {
                        onMultiSectionChange(
                            course,
                            value ? [value] : [],
                            allClassSections,
                            primarySectionIndex
                        );
                    }}
                    data={additionalSections}
                    size="xs"
                    searchable
                    clearable
                    styles={{
                        input: { fontFamily: "inherit" },
                    }}
                />
            )}
        </Stack>
    );
};
