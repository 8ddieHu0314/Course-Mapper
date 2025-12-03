import { Stack, Text } from "@mantine/core";
import { ScheduledCourse, CornellClass, ClassSection, ScheduledCourseSection } from "@full-stack/types";
import { toScheduledSection } from "../../utils/meetingTransform";
import { CourseDetailCard } from "./CourseDetailCard";

interface ClassSectionData {
    enrollGroupIndex: number;
    classSectionIndex: number;
    classSection: ClassSection;
}

interface CourseDetailsProps {
    courses: ScheduledCourse[];
    onRemoveCourse: (courseId: string) => void;
    onUpdateSection: (
        courseId: string,
        enrollGroupIndex: number,
        meetings: ScheduledCourse["meetings"]
    ) => void;
    onUpdateSelectedSections?: (
        courseId: string,
        selectedSections: ScheduledCourseSection[]
    ) => void;
    getCourseData?: (course: ScheduledCourse) => CornellClass | null;
}

export const CourseDetails = ({
    courses,
    onRemoveCourse,
    onUpdateSelectedSections,
    getCourseData,
}: CourseDetailsProps) => {
    const handleSectionChange = (
        course: ScheduledCourse,
        enrollGroupIndex: number,
        classSection: ClassSection
    ) => {
        const updatedSelectedSections: ScheduledCourseSection[] =
            course.selectedSections && course.selectedSections.length > 0
                ? [...course.selectedSections]
                : [];

        updatedSelectedSections[0] = toScheduledSection(classSection, enrollGroupIndex, 0);
        onUpdateSelectedSections?.(course.id, updatedSelectedSections);
    };

    const handleMultiSectionChange = (
        course: ScheduledCourse,
        selectedIndices: string[],
        allClassSections: ClassSectionData[],
        primarySectionIndex: number
    ) => {
        let lectureSection: ScheduledCourseSection | null = null;

        if (course.selectedSections && course.selectedSections.length > 0) {
            lectureSection = course.selectedSections[0];
        } else {
            const sectionData = allClassSections[primarySectionIndex];
            if (sectionData) {
                lectureSection = toScheduledSection(
                    sectionData.classSection,
                    sectionData.enrollGroupIndex,
                    sectionData.classSectionIndex
                );
            }
        }

        const selectedSections: ScheduledCourseSection[] = lectureSection ? [lectureSection] : [];

        selectedIndices.forEach((idx) => {
            const index = parseInt(idx);
            const sectionData = allClassSections[index];
            if (!sectionData) return;

            if (
                lectureSection &&
                sectionData.classSection.section === lectureSection.section &&
                sectionData.classSection.ssrComponent === lectureSection.ssrComponent
            ) {
                return;
            }

            selectedSections.push(
                toScheduledSection(
                    sectionData.classSection,
                    sectionData.enrollGroupIndex,
                    sectionData.classSectionIndex
                )
            );
        });

        onUpdateSelectedSections?.(course.id, selectedSections);
    };

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
                        cornellClass={getCourseData?.(course) || null}
                        onRemove={() => onRemoveCourse(course.id)}
                        onSectionChange={handleSectionChange}
                        onMultiSectionChange={handleMultiSectionChange}
                    />
                ))
            )}
        </Stack>
    );
};
