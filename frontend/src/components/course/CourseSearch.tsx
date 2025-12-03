import { useState, useEffect } from "react";
import { Autocomplete, Loader, AutocompleteItem } from "@mantine/core";
import { CornellClass } from "@full-stack/types";
import API from "../../utils/api";

interface CourseSearchProps {
    onSelect: (course: CornellClass) => void;
}

interface EnhancedCourse extends CornellClass {
    fromDatabase?: boolean;
}

export const CourseSearch = ({ onSelect }: CourseSearchProps) => {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<EnhancedCourse[]>([]);
    const [data, setData] = useState<string[]>([]);

    useEffect(() => {
        if (value.length < 2) {
            setData([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            try {
                const combinedResults: EnhancedCourse[] = [];

                // Extract subject code from input (e.g., "INFO" from "INFO 1300" or "INFO")
                const parts = value.toUpperCase().split(/\s+/);
                const subject = parts[0]; // First part should be the subject code

                // Search Cornell API by subject
                try {
                    const cornellResponse = await API.searchCoursesBySubject(subject);
                    let foundCourses = cornellResponse.data?.classes || [];
                    
                    // Filter by catalog number if provided
                    if (parts.length > 1) {
                        const catalogNumber = parts[1];
                        foundCourses = foundCourses.filter((c: CornellClass) => 
                            c.catalogNbr.startsWith(catalogNumber)
                        );
                    }
                    
                    combinedResults.push(
                        ...foundCourses.map((c: CornellClass) => ({ ...c, fromDatabase: false }))
                    );
                } catch (error) {
                    console.error("Cornell API search error:", error);
                }

                // Search course database by requirements
                try {
                    const dbResponse = await API.searchRequirements(value);
                    if (dbResponse.results && dbResponse.results.length > 0) {
                        console.log("Database search results:", dbResponse.results);
                    }
                } catch (error) {
                    console.error("Database search error:", error);
                }

                setCourses(combinedResults);
                setData(
                    combinedResults.map((c) => {
                        const displayText = `${c.subject} ${c.catalogNbr} - ${c.titleShort}`;
                        return displayText;
                    })
                );
                
                if (combinedResults.length === 0) {
                    setData([`No results found for "${value}"`]);
                }
            } catch (error) {
                console.error("Search error:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        }, 300); // Debounce

        return () => clearTimeout(searchTimeout);
    }, [value]);

    const handleItemSubmit = (item: AutocompleteItem) => {
        const itemValue = typeof item === "string" ? item : item.value;
        const selectedCourse = courses.find(
            (c) => `${c.subject} ${c.catalogNbr} - ${c.titleShort}` === itemValue
        );
        if (selectedCourse) {
            onSelect(selectedCourse);
            setValue("");
            setData([]);
            setCourses([]);
        }
    };

    return (
        <div style={{ width: "100%" }}>
            <Autocomplete
                placeholder="Search for a course (e.g., INFO 1300)"
                value={value}
                onChange={setValue}
                data={data}
                onItemSubmit={handleItemSubmit}
                rightSection={loading ? <Loader size="xs" /> : null}
                style={{ width: "100%" }}
                description="Searches both Cornell course roster and course requirements database"
            />
        </div>
    );
};
