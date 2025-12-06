import { ScheduledCourse } from "@full-stack/types";
import { CourseBlock, DayOfTheWeek, getBlockStyle } from "../../../utils/calendar-utils";
import { SCHEDULE_CONFIG } from "../../../config/constants";
import { getSectionComponent } from "../../../utils/timetable-utils";

interface CourseBlockItemProps {
    block: CourseBlock;
    metadata: ScheduledCourse;
    day: DayOfTheWeek;
    colIdx: number;
    totalColumns: number;
    minHour: number;
    totalMinutes: number;
    availablePixels: number;
}

/** Individual course block displayed on the timetable */
export function CourseBlockItem({
    block,
    metadata,
    day,
    colIdx,
    totalColumns,
    minHour,
    totalMinutes,
    availablePixels,
}: CourseBlockItemProps) {
    const style = getBlockStyle(
        block.color,
        block.timeStart,
        block.timeEnd,
        minHour,
        totalMinutes,
        availablePixels,
        SCHEDULE_CONFIG.HEADER_OFFSET_PX
    );

    const widthPercent = 100 / totalColumns;
    const leftPercent = colIdx * widthPercent;

    return (
        <div
            style={{
                position: "absolute",
                top: style.top,
                height: style.height,
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                backgroundColor: block.color,
                borderLeft: `4px solid ${block.borderColor}`,
                padding: "4px",
                fontSize: "11px",
                borderRadius: "4px",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            title={`${block.code} - ${block.timeStart} to ${block.timeEnd}`}
        >
            <div style={{ fontWeight: "bold", fontSize: "11px" }}>{block.code}</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
                {getSectionComponent(metadata, day, block.timeStart, block.ssrComponent)}
            </div>
            <div style={{ fontSize: "10px" }}>
                {block.timeStart} - {block.timeEnd}
            </div>
        </div>
    );
}

