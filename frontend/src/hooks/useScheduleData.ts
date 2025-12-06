/**
 * @hook useScheduleData
 * @description Transforms raw course data into calendar-ready display format.
 *
 * @purpose
 * - Convert ScheduledCourse[] to CourseBlock[] for calendar rendering
 * - Organize courses by day of the week
 * - Calculate time bounds (min/max hours) for the timetable
 * - Generate hour labels for the calendar grid
 *
 * @returns {ScheduleData}
 * - schedule: ClassesSchedule - Courses organized by day (Monday-Sunday)
 * - minHour: number - Earliest hour with a class (for grid start)
 * - maxHour: number - Latest hour with a class (for grid end)
 * - totalMinutes: number - Total minutes in the display range
 * - hours: string[] - Hour labels for the time axis
 *
 * @performance
 * - Memoized to prevent recalculation on every render
 * - Only recalculates when courses array changes
 *
 * @example
 * const { schedule, minHour, hours } = useScheduleData(courses);
 *
 * // Render timetable
 * {WEEKDAYS.map(day => (
 *   <DayColumn key={day} courses={schedule[day]} />
 * ))}
 *
 * @hook useCoursesForDay
 * @description Gets courses for a specific day with their original metadata.
 *
 * @purpose
 * - Extract courses for a single day from the schedule
 * - Attach original ScheduledCourse metadata to each block
 * - Enable course interactions (click to view details, etc.)
 *
 * @returns {Array<{ block: CourseBlock, metadata: ScheduledCourse | null }>}
 */

import { useMemo } from "react";
import { ScheduledCourse } from "@full-stack/types";
import {
    ClassesSchedule,
    organizeCoursesByDay,
    getMinMaxHours,
    generateHoursRange,
    getTotalMinutes,
    DayOfTheWeek,
} from "../utils/calendar-utils";
import {
    transformScheduledCoursesToCourseBlocks,
    getCourseMetadata,
} from "../utils/scheduleTransform";

export interface ScheduleData {
    schedule: ClassesSchedule;
    minHour: number;
    maxHour: number;
    totalMinutes: number;
    hours: string[];
}

const EMPTY_SCHEDULE: ClassesSchedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
};

const DEFAULT_SCHEDULE_DATA: ScheduleData = {
    schedule: EMPTY_SCHEDULE,
    minHour: 8,
    maxHour: 16,
    totalMinutes: 480,
    hours: generateHoursRange(8, 16),
};

/**
 * Hook to transform ScheduledCourse[] into calendar display format
 * Consolidates duplicate schedule transformation logic from Timetable and MapView
 */
export function useScheduleData(courses: ScheduledCourse[]): ScheduleData {
    return useMemo(() => {
        if (courses.length === 0) {
            return DEFAULT_SCHEDULE_DATA;
        }

        const courseBlocks = transformScheduledCoursesToCourseBlocks(courses);
        const schedule = organizeCoursesByDay(courseBlocks);
        const { minHour, maxHour } = getMinMaxHours(schedule);
        const totalMinutes = getTotalMinutes(minHour, maxHour);
        const hours = generateHoursRange(minHour, maxHour);

        return {
            schedule,
            minHour,
            maxHour,
            totalMinutes,
            hours,
        };
    }, [courses]);
}

/**
 * Hook to get courses for a specific day with their metadata
 */
export function useCoursesForDay(
    courses: ScheduledCourse[],
    scheduleData: ScheduleData,
    day: DayOfTheWeek
) {
    return useMemo(() => {
        const dayCourses = scheduleData.schedule[day] || [];
        return dayCourses.map((block) => {
            const metadata = getCourseMetadata(
                courses,
                block.code,
                day,
                block.timeStart
            );
            return { block, metadata };
        });
    }, [courses, scheduleData, day]);
}

