import { Stack, Text } from "@mantine/core";
import { ScheduledCourse, CornellClass, ScheduledCourseSection } from "@full-stack/types";
import { CourseDetailCard } from "./CourseDetailCard";
import { useSectionSelection } from "../../hooks/useSectionSelection";

interface CoursePanelDetailsProps {
    courses: ScheduledCourse[];
    onRemoveCourse: (courseId: string) => void;
    onUpdateSelectedSections?: (
        courseId: string,
        selectedSections: ScheduledCourseSection[]
    ) => void;
    getCourseData?: (course: ScheduledCourse) => CornellClass | null;
}

export const CoursePanelDetails = ({
    courses,
    onRemoveCourse,
    onUpdateSelectedSections,
    getCourseData,
}: CoursePanelDetailsProps) => {
    const { handleSectionChange, handleMultiSectionChange } = useSectionSelection({
        onUpdateSelectedSections,
    });

    return (
        <Stack spacing="md" style={{ padding: "16px" }}>
            <Text size="lg" fw={700}>
                Selected Courses ({courses.length})
            </Text>
            {courses.length === 0 ? (
                <Text c="dimmed">No courses added yet</Text>
            ) : (
                courses.map((course) => (
                    <CourseDetailCard
                        key={course.id}
                        course={course}
                        cornellClass={getCourseData?.(course) ?? null}
                        onRemove={() => onRemoveCourse(course.id)}
                        onSectionChange={handleSectionChange}
                        onMultiSectionChange={handleMultiSectionChange}
                    />
                ))
            )}
        </Stack>
    );
};

