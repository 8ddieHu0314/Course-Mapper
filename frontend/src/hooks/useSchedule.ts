import { useState, useEffect, useCallback, useRef } from "react";
import { Schedule, ScheduledCourse, ScheduledCourseSection, CornellClass } from "@full-stack/types";
import API from "../utils/api";
import { useAuth } from "./useAuth";
import { geocodeCourseMeetings, geocodeScheduleCourses } from "../utils/geocoding";

const ROSTER = "SP26";

export const useSchedule = () => {
    const { idToken } = useAuth();
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const geocodingInProgress = useRef(false);

    const loadSchedule = useCallback(async () => {
        if (!idToken) {
            setLoading(false);
            return;
        }

        if (geocodingInProgress.current) return;

        try {
            setLoading(true);
            const response = await API.getSchedules(ROSTER, idToken);
            
            if (response.schedules.length > 0) {
                const loadedSchedule = response.schedules[0];
                // Geocode courses that don't have coordinates yet
                geocodingInProgress.current = true;
                const geocodedCourses = await geocodeScheduleCourses(loadedSchedule.courses);
                geocodingInProgress.current = false;
                setSchedule({ ...loadedSchedule, courses: geocodedCourses });
            } else {
                // Create new schedule
                const newSchedule = await API.createSchedule(ROSTER, [], idToken);
                setSchedule(newSchedule.schedule);
            }
            setError(null);
        } catch (err) {
            geocodingInProgress.current = false;
            setError(err instanceof Error ? err.message : "Failed to load schedule");
            console.error("Load schedule error:", err);
        } finally {
            setLoading(false);
        }
    }, [idToken]);

    useEffect(() => {
        loadSchedule();
    }, [loadSchedule]);

    const addCourse = useCallback(async (cornellClass: CornellClass, enrollGroupIndex: number, classSectionIndex: number = 0) => {
        if (!schedule || !idToken) return;

        const enrollGroup = cornellClass.enrollGroups[enrollGroupIndex];
        const classSection = enrollGroup.classSections[classSectionIndex];
        if (!classSection) {
            throw new Error("Class section not found");
        }

        const courseId = `${cornellClass.crseId}-${Date.now()}`;

        // Initialize selectedSections with the primary lecture section
        const primarySection: ScheduledCourseSection = {
            enrollGroupIndex,
            classSectionIndex,
            section: classSection.section,
            ssrComponent: classSection.ssrComponent,
            meetings: classSection.meetings.map(meeting => ({
                pattern: meeting.pattern,
                timeStart: meeting.timeStart,
                timeEnd: meeting.timeEnd,
                bldgDescr: meeting.bldgDescr || "",
                facilityDescr: meeting.facilityDescr || "",
                instructors: meeting.instructors,
            })),
        };

        const scheduledCourse: ScheduledCourse = {
            id: courseId,
            crseId: cornellClass.crseId.toString(),
            subject: cornellClass.subject,
            catalogNbr: cornellClass.catalogNbr,
            title: cornellClass.titleShort,
            classSection: classSection.section,
            ssrComponent: classSection.ssrComponent,
            classNbr: classSection.classNbr.toString(),
            enrollGroupIndex,
            meetings: classSection.meetings.map(meeting => ({
                pattern: meeting.pattern,
                timeStart: meeting.timeStart,
                timeEnd: meeting.timeEnd,
                bldgDescr: meeting.bldgDescr || "",
                facilityDescr: meeting.facilityDescr || "",
                instructors: meeting.instructors,
            })),
            units: enrollGroup.unitsMinimum.toString(),
            selectedSections: [primarySection],
        };

        // Geocode the new course's meetings
        const geocodedCourse = await geocodeCourseMeetings(scheduledCourse);

        const updatedCourses = [...schedule.courses, geocodedCourse];
        
        try {
            const updated = await API.createSchedule(ROSTER, updatedCourses, idToken);
            setSchedule(updated.schedule);
        } catch (err) {
            console.error("Add course error:", err);
            throw err;
        }
    }, [schedule, idToken]);

    const updateCourseSection = useCallback(async (
        courseId: string,
        enrollGroupIndex: number,
        newMeetings: ScheduledCourse["meetings"]
    ) => {
        if (!schedule || !idToken) return;

        try {
            const updated = await API.updateCourse(
                schedule.id,
                courseId,
                { enrollGroupIndex, meetings: newMeetings }
            );
            setSchedule(updated.schedule);
        } catch (err) {
            console.error("Update course error:", err);
            throw err;
        }
    }, [schedule, idToken]);

    const removeCourse = useCallback(async (courseId: string) => {
        if (!schedule || !idToken) return;

        try {
            const updated = await API.deleteCourse(schedule.id, courseId);
            setSchedule(updated.schedule);
        } catch (err) {
            console.error("Remove course error:", err);
            throw err;
        }
    }, [schedule, idToken]);

    const updateSelectedSections = useCallback(async (
        courseId: string,
        selectedSections: ScheduledCourse["selectedSections"]
    ) => {
        if (!schedule || !idToken) return;

        try {
            // Geocode the sections as a temporary course object
            const tempCourse: ScheduledCourse = {
                ...schedule.courses.find(c => c.id === courseId)!,
                selectedSections,
                meetings: selectedSections?.[0]?.meetings || [],
            };
            const geocodedTemp = await geocodeCourseMeetings(tempCourse);
            const geocodedSections = geocodedTemp.selectedSections;

            const updatedCourses = schedule.courses.map(c => {
                if (c.id === courseId) {
                    const updatedCourse = { 
                        ...c, 
                        selectedSections: geocodedSections,
                        // Always use the first section (primary lecture) for course.meetings and course details
                        meetings: geocodedSections && geocodedSections.length > 0 ? geocodedSections[0].meetings : c.meetings,
                        classSection: geocodedSections && geocodedSections.length > 0 ? geocodedSections[0].section : c.classSection,
                        ssrComponent: geocodedSections && geocodedSections.length > 0 ? geocodedSections[0].ssrComponent : c.ssrComponent,
                    };
                    return updatedCourse;
                }
                return c;
            });
            
            const updated = await API.createSchedule(ROSTER, updatedCourses, idToken);
            setSchedule(updated.schedule);
        } catch (err) {
            console.error("Update selected sections error:", err);
            throw err;
        }
    }, [schedule, idToken]);

    return {
        schedule,
        loading,
        error,
        addCourse,
        updateCourseSection,
        updateSelectedSections,
        removeCourse,
        refreshSchedule: loadSchedule,
    };
};
