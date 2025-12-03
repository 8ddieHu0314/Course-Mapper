import { ScheduledCourse } from "@full-stack/types";
import { CourseBlock, DayOfTheWeek, formatTime, getDaysOfTheWeek, getDayAbbreviation } from "./calendar-utils";

/**
 * Gets a color for a course based on subject and component type
 */
export function getCourseColor(subject: string, component: string): string {
  // Different colors for different component types
  const componentColorMap: Record<string, string> = {
    "LEC": "#e3f2fd",
    "DIS": "#f3e5f5", 
    "REC": "#e8f5e9",
    "LAB": "#fff3e0",
    "PRJ": "#fce4ec",
  };
  
  const componentKey = component.split(" ")[0] || "LEC";
  if (componentColorMap[componentKey]) {
    return componentColorMap[componentKey];
  }
  
  // Simple hash function for consistent colors
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 85%)`;
}

/**
 * Transforms ScheduledCourse[] to CourseBlock[] format for calendar display
 * Handles both regular meetings and selectedSections
 */
export function transformScheduledCoursesToCourseBlocks(
  courses: ScheduledCourse[]
): CourseBlock[] {
  const courseBlocks: CourseBlock[] = [];

  courses.forEach((course) => {
    const courseCode = `${course.subject} ${course.catalogNbr}`;
    const courseName = course.title || courseCode;

    // Handle courses with selectedSections (multi-section mode)
    if (course.selectedSections && course.selectedSections.length > 0) {
      course.selectedSections.forEach((section) => {
        section.meetings.forEach((meeting) => {
          const days = getDaysOfTheWeek(meeting.pattern) as DayOfTheWeek[];
          if (days.length === 0) return;

          const timeStart = formatTime(meeting.timeStart);
          const timeEnd = formatTime(meeting.timeEnd);
          const color = getCourseColor(course.subject, section.ssrComponent);

          // Create a block for each day the meeting occurs
          days.forEach((day) => {
            courseBlocks.push({
              code: courseCode,
              name: courseName,
              color,
              timeStart,
              timeEnd,
              daysOfTheWeek: [day],
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
        const color = getCourseColor(course.subject, course.ssrComponent);

        // Create a block for each day the meeting occurs
        days.forEach((day) => {
          courseBlocks.push({
            code: courseCode,
            name: courseName,
            color,
            timeStart,
            timeEnd,
            daysOfTheWeek: [day],
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

