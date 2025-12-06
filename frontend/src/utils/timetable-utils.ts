import { ScheduledCourse } from "@full-stack/types";
import {
    parseTimeString,
    DayOfTheWeek,
    getDayAbbreviation,
    formatTime,
} from "./calendar-utils";
import { CourseItem, ColumnLayout } from "../types/timetable";

/**
 * Get section-specific ssrComponent by matching the block's time/day to the correct section.
 * Falls back to course-level ssrComponent if no match found.
 */
export function getSectionComponent(
    metadata: ScheduledCourse,
    day: DayOfTheWeek,
    timeStart: string,
    blockSsrComponent?: string
): string {
    if (blockSsrComponent) return blockSsrComponent;

    if (metadata.selectedSections && metadata.selectedSections.length > 0) {
        const dayAbbr = getDayAbbreviation(day);
        const matchingSection = metadata.selectedSections.find((section) =>
            section.meetings.some(
                (m) => m.pattern.includes(dayAbbr) && formatTime(m.timeStart) === timeStart
            )
        );
        if (matchingSection?.ssrComponent) {
            return matchingSection.ssrComponent;
        }
    }

    return metadata.ssrComponent;
}

/**
 * Arrange courses into non-overlapping columns for display.
 * Courses that overlap in time are placed in separate columns.
 */
export function getOverlapColumns(dayCourses: CourseItem[]): ColumnLayout {
    if (dayCourses.length === 0) return [];

    const sorted = [...dayCourses].sort((a, b) => {
        try {
            const aStart = parseTimeString(a.block.timeStart);
            const bStart = parseTimeString(b.block.timeStart);
            return (aStart.hours * 60 + aStart.minutes) - (bStart.hours * 60 + bStart.minutes);
        } catch {
            return 0;
        }
    });

    const columns: ColumnLayout = [];

    for (const item of sorted) {
        const placed = tryPlaceInExistingColumn(item, columns);
        if (!placed) {
            columns.push([item]);
        }
    }

    return columns;
}

/** Try to place an item in an existing column without overlap */
function tryPlaceInExistingColumn(item: CourseItem, columns: ColumnLayout): boolean {
    for (const column of columns) {
        if (canPlaceInColumn(item, column)) {
            column.push(item);
            return true;
        }
    }
    return false;
}

/** Check if an item can be placed in a column without overlapping existing items */
function canPlaceInColumn(item: CourseItem, column: CourseItem[]): boolean {
    try {
        const currentStart = parseTimeString(item.block.timeStart);
        const currentEnd = parseTimeString(item.block.timeEnd);
        const currentStartMin = currentStart.hours * 60 + currentStart.minutes;
        const currentEndMin = currentEnd.hours * 60 + currentEnd.minutes;

        for (const existing of column) {
            const existStart = parseTimeString(existing.block.timeStart);
            const existEnd = parseTimeString(existing.block.timeEnd);
            const existStartMin = existStart.hours * 60 + existStart.minutes;
            const existEndMin = existEnd.hours * 60 + existEnd.minutes;

            const hasOverlap = !(currentEndMin <= existStartMin || currentStartMin >= existEndMin);
            if (hasOverlap) return false;
        }
        return true;
    } catch {
        return false;
    }
}

