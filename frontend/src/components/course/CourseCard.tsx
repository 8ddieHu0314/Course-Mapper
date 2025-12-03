import { Paper } from "@mantine/core";
import { ScheduledCourse, ScheduledMeeting } from "@full-stack/types";
import { CourseBlock, DayOfTheWeek, getDayAbbreviation } from "../../utils/calendar-utils";
import styles from "../../styles/components/CourseCard.module.css";

interface CourseCardProps {
    block: CourseBlock;
    metadata: ScheduledCourse | null;
    day: DayOfTheWeek;
}

/**
 * Displays a single course card with time and location information
 * Handles TBA locations with visual indicator
 */
export const CourseCard = ({ block, metadata, day }: CourseCardProps) => {
    const courseCode = metadata?.subject && metadata?.catalogNbr
        ? `${metadata.subject} ${metadata.catalogNbr}`
        : block.code;

    const dayMeeting = metadata?.meetings.find(
        (m: ScheduledMeeting) => m.pattern.includes(getDayAbbreviation(day))
    );

    const location = dayMeeting?.displayLocation || dayMeeting?.facilityDescr || dayMeeting?.bldgDescr;
    const isTBA = location === "TBA" || !dayMeeting?.coordinates;

    return (
        <Paper
            p="sm"
            withBorder
            className={`${styles.card} ${isTBA ? styles.tbaBorder : ""}`}
        >
            <div className={styles.cardContent}>
                <div className={styles.courseTitle}>{courseCode}</div>
                <div className={styles.courseTime}>
                    {block.timeStart} - {block.timeEnd}
                </div>
                {isTBA ? (
                    <div className={`${styles.courseLocation} ${styles.locationTBA}`}>
                        ⚠️ Location TBA - Not shown on map
                    </div>
                ) : location && (
                    <div className={styles.courseLocation}>
                        📍 {location}
                    </div>
                )}
            </div>
        </Paper>
    );
};

