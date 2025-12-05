/**
 * Routes barrel export and main router configuration
 */

import { Router, Response, NextFunction } from "express";
import { ApiError } from "@full-stack/types";
import { auth } from "../firebase";
import { AuthenticatedRequest } from "../types/auth";
import cornellRoutes from "./cornell.routes";
import mapsRoutes from "./maps.routes";
import schedulesRoutes from "./schedules.routes";

const router = Router();

// Firebase Auth middleware
const verifyAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!auth) {
        res.status(503).json({ error: "Firebase not initialized" } as ApiError);
        return;
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" } as ApiError);
        return;
    }
    
    const token = authHeader.split("Bearer ")[1];
    
    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.userId = decodedToken.uid;
        req.decodedToken = decodedToken;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ error: "Invalid token" } as ApiError);
    }
};

// Mount routes
router.use("/cornell", cornellRoutes);
router.use("/", mapsRoutes); // geocode and directions at root /api level
router.use("/schedules", verifyAuth, schedulesRoutes);

// Auth verification endpoint
router.post("/auth/verify", verifyAuth, async (req: AuthenticatedRequest, res) => {
    res.json({ valid: true, userId: req.userId });
});

export default router;

