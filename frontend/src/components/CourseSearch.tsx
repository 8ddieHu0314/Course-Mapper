import { useState, useEffect } from "react";
import { Autocomplete, Loader } from "@mantine/core";
import { CornellClass } from "@full-stack/types";
import { api } from "../utils/api";

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
                const response = await api.searchCourses(value);
                const foundCourses = response.data?.classes || [];
                setCourses(foundCourses);
                setData(
                    foundCourses.map(
                        (c) => `${c.subject} ${c.catalogNbr} - ${c.title}`
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

    const handleItemSubmit = (item: string) => {
        const selectedCourse = courses.find(
            (c) => `${c.subject} ${c.catalogNbr} - ${c.title}` === item
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

