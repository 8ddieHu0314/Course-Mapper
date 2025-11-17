import { CornellClassResponse, GeocodeResponse, DirectionsResponse, Schedule, SchedulesResponse } from "@full-stack/types";

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
        const params = new URLSearchParams({
            roster,
            "acadCareer[]": "UG",
            subject: query,
        });

        const url = 'https://classes.cornell.edu/api/2.0/search/classes.json?' + params.toString();
        
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(error.error || 'HTTP ${response.status}');
        }

        return response.json();
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

    // Placeholders
    async getSchedules(roster = "SP26", token: string): Promise<SchedulesResponse> {
        // Return a mock empty schedule list
        return {
          schedules: [], // mimic no schedules found
        };
      },
    
      async createSchedule(
        roster: string,
        courses: any[],
        token: string
      ): Promise<{ schedule: Schedule }> {

        return {
          schedule: {
            id: "",
            userId: "",
            roster: "SP26",
            courses: [],
            createdAt: "",
            updatedAt: ""
          },
        };
      },
    
      async updateCourse(
        scheduleId: string,
        courseId: string,
        updates: { enrollGroupIndex?: number; meetings?: any[] },
        token: string
      ): Promise<{ schedule: Schedule }> {

        return {
          schedule: {
            id: "",
            userId: "",
            roster: "SP26",
            courses: [],
            createdAt: "",
            updatedAt: ""
          },
        };
      },
    
      async deleteCourse(
        scheduleId: string,
        courseId: string,
        token: string
      ): Promise<{ schedule: Schedule }> {

        return {
          schedule: {
            id: "",
            userId: "",
            roster: "SP26",
            courses: [],
            createdAt: "",
            updatedAt: ""
          },
        };
      },
};

export default API;