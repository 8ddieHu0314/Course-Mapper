/**
 * Schedules Controller
 * Handles CRUD operations for user schedules
 */

import { Response } from "express";
import { Schedule, ApiError } from "@full-stack/types";
import { db } from "../firebase";
import { AuthenticatedRequest } from "../types/auth";

export const schedulesController = {
    /**
     * Get all schedules for the authenticated user
     */
    async getSchedules(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId!;
            const { roster } = req.query as { roster: string };
            
            const schedulesSnapshot = await db!
                .collection("schedules")
                .where("userId", "==", userId)
                .where("roster", "==", roster)
                .get();
            
            const schedules = schedulesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Schedule[];
            
            res.json({ schedules });
        } catch (error) {
            console.error("Get schedules error:", error);
            res.status(500).json({ error: "Failed to get schedules" } as ApiError);
        }
    },

    /**
     * Create or update a schedule
     */
    async createOrUpdateSchedule(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId!;
            const { roster, courses } = req.body;
            
            // Check if schedule already exists for this user + roster
            const existingSchedules = await db!
                .collection("schedules")
                .where("userId", "==", userId)
                .where("roster", "==", roster)
                .limit(1)
                .get();
            
            if (!existingSchedules.empty) {
                // Update existing schedule
                const existingDoc = existingSchedules.docs[0];
                await existingDoc.ref.update({
                    courses,
                    updatedAt: new Date().toISOString(),
                });
                
                const schedule: Schedule = {
                    id: existingDoc.id,
                    userId,
                    roster,
                    courses,
                    createdAt: existingDoc.data().createdAt,
                    updatedAt: new Date().toISOString(),
                };
                
                res.json({ schedule });
            } else {
                // Create new schedule
                const scheduleData: Omit<Schedule, "id"> = {
                    userId,
                    roster,
                    courses,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                
                const docRef = await db!.collection("schedules").add(scheduleData);
                const schedule: Schedule = {
                    id: docRef.id,
                    ...scheduleData,
                };
                
                res.json({ schedule });
            }
        } catch (error) {
            console.error("Create schedule error:", error);
            res.status(500).json({ error: "Failed to create schedule" } as ApiError);
        }
    },

    /**
     * Update a specific course in a schedule
     */
    async updateCourse(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId!;
            const { scheduleId, courseId } = req.params;
            const { enrollGroupIndex, meetings } = req.body;
            
            // Verify schedule belongs to user
            const scheduleDoc = await db!.collection("schedules").doc(scheduleId).get();
            if (!scheduleDoc.exists) {
                res.status(404).json({ error: "Schedule not found" } as ApiError);
                return;
            }
            
            const schedule = scheduleDoc.data() as Schedule;
            if (schedule.userId !== userId) {
                res.status(403).json({ error: "Forbidden" } as ApiError);
                return;
            }
            
            // Update course
            const courseIndex = schedule.courses.findIndex(c => c.id === courseId);
            if (courseIndex === -1) {
                res.status(404).json({ error: "Course not found" } as ApiError);
                return;
            }
            
            schedule.courses[courseIndex] = {
                ...schedule.courses[courseIndex],
                enrollGroupIndex: enrollGroupIndex ?? schedule.courses[courseIndex].enrollGroupIndex,
                meetings: meetings ?? schedule.courses[courseIndex].meetings,
            };
            
            await db!.collection("schedules").doc(scheduleId).update({
                courses: schedule.courses,
                updatedAt: new Date().toISOString(),
            });
            
            const updatedSchedule: Schedule = {
                ...schedule,
                id: scheduleId,
            };
            
            res.json({ schedule: updatedSchedule });
        } catch (error) {
            console.error("Update course error:", error);
            res.status(500).json({ error: "Failed to update course" } as ApiError);
        }
    },

    /**
     * Delete a course from a schedule
     */
    async deleteCourse(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId!;
            const { scheduleId, courseId } = req.params;
            
            // Verify schedule belongs to user
            const scheduleDoc = await db!.collection("schedules").doc(scheduleId).get();
            if (!scheduleDoc.exists) {
                res.status(404).json({ error: "Schedule not found" } as ApiError);
                return;
            }
            
            const schedule = scheduleDoc.data() as Schedule;
            if (schedule.userId !== userId) {
                res.status(403).json({ error: "Forbidden" } as ApiError);
                return;
            }
            
            // Remove course
            const updatedCourses = schedule.courses.filter(c => c.id !== courseId);
            
            await db!.collection("schedules").doc(scheduleId).update({
                courses: updatedCourses,
                updatedAt: new Date().toISOString(),
            });
            
            const updatedSchedule: Schedule = {
                ...schedule,
                id: scheduleId,
                courses: updatedCourses,
            };
            
            res.json({ schedule: updatedSchedule });
        } catch (error) {
            console.error("Delete course error:", error);
            res.status(500).json({ error: "Failed to delete course" } as ApiError);
        }
    },
};

