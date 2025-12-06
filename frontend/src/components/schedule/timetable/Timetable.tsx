import { ScheduledCourse } from "@full-stack/types";
import { useScheduleData } from "../../../hooks/useScheduleData";
import { SCHEDULE_CONFIG } from "../../../config/constants";
import { TimeColumn } from "./TimeColumn";
import { DayColumn } from "./DayColumn";

interface TimetableProps {
    courses: ScheduledCourse[];
}

/** Weekly timetable view showing all scheduled courses */
export function Timetable({ courses }: TimetableProps) {
    const scheduleData = useScheduleData(courses);
    const availablePixels = (scheduleData.maxHour - scheduleData.minHour) * SCHEDULE_CONFIG.HOUR_HEIGHT_PX;

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
                <TimeColumn hours={scheduleData.hours} />

                <div style={{ display: "flex", flexDirection: "row", flex: 1, marginRight: "1rem" }}>
                    {SCHEDULE_CONFIG.WEEKDAYS.map((day) => (
                        <DayColumn
                            key={day}
                            day={day}
                            courses={courses}
                            scheduleData={scheduleData}
                            availablePixels={availablePixels}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

