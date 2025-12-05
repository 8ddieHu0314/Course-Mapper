/**
 * Courses API Routes
 * Handles course search and requirements lookups
 */

import { Router } from "express";
import { coursesController } from "../controllers";
import { validateQuery } from "../middleware/validate";
import { 
    courseIdSearchSchema, 
    requirementSearchSchema, 
    coursesByRequirementSchema 
} from "../schemas";

const router = Router();

// GET /api/courses/search/by-id - Search course by ID
router.get(
    "/search/by-id",
    validateQuery(courseIdSearchSchema),
    coursesController.searchById
);

// GET /api/courses/search/requirements - Search requirements
router.get(
    "/search/requirements",
    validateQuery(requirementSearchSchema),
    coursesController.searchRequirements
);

// GET /api/courses/search/by-requirement - Get courses by requirement
router.get(
    "/search/by-requirement",
    validateQuery(coursesByRequirementSchema),
    coursesController.getCoursesByRequirement
);

// GET /api/courses/requirements - Get all requirements
router.get(
    "/requirements",
    coursesController.getAllRequirements
);

export default router;

