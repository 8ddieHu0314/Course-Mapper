import { Tabs } from "@mantine/core";
import { IconList, IconMap } from "@tabler/icons-react";
import { ScheduledCourse, CornellClass, ScheduledCourseSection } from "@full-stack/types";
import { CoursePanelDetails } from "./CoursePanelDetails";
import { CoursePanelMap } from "./CoursePanelMap";

interface CoursePanelProps {
    courses: ScheduledCourse[];
    onRemoveCourse: (courseId: string) => void;
    onUpdateSelectedSections: (
        courseId: string,
        selectedSections: ScheduledCourseSection[]
    ) => void;
    getCourseData: (course: ScheduledCourse) => CornellClass | null;
}

export const CoursePanel = ({
    courses,
    onRemoveCourse,
    onUpdateSelectedSections,
    getCourseData,
}: CoursePanelProps) => {
    return (
        <Tabs defaultValue="details" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Tabs.List>
                <Tabs.Tab value="details" icon={<IconList size={14} />}>
                    Details
                </Tabs.Tab>
                <Tabs.Tab value="map" icon={<IconMap size={14} />}>
                    Map
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="details" style={{ flex: 1, overflowY: "auto" }}>
                <CoursePanelDetails
                    courses={courses}
                    onRemoveCourse={onRemoveCourse}
                    onUpdateSelectedSections={onUpdateSelectedSections}
                    getCourseData={getCourseData}
                />
            </Tabs.Panel>

            <Tabs.Panel value="map" style={{ flex: 1, overflow: "hidden" }}>
                <CoursePanelMap courses={courses} />
            </Tabs.Panel>
        </Tabs>
    );
};
