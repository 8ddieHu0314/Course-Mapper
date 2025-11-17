"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const firebase_1 = require("./firebase");
const app = (0, express_1.default)();
const hostname = "0.0.0.0";
const port = 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Google Maps client
const googleMapsClient = new google_maps_services_js_1.Client({});
// Rate limiting for Cornell API (1 request per second)
let lastCornellRequest = 0;
const CORNELL_RATE_LIMIT_MS = 1000;
const rateLimitCornell = async (req, res, next) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastCornellRequest;
    if (timeSinceLastRequest < CORNELL_RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, CORNELL_RATE_LIMIT_MS - timeSinceLastRequest));
    }
    lastCornellRequest = Date.now();
    next();
};
// Firebase Auth middleware
const verifyAuth = async (req, res, next) => {
    if (!firebase_1.auth) {
        res.status(503).json({ error: "Firebase not initialized" });
        return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        req.userId = decodedToken.uid;
        next();
    }
    catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ error: "Invalid token" });
    }
};
// Cornell API Proxy Endpoints
app.get("/api/cornell/search", rateLimitCornell, async (req, res) => {
    try {
        const { q, roster = "FA25", subject } = req.query;
        if (!q && !subject) {
            res.status(400).json({ error: "Either 'q' or 'subject' parameter is required" });
            return;
        }
        const params = new URLSearchParams();
        params.append("roster", roster);
        if (q)
            params.append("q", q);
        if (subject)
            params.append("subject", subject);
        const url = `https://classes.cornell.edu/api/2.0/search/classes.json?${params.toString()}`;
        const response = await (0, node_fetch_1.default)(url);
        const data = (await response.json());
        res.json(data);
    }
    catch (error) {
        console.error("Cornell API error:", error);
        res.status(500).json({ error: "Failed to fetch from Cornell API" });
    }
});
app.get("/api/cornell/subjects", rateLimitCornell, async (req, res) => {
    try {
        const { roster = "FA25" } = req.query;
        const url = `https://classes.cornell.edu/api/2.0/config/subjects.json?roster=${roster}`;
        const response = await (0, node_fetch_1.default)(url);
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error("Cornell API error:", error);
        res.status(500).json({ error: "Failed to fetch subjects" });
    }
});
// Google Maps API Proxy Endpoints
app.post("/api/geocode", async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            res.status(400).json({ error: "Address is required" });
            return;
        }
        if (!process.env.GOOGLE_MAPS_API_KEY) {
            res.status(500).json({ error: "Google Maps API key not configured" });
            return;
        }
        // Add "Ithaca, NY" to help with Cornell buildings
        const fullAddress = `${address}, Ithaca, NY`;
        const response = await googleMapsClient.geocode({
            params: {
                address: fullAddress,
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });
        if (response.data.results.length === 0) {
            res.status(404).json({ error: "Address not found" });
            return;
        }
        const result = response.data.results[0];
        const output = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
        };
        res.json(output);
    }
    catch (error) {
        console.error("Geocoding error:", error);
        res.status(500).json({ error: "Failed to geocode address" });
    }
});
app.post("/api/directions", async (req, res) => {
    try {
        const { origin, destination } = req.body;
        if (!origin || !destination) {
            res.status(400).json({ error: "Origin and destination are required" });
            return;
        }
        if (!process.env.GOOGLE_MAPS_API_KEY) {
            res.status(500).json({ error: "Google Maps API key not configured" });
            return;
        }
        const response = await googleMapsClient.directions({
            params: {
                origin: typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`,
                destination: typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`,
                mode: google_maps_services_js_1.TravelMode.walking,
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });
        if (response.data.routes.length === 0) {
            res.status(404).json({ error: "No route found" });
            return;
        }
        const route = response.data.routes[0];
        const leg = route.legs[0];
        const output = {
            distance: leg.distance.value,
            duration: leg.duration.value,
            polyline: route.overview_polyline.points,
            steps: leg.steps.map(step => ({
                distance: step.distance.value,
                duration: step.duration.value,
                instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
                startLocation: {
                    lat: step.start_location.lat,
                    lng: step.start_location.lng,
                },
                endLocation: {
                    lat: step.end_location.lat,
                    lng: step.end_location.lng,
                },
            })),
        };
        res.json(output);
    }
    catch (error) {
        console.error("Directions error:", error);
        res.status(500).json({ error: "Failed to get directions" });
    }
});
// Auth verification endpoint
app.post("/api/auth/verify", verifyAuth, async (req, res) => {
    res.json({ valid: true, userId: req.userId });
});
// Schedule CRUD Endpoints
app.get("/api/schedules", verifyAuth, async (req, res) => {
    if (!firebase_1.db) {
        res.status(503).json({ error: "Firebase not initialized" });
        return;
    }
    try {
        const userId = req.userId;
        const { roster = "FA25" } = req.query;
        const schedulesSnapshot = await firebase_1.db
            .collection("schedules")
            .where("userId", "==", userId)
            .where("roster", "==", roster)
            .get();
        const schedules = schedulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.json({ schedules });
    }
    catch (error) {
        console.error("Get schedules error:", error);
        res.status(500).json({ error: "Failed to get schedules" });
    }
});
app.post("/api/schedules", verifyAuth, async (req, res) => {
    if (!firebase_1.db) {
        res.status(503).json({ error: "Firebase not initialized" });
        return;
    }
    try {
        const userId = req.userId;
        const { roster = "FA25", courses = [] } = req.body;
        const scheduleData = {
            userId,
            roster,
            courses,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const docRef = await firebase_1.db.collection("schedules").add(scheduleData);
        const schedule = {
            id: docRef.id,
            ...scheduleData,
        };
        res.json({ schedule });
    }
    catch (error) {
        console.error("Create schedule error:", error);
        res.status(500).json({ error: "Failed to create schedule" });
    }
});
app.put("/api/schedules/:scheduleId/courses/:courseId", verifyAuth, async (req, res) => {
    if (!firebase_1.db) {
        res.status(503).json({ error: "Firebase not initialized" });
        return;
    }
    try {
        const userId = req.userId;
        const { scheduleId, courseId } = req.params;
        const { enrollGroupIndex, meetings } = req.body;
        // Verify schedule belongs to user
        const scheduleDoc = await firebase_1.db.collection("schedules").doc(scheduleId).get();
        if (!scheduleDoc.exists) {
            res.status(404).json({ error: "Schedule not found" });
            return;
        }
        const schedule = scheduleDoc.data();
        if (schedule.userId !== userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        // Update course
        const courseIndex = schedule.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        schedule.courses[courseIndex] = {
            ...schedule.courses[courseIndex],
            enrollGroupIndex: enrollGroupIndex ?? schedule.courses[courseIndex].enrollGroupIndex,
            meetings: meetings ?? schedule.courses[courseIndex].meetings,
        };
        await firebase_1.db.collection("schedules").doc(scheduleId).update({
            courses: schedule.courses,
            updatedAt: new Date().toISOString(),
        });
        const updatedSchedule = {
            ...schedule,
            id: scheduleId,
        };
        res.json({ schedule: updatedSchedule });
    }
    catch (error) {
        console.error("Update course error:", error);
        res.status(500).json({ error: "Failed to update course" });
    }
});
app.delete("/api/schedules/:scheduleId/courses/:courseId", verifyAuth, async (req, res) => {
    if (!firebase_1.db) {
        res.status(503).json({ error: "Firebase not initialized" });
        return;
    }
    try {
        const userId = req.userId;
        const { scheduleId, courseId } = req.params;
        // Verify schedule belongs to user
        const scheduleDoc = await firebase_1.db.collection("schedules").doc(scheduleId).get();
        if (!scheduleDoc.exists) {
            res.status(404).json({ error: "Schedule not found" });
            return;
        }
        const schedule = scheduleDoc.data();
        if (schedule.userId !== userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        // Remove course
        const updatedCourses = schedule.courses.filter(c => c.id !== courseId);
        await firebase_1.db.collection("schedules").doc(scheduleId).update({
            courses: updatedCourses,
            updatedAt: new Date().toISOString(),
        });
        const updatedSchedule = {
            ...schedule,
            id: scheduleId,
            courses: updatedCourses,
        };
        res.json({ schedule: updatedSchedule });
    }
    catch (error) {
        console.error("Delete course error:", error);
        res.status(500).json({ error: "Failed to delete course" });
    }
});
app.get("/weather", async (req, res) => {
    console.log("GET /api/weather was called");
    try {
        const response = await (0, node_fetch_1.default)("https://api.open-meteo.com/v1/forecast?latitude=40.7411&longitude=73.9897&current=precipitation&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York&forecast_days=1");
        const data = (await response.json());
        const output = {
            raining: data.current.precipitation > 0.5,
        };
        res.json(output);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
app.listen(port, hostname, () => {
    console.log("Listening");
});
