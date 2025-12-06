import { CornellClassResponse, GeocodeResponse, DirectionsResponse, Schedule, SchedulesResponse, ScheduledCourse } from "@full-stack/types";
import { ROSTER_CONFIG } from "../config/constants";
import { apiCache, CacheKeys } from "./apiCache";

// Define BACKEND_BASE_PATH here to avoid circular dependency with Navigation.tsx
const BACKEND_BASE_PATH = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const API_BASE = BACKEND_BASE_PATH.replace("/api", "");

const DEFAULT_ROSTER = ROSTER_CONFIG.DEFAULT;

// Cache TTLs for different endpoints
const CACHE_TTL = {
    CORNELL_SEARCH: 10 * 60 * 1000, // 10 minutes
    GEOCODE: 24 * 60 * 60 * 1000,   // 24 hours (addresses rarely change)
    DIRECTIONS: 60 * 60 * 1000,     // 1 hour
};

const API = {
    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        token?: string | null
    ): Promise<T> {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    },

    // Cornell Course Roster API (with caching)
    async searchCourses(query: string, roster = DEFAULT_ROSTER): Promise<CornellClassResponse> {
        const cacheKey = CacheKeys.cornellSearch(query, roster);
        const cached = apiCache.get<CornellClassResponse>(cacheKey);
        if (cached) return cached;

        const result = await API.request<CornellClassResponse>(
            `/api/cornell/search?q=${encodeURIComponent(query)}&roster=${roster}`
        );
        apiCache.set(cacheKey, result, CACHE_TTL.CORNELL_SEARCH);
        return result;
    },

    async searchCoursesBySubject(subject: string, roster = DEFAULT_ROSTER): Promise<CornellClassResponse> {
        const cacheKey = CacheKeys.cornellSubject(subject, roster);
        const cached = apiCache.get<CornellClassResponse>(cacheKey);
        if (cached) return cached;

        const result = await API.request<CornellClassResponse>(
            `/api/cornell/search?subject=${encodeURIComponent(subject)}&roster=${roster}`
        );
        apiCache.set(cacheKey, result, CACHE_TTL.CORNELL_SEARCH);
        return result;
    },

    // Google Maps API (with caching)
    async geocode(address: string): Promise<GeocodeResponse> {
        const cacheKey = CacheKeys.geocode(address);
        const cached = apiCache.get<GeocodeResponse>(cacheKey);
        if (cached) return cached;

        const result = await API.request<GeocodeResponse>("/api/geocode", {
            method: "POST",
            body: JSON.stringify({ address }),
        });
        apiCache.set(cacheKey, result, CACHE_TTL.GEOCODE);
        return result;
    },

    async getDirections(
        origin: { lat: number; lng: number } | string,
        destination: { lat: number; lng: number } | string
    ): Promise<DirectionsResponse> {
        // Generate cache key from coordinates
        const originCoords = typeof origin === "string" 
            ? origin 
            : `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`;
        const destCoords = typeof destination === "string"
            ? destination
            : `${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
        const cacheKey = `directions:${originCoords}:${destCoords}`;
        
        const cached = apiCache.get<DirectionsResponse>(cacheKey);
        if (cached) return cached;

        const result = await API.request<DirectionsResponse>("/api/directions", {
            method: "POST",
            body: JSON.stringify({ origin, destination }),
        });
        apiCache.set(cacheKey, result, CACHE_TTL.DIRECTIONS);
        return result;
    },

    /**
     * Clear all cached API responses
     */
    clearCache(): void {
        apiCache.clear();
    },

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return apiCache.getStats();
    },

    // Schedule Management - Backend Firebase API
    async getSchedules(roster = DEFAULT_ROSTER, token: string): Promise<SchedulesResponse> {
        return API.request<SchedulesResponse>(
            `/api/schedules?roster=${encodeURIComponent(roster)}`,
            {},
            token
        );
    },
    
    async createSchedule(
        roster: string,
        courses: ScheduledCourse[],
        token: string
    ): Promise<{ schedule: Schedule }> {
        return API.request<{ schedule: Schedule }>(
            "/api/schedules",
            {
                method: "POST",
                body: JSON.stringify({ roster, courses }),
            },
            token
        );
    },
    
    async updateCourse(
        scheduleId: string,
        courseId: string,
        updates: { enrollGroupIndex?: number; meetings?: ScheduledCourse["meetings"] },
        token: string
    ): Promise<{ schedule: Schedule }> {
        return API.request<{ schedule: Schedule }>(
            `/api/schedules/${encodeURIComponent(scheduleId)}/courses/${encodeURIComponent(courseId)}`,
            {
                method: "PUT",
                body: JSON.stringify(updates),
            },
            token
        );
    },
    
    async deleteCourse(
        scheduleId: string,
        courseId: string,
        token: string
    ): Promise<{ schedule: Schedule }> {
        return API.request<{ schedule: Schedule }>(
            `/api/schedules/${encodeURIComponent(scheduleId)}/courses/${encodeURIComponent(courseId)}`,
            {
                method: "DELETE",
            },
            token
        );
    },
};

export default API;