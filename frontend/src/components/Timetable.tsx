import { useNavigate } from "react-router-dom";
import { ScheduledCourse } from "@full-stack/types";
import { CourseBlock } from "./CourseBlock";
import { getCoursesForDay } from "../utils/walkingTime";

interface TimetableProps {
    courses: ScheduledCourse[];
    onRemoveCourse?: (courseId: string) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i); // 7am to 9pm

export const Timetable = ({ courses, onRemoveCourse }: TimetableProps) => {
    const navigate = useNavigate();

    const handleDayClick = (day: string) => {
        navigate(`/schedule/${day.toLowerCase()}`);
    };

    return (
        <div style={{ overflowX: "auto" }}>
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ width: "80px", padding: "8px", border: "1px solid #ddd" }}>
                            Time
                        </th>
                        {DAYS.map((day) => (
                            <th
                                key={day}
                                style={{
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    cursor: "pointer",
                                    backgroundColor: "#f5f5f5",
                                }}
                                onClick={() => handleDayClick(day)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#e0e0e0";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                                }}
                            >
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {HOURS.map((hour) => (
                        <tr key={hour}>
                            <td
                                style={{
                                    padding: "4px",
                                    border: "1px solid #ddd",
                                    textAlign: "center",
                                    fontSize: "12px",
                                }}
                            >
                                {hour}:00
                            </td>
                            {DAYS.map((day) => (
                                <td
                                    key={`${day}-${hour}`}
                                    style={{
                                        position: "relative",
                                        height: "60px",
                                        border: "1px solid #ddd",
                                        padding: 0,
                                    }}
                                >
                                    {getCoursesForDay(courses, day)
                                        .filter((course) => {
                                            const meetings = course.meetings.filter((m) => {
                                                const dayAbbr =
                                                    day === "Monday"
                                                        ? "M"
                                                        : day === "Tuesday"
                                                        ? "T"
                                                        : day === "Wednesday"
                                                        ? "W"
                                                        : day === "Thursday"
                                                        ? "R"
                                                        : "F";
                                                return m.pattern.includes(dayAbbr);
                                            });
                                            if (meetings.length === 0) return false;
                                            const startHour = parseInt(
                                                meetings[0].timeStart.split(":")[0]
                                            );
                                            return startHour === hour || (startHour < hour && parseInt(meetings[0].timeEnd.split(":")[0]) > hour);
                                        })
                                        .map((course) => (
                                            <CourseBlock
                                                key={course.id}
                                                course={course}
                                                day={day}
                                                onRemove={
                                                    onRemoveCourse
                                                        ? () => onRemoveCourse(course.id)
                                                        : undefined
                                                }
                                            />
                                        ))}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

