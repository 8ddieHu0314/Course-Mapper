/**
 * Utility functions for section management
 * Provides reusable logic for handling course sections across the application
 */

import { ScheduledCourse, CornellClass, ScheduledCourseSection } from "@full-stack/types";
import { ClassSectionData, SectionIdentifier } from "../types/section";
import { toScheduledSection } from "./meetingTransform";

/**
 * Check if a course is in multi-section mode (has selectedSections)
 */
export function isMultiSectionMode(course: ScheduledCourse): boolean {
    return Boolean(course.selectedSections && course.selectedSections.length > 0);
}

/**
 * Check if two section identifiers are equal
 */
export function areSectionsEqual(
    a: SectionIdentifier,
    b: SectionIdentifier
): boolean {
    return (
        a.section === b.section &&
        a.ssrComponent === b.ssrComponent &&
        a.enrollGroupIndex === b.enrollGroupIndex
    );
}

/**
 * Flatten enroll groups into a flat array of class sections
 * Useful for dropdowns and selection UI
 */
export function flattenClassSections(cornellClass: CornellClass | null): ClassSectionData[] {
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
 * Find the index of the primary (lecture) section in the flattened array
 */
export function findPrimarySectionIndex(
    course: ScheduledCourse,
    allClassSections: ClassSectionData[]
): number {
    // Check selectedSections first (multi-mode)
    if (isMultiSectionMode(course) && course.selectedSections) {
        const primary = course.selectedSections[0];
        const idx = allClassSections.findIndex((s) =>
            areSectionsEqual(
                {
                    section: s.classSection.section,
                    ssrComponent: s.classSection.ssrComponent,
                    enrollGroupIndex: s.enrollGroupIndex,
                },
                {
                    section: primary.section,
                    ssrComponent: primary.ssrComponent,
                    enrollGroupIndex: primary.enrollGroupIndex,
                }
            )
        );
        if (idx >= 0) return idx;
    }

    // Fallback to course-level fields
    let idx = allClassSections.findIndex(
        (s) =>
            s.enrollGroupIndex === course.enrollGroupIndex &&
            s.classSection.section === course.classSection &&
            s.classSection.ssrComponent === course.ssrComponent
    );

    // Last resort: find by enrollGroupIndex only
    if (idx < 0) {
        idx = allClassSections.findIndex(
            (s) => s.enrollGroupIndex === course.enrollGroupIndex
        );
    }

    return idx >= 0 ? idx : 0;
}

/**
 * Build an updated sections list from primary + additional selections
 * Handles deduplication automatically
 */
export function buildSelectedSections(
    primarySection: ClassSectionData | null,
    additionalSections: ClassSectionData[]
): ScheduledCourseSection[] {
    const sections: ScheduledCourseSection[] = [];

    if (primarySection) {
        sections.push(
            toScheduledSection(
                primarySection.classSection,
                primarySection.enrollGroupIndex,
                primarySection.classSectionIndex
            )
        );
    }

    // Create a key for the primary section to avoid duplicates
    const primaryKey = primarySection
        ? `${primarySection.classSection.section}-${primarySection.classSection.ssrComponent}`
        : null;

    additionalSections.forEach((sectionData) => {
        const key = `${sectionData.classSection.section}-${sectionData.classSection.ssrComponent}`;
        if (key !== primaryKey) {
            sections.push(
                toScheduledSection(
                    sectionData.classSection,
                    sectionData.enrollGroupIndex,
                    sectionData.classSectionIndex
                )
            );
        }
    });

    return sections;
}

/**
 * Categorize sections into lectures vs additional (discussion/lab/recitation)
 */
export function categorizeSections(allClassSections: ClassSectionData[]): {
    lectureSections: ClassSectionData[];
    additionalSections: ClassSectionData[];
} {
    return {
        lectureSections: allClassSections.filter((s) =>
            s.classSection.ssrComponent.includes("LEC")
        ),
        additionalSections: allClassSections.filter((s) =>
            !s.classSection.ssrComponent.includes("LEC")
        ),
    };
}

/**
 * Get currently selected additional section indices for MultiSelect
 */
export function getSelectedAdditionalIndices(
    course: ScheduledCourse,
    allClassSections: ClassSectionData[]
): string[] {
    if (!course.selectedSections || course.selectedSections.length <= 1) {
        return [];
    }

    return course.selectedSections
        .slice(1) // Skip primary section
        .map((section) => {
            const idx = allClassSections.findIndex(
                (s) =>
                    s.classSection.section === section.section &&
                    s.classSection.ssrComponent === section.ssrComponent &&
                    s.enrollGroupIndex === section.enrollGroupIndex
            );
            return idx >= 0 ? idx.toString() : "-1";
        })
        .filter((idx) => idx !== "-1");
}

