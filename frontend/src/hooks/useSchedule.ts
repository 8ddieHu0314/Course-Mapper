import { useState, useEffect, useCallback } from "react";
import { Schedule, ScheduledCourse, ScheduledCourseSection, CornellClass } from "@full-stack/types";
import API from "../utils/api";
import { useAuth } from "./useAuth";

const ROSTER = "SP26";

export const useSchedule = () => {
    const { idToken } = useAuth();
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSchedule = useCallback(async () => {
        if (!idToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await API.getSchedules(ROSTER, idToken);
            
            if (response.schedules.length > 0) {
                setSchedule(response.schedules[0]);
            } else {
                // Create new schedule
                const newSchedule = await API.createSchedule(ROSTER, [], idToken);
                setSchedule(newSchedule.schedule);
            }
            setError(null);
        } catch (err) {
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

        const updatedCourses = [...schedule.courses, scheduledCourse];
        
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
            const updatedCourses = schedule.courses.map(course => {
                if (course.id === courseId) {
                    const updatedCourse = { 
                        ...course, 
                        selectedSections,
                        // Always use the first section (primary lecture) for course.meetings and course details
                        meetings: selectedSections && selectedSections.length > 0 ? selectedSections[0].meetings : course.meetings,
                        classSection: selectedSections && selectedSections.length > 0 ? selectedSections[0].section : course.classSection,
                        ssrComponent: selectedSections && selectedSections.length > 0 ? selectedSections[0].ssrComponent : course.ssrComponent,
                    };
                    return updatedCourse;
                }
                return course;
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
