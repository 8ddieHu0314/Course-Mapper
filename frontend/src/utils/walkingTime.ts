import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import { api } from "./api";

export type TimeSlot = {
    hour: number;
    minute: number;
};

export const parseTime = (timeStr: string): TimeSlot => {
    const [hour, minute] = timeStr.split(":").map(Number);
    return { hour, minute };
};

export const timeToMinutes = (time: TimeSlot): number => {
    return time.hour * 60 + time.minute;
};

export const minutesToTime = (minutes: number): TimeSlot => {
    return {
        hour: Math.floor(minutes / 60),
        minute: minutes % 60,
    };
};

export const getDayAbbreviation = (day: string): string => {
    const dayMap: Record<string, string> = {
        Monday: "M",
        Tuesday: "T",
        Wednesday: "W",
        Thursday: "R",
        Friday: "F",
    };
    return dayMap[day] || day;
};

export const getCoursesForDay = (courses: ScheduledCourse[], day: string): ScheduledCourse[] => {
    const dayAbbr = getDayAbbreviation(day);
    return courses.filter(course =>
        course.meetings.some(meeting => meeting.pattern.includes(dayAbbr))
    );
};

export const getMeetingsForDay = (course: ScheduledCourse, day: string): ScheduledMeeting[] => {
    const dayAbbr = getDayAbbreviation(day);
    return course.meetings.filter(meeting => meeting.pattern.includes(dayAbbr));
};

export const checkWalkingTime = async (
    previousCourse: ScheduledCourse | null,
    currentCourse: ScheduledCourse,
    nextCourse: ScheduledCourse | null,
    day: string
): Promise<{ insufficient: boolean; message?: string }> => {
    const dayAbbr = getDayAbbreviation(day);
    
    // Get meetings for this day
    const currentMeetings = currentCourse.meetings.filter(m => m.pattern.includes(dayAbbr));
    if (currentMeetings.length === 0) return { insufficient: false };

    const currentMeeting = currentMeetings[0];
    const currentEnd = parseTime(currentMeeting.timeEnd);
    const currentEndMinutes = timeToMinutes(currentEnd);

    // Check time before next class
    if (nextCourse) {
        const nextMeetings = nextCourse.meetings.filter(m => m.pattern.includes(dayAbbr));
        if (nextMeetings.length > 0) {
            const nextStart = parseTime(nextMeetings[0].timeStart);
            const nextStartMinutes = timeToMinutes(nextStart);
            const timeBetween = nextStartMinutes - currentEndMinutes;

            if (timeBetween > 0) {
                // Get coordinates if not already cached
                if (!currentMeeting.coordinates) {
                    try {
                        const geocode = await api.geocode(
                            `${currentMeeting.bldgDescr}, Ithaca, NY`
                        );
                        currentMeeting.coordinates = { lat: geocode.lat, lng: geocode.lng };
                    } catch (err) {
                        console.error("Geocoding error:", err);
                        return { insufficient: false }; // Can't verify, allow it
                    }
                }

                if (!nextMeetings[0].coordinates) {
                    try {
                        const geocode = await api.geocode(
                            `${nextMeetings[0].bldgDescr}, Ithaca, NY`
                        );
                        nextMeetings[0].coordinates = { lat: geocode.lat, lng: geocode.lng };
                    } catch (err) {
                        console.error("Geocoding error:", err);
                        return { insufficient: false };
                    }
                }

                // Calculate walking time
                try {
                    const directions = await api.getDirections(
                        currentMeeting.coordinates!,
                        nextMeetings[0].coordinates!
                    );

                    const walkingMinutes = Math.ceil(directions.duration / 60);

                    if (walkingMinutes > timeBetween) {
                        return {
                            insufficient: true,
                            message: `Insufficient time between ${currentCourse.subject} ${currentCourse.catalogNbr} and ${nextCourse.subject} ${nextCourse.catalogNbr}. Walking time: ${walkingMinutes} minutes, available time: ${timeBetween} minutes.`,
                        };
                    }
                } catch (err) {
                    console.error("Directions error:", err);
                    // If we can't calculate, allow it but warn
                    return { insufficient: false };
                }
            }
        }
    }

    // Check time after previous class
    if (previousCourse) {
        const prevMeetings = previousCourse.meetings.filter(m => m.pattern.includes(dayAbbr));
        if (prevMeetings.length > 0) {
            const prevEnd = parseTime(prevMeetings[0].timeEnd);
            const prevEndMinutes = timeToMinutes(prevEnd);
            const currentStart = parseTime(currentMeeting.timeStart);
            const currentStartMinutes = timeToMinutes(currentStart);
            const timeBetween = currentStartMinutes - prevEndMinutes;

            if (timeBetween > 0) {
                // Similar check as above
                if (!prevMeetings[0].coordinates) {
                    try {
                        const geocode = await api.geocode(
                            `${prevMeetings[0].bldgDescr}, Ithaca, NY`
                        );
                        prevMeetings[0].coordinates = { lat: geocode.lat, lng: geocode.lng };
                    } catch (err) {
                        return { insufficient: false };
                    }
                }

                if (!currentMeeting.coordinates) {
                    try {
                        const geocode = await api.geocode(
                            `${currentMeeting.bldgDescr}, Ithaca, NY`
                        );
                        currentMeeting.coordinates = { lat: geocode.lat, lng: geocode.lng };
                    } catch (err) {
                        return { insufficient: false };
                    }
                }

                try {
                    const directions = await api.getDirections(
                        prevMeetings[0].coordinates!,
                        currentMeeting.coordinates!
                    );

                    const walkingMinutes = Math.ceil(directions.duration / 60);

                    if (walkingMinutes > timeBetween) {
                        return {
                            insufficient: true,
                            message: `Insufficient time between ${previousCourse.subject} ${previousCourse.catalogNbr} and ${currentCourse.subject} ${currentCourse.catalogNbr}. Walking time: ${walkingMinutes} minutes, available time: ${timeBetween} minutes.`,
                        };
                    }
                } catch (err) {
                    console.error("Directions error:", err);
                    return { insufficient: false };
                }
            }
        }
    }

    return { insufficient: false };
};

