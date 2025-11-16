import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import { getMeetingsForDay, parseTime, timeToMinutes } from "../utils/walkingTime";

interface CourseBlockProps {
    course: ScheduledCourse;
    day: string;
    onRemove?: () => void;
}

export const CourseBlock = ({ course, day, onRemove }: CourseBlockProps) => {
    const meetings = getMeetingsForDay(course, day);
    if (meetings.length === 0) return null;

    const meeting = meetings[0];
    const startTime = parseTime(meeting.timeStart);
    const endTime = parseTime(meeting.timeEnd);
    
    // Calculate position (7am = 0, 9pm = 14 hours = 840 minutes)
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const startOffset = (startMinutes - 7 * 60) / 60; // Convert to hours from 7am
    const duration = (endMinutes - startMinutes) / 60; // Duration in hours
    
    // Height: 1 hour = 60px
    const top = startOffset * 60;
    const height = duration * 60;

    const getColor = (subject: string) => {
        // Simple hash function for consistent colors
        let hash = 0;
        for (let i = 0; i < subject.length; i++) {
            hash = subject.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 80%)`;
    };

    return (
        <div
            style={{
                position: "absolute",
                top: `${top}px`,
                height: `${height}px`,
                left: "4px",
                right: "4px",
                backgroundColor: getColor(course.subject),
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "4px",
                fontSize: "12px",
                cursor: "pointer",
                overflow: "hidden",
            }}
            title={`${course.subject} ${course.catalogNbr} - ${course.title}`}
        >
            <div style={{ fontWeight: "bold" }}>
                {course.subject} {course.catalogNbr}
            </div>
            <div style={{ fontSize: "10px" }}>
                {meeting.timeStart} - {meeting.timeEnd}
            </div>
            <div style={{ fontSize: "10px" }}>
                {meeting.bldgDescr} {meeting.facilityDescr}
            </div>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        background: "rgba(255,255,255,0.8)",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                        fontSize: "10px",
                        padding: "2px 4px",
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

