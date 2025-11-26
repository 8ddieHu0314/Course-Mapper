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

    // Schedule Management with localStorage for client-side persistence
    async getSchedules(roster = "SP26", token: string): Promise<SchedulesResponse> {
        void token;
        try {
            const stored = localStorage.getItem(`schedules_${roster}`);
            if (stored) {
                const schedules = JSON.parse(stored) as Schedule[];
                return { schedules };
            }
            return { schedules: [] };
        } catch (error) {
            console.error("Error reading schedules from localStorage:", error);
            return { schedules: [] };
        }
    },
    
    async createSchedule(
        roster: string,
        courses: ScheduledCourse[],
        token: string
    ): Promise<{ schedule: Schedule }> {
        try {
            const scheduleId = `schedule_${Date.now()}`;
            const schedule: Schedule = {
                id: scheduleId,
                userId: token ? "current-user" : "",
                roster,
                courses,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Try to load existing schedules
            const existingSchedules = localStorage.getItem(`schedules_${roster}`);
            const schedules: Schedule[] = existingSchedules ? JSON.parse(existingSchedules) : [];

            // Check if schedule already exists, update or create
            const existingIndex = schedules.findIndex(s => s.id === scheduleId);
            if (existingIndex >= 0) {
                schedules[existingIndex] = schedule;
            } else if (schedules.length === 0) {
                // First schedule
                schedules.push(schedule);
            } else {
                // Replace the first (current) schedule
                schedules[0] = schedule;
            }

            localStorage.setItem(`schedules_${roster}`, JSON.stringify(schedules));
            return { schedule };
        } catch (error) {
            console.error("Error saving schedule to localStorage:", error);
            throw error;
        }
    },
    
    async updateCourse(
        scheduleId: string,
        courseId: string,
        updates: { enrollGroupIndex?: number; meetings?: ScheduledCourse["meetings"] }
    ): Promise<{ schedule: Schedule }> {
        try {
            // Find the schedule across all rosters
            let targetSchedule: Schedule | null = null;
            let rosterKey = "";

            for (const key of Object.keys(localStorage)) {
                if (key.startsWith("schedules_")) {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const schedules: Schedule[] = JSON.parse(stored);
                        const found = schedules.find(s => s.id === scheduleId);
                        if (found) {
                            targetSchedule = found;
                            rosterKey = key;
                            break;
                        }
                    }
                }
            }

            if (!targetSchedule || !rosterKey) {
                throw new Error("Schedule not found");
            }

            // Update the course
            const courseIndex = targetSchedule.courses.findIndex(c => c.id === courseId);
            if (courseIndex === -1) {
                throw new Error("Course not found");
            }

            targetSchedule.courses[courseIndex] = {
                ...targetSchedule.courses[courseIndex],
                ...(updates.enrollGroupIndex !== undefined && { enrollGroupIndex: updates.enrollGroupIndex }),
                ...(updates.meetings && { meetings: updates.meetings }),
            };
            targetSchedule.updatedAt = new Date().toISOString();

            // Save back to localStorage
            const stored = localStorage.getItem(rosterKey);
            if (stored) {
                const schedules: Schedule[] = JSON.parse(stored);
                const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
                if (scheduleIndex >= 0) {
                    schedules[scheduleIndex] = targetSchedule;
                    localStorage.setItem(rosterKey, JSON.stringify(schedules));
                }
            }

            return { schedule: targetSchedule };
        } catch (error) {
            console.error("Error updating course in localStorage:", error);
            throw error;
        }
    },
    
    async deleteCourse(
        scheduleId: string,
        courseId: string
    ): Promise<{ schedule: Schedule }> {
        try {
            // Find the schedule across all rosters
            let targetSchedule: Schedule | null = null;
            let rosterKey = "";

            for (const key of Object.keys(localStorage)) {
                if (key.startsWith("schedules_")) {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const schedules: Schedule[] = JSON.parse(stored);
                        const found = schedules.find(s => s.id === scheduleId);
                        if (found) {
                            targetSchedule = found;
                            rosterKey = key;
                            break;
                        }
                    }
                }
            }

            if (!targetSchedule || !rosterKey) {
                throw new Error("Schedule not found");
            }

            // Remove the course
            targetSchedule.courses = targetSchedule.courses.filter(c => c.id !== courseId);
            targetSchedule.updatedAt = new Date().toISOString();

            // Save back to localStorage
            const stored = localStorage.getItem(rosterKey);
            if (stored) {
                const schedules: Schedule[] = JSON.parse(stored);
                const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
                if (scheduleIndex >= 0) {
                    schedules[scheduleIndex] = targetSchedule;
                    localStorage.setItem(rosterKey, JSON.stringify(schedules));
                }
            }

            return { schedule: targetSchedule };
        } catch (error) {
            console.error("Error deleting course from localStorage:", error);
            throw error;
        }
    },
};

export default API;