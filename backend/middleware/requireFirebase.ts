/**
 * Firebase availability middleware
 * Ensures Firebase services are initialized before processing requests
 */

import { Request, Response, NextFunction } from "express";
import { ApiError } from "@full-stack/types";
import { db, auth } from "../firebase";

/**
 * Middleware that checks if Firebase Firestore is available
 * Returns 503 Service Unavailable if Firebase is not initialized
 */
export const requireFirestore = (req: Request, res: Response, next: NextFunction) => {
    if (!db) {
        res.status(503).json({
            error: "Database service temporarily unavailable",
        } as ApiError);
        return;
    }
    next();
};

/**
 * Middleware that checks if Firebase Auth is available
 * Returns 503 Service Unavailable if Firebase Auth is not initialized
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!auth) {
        res.status(503).json({
            error: "Authentication service temporarily unavailable",
        } as ApiError);
        return;
    }
    next();
};

/**
 * Middleware that checks if both Firebase Firestore and Auth are available
 * Returns 503 Service Unavailable if either is not initialized
 */
export const requireFirebase = (req: Request, res: Response, next: NextFunction) => {
    if (!db || !auth) {
        res.status(503).json({
            error: "Firebase services temporarily unavailable",
        } as ApiError);
        return;
    }
    next();
};

