import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import API from "./api";

// Cache for geocoded addresses to avoid duplicate API calls
const geocodeCache = new Map<string, { lat: number; lng: number }>();

/**
 * Geocode a single meeting's location using the building data from Cornell API
 * Returns the meeting with coordinates if geocoding succeeds, otherwise returns as-is
 */
export const geocodeMeeting = async (meeting: ScheduledMeeting): Promise<ScheduledMeeting> => {
    // If already has coordinates, return as-is
    if (meeting.coordinates) {
        return meeting;
    }
    
    // Get building name from Cornell API data
    const buildingName = meeting.bldgDescr || meeting.facilityDescr;
    
    // If no building name available, return as-is (no pin will show)
    if (!buildingName || buildingName.trim() === "") {
        return meeting;
    }
    
    // Check cache first
    if (geocodeCache.has(buildingName)) {
        return { ...meeting, coordinates: geocodeCache.get(buildingName) };
    }

    try {
        const result = await API.geocode(buildingName);
        const coordinates = { lat: result.lat, lng: result.lng };
        geocodeCache.set(buildingName, coordinates);
        return { ...meeting, coordinates };
    } catch (err) {
        console.warn(`[Geocode] Failed to geocode "${buildingName}":`, err);
        return meeting;
    }
};

/**
 * Geocode all meetings in a course
 */
export const geocodeCourseMeetings = async (course: ScheduledCourse): Promise<ScheduledCourse> => {
    const geocodedMeetings = await Promise.all(
        course.meetings.map(meeting => geocodeMeeting(meeting))
    );

    let geocodedSelectedSections = course.selectedSections;
    if (course.selectedSections && course.selectedSections.length > 0) {
        geocodedSelectedSections = await Promise.all(
            course.selectedSections.map(async (section) => ({
                ...section,
                meetings: await Promise.all(
                    section.meetings.map(meeting => geocodeMeeting(meeting))
                ),
            }))
        );
    }

    return {
        ...course,
        meetings: geocodedMeetings,
        selectedSections: geocodedSelectedSections,
    };
};

/**
 * Geocode all courses in a schedule
 */
export const geocodeScheduleCourses = async (courses: ScheduledCourse[]): Promise<ScheduledCourse[]> => {
    const geocodedCourses = await Promise.all(
        courses.map(course => geocodeCourseMeetings(course))
    );
    return geocodedCourses;
};

/**
 * Clear the geocode cache (useful for testing)
 */
export const clearGeocodeCache = (): void => {
    geocodeCache.clear();
};
