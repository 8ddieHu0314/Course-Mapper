/**
 * Course Selection Hook
 * Handles the logic for selecting and adding courses to the schedule
 * with walking time validation
 */

import { useState, useCallback } from "react";
import { CornellClass, Schedule, ScheduledCourse } from "@full-stack/types";
import { checkWalkingTime, getCoursesForDay } from "../utils/walkingTime";
import { getDayAbbreviation, DayOfTheWeek } from "../utils/calendar-utils";
import { SCHEDULE_CONFIG } from "../config/constants";

export interface WalkingWarning {
    show: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface UseCourseSelectionProps {
    schedule: Schedule | null;
    addCourse: (cornellClass: CornellClass, enrollGroupIndex: number, classSectionIndex: number) => Promise<void>;
}

interface UseCourseSelectionReturn {
    walkingWarning: WalkingWarning | null;
    setWalkingWarning: (warning: WalkingWarning | null) => void;
    handleCourseSelect: (cornellClass: CornellClass) => Promise<void>;
    courseDataCache: Map<string, CornellClass>;
    getCourseData: (course: ScheduledCourse) => CornellClass | null;
}

/**
 * Creates a temporary ScheduledCourse object for walking time validation
 */
function createTempCourse(
    cornellClass: CornellClass,
    enrollGroupIndex: number,
    classSection: CornellClass["enrollGroups"][0]["classSections"][0],
    enrollGroup: CornellClass["enrollGroups"][0]
): ScheduledCourse {
    return {
        id: "temp",
        crseId: cornellClass.crseId.toString(),
        subject: cornellClass.subject,
        catalogNbr: cornellClass.catalogNbr,
        title: cornellClass.titleShort,
        classSection: classSection.section,
        ssrComponent: classSection.ssrComponent,
        classNbr: classSection.classNbr.toString(),
        enrollGroupIndex,
        meetings: classSection.meetings.map((m) => ({
            pattern: m.pattern,
            timeStart: m.timeStart,
            timeEnd: m.timeEnd,
            bldgDescr: m.bldgDescr || "",
            facilityDescr: m.facilityDescr || "",
            instructors: m.instructors,
        })),
        units: enrollGroup.unitsMinimum.toString(),
    };
}

/**
 * Finds adjacent courses for a given day and time
 */
function findAdjacentCourses(
    scheduleCourses: ScheduledCourse[],
    day: string,
    newCourseStart: string
): { previousCourse: ScheduledCourse | null; nextCourse: ScheduledCourse | null } {
    const dayAbbr = getDayAbbreviation(day as DayOfTheWeek);
    const dayCourses = getCoursesForDay(scheduleCourses, day);
    
    const sortedDayCourses = dayCourses.sort((a, b) => {
        const aMeeting = a.meetings.find((m) => m.pattern.includes(dayAbbr));
        const bMeeting = b.meetings.find((m) => m.pattern.includes(dayAbbr));
        if (!aMeeting || !bMeeting) return 0;
        return aMeeting.timeStart.localeCompare(bMeeting.timeStart);
    });

    let previousCourse: ScheduledCourse | null = null;
    let nextCourse: ScheduledCourse | null = null;

    for (const course of sortedDayCourses) {
        const courseMeeting = course.meetings.find((m) => m.pattern.includes(dayAbbr));
        if (!courseMeeting) continue;

        if (courseMeeting.timeEnd <= newCourseStart) {
            previousCourse = course;
        } else if (courseMeeting.timeStart > newCourseStart && !nextCourse) {
            nextCourse = course;
            break;
        }
    }

    return { previousCourse, nextCourse };
}

/**
 * Validates walking time for a new course across all meeting days
 */
async function validateWalkingTimeForCourse(
    schedule: Schedule,
    classSection: CornellClass["enrollGroups"][0]["classSections"][0],
    tempCourse: ScheduledCourse
): Promise<{ hasWarning: boolean; message: string }> {
    const days = SCHEDULE_CONFIG.WEEKDAYS as readonly string[];

    for (const day of days) {
        const dayAbbr = getDayAbbreviation(day as DayOfTheWeek);
        const meeting = classSection.meetings.find((m) => m.pattern.includes(dayAbbr));
        
        if (!meeting) continue;

        const { previousCourse, nextCourse } = findAdjacentCourses(
            schedule.courses,
            day,
            meeting.timeStart
        );

        const check = await checkWalkingTime(previousCourse, tempCourse, nextCourse, day);

        if (check.insufficient) {
            return {
                hasWarning: true,
                message: check.message || "Insufficient walking time",
            };
        }
    }

    return { hasWarning: false, message: "" };
}

/**
 * Hook for managing course selection with walking time validation
 */
export function useCourseSelection({
    schedule,
    addCourse,
}: UseCourseSelectionProps): UseCourseSelectionReturn {
    const [walkingWarning, setWalkingWarning] = useState<WalkingWarning | null>(null);
    const [courseDataCache, setCourseDataCache] = useState<Map<string, CornellClass>>(new Map());

    const getCourseData = useCallback(
        (course: ScheduledCourse): CornellClass | null => {
            return courseDataCache.get(course.crseId.toString()) || null;
        },
        [courseDataCache]
    );

    const handleCourseSelect = useCallback(
        async (cornellClass: CornellClass) => {
            if (!schedule) return;

            // Cache course data for later use
            setCourseDataCache((prev) =>
                new Map(prev).set(cornellClass.crseId.toString(), cornellClass)
            );

            // Default to first enroll group and class section
            const enrollGroupIndex = 0;
            const enrollGroup = cornellClass.enrollGroups[enrollGroupIndex];
            const classSection = enrollGroup.classSections[0];

            if (!classSection) {
                console.error("No class sections found");
                return;
            }

            // Create temporary course for validation
            const tempCourse = createTempCourse(
                cornellClass,
                enrollGroupIndex,
                classSection,
                enrollGroup
            );

            // Validate walking time
            const { hasWarning, message } = await validateWalkingTimeForCourse(
                schedule,
                classSection,
                tempCourse
            );

            if (hasWarning) {
                setWalkingWarning({
                    show: true,
                    message,
                    onConfirm: async () => {
                        try {
                            await addCourse(cornellClass, enrollGroupIndex, 0);
                            setWalkingWarning(null);
                        } catch (error) {
                            console.error("Failed to add course:", error);
                        }
                    },
                    onCancel: () => {
                        setWalkingWarning(null);
                    },
                });
            } else {
                try {
                    await addCourse(cornellClass, enrollGroupIndex, 0);
                } catch (error) {
                    console.error("Failed to add course:", error);
                }
            }
        },
        [schedule, addCourse]
    );

    return {
        walkingWarning,
        setWalkingWarning,
        handleCourseSelect,
        courseDataCache,
        getCourseData,
    };
}

export default useCourseSelection;

