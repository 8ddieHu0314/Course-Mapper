/**
 * API Response Cache
 * Provides in-memory caching for API responses with TTL support
 */

import { API_CONFIG } from "../config/constants";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface CacheOptions {
    /** Time-to-live in milliseconds */
    ttl?: number;
    /** Cache key override (defaults to URL) */
    key?: string;
}

class ApiCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private defaultTTL = API_CONFIG.CACHE_TTL_MS;

    /**
     * Get cached data if available and not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Store data in cache
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const now = Date.now();
        const expiresAt = now + (ttl ?? this.defaultTTL);

        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt,
        });
    }

    /**
     * Check if cache has a valid (non-expired) entry
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Remove entry from cache
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cached entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Clear all expired entries
     */
    clearExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Singleton cache instance
export const apiCache = new ApiCache();

/**
 * Higher-order function to wrap API calls with caching
 */
export function withCache<T>(
    fetcher: () => Promise<T>,
    key: string,
    options?: CacheOptions
): () => Promise<T> {
    return async () => {
        // Check cache first
        const cached = apiCache.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch fresh data
        const data = await fetcher();

        // Store in cache
        apiCache.set(key, data, options?.ttl);

        return data;
    };
}

/**
 * Cache key generators for common API endpoints
 */
export const CacheKeys = {
    cornellSearch: (query: string, roster: string) => 
        `cornell:search:${roster}:${query}`,
    
    cornellSubject: (subject: string, roster: string) => 
        `cornell:subject:${roster}:${subject}`,
    
    geocode: (address: string) => 
        `geocode:${address.toLowerCase().trim()}`,
    
    directions: (originLat: number, originLng: number, destLat: number, destLng: number) =>
        `directions:${originLat},${originLng}:${destLat},${destLng}`,
    
    requirements: () => 
        `requirements:all`,
    
    courseById: (courseId: number) => 
        `course:${courseId}`,
};

export default apiCache;

