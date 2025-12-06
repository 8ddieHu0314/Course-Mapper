import { ScheduledCourse } from "@full-stack/types";
import { CourseBlock, DayOfTheWeek, formatTime, getDaysOfTheWeek, getDayAbbreviation } from "./calendar-utils";

/**
 * Color palette for courses - distinct, visually appealing colors
 * Each course gets a unique color from this palette (loops if more courses than colors)
 */
export const COURSE_COLOR_PALETTE = [
  "#4285F4", // Blue
  "#EA4335", // Red
  "#34A853", // Green
  "#FBBC04", // Yellow
  "#9C27B0", // Purple
  "#00BCD4", // Cyan
  "#FF5722", // Deep Orange
  "#607D8B", // Blue Grey
  "#E91E63", // Pink
  "#009688", // Teal
  "#795548", // Brown
  "#3F51B5", // Indigo
];

/**
 * Light background versions of the palette (for timetable blocks)
 */
export const COURSE_COLOR_PALETTE_LIGHT = [
  "#e3f2fd", // Blue light
  "#ffebee", // Red light
  "#e8f5e9", // Green light
  "#fff8e1", // Yellow light
  "#f3e5f5", // Purple light
  "#e0f7fa", // Cyan light
  "#fbe9e7", // Deep Orange light
  "#eceff1", // Blue Grey light
  "#fce4ec", // Pink light
  "#e0f2f1", // Teal light
  "#efebe9", // Brown light
  "#e8eaf6", // Indigo light
];

/**
 * Creates a color map for a list of courses
 * Each unique course code gets assigned a color from the palette
 */
export function createCourseColorMap(courses: ScheduledCourse[]): Map<string, number> {
  const colorMap = new Map<string, number>();
  const seenCourses = new Set<string>();
  let colorIndex = 0;

  courses.forEach((course) => {
    const courseCode = `${course.subject} ${course.catalogNbr}`;
    if (!seenCourses.has(courseCode)) {
      seenCourses.add(courseCode);
      colorMap.set(courseCode, colorIndex);
      colorIndex = (colorIndex + 1) % COURSE_COLOR_PALETTE.length;
    }
  });

  return colorMap;
}

/**
 * Gets the marker color for a course (darker, saturated color for map markers)
 */
export function getCourseMarkerColor(courseCode: string, colorMap: Map<string, number>): string {
  const colorIndex = colorMap.get(courseCode) ?? 0;
  return COURSE_COLOR_PALETTE[colorIndex % COURSE_COLOR_PALETTE.length];
}

/**
 * Gets the background color for a course (lighter color for timetable blocks)
 */
export function getCourseBackgroundColor(courseCode: string, colorMap: Map<string, number>): string {
  const colorIndex = colorMap.get(courseCode) ?? 0;
  return COURSE_COLOR_PALETTE_LIGHT[colorIndex % COURSE_COLOR_PALETTE_LIGHT.length];
}

/**
 * Transforms ScheduledCourse[] to CourseBlock[] format for calendar display
 * Handles both regular meetings and selectedSections
 * Uses unified color system - each course gets a unique color
 */
export function transformScheduledCoursesToCourseBlocks(
  courses: ScheduledCourse[]
): CourseBlock[] {
  const courseBlocks: CourseBlock[] = [];
  
  // Create color map for consistent colors across all courses
  const colorMap = createCourseColorMap(courses);

  courses.forEach((course) => {
    const courseCode = `${course.subject} ${course.catalogNbr}`;
    const courseName = course.title || courseCode;
    // Use unified colors based on course code
    const backgroundColor = getCourseBackgroundColor(courseCode, colorMap);
    const borderColor = getCourseMarkerColor(courseCode, colorMap);

    // Handle courses with selectedSections (multi-section mode)
    if (course.selectedSections && course.selectedSections.length > 0) {
      course.selectedSections.forEach((section) => {
        section.meetings.forEach((meeting) => {
          const days = getDaysOfTheWeek(meeting.pattern) as DayOfTheWeek[];
          if (days.length === 0) return;

          const timeStart = formatTime(meeting.timeStart);
          const timeEnd = formatTime(meeting.timeEnd);

          // Create a block for each day the meeting occurs
          days.forEach((day) => {
            courseBlocks.push({
              code: courseCode,
              name: courseName,
              color: backgroundColor,
              borderColor,
              timeStart,
              timeEnd,
              daysOfTheWeek: [day],
              ssrComponent: section.ssrComponent,
            });
          });
        });
      });
    } else {
      // Handle courses with regular meetings
      course.meetings.forEach((meeting) => {
        const days = getDaysOfTheWeek(meeting.pattern) as DayOfTheWeek[];
        if (days.length === 0) return;

        const timeStart = formatTime(meeting.timeStart);
        const timeEnd = formatTime(meeting.timeEnd);

        // Create a block for each day the meeting occurs
        days.forEach((day) => {
          courseBlocks.push({
            code: courseCode,
            name: courseName,
            color: backgroundColor,
            borderColor,
            timeStart,
            timeEnd,
            daysOfTheWeek: [day],
            ssrComponent: course.ssrComponent,
          });
        });
      });
    }
  });

  return courseBlocks;
}

/**
 * Gets course metadata for a specific course block
 * Useful for maintaining reference to the original ScheduledCourse
 */
export function getCourseMetadata(
  courses: ScheduledCourse[],
  courseCode: string,
  day: DayOfTheWeek,
  timeStart: string
): ScheduledCourse | null {
  return (
    courses.find((course) => {
      const code = `${course.subject} ${course.catalogNbr}`;
      if (code !== courseCode) return false;

      // Check if course has a meeting matching the day and time
      const dayAbbr = getDayAbbreviation(day);

      if (course.selectedSections && course.selectedSections.length > 0) {
        return course.selectedSections.some((section) =>
          section.meetings.some(
            (m) =>
              m.pattern.includes(dayAbbr) &&
              formatTime(m.timeStart) === timeStart
          )
        );
      } else {
        return course.meetings.some(
          (m) =>
            m.pattern.includes(dayAbbr) &&
            formatTime(m.timeStart) === timeStart
        );
      }
    }) || null
  );
}

