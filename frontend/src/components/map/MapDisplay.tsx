import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Paper, Loader, Center, Text } from "@mantine/core";
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow } from "@react-google-maps/api";
import { CircleMarker } from "./AdvancedMarker";
import { DayOfTheWeek, getDayAbbreviation } from "../../utils/calendar-utils";
import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import { createCourseColorMap, getCourseMarkerColor } from "../../utils/scheduleTransform";
import { TBANotice } from "./TBANotice";
import { RouteList } from "./RouteList";
import API from "../../utils/api";
import { decodePolyline } from "../../utils/polyline";
import "./MapStyles.css";

interface CourseDayItem {
    block: {
        code: string;
        timeStart: string;
        timeEnd: string;
    };
    metadata: ScheduledCourse | null;
}

interface MapDisplayProps {
    courses: CourseDayItem[];
    day: DayOfTheWeek;
    allCourses?: ScheduledCourse[]; // All courses for consistent color mapping
}

export const MapDisplay = ({ courses, day, allCourses }: MapDisplayProps) => {
    // Cache routes by day to avoid recalculating when switching days
    // Store both the routes and the coursesKey that was used to generate them
    // Use a ref to track the current cache so useMemo can read the latest value
    const [routesCache, setRoutesCache] = useState<Map<DayOfTheWeek, {
        routes: Array<{
            path: Array<{ lat: number; lng: number }>;
            color: string;
            fromCourse: string;
            toCourse: string;
        }>;
        coursesKey: string;
    }>>(new Map());
    const routesCacheRef = useRef(routesCache);
    routesCacheRef.current = routesCache;
    
    const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
    
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    });

    const dayAbbr = getDayAbbreviation(day);

    // Create unified color map - use allCourses if provided for consistency across views
    const courseColorMap = useMemo(() => {
        const coursesToMap = allCourses || courses
            .filter((c) => c.metadata !== null)
            .map((c) => c.metadata as ScheduledCourse);
        return createCourseColorMap(coursesToMap);
    }, [allCourses, courses]);

    // Helper to get marker color for a course
    const getMarkerColor = (courseCode: string): string => {
        return getCourseMarkerColor(courseCode, courseColorMap);
    };

    // Compute TBA courses for the notice
    const tbaCourses = useMemo(() => {
        return courses
            .filter((course) => {
                const dayMeeting = course.metadata?.meetings.find(
                    (m: ScheduledMeeting) => m.pattern.includes(dayAbbr)
                );
                return dayMeeting && (!dayMeeting.coordinates || dayMeeting.displayLocation === "TBA");
            })
            .map((course) => ({
                courseCode: `${course.metadata?.subject} ${course.metadata?.catalogNbr}`,
            }));
    }, [courses, dayAbbr]);

    // Track if component is mounted to prevent state updates after unmount
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Create a stable key for courses to detect when they actually change
    // This key includes the day so we can detect when courses change for a specific day
    const coursesKey = useMemo(() => {
        return `${day}-${courses
            .map((c) => {
                if (!c.metadata) return '';
                const dayMeeting = c.metadata.meetings.find((m: ScheduledMeeting) =>
                    m.pattern.includes(dayAbbr)
                );
                return `${c.metadata.subject}-${c.metadata.catalogNbr}-${dayMeeting?.coordinates?.lat}-${dayMeeting?.coordinates?.lng}`;
            })
            .join('|')}`;
    }, [courses, day, dayAbbr]);

    // Get routes for current day from cache (if coursesKey matches)
    // Use useMemo to ensure routes update when day or coursesKey changes
    // We need to track the cache size and the specific day's cache to detect changes
    const [cacheVersion, setCacheVersion] = useState(0);
    
    const routes = useMemo(() => {
        // Read from ref to get the latest cache value
        const cachedData = routesCacheRef.current.get(day);
        // Only return routes if they match the current day and coursesKey exactly
        // Add strict validation: cached data must exist, match day, and match coursesKey
        if (cachedData && cachedData.coursesKey === coursesKey) {
            // Additional validation: ensure coursesKey starts with the current day
            // This prevents routes from other days from being returned
            if (cachedData.coursesKey.startsWith(`${day}-`)) {
                // Double-check: ensure we're only returning routes for the current day
                // Return a new array reference to avoid mutation issues
                return [...cachedData.routes];
            }
        }
        // Return empty array if no cache, coursesKey doesn't match, or day doesn't match
        return [];
    }, [cacheVersion, day, coursesKey]);

    // Clear routes immediately when day changes to prevent showing stale routes
    // This ensures routes useMemo returns empty array immediately when day changes
    useEffect(() => {
        // Immediately clear routes for the new day by removing it from cache
        // This ensures routes useMemo returns empty array before new routes are calculated
        setRoutesCache((prev) => {
            const newCache = new Map(prev);
            // Remove the entry for the current day to force recalculation
            newCache.delete(day);
            // Update ref synchronously to ensure routes useMemo sees the cleared cache
            routesCacheRef.current = newCache;
            // Increment cacheVersion to trigger useMemo recalculation
            setCacheVersion((v) => v + 1);
            return newCache;
        });
    }, [day]);

    useEffect(() => {
        // Check if routes for this day are already cached with matching coursesKey
        // Use routesCacheRef to get the latest cache state
        const cachedData = routesCacheRef.current.get(day);
        if (cachedData && cachedData.coursesKey === coursesKey) {
            // Routes already exist for this day with matching courses, no need to recalculate
            return;
        }

        // Early return if no courses or only one course (no routes possible)
        if (courses.length < 2) {
            // Cache empty routes for this day to ensure no routes are shown
            setRoutesCache((prev) => {
                const newCache = new Map(prev);
                newCache.set(day, { routes: [], coursesKey });
                // Update ref synchronously to ensure routes useMemo sees the update
                routesCacheRef.current = newCache;
                setCacheVersion((v) => v + 1); // Increment to trigger useMemo update
                return newCache;
            });
            return;
        }

        // Create AbortController for cleanup
        const abortController = new AbortController();
        // Store the day and coursesKey at the start of calculation to validate later
        const calculationDay = day;
        const calculationCoursesKey = coursesKey;

        const calculateRoutes = async () => {
            // Validate we're still calculating for the correct day and courses
            // If day or courses changed, abort calculation
            if (calculationDay !== day || calculationCoursesKey !== coursesKey) {
                return;
            }

            const routePromises: Promise<{
                path: Array<{ lat: number; lng: number }>;
                color: string;
                fromCourse: string;
                toCourse: string;
            } | null>[] = [];

            // Iterate through consecutive course pairs
            for (let i = 0; i < courses.length - 1; i++) {
                const fromCourse = courses[i];
                const toCourse = courses[i + 1];

                // Validate both courses have metadata
                if (!fromCourse.metadata || !toCourse.metadata) {
                    continue;
                }

                // Get meetings for the selected day - ensure we only use meetings for this specific day
                const fromMeeting = fromCourse.metadata.meetings.find((m: ScheduledMeeting) =>
                    m.pattern.includes(dayAbbr)
                );
                const toMeeting = toCourse.metadata.meetings.find((m: ScheduledMeeting) =>
                    m.pattern.includes(dayAbbr)
                );

                // Validate meetings exist (they should already be filtered by dayAbbr)
                if (!fromMeeting || !toMeeting) {
                    continue;
                }

                // Validate coordinates exist and are valid numbers
                const fromCoords = fromMeeting.coordinates;
                const toCoords = toMeeting.coordinates;

                if (
                    !fromCoords ||
                    !toCoords ||
                    typeof fromCoords.lat !== "number" ||
                    typeof fromCoords.lng !== "number" ||
                    typeof toCoords.lat !== "number" ||
                    typeof toCoords.lng !== "number" ||
                    isNaN(fromCoords.lat) ||
                    isNaN(fromCoords.lng) ||
                    isNaN(toCoords.lat) ||
                    isNaN(toCoords.lng)
                ) {
                    continue;
                }

                // Validate coordinates are within reasonable bounds (Cornell area)
                if (
                    fromCoords.lat < 42.4 ||
                    fromCoords.lat > 42.5 ||
                    fromCoords.lng < -76.5 ||
                    fromCoords.lng > -76.4 ||
                    toCoords.lat < 42.4 ||
                    toCoords.lat > 42.5 ||
                    toCoords.lng < -76.5 ||
                    toCoords.lng > -76.4
                ) {
                    continue;
                }

                const fromLabel = `${fromCourse.metadata.subject} ${fromCourse.metadata.catalogNbr}`;
                const toLabel = `${toCourse.metadata.subject} ${toCourse.metadata.catalogNbr}`;

                // Create promise for this route
                const routePromise = (async () => {
                    try {
                        // Call Google Maps Directions API
                        const directions = await API.getDirections(fromCoords, toCoords);

                        // Check if component is still mounted and request wasn't aborted
                        if (!mountedRef.current || abortController.signal.aborted) {
                            return null;
                        }

                        // Validate API response
                        if (!directions || !directions.polyline || typeof directions.polyline !== "string") {
                            console.warn(`Invalid directions response for ${fromLabel} → ${toLabel}`);
                            return null;
                        }

                        // Decode polyline
                        const decodedPath = decodePolyline(directions.polyline);

                        // Validate decoded path
                        if (!decodedPath || decodedPath.length < 2) {
                            console.warn(`Invalid decoded path for ${fromLabel} → ${toLabel}`);
                            return null;
                        }

                        // Validate all coordinates in path are valid
                        const validPath = decodedPath.filter(
                            (coord) =>
                                coord &&
                                typeof coord.lat === "number" &&
                                typeof coord.lng === "number" &&
                                !isNaN(coord.lat) &&
                                !isNaN(coord.lng)
                        );

                        if (validPath.length < 2) {
                            console.warn(`Insufficient valid coordinates in path for ${fromLabel} → ${toLabel}`);
                            return null;
                        }

                        // Check again if component is still mounted before returning route
                        if (!mountedRef.current || abortController.signal.aborted) {
                            return null;
                        }

                        // Return route object
                        return {
                            path: validPath,
                            color: "#666666",
                            fromCourse: fromLabel,
                            toCourse: toLabel,
                        };
                    } catch (error) {
                        // Handle errors gracefully - log but don't crash
                        if (abortController.signal.aborted) {
                            return null; // Request was cancelled, ignore error
                        }
                        console.error(`Failed to get directions for ${fromLabel} → ${toLabel}:`, error);
                        // Return null to indicate this route failed
                        return null;
                    }
                })();

                routePromises.push(routePromise);
            }

            // Wait for all route calculations to complete (or fail)
            // Use allSettled so one failure doesn't block others
            const results = await Promise.allSettled(routePromises);

            // Check if component is still mounted, request wasn't aborted, and day/courses haven't changed
            if (!mountedRef.current || abortController.signal.aborted) {
                return;
            }

            // Validate we're still on the same day and coursesKey hasn't changed
            // If day or courses changed during calculation, don't cache these routes
            if (calculationDay !== day || calculationCoursesKey !== coursesKey) {
                return;
            }

            // Collect all successful routes
            const calculatedRoutes = results
                .map((result) => {
                    if (result.status === "fulfilled" && result.value !== null) {
                        return result.value;
                    }
                    return null;
                })
                .filter((route): route is NonNullable<typeof route> => route !== null);

            // Update cache with routes for this day
            // Add validation: only cache routes if they match the current day and coursesKey
            if (mountedRef.current && !abortController.signal.aborted) {
                // Double-check that we're still on the same day and coursesKey hasn't changed
                // This prevents caching routes for the wrong day if user switches days quickly
                const currentCachedData = routesCacheRef.current.get(day);
                if (currentCachedData && currentCachedData.coursesKey !== coursesKey) {
                    // coursesKey has changed, don't cache these routes
                    return;
                }
                
                setRoutesCache((prev) => {
                    const newCache = new Map(prev);
                    // Only set routes for the current day with the current coursesKey
                    newCache.set(day, { routes: calculatedRoutes, coursesKey });
                    // Update ref synchronously to ensure routes useMemo sees the update immediately
                    routesCacheRef.current = newCache;
                    setCacheVersion((v) => v + 1); // Increment to trigger useMemo update
                    return newCache;
                });
            }
        };

        calculateRoutes();

        // Cleanup function
        return () => {
            abortController.abort();
        };
    }, [coursesKey, day, dayAbbr]);

    return (
        <Paper p="md" withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "1rem" }}>
                <h3>Walking Routes - {day}</h3>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    Colored lines show walking paths between your classes
                </p>
            </div>

            <div style={{ flex: 1, borderRadius: "8px", overflow: "hidden" }}>
                {loadError && (
                    <Center style={{ height: "100%", flexDirection: "column" }}>
                        <Text color="red" size="sm">Failed to load Google Maps</Text>
                        <Text color="dimmed" size="xs">Check your API key configuration</Text>
                    </Center>
                )}
                {!isLoaded && !loadError && (
                    <Center style={{ height: "100%" }}>
                        <Loader size="lg" />
                    </Center>
                )}
                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={{ lat: 42.4534, lng: -76.4735 }}
                        zoom={16}
                        options={{
                            fullscreenControl: false,
                            mapTypeControl: false,
                            streetViewControl: false,
                            clickableIcons: false,
                        }}
                    >
                        {/* Draw routes between classes */}
                        {routes.map((route, idx) => {
                            // Validate route has valid path before rendering
                            if (!route.path || route.path.length < 2) {
                                return null;
                            }
                            // Include day in key to ensure Polylines are remounted when day changes
                            return (
                                <Polyline
                                    key={`${day}-${route.fromCourse}-${route.toCourse}-${idx}`}
                                    path={route.path}
                                    options={{
                                        strokeColor: route.color,
                                        strokeOpacity: 0.8,
                                        strokeWeight: 4,
                                        geodesic: true,
                                    }}
                                />
                            );
                        })}

                        {/* Mark class locations */}
                        {courses.map((course, idx) => {
                            const dayMeeting = course.metadata?.meetings.find(
                                (m: ScheduledMeeting) => m.pattern.includes(dayAbbr)
                            );

                            if (!dayMeeting || !dayMeeting.coordinates) return null;

                            const courseLabel = `${course.metadata?.subject} ${course.metadata?.catalogNbr}`;

                            return (
                                <CircleMarker
                                    key={idx}
                                    position={dayMeeting.coordinates}
                                    onClick={() => setSelectedMarker(courseLabel)}
                                    color={getMarkerColor(courseLabel)}
                                    size={24}
                                    title={courseLabel}
                                />
                            );
                        })}

                        {/* Single InfoWindow - rendered outside of markers */}
                        {selectedMarker && (() => {
                            const selectedCourse = courses.find((c) => {
                                const label = `${c.metadata?.subject} ${c.metadata?.catalogNbr}`;
                                return label === selectedMarker;
                            });
                            const dayMeeting = selectedCourse?.metadata?.meetings.find(
                                (m: ScheduledMeeting) => m.pattern.includes(dayAbbr)
                            );
                            if (!dayMeeting?.coordinates) return null;

                            return (
                                <InfoWindow
                                    position={dayMeeting.coordinates}
                                    onCloseClick={() => setSelectedMarker(null)}
                                    options={{ maxWidth: 180 }}
                                >
                                    <div style={{ 
                                        padding: "8px 24px 8px 8px", 
                                        maxWidth: "160px",
                                        lineHeight: 1.3
                                    }}>
                                        <div style={{ 
                                            fontSize: "13px", 
                                            fontWeight: 600,
                                            marginBottom: "4px",
                                            wordWrap: "break-word"
                                        }}>
                                            {selectedMarker}
                                        </div>
                                        <div style={{ 
                                            fontSize: "11px", 
                                            color: "#666",
                                            marginBottom: "2px"
                                        }}>
                                            {dayMeeting.timeStart} - {dayMeeting.timeEnd}
                                        </div>
                                        <div style={{ 
                                            fontSize: "11px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}>
                                            {dayMeeting.displayLocation || dayMeeting.facilityDescr || dayMeeting.bldgDescr}
                                        </div>
                                    </div>
                                </InfoWindow>
                            );
                        })()}
                    </GoogleMap>
                )}
            </div>

            {/* TBA Courses Notice */}
            <div style={{ marginTop: "1rem" }}>
                <TBANotice courses={tbaCourses} />
            </div>

            {/* Route List */}
            <RouteList routes={routes} />
        </Paper>
    );
};
