import { BACKEND_BASE_PATH } from "../constants/Navigation";
import { CornellClassResponse, GeocodeResponse, DirectionsResponse, Schedule, SchedulesResponse } from "@full-stack/types";

const API_BASE = BACKEND_BASE_PATH.replace("/api", "");

export const api = {
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
            headers["Authorization"] = `Bearer ${token}`;
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

    // Cornell API
    async searchCourses(query: string, roster = "FA25"): Promise<CornellClassResponse> {
        return this.request<CornellClassResponse>(
            `/api/cornell/search?q=${encodeURIComponent(query)}&roster=${roster}`
        );
    },

    // Google Maps API
    async geocode(address: string): Promise<GeocodeResponse> {
        return this.request<GeocodeResponse>("/api/geocode", {
            method: "POST",
            body: JSON.stringify({ address }),
        });
    },

    async getDirections(
        origin: { lat: number; lng: number } | string,
        destination: { lat: number; lng: number } | string
    ): Promise<DirectionsResponse> {
        return this.request<DirectionsResponse>("/api/directions", {
            method: "POST",
            body: JSON.stringify({ origin, destination }),
        });
    },

    // Schedule API
    async getSchedules(roster = "FA25", token: string): Promise<SchedulesResponse> {
        return this.request<SchedulesResponse>(
            `/api/schedules?roster=${roster}`,
            { method: "GET" },
            token
        );
    },

    async createSchedule(
        roster: string,
        courses: any[],
        token: string
    ): Promise<{ schedule: Schedule }> {
        return this.request<{ schedule: Schedule }>(
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
        updates: { enrollGroupIndex?: number; meetings?: any[] },
        token: string
    ): Promise<{ schedule: Schedule }> {
        return this.request<{ schedule: Schedule }>(
            `/api/schedules/${scheduleId}/courses/${courseId}`,
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
        return this.request<{ schedule: Schedule }>(
            `/api/schedules/${scheduleId}/courses/${courseId}`,
            { method: "DELETE" },
            token
        );
    },
};

