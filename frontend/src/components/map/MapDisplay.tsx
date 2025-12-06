import { useEffect, useLayoutEffect, useState, useMemo, useRef, useCallback } from "react";
import { Paper, Loader, Center, Text } from "@mantine/core";
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow } from "@react-google-maps/api";
import { CircleMarker } from "./AdvancedMarker";
import { DayOfTheWeek, getDayAbbreviation } from "../../utils/calendar-utils";
import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import { createCourseColorMap, getCourseMarkerColor } from "../../utils/scheduleTransform";
import { isMultiSectionMode } from "../../utils/sectionUtils";
import { TBANotice } from "./TBANotice";
import { RouteList } from "./RouteList";
import API from "../../utils/api";
import { decodePolyline } from "../../utils/polyline";
import { MAPS_CONFIG } from "../../config/constants";
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
    // Simple state for current routes - cleared immediately when day changes
    const [routes, setRoutes] = useState<Array<{
        path: Array<{ lat: number; lng: number }>;
        color: string;
        fromCourse: string;
        toCourse: string;
    }>>([]);
    
    // Track which day the current routes belong to
    const [routesDay, setRoutesDay] = useState<DayOfTheWeek | null>(null);
    
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

    // Helper to find the meeting for a specific day from either meetings or selectedSections
    const findDayMeeting = useCallback((course: ScheduledCourse | null | undefined): ScheduledMeeting | undefined => {
        if (!course) return undefined;
        
        // Check selectedSections first if in multi-section mode
        if (isMultiSectionMode(course)) {
            for (const section of course.selectedSections!) {
                const meeting = section.meetings.find((m: ScheduledMeeting) => 
                    m.pattern.includes(dayAbbr)
                );
                if (meeting && meeting.coordinates) {
                    return meeting;
                }
            }
        }
        
        // Fall back to regular meetings
        return course.meetings.find((m: ScheduledMeeting) => m.pattern.includes(dayAbbr));
    }, [dayAbbr]);

    // Compute TBA courses for the notice
    const tbaCourses = useMemo(() => {
        return courses
            .filter((course) => {
                const dayMeeting = findDayMeeting(course.metadata);
                return dayMeeting && (!dayMeeting.coordinates || dayMeeting.displayLocation === "TBA");
            })
            .map((course) => ({
                courseCode: `${course.metadata?.subject} ${course.metadata?.catalogNbr}`,
            }));
    }, [courses, findDayMeeting]);

    // Track if component is mounted to prevent state updates after unmount
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Clear routes immediately when day changes to prevent showing stale routes
    // Use useLayoutEffect to run synchronously before browser paint
    useLayoutEffect(() => {
        // If day changed, clear routes immediately before new ones are calculated
        if (routesDay !== day) {
            setRoutes([]);
            setRoutesDay(day);
        }
    }, [day, routesDay]);

    // Calculate routes when day or courses change
    useEffect(() => {
        // Early return if no courses or only one course (no routes possible)
        if (courses.length < 2) {
            setRoutes([]);
            return;
        }

        // Create AbortController for cleanup
        const abortController = new AbortController();
        // Store the day at the start of calculation to validate later
        const calculationDay = day;

        const calculateRoutes = async () => {
            // Validate we're still calculating for the correct day
            if (calculationDay !== day) {
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

                // Skip if either course doesn't have metadata
                if (!fromCourse.metadata || !toCourse.metadata) {
                    continue;
                }

                // Get meetings for the selected day - check both meetings and selectedSections
                const fromMeeting = findDayMeeting(fromCourse.metadata);
                const toMeeting = findDayMeeting(toCourse.metadata);

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

            // Validate we're still on the same day
            // If day changed during calculation, don't update routes
            if (calculationDay !== day) {
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

            // Update routes state only if still on the same day and not aborted
            if (mountedRef.current && !abortController.signal.aborted && calculationDay === day) {
                setRoutes(calculatedRoutes);
            }
        };

        calculateRoutes();

        return () => {
            abortController.abort();
        };
    }, [courses, day, findDayMeeting]);

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
                        center={MAPS_CONFIG.DEFAULT_CENTER}
                        zoom={MAPS_CONFIG.DEFAULT_ZOOM}
                        options={{
                            fullscreenControl: false,
                            mapTypeControl: false,
                            streetViewControl: false,
                            clickableIcons: false,
                        }}
                    >
                        {/* Draw routes between classes - only if routes belong to current day */}
                        {routesDay === day && routes.map((route, idx) => {
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
                                        strokeOpacity: 1,
                                        strokeWeight: 10,
                                        geodesic: true,
                                    }}
                                />
                            );
                        })}

                        {/* Mark class locations */}
                        {courses.map((course, idx) => {
                            const dayMeeting = findDayMeeting(course.metadata);

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
                            const dayMeeting = findDayMeeting(selectedCourse?.metadata);
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
