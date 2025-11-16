import { useState, useEffect, useCallback } from "react";
import { Schedule, ScheduledCourse, CornellClass, EnrollGroup } from "@full-stack/types";
import { api } from "../utils/api";
import { useAuth } from "./useAuth";

const ROSTER = "FA25";

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
            const response = await api.getSchedules(ROSTER, idToken);
            
            if (response.schedules.length > 0) {
                setSchedule(response.schedules[0]);
            } else {
                // Create new schedule
                const newSchedule = await api.createSchedule(ROSTER, [], idToken);
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

    const addCourse = useCallback(async (cornellClass: CornellClass, enrollGroupIndex: number) => {
        if (!schedule || !idToken) return;

        const enrollGroup = cornellClass.enrollGroups[enrollGroupIndex];
        const courseId = `${cornellClass.crseId}-${Date.now()}`;

        const scheduledCourse: ScheduledCourse = {
            id: courseId,
            crseId: cornellClass.crseId,
            subject: cornellClass.subject,
            catalogNbr: cornellClass.catalogNbr,
            title: cornellClass.title,
            classSection: enrollGroup.classSection,
            ssrComponent: enrollGroup.ssrComponent,
            classNbr: cornellClass.classNbr,
            enrollGroupIndex,
            meetings: enrollGroup.meetings.map(meeting => ({
                pattern: meeting.pattern,
                timeStart: meeting.timeStart,
                timeEnd: meeting.timeEnd,
                bldgDescr: meeting.bldgDescr,
                facilityDescr: meeting.facilityDescr,
                instructors: meeting.instructors,
            })),
            units: enrollGroup.units,
        };

        const updatedCourses = [...schedule.courses, scheduledCourse];
        
        try {
            const updated = await api.createSchedule(ROSTER, updatedCourses, idToken);
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
            const updated = await api.updateCourse(
                schedule.id,
                courseId,
                { enrollGroupIndex, meetings: newMeetings },
                idToken
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
            const updated = await api.deleteCourse(schedule.id, courseId, idToken);
            setSchedule(updated.schedule);
        } catch (err) {
            console.error("Remove course error:", err);
            throw err;
        }
    }, [schedule, idToken]);

    return {
        schedule,
        loading,
        error,
        addCourse,
        updateCourseSection,
        removeCourse,
        refreshSchedule: loadSchedule,
    };
};

