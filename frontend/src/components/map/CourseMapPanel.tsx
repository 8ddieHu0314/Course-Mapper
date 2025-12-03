import { useState, useMemo } from "react";
import { Text, Stack, Loader, Center } from "@mantine/core";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { ScheduledCourse } from "@full-stack/types";
import { getCourseColor } from "../../utils/scheduleTransform";
import { TBANotice } from "./TBANotice";

interface CourseMapPanelProps {
    courses: ScheduledCourse[];
}

interface CourseLocation {
    id: string;
    courseCode: string;
    title: string;
    building: string;
    coordinates: { lat: number; lng: number };
    color: string;
    ssrComponent: string;
}

// Cornell campus center coordinates
const CORNELL_CENTER = { lat: 42.4534, lng: -76.4735 };

export const CourseMapPanel = ({ courses }: CourseMapPanelProps) => {
    const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
    
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    });

    // Extract unique course locations with their colors
    const { courseLocations, tbaCourses } = useMemo(() => {
        const locations: CourseLocation[] = [];
        const tbaList: Array<{ courseCode: string; title: string; ssrComponent: string }> = [];
        const seenLocations = new Set<string>();
        const seenTBA = new Set<string>();

        courses.forEach((course) => {
            const courseCode = `${course.subject} ${course.catalogNbr}`;
            
            // Check selectedSections first, then fall back to meetings
            const sections = course.selectedSections && course.selectedSections.length > 0
                ? course.selectedSections
                : [{ meetings: course.meetings, ssrComponent: course.ssrComponent }];

            sections.forEach((section) => {
                section.meetings.forEach((meeting) => {
                    const locationKey = `${courseCode}-${meeting.bldgDescr}-${section.ssrComponent}`;
                    
                    if (meeting.coordinates) {
                        // Has coordinates - add to map
                        if (!seenLocations.has(locationKey)) {
                            seenLocations.add(locationKey);
                            
                            const color = getCourseColor(course.subject, section.ssrComponent);
                            
                            locations.push({
                                id: locationKey,
                                courseCode,
                                title: course.title,
                                building: meeting.displayLocation || meeting.facilityDescr || meeting.bldgDescr || "Unknown Location",
                                coordinates: meeting.coordinates,
                                color,
                                ssrComponent: section.ssrComponent,
                            });
                        }
                    } else if (meeting.displayLocation === "TBA" || !meeting.displayLocation) {
                        // TBA location - track separately
                        const tbaKey = `${courseCode}-${section.ssrComponent}`;
                        if (!seenTBA.has(tbaKey)) {
                            seenTBA.add(tbaKey);
                            tbaList.push({
                                courseCode,
                                title: course.title,
                                ssrComponent: section.ssrComponent,
                            });
                        }
                    }
                });
            });
        });

        return { courseLocations: locations, tbaCourses: tbaList };
    }, [courses]);

    // Calculate map bounds to fit all markers
    const mapCenter = useMemo(() => {
        if (courseLocations.length === 0) return CORNELL_CENTER;
        
        const avgLat = courseLocations.reduce((sum, loc) => sum + loc.coordinates.lat, 0) / courseLocations.length;
        const avgLng = courseLocations.reduce((sum, loc) => sum + loc.coordinates.lng, 0) / courseLocations.length;
        
        return { lat: avgLat, lng: avgLng };
    }, [courseLocations]);

    // Convert hex color to a darker shade for pin
    const getDarkerColor = (color: string): string => {
        // If it's an HSL color, darken it
        if (color.startsWith("hsl")) {
            return color.replace(/85%\)$/, "45%)");
        }
        // For hex colors, return as-is (they're already light background colors)
        // We'll use a mapping for component types
        const componentColorMap: Record<string, string> = {
            "#e3f2fd": "#1976d2", // LEC - blue
            "#f3e5f5": "#7b1fa2", // DIS - purple
            "#e8f5e9": "#388e3c", // REC - green
            "#fff3e0": "#f57c00", // LAB - orange
            "#fce4ec": "#c2185b", // PRJ - pink
        };
        return componentColorMap[color] || "#666666";
    };

    return (
        <Stack spacing="md" style={{ height: "100%", padding: "16px" }}>
            <div>
                <Text weight={600} size="lg">Course Locations</Text>
                <Text size="sm" color="dimmed">
                    {courseLocations.length > 0 
                        ? `${courseLocations.length} location${courseLocations.length !== 1 ? "s" : ""} on map`
                        : courses.length > 0
                            ? "Room assignments not yet available for this semester"
                            : "Add courses to see their locations"}
                </Text>
            </div>

            <div style={{ flex: 1, borderRadius: "8px", overflow: "hidden", minHeight: "300px" }}>
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
                        center={mapCenter}
                        zoom={16}
                        options={{
                            fullscreenControl: false,
                            mapTypeControl: false,
                            streetViewControl: false,
                        }}
                    >
                        {courseLocations.map((location) => {
                            const pinColor = getDarkerColor(location.color);
                            
                            return (
                                <div key={location.id}>
                                    <Marker
                                        position={location.coordinates}
                                        onClick={() => setSelectedMarker(location.id)}
                                        icon={{
                                            path: google.maps.SymbolPath.CIRCLE,
                                            fillColor: pinColor,
                                            fillOpacity: 1,
                                            scale: 10,
                                            strokeColor: "#fff",
                                            strokeWeight: 2,
                                        }}
                                        title={location.courseCode}
                                    />
                                    {selectedMarker === location.id && (
                                        <InfoWindow
                                            position={location.coordinates}
                                            onCloseClick={() => setSelectedMarker(null)}
                                        >
                                            <div style={{ padding: "4px", minWidth: "150px" }}>
                                                <strong style={{ fontSize: "14px" }}>{location.courseCode}</strong>
                                                <p style={{ margin: "4px 0", fontSize: "12px", color: "#666" }}>
                                                    {location.title}
                                                </p>
                                                <p style={{ margin: "4px 0", fontSize: "12px" }}>
                                                    <span style={{ 
                                                        display: "inline-block",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        backgroundColor: location.color,
                                                        marginRight: "8px",
                                                        fontSize: "11px"
                                                    }}>
                                                        {location.ssrComponent}
                                                    </span>
                                                    {location.building}
                                                </p>
                                            </div>
                                        </InfoWindow>
                                    )}
                                </div>
                            );
                        })}
                    </GoogleMap>
                )}
            </div>

            {/* TBA Courses Notice */}
            <TBANotice courses={tbaCourses} />

            {/* Course Legend */}
            {courseLocations.length > 0 && (
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                    <Text size="sm" weight={500} mb="xs">Courses on map:</Text>
                    {courseLocations.map((location) => (
                        <div 
                            key={location.id}
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                marginBottom: "6px",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "4px",
                                backgroundColor: selectedMarker === location.id ? "#f5f5f5" : "transparent"
                            }}
                            onClick={() => setSelectedMarker(location.id)}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "50%",
                                    backgroundColor: getDarkerColor(location.color),
                                    marginRight: "8px",
                                    border: "2px solid white",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                                }}
                            />
                            <span style={{ fontSize: "13px" }}>
                                <strong>{location.courseCode}</strong>
                                <span style={{ color: "#666", marginLeft: "8px" }}>
                                    {location.building}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Stack>
    );
};
