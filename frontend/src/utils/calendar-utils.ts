/**
 * Standalone utility functions for building a visual calendar schedule
 * Extracted from course-plan codebase
 */

// ============================================================================
// TYPES
// ============================================================================

export type DayOfTheWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type Time = {
  hours: number;
  minutes: number;
};

export type CourseBlock = {
  code: string;
  name: string;
  color: string;
  timeStart: string; // e.g., "10:00am"
  timeEnd: string;   // e.g., "11:15am"
  daysOfTheWeek: DayOfTheWeek[];
};

export type ClassesSchedule = {
  [day: string]: CourseBlock[];
};

export type MinMaxHour = {
  minHour: number;
  maxHour: number;
};

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Converts 24-hour format (HH:MM) to 12-hour format with AM/PM (e.g., "10:00am")
 */
export function convert24To12Hour(timeStr: string): string {
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minutes = minuteStr || '00';
  
  if (isNaN(hour)) return timeStr;
  
  const period = hour < 12 ? 'am' : 'pm';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes}${period}`;
}

/**
 * Formats raw time string (e.g., "10:00AM" or "10:00") to display format (e.g., "10:00am")
 */
export function formatTime(timeStr: string): string {
  // If it's already in 12-hour format with AM/PM
  const timeParts = timeStr.match(/(\d+):(\d+)(\w{2})/);
  if (timeParts) {
    const hours = parseInt(timeParts[1], 10);
    const minutes = timeParts[2];
    const period = timeParts[3].toLowerCase();
    return `${hours}:${minutes}${period}`;
  }
  
  // If it's in 24-hour format (HH:MM)
  const hourMinuteParts = timeStr.match(/(\d+):(\d+)/);
  if (hourMinuteParts) {
    return convert24To12Hour(timeStr);
  }
  
  return timeStr;
}

/**
 * Parses formatted time string (e.g., "10:00am") into hours and minutes
 */
export function parseTimeString(time: string): Time {
  const parts = time.match(/(\d+):(\d+)(AM|PM)/i);
  if (!parts) {
    throw new Error('Invalid time format');
  }
  let hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);

  const ampm = parts[3];
  if (ampm.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
}

// ============================================================================
// DAY PATTERN PARSING
// ============================================================================

/**
 * Converts a full day name to its abbreviation (e.g., "Monday" -> "M")
 * Used for matching meeting patterns
 */
export function getDayAbbreviation(day: DayOfTheWeek): string {
  const abbrevMap: Record<DayOfTheWeek, string> = {
    Monday: "M",
    Tuesday: "T",
    Wednesday: "W",
    Thursday: "R",
    Friday: "F",
    Saturday: "S",
    Sunday: "Su",
  };
  return abbrevMap[day];
}

/**
 * Converts Cornell-style day pattern (e.g., "MWF", "TR") to array of day names
 * Handles special case: "Su" for Sunday (not just "S")
 */
export function getDaysOfTheWeek(patternStr?: string): DayOfTheWeek[] {
  if (patternStr === undefined || patternStr === '') {
    return [];
  }

  const dayMap: { [key: string]: DayOfTheWeek } = {
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    R: 'Thursday',
    F: 'Friday',
    S: 'Saturday',
    Su: 'Sunday',
  };

  const days: DayOfTheWeek[] = [];

  for (let i = 0; i < patternStr.length; i += 1) {
    if (patternStr[i] === 'S' && i + 1 < patternStr.length && patternStr[i + 1] === 'u') {
      days.push(dayMap.Su);
      i += 1;
    } else if (dayMap[patternStr[i]]) {
      days.push(dayMap[patternStr[i]]);
    }
  }

  return days;
}

// ============================================================================
// CALENDAR CALCULATIONS
// ============================================================================

/**
 * Calculates the minimum and maximum hours needed to display all courses
 */
export function getMinMaxHours(classesSchedule: ClassesSchedule): MinMaxHour {
  let minHour = 23;
  let maxHour = 0;

  Object.values(classesSchedule).forEach(classes => {
    classes.forEach(cls => {
      const startHour = parseTimeString(cls.timeStart).hours;
      const { hours: endHour, minutes: endMinutes } = parseTimeString(cls.timeEnd);
      
      minHour = Math.min(minHour, startHour);
      if (maxHour < endHour + (endMinutes > 0 ? 1 : 0)) {
        maxHour = endHour + (endMinutes > 0 ? 1 : 0);
      }
    });
  });
  
  // Set reasonable defaults if no courses
  minHour = Math.min(minHour, 8);
  maxHour = Math.max(maxHour, 16);
  
  return { minHour, maxHour };
}

/**
 * Generates array of hour labels for calendar display
 */
export function generateHoursRange(minHour: number, maxHour: number): string[] {
  const hoursArray: string[] = [];
  for (let hour = minHour; hour <= maxHour; hour += 1) {
    const suffix = hour < 12 ? 'am' : 'pm';
    const formattedHour = `${hour <= 12 ? hour : hour - 12}${suffix}`;
    hoursArray.push(formattedHour);
  }
  return hoursArray;
}

/**
 * Calculates total minutes between min and max hour
 */
export function getTotalMinutes(minHour: number, maxHour: number): number {
  return (maxHour - minHour) * 60;
}

/**
 * Calculates pixel position for a given time
 */
export function getPixels(
  time: string,
  minHour: number,
  totalMinutes: number,
  availablePixels: number,
  headerOffset: number = 50
): number {
  const { hours, minutes } = parseTimeString(time);
  return (
    Math.round(
      (((hours - minHour) * 60 + minutes) / totalMinutes) * availablePixels
    ) + headerOffset
  );
}

/**
 * Calculates CSS style for a course block (position and height)
 */
export function getBlockStyle(
  color: string,
  timeStart: string,
  timeEnd: string,
  minHour: number,
  totalMinutes: number,
  availablePixels: number,
  headerOffset: number = 50
): { borderColor: string; top: string; height: string } {
  const startPixels = getPixels(timeStart, minHour, totalMinutes, availablePixels, headerOffset);
  const endPixels = getPixels(timeEnd, minHour, totalMinutes, availablePixels, headerOffset);
  
  return {
    borderColor: color,
    top: `${startPixels}px`,
    height: `${endPixels - startPixels}px`,
  };
}

// ============================================================================
// DATA ORGANIZATION
// ============================================================================

/**
 * Organizes courses by day of the week
 * Takes courses with timeslots and creates a day-indexed schedule
 */
export function organizeCoursesByDay(
  courses: Array<{
    code: string;
    name: string;
    color: string;
    timeStart: string;
    timeEnd: string;
    daysOfTheWeek: DayOfTheWeek[];
  }>
): ClassesSchedule {
  const schedule: ClassesSchedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  courses.forEach(course => {
    course.daysOfTheWeek.forEach(day => {
      schedule[day].push({
        code: course.code,
        name: course.name,
        color: course.color,
        timeStart: course.timeStart,
        timeEnd: course.timeEnd,
        daysOfTheWeek: [day],
      });
    });
  });

  return schedule;
}

