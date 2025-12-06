/**
 * Shared types for section management across the application
 */

import { ClassSection } from "@full-stack/types";

/**
 * Represents a flattened class section with its position in the enroll group hierarchy
 */
export interface ClassSectionData {
    enrollGroupIndex: number;
    classSectionIndex: number;
    classSection: ClassSection;
}

/**
 * Minimal identifier for comparing sections
 */
export interface SectionIdentifier {
    section: string;
    ssrComponent: string;
    enrollGroupIndex: number;
    classSectionIndex?: number;
}

