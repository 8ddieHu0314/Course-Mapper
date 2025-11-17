import { useEffect, useRef, useState } from "react";
import { GoogleMap as GoogleMapComponent, LoadScript, Polyline, Marker } from "@react-google-maps/api";
import { ScheduledCourse } from "@full-stack/types";
import { getCoursesForDay, getMeetingsForDay } from "../utils/walkingTime";
import API from "../utils/api";

interface DayMapProps {
    courses: ScheduledCourse[];
    day: string;
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 42.4534,
    lng: -76.4735,
};

const defaultZoom = 16;

type LatLngLiteral = { lat: number; lng: number };
type GoogleMapInstance = {
    fitBounds: (bounds: unknown) => void;
};

export const DayMap = ({ courses, day }: DayMapProps) => {
    const mapRef = useRef<GoogleMapInstance | null>(null);
    const [paths, setPaths] = useState<LatLngLiteral[][]>([]);
    const [markers, setMarkers] = useState<Array<{ position: LatLngLiteral; label: string }>>([]);

    useEffect(() => {
        const loadMapData = async () => {
            const dayCourses = getCoursesForDay(courses, day);
            const sortedCourses = dayCourses.sort((a, b) => {
                const aMeeting = getMeetingsForDay(a, day)[0];
                const bMeeting = getMeetingsForDay(b, day)[0];
                if (!aMeeting || !bMeeting) return 0;
                return aMeeting.timeStart.localeCompare(bMeeting.timeStart);
            });

            const newMarkers: Array<{ position: LatLngLiteral; label: string }> = [];
            const newPaths: LatLngLiteral[][] = [];

            for (let i = 0; i < sortedCourses.length; i++) {
                const course = sortedCourses[i];
                const meeting = getMeetingsForDay(course, day)[0];
                if (!meeting) continue;

                // Get or cache coordinates
                if (!meeting.coordinates) {
                    try {
                        const geocode = await API.geocode(
                            `${meeting.bldgDescr}, Ithaca, NY`
                        );
                        meeting.coordinates = { lat: geocode.lat, lng: geocode.lng };
                    } catch (err) {
                        console.error("Geocoding error:", err);
                        continue;
                    }
                }

                newMarkers.push({
                    position: meeting.coordinates,
                    label: `${i + 1}`,
                });

                // Draw path to next course
                if (i < sortedCourses.length - 1) {
                    const nextCourse = sortedCourses[i + 1];
                    const nextMeeting = getMeetingsForDay(nextCourse, day)[0];
                    if (nextMeeting) {
                        if (!nextMeeting.coordinates) {
                            try {
                                const geocode = await API.geocode(
                                    `${nextMeeting.bldgDescr}, Ithaca, NY`
                                );
                                nextMeeting.coordinates = {
                                    lat: geocode.lat,
                                    lng: geocode.lng,
                                };
                            } catch (err) {
                                console.error("Geocoding error:", err);
                                continue;
                            }
                        }

                        try {
                            await API.getDirections(
                                meeting.coordinates!,
                                nextMeeting.coordinates!
                            );

                            // For now, use straight line between points
                            // In the future, could decode the polyline from directions response
                            newPaths.push([
                                meeting.coordinates!,
                                nextMeeting.coordinates!,
                            ]);
                        } catch (err) {
                            console.error("Directions error:", err);
                            // Fallback to straight line
                            newPaths.push([
                                meeting.coordinates!,
                                nextMeeting.coordinates!,
                            ]);
                        }
                    }
                }
            }

            setMarkers(newMarkers);
            setPaths(newPaths);

            // Fit bounds to show all markers
            if (mapRef.current && newMarkers.length > 0 && typeof window !== "undefined" && (window as { google?: { maps?: { LatLngBounds: new () => { extend: (pos: LatLngLiteral) => void; }; }; }; }).google?.maps) {
                const GoogleMaps = (window as { google: { maps: { LatLngBounds: new () => { extend: (pos: LatLngLiteral) => void; }; }; }; }).google.maps;
                const bounds = new GoogleMaps.LatLngBounds();
                newMarkers.forEach((marker) => bounds.extend(marker.position));
                mapRef.current.fitBounds(bounds);
            }
        };

        loadMapData();
    }, [courses, day]);

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                Google Maps API key not configured
            </div>
        );
    }

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
        >
            <GoogleMapComponent
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={defaultZoom}
                onLoad={(map) => {
                    mapRef.current = map as GoogleMapInstance;
                }}
            >
                {paths.map((path, idx) => (
                    <Polyline
                        key={idx}
                        path={path}
                        options={{
                            strokeColor: "#FF0000",
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                        }}
                    />
                ))}
                {markers.map((marker, idx) => (
                    <Marker
                        key={idx}
                        position={marker.position}
                        label={marker.label}
                    />
                ))}
            </GoogleMapComponent>
        </LoadScript>
    );
};

