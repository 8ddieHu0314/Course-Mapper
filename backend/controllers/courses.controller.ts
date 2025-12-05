/**
 * Courses Controller
 * Handles course search and requirements lookups
 */

import { Request, Response } from "express";
import { CourseSearchResponse, RequirementsResponse, ApiError } from "@full-stack/types";
import { courseDataService } from "../services/courseDataService";

export const coursesController = {
    /**
     * Search for course by ID
     */
    async searchById(req: Request, res: Response) {
        try {
            const { courseId } = req.query as unknown as { courseId: number };
            
            const results = courseDataService.searchById(courseId);
            const response: CourseSearchResponse = {
                results,
                count: results.length,
            };
            
            res.json(response);
        } catch (error) {
            console.error("Course search error:", error);
            res.status(500).json({ error: "Failed to search courses" } as ApiError);
        }
    },

    /**
     * Search requirements by query
     */
    async searchRequirements(req: Request, res: Response) {
        try {
            const { q } = req.query as { q: string };
            
            const requirements = courseDataService.searchRequirements(q);
            
            res.json({
                results: requirements,
                count: requirements.length,
            });
        } catch (error) {
            console.error("Requirement search error:", error);
            res.status(500).json({ error: "Failed to search requirements" } as ApiError);
        }
    },

    /**
     * Get courses by requirement name
     */
    async getCoursesByRequirement(req: Request, res: Response) {
        try {
            const { requirementName } = req.query as { requirementName: string };
            
            const courses = courseDataService.getCoursesByRequirement(requirementName);
            const response: CourseSearchResponse = {
                results: courses.map(courseId => ({
                    courseId,
                    requirementName,
                    requirementDescription: "",
                    college: "",
                    university: "",
                })),
                count: courses.length,
            };
            
            res.json(response);
        } catch (error) {
            console.error("Course by requirement search error:", error);
            res.status(500).json({ error: "Failed to search courses" } as ApiError);
        }
    },

    /**
     * Get all available requirements
     */
    async getAllRequirements(req: Request, res: Response) {
        try {
            const requirements = courseDataService.getAllRequirements();
            const response: RequirementsResponse = {
                requirements,
            };
            
            res.json(response);
        } catch (error) {
            console.error("Get requirements error:", error);
            res.status(500).json({ error: "Failed to fetch requirements" } as ApiError);
        }
    },
};

