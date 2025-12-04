import { useEffect, useRef, useMemo } from "react";
import { OverlayView, OverlayViewF } from "@react-google-maps/api";

interface AdvancedMarkerProps {
    position: google.maps.LatLngLiteral;
    onClick?: () => void;
    title?: string;
    // Custom pin styling
    pinColor?: string;
    pinBorderColor?: string;
}

export const AdvancedMarker = ({
    position,
    onClick,
    title,
    pinColor = "#4285F4",
    pinBorderColor = "#ffffff",
}: AdvancedMarkerProps) => {
    const getPixelPositionOffset = (width: number, height: number) => ({
        x: -(width / 2),
        y: -height,
    });

    return (
        <OverlayViewF
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={getPixelPositionOffset}
        >
            <div
                onClick={onClick}
                title={title}
                style={{
                    cursor: "pointer",
                    transform: "translate(-50%, -100%)",
                }}
            >
                {/* Default pin shape */}
                <svg width="30" height="40" viewBox="0 0 30 40">
                    <path
                        d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z"
                        fill={pinColor}
                        stroke={pinBorderColor}
                        strokeWidth="2"
                    />
                    <circle cx="15" cy="14" r="5" fill={pinBorderColor} />
                </svg>
            </div>
        </OverlayViewF>
    );
};

// Circle marker variant for custom styling
interface CircleMarkerProps {
    position: google.maps.LatLngLiteral;
    onClick?: () => void;
    title?: string;
    color?: string;
    size?: number;
}

export const CircleMarker = ({
    position,
    onClick,
    title,
    color = "#4285F4",
    size = 24,
}: CircleMarkerProps) => {
    const markerRef = useRef<HTMLDivElement>(null);

    const getPixelPositionOffset = useMemo(() => {
        return () => ({
            x: -(size / 2),
            y: -(size / 2),
        });
    }, [size]);

    // Handle hover effects
    useEffect(() => {
        const element = markerRef.current;
        if (!element) return;

        const handleMouseEnter = () => {
            element.style.transform = "scale(1.15)";
        };
        const handleMouseLeave = () => {
            element.style.transform = "scale(1)";
        };

        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            element.removeEventListener("mouseenter", handleMouseEnter);
            element.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <OverlayViewF
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={getPixelPositionOffset}
        >
            <div
                ref={markerRef}
                onClick={onClick}
                title={title}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    borderRadius: "50%",
                    border: "3px solid white",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                }}
            />
        </OverlayViewF>
    );
};
