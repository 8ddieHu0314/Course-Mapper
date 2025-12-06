/**
 * Zod validation schemas for API request validation
 * Provides runtime type checking and validation for all API endpoints
 */

import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

export const rosterSchema = z.string().regex(/^(FA|SP|SU)\d{2}$/, {
    message: "Roster must be in format FA25, SP26, etc."
}).default("SP26");

export const coordinatesSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

// ============================================================================
// Cornell API Schemas
// ============================================================================

export const cornellSearchSchema = z.object({
    q: z.string().optional(),
    subject: z.string().optional(),
    roster: rosterSchema,
}).refine((data) => data.q || data.subject, {
    message: "Either 'q' or 'subject' parameter is required",
});

export const cornellSubjectsSchema = z.object({
    roster: rosterSchema,
});

// ============================================================================
// Google Maps API Schemas
// ============================================================================

export const geocodeSchema = z.object({
    address: z.string().min(1, "Address is required").max(500),
});

export const directionsSchema = z.object({
    origin: z.union([
        z.string().min(1),
        coordinatesSchema,
    ]),
    destination: z.union([
        z.string().min(1),
        coordinatesSchema,
    ]),
});

// ============================================================================
// Schedule Schemas
// ============================================================================

export const scheduledMeetingSchema = z.object({
    pattern: z.string(),
    timeStart: z.string(),
    timeEnd: z.string(),
    bldgDescr: z.string(),
    facilityDescr: z.string(),
    instructors: z.array(z.object({
        instrAssignSeq: z.number(),
        netid: z.string().optional(),
        firstName: z.string(),
        middleName: z.string().optional(),
        lastName: z.string(),
    })),
    displayLocation: z.string().optional(),
    coordinates: coordinatesSchema.optional(),
});

export const scheduledCourseSectionSchema = z.object({
    enrollGroupIndex: z.number().int().min(0),
    classSectionIndex: z.number().int().min(0),
    section: z.string(),
    ssrComponent: z.string(),
    classNbr: z.string(),
    meetings: z.array(scheduledMeetingSchema),
});

export const scheduledCourseSchema = z.object({
    id: z.string(),
    crseId: z.string(),
    subject: z.string(),
    catalogNbr: z.string(),
    title: z.string(),
    classSection: z.string(),
    ssrComponent: z.string(),
    classNbr: z.string(),
    enrollGroupIndex: z.number().int().min(0),
    meetings: z.array(scheduledMeetingSchema),
    units: z.string(),
    selectedSections: z.array(scheduledCourseSectionSchema).optional(),
});

export const getSchedulesSchema = z.object({
    roster: rosterSchema,
});

export const createScheduleSchema = z.object({
    roster: rosterSchema,
    courses: z.array(scheduledCourseSchema).default([]),
});

export const updateCourseSchema = z.object({
    enrollGroupIndex: z.number().int().min(0).optional(),
    meetings: z.array(scheduledMeetingSchema).optional(),
});

export const scheduleParamsSchema = z.object({
    scheduleId: z.string().min(1),
    courseId: z.string().min(1),
});

// ============================================================================
// Course Search Schemas
// ============================================================================

export const courseIdSearchSchema = z.object({
    courseId: z.coerce.number().int().positive("courseId must be a positive integer"),
});

export const requirementSearchSchema = z.object({
    q: z.string().min(1, "Search query is required"),
});

export const coursesByRequirementSchema = z.object({
    requirementName: z.string().min(1, "Requirement name is required"),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CornellSearchInput = z.infer<typeof cornellSearchSchema>;
export type GeocodeInput = z.infer<typeof geocodeSchema>;
export type DirectionsInput = z.infer<typeof directionsSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

