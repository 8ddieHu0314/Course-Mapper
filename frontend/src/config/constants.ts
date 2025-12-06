/**
 * Centralized application configuration constants
 * This file contains all configuration values used across the application
 */

/**
 * Default and available roster configurations
 */
export const ROSTER_CONFIG = {
    /** Default roster for course searches and schedules */
    DEFAULT: "SP26",
    /** Available rosters for selection */
    AVAILABLE: ["FA25", "SP26"] as const,
} as const;

/**
 * Google Maps configuration
 */
export const MAPS_CONFIG = {
    /** Default center coordinates (Cornell University campus) */
    DEFAULT_CENTER: {
        lat: 42.4534,
        lng: -76.4735,
    },
    /** Default zoom level for campus view */
    DEFAULT_ZOOM: 16,
    /** Fallback coordinates when geocoding fails */
    FALLBACK_COORDS: {
        lat: 42.4534,
        lng: -76.4735,
    },
} as const;

/**
 * Walking time configuration for schedule validation
 */
export const WALKING_CONFIG = {
    /** Minimum walking time threshold in minutes to trigger a warning */
    WARNING_THRESHOLD_MINUTES: 10,
    /** Buffer time to add when calculating walking feasibility (in minutes) */
    BUFFER_MINUTES: 2,
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
    /** Request timeout in milliseconds */
    TIMEOUT_MS: 10000,
    /** Number of retry attempts for failed requests */
    RETRY_ATTEMPTS: 3,
    /** Cache TTL in milliseconds (5 minutes) */
    CACHE_TTL_MS: 5 * 60 * 1000,
} as const;

/**
 * Schedule display configuration
 */
export const SCHEDULE_CONFIG = {
    /** Days of the week to display in schedule views */
    WEEKDAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const,
    /** Default hour range for empty schedules */
    DEFAULT_MIN_HOUR: 8,
    DEFAULT_MAX_HOUR: 16,
    /** Height in pixels per hour in the timetable */
    HOUR_HEIGHT_PX: 60,
    /** Header offset in pixels for the timetable */
    HEADER_OFFSET_PX: 50,
} as const;

/**
 * Type exports for roster values
 */
export type Roster = typeof ROSTER_CONFIG.AVAILABLE[number];
export type Weekday = typeof SCHEDULE_CONFIG.WEEKDAYS[number];

