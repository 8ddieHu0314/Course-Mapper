import { useState, useEffect } from "react";
import { Autocomplete, Loader, AutocompleteItem } from "@mantine/core";
import { CornellClass } from "@full-stack/types";
import API from "../utils/api";

interface CourseSearchProps {
    onSelect: (course: CornellClass) => void;
}

export const CourseSearch = ({ onSelect }: CourseSearchProps) => {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<CornellClass[]>([]);
    const [data, setData] = useState<string[]>([]);

    useEffect(() => {
        if (value.length < 3) {
            setData([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await API.searchCourses(value);
                const foundCourses = response.data?.classes || [];
                setCourses(foundCourses);
                setData(
                    foundCourses.map(
                        (c) => `${c.subject} ${c.catalogNbr} - ${c.titleShort}`
                    )
                );
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
        <Autocomplete
            placeholder="Search for a course (e.g., INFO 1300)"
            value={value}
            onChange={setValue}
            data={data}
            onItemSubmit={handleItemSubmit}
            rightSection={loading ? <Loader size="xs" /> : null}
            style={{ width: "100%" }}
        />
    );
};

