import { ScheduledCourse, ScheduledMeeting, ScheduledCourseSection } from "@full-stack/types";
import API from "./api";
import classLocationData from "../assets/class_location.json";

// Type for class location data
interface ClassLocationEntry {
    "class-number": string;
    "display-location": string;
    "class-location": string;
}

// Type the imported JSON data
const classLocations: Record<string, ClassLocationEntry> = classLocationData;

// Cache for geocoded addresses to avoid duplicate API calls
const geocodeCache = new Map<string, { lat: number; lng: number }>();

/**
 * Look up location data by class number from the pre-fetched class_location.json
 */
export const getLocationByClassNbr = (classNbr: string): { classLocation: string; displayLocation: string } | null => {
    const entry = classLocations[classNbr];
    if (!entry) {
        return null;
    }
    return {
        classLocation: entry["class-location"],
        displayLocation: entry["display-location"],
    };
};

/**
 * Geocode a single meeting's location using the class number to look up location data
 * Returns the meeting with coordinates and displayLocation if lookup/geocoding succeeds
 */
export const geocodeMeeting = async (
    meeting: ScheduledMeeting,
    classNbr?: string
): Promise<ScheduledMeeting> => {
    // If already has coordinates and displayLocation, return as-is
    if (meeting.coordinates && meeting.displayLocation) {
        return meeting;
    }

    let locationToGeocode: string | null = null;
    let displayLocation: string | undefined = meeting.displayLocation;

    // Try to look up location by class number first
    if (classNbr) {
        const locationData = getLocationByClassNbr(classNbr);
        if (locationData) {
            locationToGeocode = locationData.classLocation;
            displayLocation = locationData.displayLocation;
        }
    }

    // Fall back to building name from Cornell API if no class location found
    if (!locationToGeocode) {
        locationToGeocode = meeting.bldgDescr || meeting.facilityDescr || null;
    }

    // If no location available, return with displayLocation if we have it
    if (!locationToGeocode || locationToGeocode.trim() === "") {
        return { ...meeting, displayLocation };
    }

    // If already has coordinates, just add displayLocation
    if (meeting.coordinates) {
        return { ...meeting, displayLocation };
    }

    // Check cache first
    if (geocodeCache.has(locationToGeocode)) {
        return { 
            ...meeting, 
            coordinates: geocodeCache.get(locationToGeocode),
            displayLocation,
        };
    }

    try {
        const result = await API.geocode(locationToGeocode);
        const coordinates = { lat: result.lat, lng: result.lng };
        geocodeCache.set(locationToGeocode, coordinates);
        return { ...meeting, coordinates, displayLocation };
    } catch (err) {
        console.warn(`[Geocode] Failed to geocode "${locationToGeocode}":`, err);
        return { ...meeting, displayLocation };
    }
};

/**
 * Geocode all meetings in a section using the section's classNbr
 */
export const geocodeSectionMeetings = async (
    section: ScheduledCourseSection
): Promise<ScheduledCourseSection> => {
    const geocodedMeetings = await Promise.all(
        section.meetings.map(meeting => geocodeMeeting(meeting, section.classNbr))
    );
    return {
        ...section,
        meetings: geocodedMeetings,
    };
};

/**
 * Geocode all meetings in a course using the course's classNbr
 */
export const geocodeCourseMeetings = async (course: ScheduledCourse): Promise<ScheduledCourse> => {
    // Geocode main meetings using the course's classNbr
    const geocodedMeetings = await Promise.all(
        course.meetings.map(meeting => geocodeMeeting(meeting, course.classNbr))
    );

    // Geocode selected sections using each section's own classNbr
    let geocodedSelectedSections = course.selectedSections;
    if (course.selectedSections && course.selectedSections.length > 0) {
        geocodedSelectedSections = await Promise.all(
            course.selectedSections.map(section => geocodeSectionMeetings(section))
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
