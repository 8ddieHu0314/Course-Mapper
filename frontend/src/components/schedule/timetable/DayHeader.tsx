import { SCHEDULE_CONFIG } from "../../../config/constants";

interface DayHeaderProps {
    day: string;
}

/** Header showing the day name (Monday, Tuesday, etc.) */
export function DayHeader({ day }: DayHeaderProps) {
    return (
        <div
            style={{
                height: `${SCHEDULE_CONFIG.HEADER_OFFSET_PX}px`,
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
    );
}

