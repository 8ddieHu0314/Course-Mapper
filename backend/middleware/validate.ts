/**
 * Validation middleware using Zod schemas
 * Provides request validation for body, query, and params
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "@full-stack/types";

/**
 * Creates middleware that validates request body against a Zod schema
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
                res.status(400).json({ error: message } as ApiError);
                return;
            }
            res.status(400).json({ error: "Invalid request body" } as ApiError);
        }
    };
};

/**
 * Creates middleware that validates request query against a Zod schema
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.query = schema.parse(req.query) as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
                res.status(400).json({ error: message } as ApiError);
                return;
            }
            res.status(400).json({ error: "Invalid query parameters" } as ApiError);
        }
    };
};

/**
 * Creates middleware that validates request params against a Zod schema
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.params = schema.parse(req.params) as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
                res.status(400).json({ error: message } as ApiError);
                return;
            }
            res.status(400).json({ error: "Invalid URL parameters" } as ApiError);
        }
    };
};

