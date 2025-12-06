import { SCHEDULE_CONFIG } from "../../../config/constants";

interface HourGridLinesProps {
    count: number;
}

/** Horizontal grid lines separating each hour */
export function HourGridLines({ count }: HourGridLinesProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    style={{
                        position: "absolute",
                        top: `${SCHEDULE_CONFIG.HEADER_OFFSET_PX + idx * SCHEDULE_CONFIG.HOUR_HEIGHT_PX}px`,
                        left: 0,
                        right: 0,
                        height: "1px",
                        backgroundColor: "#eee",
                        pointerEvents: "none",
                    }}
                />
            ))}
        </>
    );
}

