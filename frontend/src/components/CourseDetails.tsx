import { Stack, Text, Select, Paper, Group, ActionIcon, MultiSelect, Badge } from "@mantine/core";
import { ScheduledCourse, CornellClass, ClassSection, ScheduledCourseSection } from "@full-stack/types";
import { IconTrash } from "@tabler/icons-react";

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
        const newMeetings = classSection.meetings.map((meeting) => ({
            pattern: meeting.pattern,
            timeStart: meeting.timeStart,
            timeEnd: meeting.timeEnd,
            bldgDescr: meeting.bldgDescr || "",
            facilityDescr: meeting.facilityDescr || "",
            instructors: meeting.instructors,
        }));

        // Always use selectedSections to ensure calendar updates immediately
        // If selectedSections doesn't exist, initialize it with the new lecture section
        // If it exists, update the first item (the lecture) and keep any additional sections
        const updatedSelectedSections: ScheduledCourseSection[] = course.selectedSections && course.selectedSections.length > 0
            ? [...course.selectedSections]
            : [];
        
        // Update or set the first section (lecture)
        updatedSelectedSections[0] = {
            enrollGroupIndex,
            classSectionIndex: 0,
            section: classSection.section,
            ssrComponent: classSection.ssrComponent,
            classNbr: classSection.classNbr.toString(),
            meetings: newMeetings,
        };

        // Update the selected sections, which will immediately update the calendar
        onUpdateSelectedSections?.(course.id, updatedSelectedSections);
    };

    const handleMultiSectionChange = (
        course: ScheduledCourse,
        selectedIndices: string[],
        allClassSections: Array<{ enrollGroupIndex: number; classSectionIndex: number; classSection: ClassSection }>,
        primarySectionIndex: number
    ) => {
        // Always include the primary (lecture) section
        // Use the current lecture from selectedSections[0] if it exists, otherwise use primarySectionIndex
        let lectureSection: ScheduledCourseSection | null = null;
        
        if (course.selectedSections && course.selectedSections.length > 0) {
            // Use the current lecture section from selectedSections
            lectureSection = course.selectedSections[0];
        } else {
            // Fall back to finding the lecture section from allClassSections
            const sectionData = allClassSections[primarySectionIndex];
            if (sectionData) {
                lectureSection = {
                    enrollGroupIndex: sectionData.enrollGroupIndex,
                    classSectionIndex: sectionData.classSectionIndex,
                    section: sectionData.classSection.section,
                    ssrComponent: sectionData.classSection.ssrComponent,
                    classNbr: sectionData.classSection.classNbr.toString(),
                    meetings: sectionData.classSection.meetings.map(m => ({
                        pattern: m.pattern,
                        timeStart: m.timeStart,
                        timeEnd: m.timeEnd,
                        bldgDescr: m.bldgDescr || "",
                        facilityDescr: m.facilityDescr || "",
                        instructors: m.instructors,
                    })),
                };
            }
        }
        
        // Build the selected sections array: start with lecture, then add selected discussion/project sections
        const selectedSections: ScheduledCourseSection[] = lectureSection ? [lectureSection] : [];
        
        // Add the selected discussion/project sections
        selectedIndices.forEach(idx => {
            const index = parseInt(idx);
            const sectionData = allClassSections[index];
            if (!sectionData) return;
            
            // Don't add the lecture section again if it's already included
            if (lectureSection && 
                sectionData.classSection.section === lectureSection.section &&
                sectionData.classSection.ssrComponent === lectureSection.ssrComponent) {
                return;
            }
            
            selectedSections.push({
                enrollGroupIndex: sectionData.enrollGroupIndex,
                classSectionIndex: sectionData.classSectionIndex,
                section: sectionData.classSection.section,
                ssrComponent: sectionData.classSection.ssrComponent,
                classNbr: sectionData.classSection.classNbr.toString(),
                meetings: sectionData.classSection.meetings.map(m => ({
                    pattern: m.pattern,
                    timeStart: m.timeStart,
                    timeEnd: m.timeEnd,
                    bldgDescr: m.bldgDescr || "",
                    facilityDescr: m.facilityDescr || "",
                    instructors: m.instructors,
                })),
            });
        });

        // Update selected sections, which will immediately update the calendar
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
                courses.map((course) => {
                    const cornellClass = getCourseData?.(course);
                    const enrollGroups = cornellClass?.enrollGroups || [];
                    
                    // Flatten all class sections from all enroll groups
                    const allClassSections: Array<{ enrollGroupIndex: number; classSectionIndex: number; classSection: ClassSection }> = [];
                    enrollGroups.forEach((eg, egIdx) => {
                        eg.classSections.forEach((cs, csIdx) => {
                            allClassSections.push({
                                enrollGroupIndex: egIdx,
                                classSectionIndex: csIdx,
                                classSection: cs,
                            });
                        });
                    });

                    return (
                        <Paper key={course.id} p="md" withBorder>
                            <Group position="apart" mb="xs">
                                <div>
                                    <Text fw={600}>
                                        {course.subject} {course.catalogNbr}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {course.title}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {course.units} Credits
                                    </Text>
                                </div>
                                <ActionIcon
                                    color="red"
                                    variant="light"
                                    onClick={() => onRemoveCourse(course.id)}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Group>

                            {allClassSections.length > 1 && (() => {
                                const isInMultiMode = course.selectedSections && course.selectedSections.length > 0;

                                // Find the current section index
                                let primarySectionIndex = 0;
                                
                                if (isInMultiMode && course.selectedSections && course.selectedSections.length > 0) {
                                    // Use the first item in selectedSections to find the primary section
                                    const primarySection = course.selectedSections[0];
                                    primarySectionIndex = allClassSections.findIndex(
                                        (sectionData) =>
                                            sectionData.enrollGroupIndex === primarySection.enrollGroupIndex &&
                                            sectionData.classSectionIndex === primarySection.classSectionIndex &&
                                            sectionData.classSection.section === primarySection.section &&
                                            sectionData.classSection.ssrComponent === primarySection.ssrComponent
                                    );
                                    if (primarySectionIndex < 0) primarySectionIndex = 0;
                                } else {
                                    // Use course fields to find the primary section
                                    primarySectionIndex = allClassSections.findIndex(
                                        (sectionData) =>
                                            sectionData.enrollGroupIndex === course.enrollGroupIndex &&
                                            sectionData.classSection.section === course.classSection &&
                                            sectionData.classSection.ssrComponent === course.ssrComponent
                                    );
                                    if (primarySectionIndex < 0) {
                                        primarySectionIndex = allClassSections.findIndex(
                                            (sd) => sd.enrollGroupIndex === course.enrollGroupIndex
                                        );
                                    }
                                    if (primarySectionIndex < 0) primarySectionIndex = 0;
                                }
                                
                                const selectedValue = primarySectionIndex.toString();

                                // Filter to only show discussion/recitation/lab for the additional sections
                                const additionalSectionsData = allClassSections
                                    .map((sectionData, idx) => {
                                        const { classSection } = sectionData;
                                        const meetingsStr = classSection.meetings
                                            .map(
                                                (m) =>
                                                    `${m.pattern} ${m.timeStart}-${m.timeEnd}`
                                            )
                                            .join(", ");
                                        return {
                                            value: idx.toString(),
                                            label: `${classSection.ssrComponent} ${classSection.section} - ${meetingsStr}`,
                                            component: classSection.ssrComponent,
                                        };
                                    })
                                    .filter(item => !item.component.includes("LEC")); // Exclude lectures

                                return (
                                    <>
                                        <Select
                                            label={isInMultiMode ? "Primary Section (Lecture)" : "Section"}
                                            placeholder="Select a lecture section"
                                            value={selectedValue}
                                            onChange={(value) => {
                                                if (value) {
                                                    const index = parseInt(value);
                                                    const sectionData = allClassSections[index];
                                                    if (sectionData) {
                                                        handleSectionChange(
                                                            course,
                                                            sectionData.enrollGroupIndex,
                                                            sectionData.classSection
                                                        );
                                                    }
                                                }
                                            }}
                                            data={allClassSections
                                                .filter(sectionData => sectionData.classSection.ssrComponent.includes("LEC"))
                                                .map((sectionData) => {
                                                    const { classSection } = sectionData;
                                                    const meetingsStr = classSection.meetings
                                                        .map(
                                                            (m) =>
                                                                `${m.pattern} ${m.timeStart}-${m.timeEnd}`
                                                        )
                                                        .join(", ");
                                                    return {
                                                        value: allClassSections.indexOf(sectionData).toString(),
                                                        label: `${classSection.ssrComponent} ${classSection.section} - ${meetingsStr}`,
                                                    };
                                                })
                                            }
                                            size="sm"
                                            mt="xs"
                                        />

                                        {additionalSectionsData.length > 0 && (
                                            <>
                                                <Text size="sm" fw={500} mt="md" mb="xs">
                                                    Add Discussion/Recitation/Lab Sections:
                                                </Text>
                                                <MultiSelect
                                                    label="Additional Sections"
                                                    placeholder="Select discussion, recitation, or lab section"
                                                    maxSelectedValues={1}
                                                    value={
                                                        course.selectedSections && course.selectedSections.length > 1
                                                            ? course.selectedSections
                                                                .slice(1) // Exclude the primary section
                                                                .map((section) => {
                                                                    // Find the index using enrollGroupIndex, section, and ssrComponent
                                                                    const idx = allClassSections.findIndex(
                                                                        s => s.classSection.section === section.section && 
                                                                        s.classSection.ssrComponent === section.ssrComponent &&
                                                                        s.enrollGroupIndex === section.enrollGroupIndex
                                                                    );
                                                                    return idx >= 0 ? idx.toString() : "-1";
                                                                })
                                                                .filter(idx => idx !== "-1")
                                                            : []
                                                    }
                                                    onChange={(values) => {
                                                        handleMultiSectionChange(course, values, allClassSections, primarySectionIndex);
                                                    }}
                                                    data={allClassSections
                                                        .map((sectionData, idx) => {
                                                            const label = `${sectionData.classSection.ssrComponent} ${sectionData.classSection.section} - ${sectionData.classSection.meetings.map(m => `${m.pattern} ${m.timeStart}-${m.timeEnd}`).join(", ")}`;
                                                            // Only include non-lecture items, but keep the original index from allClassSections
                                                            if (label.includes("LEC ")) {
                                                                return null;
                                                            }
                                                            return {
                                                                value: idx.toString(),
                                                                label: label,
                                                            };
                                                        })
                                                        .filter((item): item is { value: string; label: string } => item !== null)
                                                    }
                                                    size="sm"
                                                    mt="xs"
                                                    searchable
                                                />
                                                {course.selectedSections && course.selectedSections.length > 0 && (
                                                    <Group spacing="xs" mt="xs">
                                                        {course.selectedSections.map((section, idx) => (
                                                            <Badge key={idx} size="lg" variant="light">
                                                                {section.ssrComponent} {section.section}
                                                            </Badge>
                                                        ))}
                                                    </Group>
                                                )}
                                                <Text size="xs" c="dimmed" mt="xs">
                                                    💡 Click any course block on the calendar to toggle between selected sections
                                                </Text>
                                            </>
                                        )}
                                    </>
                                );
                            })()}

                            <Stack spacing="xs" mt="xs">
                                {course.meetings.map((meeting, idx) => (
                                    <Text key={idx} size="sm">
                                        {meeting.pattern} {meeting.timeStart} - {meeting.timeEnd}
                                        <br />
                                        {meeting.bldgDescr} {meeting.facilityDescr}
                                    </Text>
                                ))}
                            </Stack>
                        </Paper>
                    );
                })
            )}
        </Stack>
    );
};

