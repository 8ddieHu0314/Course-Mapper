import { ScheduledCourse } from "@full-stack/types";
import { DayOfTheWeek } from "../../../utils/calendar-utils";
import { getCourseMetadata } from "../../../utils/scheduleTransform";
import { ScheduleData } from "../../../hooks/useScheduleData";
import { SCHEDULE_CONFIG } from "../../../config/constants";
import { getOverlapColumns } from "../../../utils/timetable-utils";
import { DayHeader } from "./DayHeader";
import { HourGridLines } from "./HourGridLines";
import { CourseBlockItem } from "./CourseBlockItem";

interface DayColumnProps {
    day: DayOfTheWeek;
    courses: ScheduledCourse[];
    scheduleData: ScheduleData;
    availablePixels: number;
}

/** A single day column containing the header, grid lines, and course blocks */
export function DayColumn({ day, courses, scheduleData, availablePixels }: DayColumnProps) {
    const dayCourses = (scheduleData.schedule[day] || []).map((block) => ({
        block,
        metadata: getCourseMetadata(courses, block.code, day, block.timeStart),
    }));

    const columns = getOverlapColumns(dayCourses);

    return (
        <div
            style={{
                flex: 1,
                position: "relative",
                borderLeft: "1px solid #eee",
                borderRight: "1px solid #eee",
                minHeight: `${SCHEDULE_CONFIG.HEADER_OFFSET_PX + availablePixels}px`,
            }}
        >
            <DayHeader day={day} />
            <HourGridLines count={scheduleData.hours.length} />

            {columns.map((column, colIdx) =>
                column.map((item, itemIdx) => {
                    if (!item.metadata) {
                        console.warn(`No metadata found for course block: ${item.block.code} on ${day}`);
                        return null;
                    }

                    return (
                        <CourseBlockItem
                            key={`${item.block.code}-${item.block.timeStart}-${itemIdx}`}
                            block={item.block}
                            metadata={item.metadata}
                            day={day}
                            colIdx={colIdx}
                            totalColumns={columns.length}
                            minHour={scheduleData.minHour}
                            totalMinutes={scheduleData.totalMinutes}
                            availablePixels={availablePixels}
                        />
                    );
                })
            )}
        </div>
    );
}

