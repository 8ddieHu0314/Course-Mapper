/**
 * @hook useSectionSelection
 * @description Manages section selection within a course (lecture, discussion, lab).
 *
 * @purpose
 * - Handle switching between lecture sections
 * - Manage multi-section selection (lecture + discussion/lab)
 * - Provide unified API for section updates
 * - Preserve primary section when adding secondary sections
 *
 * @props {Object} UseSectionSelectionProps
 * - onUpdateSelectedSections?: (courseId, selectedSections) => void
 *     Callback to persist section changes (typically from useSchedule)
 *
 * @returns {Object}
 * - handleSectionChange: (course, enrollGroupIndex, classSection) => void
 *     Handle single section change (e.g., switching lecture)
 *     Preserves additional sections when switching the primary
 *
 * - handleMultiSectionChange: (course, selectedIndices, allClassSections, primarySectionIndex) => void
 *     Handle multi-section selection from dropdowns
 *     Used with MultiSelect for discussion/lab sections
 *
 * - updateSections: (courseId, primary, additional?) => void
 *     Unified handler with simpler API for direct updates
 *     Works for both single and multi-section updates
 *
 * @example
 * const { handleSectionChange, handleMultiSectionChange } = useSectionSelection({
 *   onUpdateSelectedSections: updateSelectedSections, // from useSchedule
 * });
 *
 * // Single section change (lecture dropdown)
 * <Select onChange={(value) => {
 *   const section = allSections[parseInt(value)];
 *   handleSectionChange(course, section.enrollGroupIndex, section.classSection);
 * }} />
 *
 * // Multi-section change (discussion/lab MultiSelect)
 * <MultiSelect onChange={(values) => {
 *   handleMultiSectionChange(course, values, allSections, primaryIndex);
 * }} />
 */

import { useCallback } from "react";
import { ScheduledCourse, ClassSection, ScheduledCourseSection } from "@full-stack/types";
import { ClassSectionData } from "../types/section";
import {
    isMultiSectionMode,
    buildSelectedSections,
} from "../utils/sectionUtils";
import { toScheduledSection } from "../utils/meetingTransform";

interface UseSectionSelectionProps {
    onUpdateSelectedSections?: (
        courseId: string,
        selectedSections: ScheduledCourseSection[]
    ) => void;
}

interface UseSectionSelectionReturn {
    /**
     * Handle single section change (e.g., switching lecture)
     * Preserves additional sections when switching the primary
     */
    handleSectionChange: (
        course: ScheduledCourse,
        enrollGroupIndex: number,
        classSection: ClassSection
    ) => void;
    
    /**
     * Handle multi-section change (lecture + discussion/lab)
     * Used when selecting from MultiSelect dropdown
     */
    handleMultiSectionChange: (
        course: ScheduledCourse,
        selectedIndices: string[],
        allClassSections: ClassSectionData[],
        primarySectionIndex: number
    ) => void;
    
    /**
     * Unified handler for updating sections
     * Simpler API that works for both single and multi-section updates
     */
    updateSections: (
        courseId: string,
        primary: ClassSectionData | null,
        additional?: ClassSectionData[]
    ) => void;
}

export function useSectionSelection({
    onUpdateSelectedSections,
}: UseSectionSelectionProps): UseSectionSelectionReturn {
    
    /**
     * Handle single section change (e.g., switching lecture)
     */
    const handleSectionChange = useCallback(
        (
            course: ScheduledCourse,
            enrollGroupIndex: number,
            classSection: ClassSection
        ) => {
            const existingSections: ScheduledCourseSection[] =
                isMultiSectionMode(course) && course.selectedSections
                    ? [...course.selectedSections]
                    : [];

            // Replace primary section (index 0)
            existingSections[0] = toScheduledSection(classSection, enrollGroupIndex, 0);

            onUpdateSelectedSections?.(course.id, existingSections);
        },
        [onUpdateSelectedSections]
    );

    /**
     * Handle multi-section change (lecture + discussion/lab)
     */
    const handleMultiSectionChange = useCallback(
        (
            course: ScheduledCourse,
            selectedIndices: string[],
            allClassSections: ClassSectionData[],
            primarySectionIndex: number
        ) => {
            // Get or create the primary (lecture) section
            let primarySection: ClassSectionData | null = null;

            if (isMultiSectionMode(course) && course.selectedSections) {
                // Use existing primary section's data to find in allClassSections
                const existingPrimary = course.selectedSections[0];
                const existingIdx = allClassSections.findIndex(
                    (s) =>
                        s.classSection.section === existingPrimary.section &&
                        s.classSection.ssrComponent === existingPrimary.ssrComponent &&
                        s.enrollGroupIndex === existingPrimary.enrollGroupIndex
                );
                primarySection = existingIdx >= 0 ? allClassSections[existingIdx] : allClassSections[primarySectionIndex];
            } else {
                primarySection = allClassSections[primarySectionIndex] ?? null;
            }

            // Convert selected indices to ClassSectionData
            const additionalSections = selectedIndices
                .map((idx) => allClassSections[parseInt(idx)])
                .filter((s): s is ClassSectionData => s !== undefined);

            const sections = buildSelectedSections(primarySection, additionalSections);

            onUpdateSelectedSections?.(course.id, sections);
        },
        [onUpdateSelectedSections]
    );

    /**
     * Unified handler - simpler API for direct updates
     */
    const updateSections = useCallback(
        (
            courseId: string,
            primary: ClassSectionData | null,
            additional: ClassSectionData[] = []
        ) => {
            const sections = buildSelectedSections(primary, additional);
            onUpdateSelectedSections?.(courseId, sections);
        },
        [onUpdateSelectedSections]
    );

    return {
        handleSectionChange,
        handleMultiSectionChange,
        updateSections,
    };
}

export default useSectionSelection;

