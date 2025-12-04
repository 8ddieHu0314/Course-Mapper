import { CornellClassResponse, GeocodeResponse, DirectionsResponse, Schedule, SchedulesResponse, CourseSearchResponse, RequirementsResponse, ScheduledCourse } from "@full-stack/types";

// Define BACKEND_BASE_PATH here to avoid circular dependency with Navigation.tsx
const BACKEND_BASE_PATH = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const API_BASE = BACKEND_BASE_PATH.replace("/api", "");

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

    // Cornell Course Roster API
    async searchCourses(query: string, roster = "SP26"): Promise<CornellClassResponse> {
        return API.request<CornellClassResponse>(`/api/cornell/search?q=${encodeURIComponent(query)}&roster=${roster}`);
    },

    async searchCoursesBySubject(subject: string, roster = "SP26"): Promise<CornellClassResponse> {
        return API.request<CornellClassResponse>(`/api/cornell/search?subject=${encodeURIComponent(subject)}&roster=${roster}`);
    },

    // Google Maps API
    async geocode(address: string): Promise<GeocodeResponse> {
        return API.request<GeocodeResponse>("/api/geocode", {
            method: "POST",
            body: JSON.stringify({ address }),
        });
    },

    async getDirections(
        origin: { lat: number; lng: number } | string,
        destination: { lat: number; lng: number } | string
    ): Promise<DirectionsResponse> {
        return API.request<DirectionsResponse>("/api/directions", {
            method: "POST",
            body: JSON.stringify({ origin, destination }),
        });
    },

    // Course Search API
    async searchCourseById(courseId: number): Promise<CourseSearchResponse> {
        return API.request<CourseSearchResponse>(`/api/courses/search/by-id?courseId=${courseId}`);
    },

    async searchRequirements(query: string): Promise<{ results: unknown[]; count: number }> {
        return API.request<{ results: unknown[]; count: number }>(`/api/courses/search/requirements?q=${encodeURIComponent(query)}`);
    },

    async getCoursesByRequirement(requirementName: string): Promise<CourseSearchResponse> {
        return API.request<CourseSearchResponse>(`/api/courses/search/by-requirement?requirementName=${encodeURIComponent(requirementName)}`);
    },

    async getAllRequirements(): Promise<RequirementsResponse> {
        return API.request<RequirementsResponse>("/api/courses/requirements");
    },

    // Schedule Management - Backend Firebase API
    async getSchedules(roster = "SP26", token: string): Promise<SchedulesResponse> {
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