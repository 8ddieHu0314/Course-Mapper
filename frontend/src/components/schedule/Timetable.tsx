import { ScheduledCourse } from "@full-stack/types";
import { getCourseMetadata } from "../../utils/scheduleTransform";
import { useScheduleData } from "../../hooks/useScheduleData";
import {
    getBlockStyle,
    parseTimeString,
    DayOfTheWeek,
} from "../../utils/calendar-utils";

interface TimetableProps {
    courses: ScheduledCourse[];
}

const DAYS: DayOfTheWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const Timetable = ({ courses }: TimetableProps) => {
    const scheduleData = useScheduleData(courses);

    // Get courses for a specific day with metadata
    const getCoursesForDay = (day: DayOfTheWeek) => {
        const dayCourses = scheduleData.schedule[day] || [];
        return dayCourses.map((block) => {
            const metadata = getCourseMetadata(
                courses,
                block.code,
                day,
                block.timeStart
            );
            return { block, metadata };
        });
    };

    // Calculate available pixels for the calendar (assuming ~60px per hour)
    const hourHeight = 60;
    const availablePixels = (scheduleData.maxHour - scheduleData.minHour) * hourHeight;
    const headerOffset = 50;

    // Detect overlapping courses and assign columns
    const getOverlapColumns = (dayCourses: Array<{ block: typeof scheduleData.schedule.Monday[0]; metadata: ScheduledCourse | null }>) => {
        if (dayCourses.length === 0) return [];

        // Sort courses by start time
        const sorted = [...dayCourses].sort((a, b) => {
            try {
                const aStart = parseTimeString(a.block.timeStart);
                const bStart = parseTimeString(b.block.timeStart);
                const aMinutes = aStart.hours * 60 + aStart.minutes;
                const bMinutes = bStart.hours * 60 + bStart.minutes;
                return aMinutes - bMinutes;
            } catch {
                return 0;
            }
        });

        const columns: Array<Array<{ block: typeof scheduleData.schedule.Monday[0]; metadata: ScheduledCourse | null }>> = [];

        sorted.forEach((item) => {
            const { block } = item;
            let placed = false;

            // Try to place in existing column (check all items in column, not just last)
            for (let colIdx = 0; colIdx < columns.length; colIdx++) {
                const column = columns[colIdx];
                let canPlace = true;

                // Check if this block overlaps with any item in this column
                for (const existingItem of column) {
                    try {
                        const existingStart = parseTimeString(existingItem.block.timeStart);
                        const existingEnd = parseTimeString(existingItem.block.timeEnd);
                        const currentStart = parseTimeString(block.timeStart);
                        const currentEnd = parseTimeString(block.timeEnd);

                        const existingStartMinutes = existingStart.hours * 60 + existingStart.minutes;
                        const existingEndMinutes = existingEnd.hours * 60 + existingEnd.minutes;
                        const currentStartMinutes = currentStart.hours * 60 + currentStart.minutes;
                        const currentEndMinutes = currentEnd.hours * 60 + currentEnd.minutes;

                        // Check for overlap
                        if (!(currentEndMinutes <= existingStartMinutes || currentStartMinutes >= existingEndMinutes)) {
                            canPlace = false;
                            break;
                        }
                    } catch {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    column.push(item);
                    placed = true;
                    break;
                }
            }

            // If couldn't place, create new column
            if (!placed) {
                columns.push([item]);
            }
        });

        return columns;
    };

    return (
        <div style={{ overflowX: "auto" }}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flex: 1,
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "2rem 0.5rem 1rem 1.5rem",
                    backgroundColor: "#fff",
                }}
            >
                {/* Time column */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginRight: "2rem",
                        minWidth: "80px",
                        margin: "0",
                    }}
                >
                    <div style={{ height: `${headerOffset}px` }}></div>
                    {scheduleData.hours.map((hour, idx) => (
                        <div
                            key={hour}
                            style={{
                                height: `${hourHeight}px`,
                                display: "flex",
                                alignItems: "flex-start",
                                paddingTop: "4px",
                                fontSize: "12px",
                                color: "#666",
                            }}
                        >
                            {hour}
                        </div>
                    ))}
                </div>

                {/* Days columns */}
                <div style={{ 
                        display: "flex", 
                        flexDirection: "row", 
                        flex: 1,
                        marginRight: "1rem" }}>
                    {DAYS.map((day, dayIdx) => {
                        const dayCourses = getCoursesForDay(day);
                        const columns = getOverlapColumns(dayCourses);
                        
                        return (
                            <div
                                key={day}
                                style={{
                                    flex: 1,
                                    position: "relative",
                                    borderLeft: "1px solid #eee",
                                    borderRight: "1px solid #eee",
                                    minHeight: `${headerOffset + availablePixels}px`,
                                }}
                            >
                                {/* Day header */}
                                <div
                                    style={{
                                        height: `${headerOffset}px`,
                                        padding: "8px",
                                        borderBottom: "1px solid #eee",
                                        backgroundColor: "#f5f5f5",
                                        fontWeight: "bold",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {day}
                                </div>

                                {/* Hour grid lines */}
                                {scheduleData.hours.map((_, hourIdx) => (
                                    <div
                                        key={hourIdx}
                                        style={{
                                            position: "absolute",
                                            top: `${headerOffset + hourIdx * hourHeight}px`,
                                            left: 0,
                                            right: 0,
                                            height: "1px",
                                            backgroundColor: "#eee",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ))}

                                {/* Course blocks */}
                                {columns.map((column, colIdx) =>
                                    column.map((item, itemIdx) => {
                                        const { block, metadata } = item;
                                        if (!metadata) {
                                            console.warn(`No metadata found for course block: ${block.code} on ${day}`);
                                            return null;
                                        }

                                        const style = getBlockStyle(
                                            block.color,
                                            block.timeStart,
                                            block.timeEnd,
                                            scheduleData.minHour,
                                            scheduleData.totalMinutes,
                                            availablePixels,
                                            headerOffset
                                        );

                                        const widthPercent = 100 / columns.length;
                                        const leftPercent = (colIdx * widthPercent);

                                        return (
                                            <div
                                                key={`${block.code}-${block.timeStart}-${itemIdx}`}
                                                style={{
                                                    position: "absolute",
                                                    top: style.top,
                                                    height: style.height,
                                                    left: `${leftPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    backgroundColor: block.color,
                                                    borderLeftWidth: "4px",
                                                    borderLeftStyle: "solid",
                                                    borderLeftColor: block.borderColor,
                                                    paddingLeft: "8px",
                                                    padding: "4px",
                                                    fontSize: "11px",
                                                    borderRadius: "4px",
                                                    overflow: "hidden",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                }}
                                                title={`${block.code} - ${block.timeStart} to ${block.timeEnd}`}
                                            >
                                                <div style={{ fontWeight: "bold", fontSize: "11px" }}>
                                                    {block.code}
                                                </div>
                                                <div style={{ fontSize: "10px", color: "#666" }}>
                                                    {block.ssrComponent || metadata.ssrComponent}
                                                </div>
                                                <div style={{ fontSize: "10px" }}>
                                                    {block.timeStart} - {block.timeEnd}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
