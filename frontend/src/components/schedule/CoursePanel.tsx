import { Tabs } from "@mantine/core";
import { IconList, IconMap } from "@tabler/icons-react";
import { ScheduledCourse, CornellClass } from "@full-stack/types";
import { CourseDetails } from "./CourseDetails";
import { CourseMapPanel } from "../map";

interface CoursePanelProps {
    courses: ScheduledCourse[];
    onRemoveCourse: (courseId: string) => void;
    onUpdateSection: (
        courseId: string,
        enrollGroupIndex: number,
        meetings: ScheduledCourse["meetings"]
    ) => void;
    onUpdateSelectedSections: (
        courseId: string,
        selectedSections: ScheduledCourse["selectedSections"]
    ) => void;
    getCourseData: (course: ScheduledCourse) => CornellClass | null;
}

export const CoursePanel = ({
    courses,
    onRemoveCourse,
    onUpdateSection,
    onUpdateSelectedSections,
    getCourseData,
}: CoursePanelProps) => {
    return (
        <Tabs defaultValue="details" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Tabs.List>
                <Tabs.Tab value="details" icon={<IconList size={14} />}>
                    Course Details
                </Tabs.Tab>
                <Tabs.Tab value="map" icon={<IconMap size={14} />}>
                    Map
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="details" style={{ flex: 1, overflowY: "auto" }}>
                <CourseDetails
                    courses={courses}
                    onRemoveCourse={onRemoveCourse}
                    onUpdateSection={onUpdateSection}
                    onUpdateSelectedSections={onUpdateSelectedSections}
                    getCourseData={getCourseData}
                />
            </Tabs.Panel>

            <Tabs.Panel value="map" style={{ flex: 1, overflow: "hidden" }}>
                <CourseMapPanel courses={courses} />
            </Tabs.Panel>
        </Tabs>
    );
};
