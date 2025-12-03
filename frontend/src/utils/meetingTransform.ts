import { Meeting, ScheduledMeeting, ClassSection, ScheduledCourseSection } from "@full-stack/types";

/**
 * Transforms a Cornell API Meeting to a ScheduledMeeting
 * Normalizes undefined values to empty strings for consistent handling
 */
export function toScheduledMeeting(meeting: Meeting): ScheduledMeeting {
    return {
        pattern: meeting.pattern,
        timeStart: meeting.timeStart,
        timeEnd: meeting.timeEnd,
        bldgDescr: meeting.bldgDescr || "",
        facilityDescr: meeting.facilityDescr || "",
        instructors: meeting.instructors,
    };
}

/**
 * Transforms an array of Cornell API Meetings to ScheduledMeetings
 */
export function toScheduledMeetings(meetings: Meeting[]): ScheduledMeeting[] {
    return meetings.map(toScheduledMeeting);
}

/**
 * Transforms a Cornell API ClassSection to a ScheduledCourseSection
 */
export function toScheduledSection(
    classSection: ClassSection,
    enrollGroupIndex: number,
    classSectionIndex: number
): ScheduledCourseSection {
    return {
        enrollGroupIndex,
        classSectionIndex,
        section: classSection.section,
        ssrComponent: classSection.ssrComponent,
        classNbr: classSection.classNbr.toString(),
        meetings: toScheduledMeetings(classSection.meetings),
    };
}

