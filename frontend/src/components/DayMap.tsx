import { ScheduledCourse } from "@full-stack/types";
import "./DayMap.css";

interface DayMapProps {
    courses: ScheduledCourse[];
    day: string;
}

export const DayMap = ({ courses, day }: DayMapProps) => {
    return (
        <div className="day-map-outer-box">
            <div className="day-map-inner-box">
                Google Map Display Coming Soon
            </div>
        </div>
    );
};

