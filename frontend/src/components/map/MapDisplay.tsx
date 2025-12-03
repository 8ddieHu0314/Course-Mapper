import { useEffect, useState, useMemo } from "react";
import { Paper, Loader, Center, Text } from "@mantine/core";
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow } from "@react-google-maps/api";
import { CircleMarker } from "./AdvancedMarker";
import { DayOfTheWeek, getDayAbbreviation } from "../../utils/calendar-utils";
import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import { TBANotice } from "./TBANotice";
import { RouteList } from "./RouteList";

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
}

const POLYLINE_COLORS = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
];

export const MapDisplay = ({ courses, day }: MapDisplayProps) => {
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
            const dummyRoutes: typeof routes = [];

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

                    dummyRoutes.push({
                        path,
                        color: POLYLINE_COLORS[i % POLYLINE_COLORS.length],
                        fromCourse: fromLabel,
                        toCourse: toLabel,
                    });
                }
            }

            setRoutes(dummyRoutes);
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
                                    color={POLYLINE_COLORS[idx % POLYLINE_COLORS.length]}
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
                                >
                                    <div style={{ padding: "8px" }}>
                                        <strong>{selectedMarker}</strong>
                                        <p>{dayMeeting.timeStart} - {dayMeeting.timeEnd}</p>
                                        <p>{dayMeeting.displayLocation || dayMeeting.facilityDescr || dayMeeting.bldgDescr}</p>
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
