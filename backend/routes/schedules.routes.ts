/**
 * Schedules API Routes
 * Handles CRUD operations for user schedules
 */

import { Router } from "express";
import { schedulesController } from "../controllers";
import { requireFirestore } from "../middleware/requireFirebase";
import { validateBody, validateQuery, validateParams } from "../middleware/validate";
import { 
    getSchedulesSchema, 
    createScheduleSchema, 
    updateCourseSchema,
    scheduleParamsSchema 
} from "../schemas";

const router = Router();

// Note: verifyAuth middleware is applied in the main router

// GET /api/schedules - Get all schedules for user
router.get(
    "/",
    requireFirestore,
    validateQuery(getSchedulesSchema),
    schedulesController.getSchedules
);

// POST /api/schedules - Create or update a schedule
router.post(
    "/",
    requireFirestore,
    validateBody(createScheduleSchema),
    schedulesController.createOrUpdateSchedule
);

// PUT /api/schedules/:scheduleId/courses/:courseId - Update a course
router.put(
    "/:scheduleId/courses/:courseId",
    requireFirestore,
    validateParams(scheduleParamsSchema),
    validateBody(updateCourseSchema),
    schedulesController.updateCourse
);

// DELETE /api/schedules/:scheduleId/courses/:courseId - Delete a course
router.delete(
    "/:scheduleId/courses/:courseId",
    requireFirestore,
    validateParams(scheduleParamsSchema),
    schedulesController.deleteCourse
);

export default router;

