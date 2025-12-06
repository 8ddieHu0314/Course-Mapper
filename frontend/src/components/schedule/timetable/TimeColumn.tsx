import { SCHEDULE_CONFIG } from "../../../config/constants";

interface TimeColumnProps {
    hours: string[];
}

/** Left sidebar showing hour labels (8am, 9am, etc.) */
export function TimeColumn({ hours }: TimeColumnProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", minWidth: "80px", margin: 0 }}>
            <div style={{ height: `${SCHEDULE_CONFIG.HEADER_OFFSET_PX}px` }} />
            {hours.map((hour) => (
                <div
                    key={hour}
                    style={{
                        height: `${SCHEDULE_CONFIG.HOUR_HEIGHT_PX}px`,
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
    );
}

