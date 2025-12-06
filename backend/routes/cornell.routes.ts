/**
 * Cornell API Routes
 * Proxies requests to the Cornell Class Roster API
 */

import { Router, Request, Response, NextFunction } from "express";
import { cornellController } from "../controllers";
import { validateQuery } from "../middleware/validate";
import { cornellSearchSchema, cornellSubjectsSchema } from "../schemas";

const router = Router();

// Rate limiting for Cornell API (1 request per second)
let lastCornellRequest = 0;
const CORNELL_RATE_LIMIT_MS = 1000;

const rateLimitCornell = async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastCornellRequest;
    
    if (timeSinceLastRequest < CORNELL_RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, CORNELL_RATE_LIMIT_MS - timeSinceLastRequest));
    }
    
    lastCornellRequest = Date.now();
    next();
};

// GET /api/cornell/search - Search for classes
router.get(
    "/search",
    rateLimitCornell,
    validateQuery(cornellSearchSchema),
    cornellController.searchClasses
);

// GET /api/cornell/subjects - Get list of subjects
router.get(
    "/subjects",
    rateLimitCornell,
    validateQuery(cornellSubjectsSchema),
    cornellController.getSubjects
);

export default router;

