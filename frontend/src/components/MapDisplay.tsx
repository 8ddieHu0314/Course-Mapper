import { useEffect, useState } from "react";
import { Paper } from "@mantine/core";
import { GoogleMap, LoadScript, Polyline, Marker, InfoWindow } from "@react-google-maps/api";
import { DayOfTheWeek } from "../utils/calendar-utils";
import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";

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

    const getDayAbbr = (): string => {
        switch (day) {
            case "Monday":
                return "M";
            case "Tuesday":
                return "T";
            case "Wednesday":
                return "W";
            case "Thursday":
                return "R";
            case "Friday":
                return "F";
            default:
                return "M";
        }
    };

    useEffect(() => {
        const calculateRoutes = () => {
            const dummyRoutes: typeof routes = [];
            const dayAbbr = getDayAbbr();

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
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"}>
                    <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={{ lat: 42.4534, lng: -76.4735 }}
                        zoom={16}
                        options={{
                            fullscreenControl: false,
                            mapTypeControl: false,
                            streetViewControl: false,
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
                            const dayAbbr = getDayAbbr();
                            const dayMeeting = course.metadata?.meetings.find(
                                (m: ScheduledMeeting) => m.pattern.includes(dayAbbr)
                            );

                            if (!dayMeeting || !dayMeeting.coordinates) return null;

                            const courseLabel = `${course.metadata?.subject} ${course.metadata?.catalogNbr}`;

                            return (
                                <div key={idx}>
                                    <Marker
                                        position={dayMeeting.coordinates}
                                        onClick={() => setSelectedMarker(courseLabel)}
                                        icon={{
                                            path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z",
                                            fillColor: POLYLINE_COLORS[idx % POLYLINE_COLORS.length],
                                            fillOpacity: 1,
                                            scale: 2,
                                            strokeColor: "#fff",
                                            strokeWeight: 2,
                                        }}
                                        title={courseLabel}
                                    />
                                    {selectedMarker === courseLabel && (
                                        <InfoWindow position={dayMeeting.coordinates}>
                                            <div style={{ padding: "8px" }}>
                                                <strong>{courseLabel}</strong>
                                                <p>{dayMeeting.timeStart} - {dayMeeting.timeEnd}</p>
                                                <p>{dayMeeting.facilityDescr || dayMeeting.bldgDescr}</p>
                                            </div>
                                        </InfoWindow>
                                    )}
                                </div>
                            );
                        })}
                    </GoogleMap>
                </LoadScript>
            </div>

            {/* Route List */}
            <div style={{ marginTop: "1rem", maxHeight: "150px", overflowY: "auto" }}>
                <strong>Routes ({routes.length}):</strong>
                {routes.length > 0 ? (
                    <ul style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                        {routes.map((route, idx) => (
                            <li key={idx}>
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "2px",
                                        backgroundColor: route.color,
                                        marginRight: "8px",
                                    }}
                                />
                                {route.fromCourse} → {route.toCourse}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.5rem" }}>
                        No routes calculated yet. Ensure courses have coordinates.
                    </p>
                )}
            </div>
        </Paper>
    );
};
