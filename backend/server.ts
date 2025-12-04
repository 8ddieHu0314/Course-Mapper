import "dotenv/config";
import path from "path";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { WeatherResponse, CornellClassResponse, GeocodeResponse, DirectionsResponse, Schedule, ScheduledCourse, ApiError, CourseSearchResponse, RequirementsResponse } from "@full-stack/types";
import fetch from "node-fetch";
import { Client, TravelMode } from "@googlemaps/google-maps-services-js";
import { db, auth } from "./firebase";
import { courseDataService } from "./services/courseDataService";

const app: Express = express();

const hostname = "0.0.0.0";
const port = 8080;

app.use(cors());
app.use(express.json());

// Google Maps client
const googleMapsClient = new Client({});

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

// Firebase Auth middleware
const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
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
        (req as any).userId = decodedToken.uid;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ error: "Invalid token" } as ApiError);
    }
};

// Cornell API Proxy Endpoints
app.get("/api/cornell/search", rateLimitCornell, async (req, res) => {
    try {
        const { q, roster = "SP26", subject } = req.query;
        
        if (!q && !subject) {
            res.status(400).json({ error: "Either 'q' or 'subject' parameter is required" } as ApiError);
            return;
        }
        
        const params = new URLSearchParams();
        params.append("roster", roster as string);
        if (q) params.append("q", q as string);
        if (subject) params.append("subject", subject as string);
        
        const url = `https://classes.cornell.edu/api/2.0/search/classes.json?${params.toString()}`;
        const response = await fetch(url);
        const data = (await response.json()) as CornellClassResponse;
        
        res.json(data);
    } catch (error) {
        console.error("Cornell API error:", error);
        res.status(500).json({ error: "Failed to fetch from Cornell API" } as ApiError);
    }
});

app.get("/api/cornell/subjects", rateLimitCornell, async (req, res) => {
    try {
        const { roster = "SP26" } = req.query;
        const url = `https://classes.cornell.edu/api/2.0/config/subjects.json?roster=${roster}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Cornell API error:", error);
        res.status(500).json({ error: "Failed to fetch subjects" } as ApiError);
    }
});

// Google Maps API Proxy Endpoints
app.post("/api/geocode", async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            res.status(400).json({ error: "Address is required" } as ApiError);
            return;
        }
        
        if (!process.env.GOOGLE_MAPS_API_KEY) {
            res.status(500).json({ error: "Google Maps API key not configured" } as ApiError);
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
            res.status(404).json({ error: "Address not found" } as ApiError);
            return;
        }
        
        const result = response.data.results[0];
        const output: GeocodeResponse = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
        };
        
        res.json(output);
    } catch (error) {
        console.error("Geocoding error:", error);
        res.status(500).json({ error: "Failed to geocode address" } as ApiError);
    }
});

app.post("/api/directions", async (req, res) => {
    try {
        const { origin, destination } = req.body;
        
        if (!origin || !destination) {
            res.status(400).json({ error: "Origin and destination are required" } as ApiError);
            return;
        }
        
        if (!process.env.GOOGLE_MAPS_API_KEY) {
            res.status(500).json({ error: "Google Maps API key not configured" } as ApiError);
            return;
        }
        
        const response = await googleMapsClient.directions({
            params: {
                origin: typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`,
                destination: typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`,
                mode: TravelMode.walking,
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });
        
        if (response.data.routes.length === 0) {
            res.status(404).json({ error: "No route found" } as ApiError);
            return;
        }
        
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        const output: DirectionsResponse = {
            distance: leg.distance.value, // in meters
            duration: leg.duration.value, // in seconds
            polyline: route.overview_polyline.points,
            steps: leg.steps.map(step => ({
                distance: step.distance.value,
                duration: step.duration.value,
                instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Strip HTML
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
    } catch (error) {
        console.error("Directions error:", error);
        res.status(500).json({ error: "Failed to get directions" } as ApiError);
    }
});

// Auth verification endpoint
app.post("/api/auth/verify", verifyAuth, async (req, res) => {
    res.json({ valid: true, userId: (req as any).userId });
});

// Schedule CRUD Endpoints
app.get("/api/schedules", verifyAuth, async (req, res) => {
    if (!db) {
        res.status(503).json({ error: "Firebase not initialized" } as ApiError);
        return;
    }
    
    try {
        const userId = (req as any).userId;
        const { roster = "SP26" } = req.query;
        
        const schedulesSnapshot = await db
            .collection("schedules")
            .where("userId", "==", userId)
            .where("roster", "==", roster)
            .get();
        
        const schedules = schedulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Schedule[];
        
        res.json({ schedules });
    } catch (error) {
        console.error("Get schedules error:", error);
        res.status(500).json({ error: "Failed to get schedules" } as ApiError);
    }
});

app.post("/api/schedules", verifyAuth, async (req, res) => {
    if (!db) {
        res.status(503).json({ error: "Firebase not initialized" } as ApiError);
        return;
    }
    
    try {
        const userId = (req as any).userId;
        const { roster = "SP26", courses = [] } = req.body;
        
        // Check if schedule already exists for this user + roster
        const existingSchedules = await db
            .collection("schedules")
            .where("userId", "==", userId)
            .where("roster", "==", roster)
            .limit(1)
            .get();
        
        if (!existingSchedules.empty) {
            // Update existing schedule
            const existingDoc = existingSchedules.docs[0];
            await existingDoc.ref.update({
                courses,
                updatedAt: new Date().toISOString(),
            });
            
            const schedule: Schedule = {
                id: existingDoc.id,
                userId,
                roster,
                courses,
                createdAt: existingDoc.data().createdAt,
                updatedAt: new Date().toISOString(),
            };
            
            res.json({ schedule });
        } else {
            // Create new schedule
            const scheduleData: Omit<Schedule, "id"> = {
                userId,
                roster,
                courses,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            const docRef = await db.collection("schedules").add(scheduleData);
            const schedule: Schedule = {
                id: docRef.id,
                ...scheduleData,
            };
            
            res.json({ schedule });
        }
    } catch (error) {
        console.error("Create schedule error:", error);
        res.status(500).json({ error: "Failed to create schedule" } as ApiError);
    }
});

app.put("/api/schedules/:scheduleId/courses/:courseId", verifyAuth, async (req, res) => {
    if (!db) {
        res.status(503).json({ error: "Firebase not initialized" } as ApiError);
        return;
    }
    
    try {
        const userId = (req as any).userId;
        const { scheduleId, courseId } = req.params;
        const { enrollGroupIndex, meetings } = req.body;
        
        // Verify schedule belongs to user
        const scheduleDoc = await db.collection("schedules").doc(scheduleId).get();
        if (!scheduleDoc.exists) {
            res.status(404).json({ error: "Schedule not found" } as ApiError);
            return;
        }
        
        const schedule = scheduleDoc.data() as Schedule;
        if (schedule.userId !== userId) {
            res.status(403).json({ error: "Forbidden" } as ApiError);
            return;
        }
        
        // Update course
        const courseIndex = schedule.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            res.status(404).json({ error: "Course not found" } as ApiError);
            return;
        }
        
        schedule.courses[courseIndex] = {
            ...schedule.courses[courseIndex],
            enrollGroupIndex: enrollGroupIndex ?? schedule.courses[courseIndex].enrollGroupIndex,
            meetings: meetings ?? schedule.courses[courseIndex].meetings,
        };
        
        await db.collection("schedules").doc(scheduleId).update({
            courses: schedule.courses,
            updatedAt: new Date().toISOString(),
        });
        
        const updatedSchedule: Schedule = {
            ...schedule,
            id: scheduleId,
        };
        
        res.json({ schedule: updatedSchedule });
    } catch (error) {
        console.error("Update course error:", error);
        res.status(500).json({ error: "Failed to update course" } as ApiError);
    }
});

app.delete("/api/schedules/:scheduleId/courses/:courseId", verifyAuth, async (req, res) => {
    if (!db) {
        res.status(503).json({ error: "Firebase not initialized" } as ApiError);
        return;
    }
    
    try {
        const userId = (req as any).userId;
        const { scheduleId, courseId } = req.params;
        
        // Verify schedule belongs to user
        const scheduleDoc = await db.collection("schedules").doc(scheduleId).get();
        if (!scheduleDoc.exists) {
            res.status(404).json({ error: "Schedule not found" } as ApiError);
            return;
        }
        
        const schedule = scheduleDoc.data() as Schedule;
        if (schedule.userId !== userId) {
            res.status(403).json({ error: "Forbidden" } as ApiError);
            return;
        }
        
        // Remove course
        const updatedCourses = schedule.courses.filter(c => c.id !== courseId);
        
        await db.collection("schedules").doc(scheduleId).update({
            courses: updatedCourses,
            updatedAt: new Date().toISOString(),
        });
        
        const updatedSchedule: Schedule = {
            ...schedule,
            id: scheduleId,
            courses: updatedCourses,
        };
        
        res.json({ schedule: updatedSchedule });
    } catch (error) {
        console.error("Delete course error:", error);
        res.status(500).json({ error: "Failed to delete course" } as ApiError);
    }
});

// Course Search API Endpoints
app.get("/api/courses/search/by-id", async (req, res) => {
    try {
        const { courseId } = req.query;
        
        if (!courseId) {
            res.status(400).json({ error: "courseId parameter is required" } as ApiError);
            return;
        }
        
        const id = parseInt(courseId as string);
        if (isNaN(id)) {
            res.status(400).json({ error: "courseId must be a number" } as ApiError);
            return;
        }
        
        const results = courseDataService.searchById(id);
        const response: CourseSearchResponse = {
            results,
            count: results.length,
        };
        
        res.json(response);
    } catch (error) {
        console.error("Course search error:", error);
        res.status(500).json({ error: "Failed to search courses" } as ApiError);
    }
});

app.get("/api/courses/search/requirements", async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            res.status(400).json({ error: "q parameter is required" } as ApiError);
            return;
        }
        
        const requirements = courseDataService.searchRequirements(q as string);
        
        res.json({
            results: requirements,
            count: requirements.length,
        });
    } catch (error) {
        console.error("Requirement search error:", error);
        res.status(500).json({ error: "Failed to search requirements" } as ApiError);
    }
});

app.get("/api/courses/search/by-requirement", async (req, res) => {
    try {
        const { requirementName } = req.query;
        
        if (!requirementName) {
            res.status(400).json({ error: "requirementName parameter is required" } as ApiError);
            return;
        }
        
        const courses = courseDataService.getCoursesByRequirement(requirementName as string);
        const response: CourseSearchResponse = {
            results: courses.map(courseId => ({
                courseId,
                requirementName: requirementName as string,
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
});

app.get("/api/courses/requirements", async (req, res) => {
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
});

// Legacy weather endpoint
type WeatherData = {
    latitude: number;
    longitude: number;
    timezone: string;
    timezone_abbreviation: string;
    current: {
        time: string;
        interval: number;
        precipitation: number;
    };
};

app.get("/weather", async (req, res) => {
    console.log("GET /api/weather was called");
    try {
        const response = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=40.7411&longitude=73.9897&current=precipitation&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York&forecast_days=1"
        );
        const data = (await response.json()) as WeatherData;
        const output: WeatherResponse = {
            raining: data.current.precipitation > 0.5,
        };
        res.json(output);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.listen(port, hostname, async () => {
    try {
        // Initialize course data service
        await courseDataService.initialize();
        const stats = courseDataService.getStats();
        console.log("Course data stats:", stats);
    } catch (error) {
        console.error("Failed to initialize course data:", error);
    }
    console.log("Listening");
});
