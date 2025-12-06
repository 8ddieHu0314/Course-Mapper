import { useState, useMemo } from "react";
import { Text, Stack, Loader, Center } from "@mantine/core";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { CircleMarker } from "../map/AdvancedMarker";
import { ScheduledCourse } from "@full-stack/types";
import { createCourseColorMap, getCourseMarkerColor, getCourseBackgroundColor } from "../../utils/scheduleTransform";
import { isMultiSectionMode } from "../../utils/sectionUtils";
import { TBANotice } from "../map/TBANotice";
import { MAPS_CONFIG } from "../../config/constants";
import "../map/MapStyles.css";

interface CoursePanelMapProps {
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

export const CoursePanelMap = ({ courses }: CoursePanelMapProps) => {
    const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
    
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    });

    // Create unified color map for all courses
    const courseColorMap = useMemo(() => createCourseColorMap(courses), [courses]);

    // Extract unique course locations with their colors
    const { courseLocations, tbaCourses } = useMemo(() => {
        const locations: CourseLocation[] = [];
        const tbaList: Array<{ courseCode: string; title: string; ssrComponent: string }> = [];
        const seenLocations = new Set<string>();
        const seenTBA = new Set<string>();

        courses.forEach((course) => {
            const courseCode = `${course.subject} ${course.catalogNbr}`;
            
            // Check selectedSections first, then fall back to meetings
            const sections = isMultiSectionMode(course)
                ? course.selectedSections!
                : [{ meetings: course.meetings, ssrComponent: course.ssrComponent }];

            sections.forEach((section) => {
                section.meetings.forEach((meeting) => {
                    const locationKey = `${courseCode}-${meeting.bldgDescr}-${section.ssrComponent}`;
                    
                    if (meeting.coordinates) {
                        // Has coordinates - add to map
                        if (!seenLocations.has(locationKey)) {
                            seenLocations.add(locationKey);
                            
                            locations.push({
                                id: locationKey,
                                courseCode,
                                title: course.title,
                                building: meeting.displayLocation || meeting.facilityDescr || meeting.bldgDescr || "Unknown Location",
                                coordinates: meeting.coordinates,
                                color: getCourseBackgroundColor(courseCode, courseColorMap),
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
    }, [courses, courseColorMap]);

    // Calculate map bounds to fit all markers
    const mapCenter = useMemo(() => {
        if (courseLocations.length === 0) return MAPS_CONFIG.DEFAULT_CENTER;
        
        const avgLat = courseLocations.reduce((sum, loc) => sum + loc.coordinates.lat, 0) / courseLocations.length;
        const avgLng = courseLocations.reduce((sum, loc) => sum + loc.coordinates.lng, 0) / courseLocations.length;
        
        return { lat: avgLat, lng: avgLng };
    }, [courseLocations]);

    // Get marker color for a course
    const getMarkerColor = (courseCode: string): string => {
        return getCourseMarkerColor(courseCode, courseColorMap);
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
                            clickableIcons: false,
                        }}
                    >
                        {courseLocations.map((location) => (
                            <CircleMarker
                                key={location.id}
                                position={location.coordinates}
                                onClick={() => setSelectedMarker(location.id)}
                                color={getMarkerColor(location.courseCode)}
                                size={20}
                                title={location.courseCode}
                            />
                        ))}

                        {/* Single InfoWindow - rendered outside of markers */}
                        {selectedMarker && (() => {
                            const location = courseLocations.find((loc) => loc.id === selectedMarker);
                            if (!location) return null;

                            return (
                                <InfoWindow
                                    position={location.coordinates}
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
                                            {location.courseCode}
                                        </div>
                                        <div style={{ 
                                            fontSize: "11px", 
                                            color: "#666",
                                            marginBottom: "4px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}>
                                            {location.title}
                                        </div>
                                        <div style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ 
                                                padding: "1px 4px",
                                                borderRadius: "3px",
                                                backgroundColor: location.color,
                                                fontSize: "10px",
                                                flexShrink: 0
                                            }}>
                                                {location.ssrComponent}
                                            </span>
                                            <span style={{ 
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {location.building}
                                            </span>
                                        </div>
                                    </div>
                                </InfoWindow>
                            );
                        })()}
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
                                    backgroundColor: getMarkerColor(location.courseCode),
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

