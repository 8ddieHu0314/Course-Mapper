/**
 * Google Maps API Routes
 * Handles geocoding and directions requests
 */

import { Router } from "express";
import { mapsController } from "../controllers";
import { validateBody } from "../middleware/validate";
import { geocodeSchema, directionsSchema } from "../schemas";

const router = Router();

// POST /api/geocode - Geocode an address
router.post(
    "/geocode",
    validateBody(geocodeSchema),
    mapsController.geocode
);

// POST /api/directions - Get walking directions
router.post(
    "/directions",
    validateBody(directionsSchema),
    mapsController.getDirections
);

export default router;

