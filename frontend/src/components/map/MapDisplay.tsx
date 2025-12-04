import { useEffect, useState, useMemo } from "react";
import { Paper, Loader, Center, Text } from "@mantine/core";
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow } from "@react-google-maps/api";
import { CircleMarker } from "./AdvancedMarker";
import { DayOfTheWeek, getDayAbbreviation } from "../../utils/calendar-utils";
import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import { createCourseColorMap, getCourseMarkerColor } from "../../utils/scheduleTransform";
import { TBANotice } from "./TBANotice";
import { RouteList } from "./RouteList";
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
    const [routes, setRoutes] = useState<Array<{
        path: Array<{ lat: number; lng: number }>;
        color: string;
        fromCourse: string;
        toCourse: string;
    }>>([]);
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

    useEffect(() => {
        const calculateRoutes = () => {
            const calculatedRoutes: typeof routes = [];

            for (let i = 0; i < courses.length - 1; i++) {
                const fromCourse = courses[i];
                const toCourse = courses[i + 1];

                if (fromCourse.metadata && toCourse.metadata) {
                    // Get coordinates from meetings
                    const fromMeeting = fromCourse.metadata.meetings.find((m: ScheduledMeeting) =>
                        m.pattern.includes(dayAbbr)
                    );
                    const toMeeting = toCourse.metadata.meetings.find((m: ScheduledMeeting) =>
                        m.pattern.includes(dayAbbr)
                    );

                    const fromCoords = fromMeeting?.coordinates || { lat: 42.4534, lng: -76.4735 };
                    const toCoords = toMeeting?.coordinates || { lat: 42.4545, lng: -76.4745 };

                    const path = [
                        fromCoords,
                        {
                            lat: (fromCoords.lat + toCoords.lat) / 2,
                            lng: (fromCoords.lng + toCoords.lng) / 2,
                        },
                        toCoords,
                    ];

                    const fromLabel = `${fromCourse.metadata.subject} ${fromCourse.metadata.catalogNbr}`;
                    const toLabel = `${toCourse.metadata.subject} ${toCourse.metadata.catalogNbr}`;

                    // Use gray color for routes to distinguish from markers
                    calculatedRoutes.push({
                        path,
                        color: "#666666",
                        fromCourse: fromLabel,
                        toCourse: toLabel,
                    });
                }
            }

            setRoutes(calculatedRoutes);
        };

        calculateRoutes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courses, day]);

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
                        {routes.map((route, idx) => (
                            <Polyline
                                key={idx}
                                path={route.path}
                                options={{
                                    strokeColor: route.color,
                                    strokeOpacity: 0.8,
                                    strokeWeight: 4,
                                    geodesic: true,
                                }}
                            />
                        ))}

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
