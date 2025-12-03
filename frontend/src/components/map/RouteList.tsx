interface Route {
    color: string;
    fromCourse: string;
    toCourse: string;
}

interface RouteListProps {
    routes: Route[];
}

/**
 * Displays a list of walking routes between classes
 */
export const RouteList = ({ routes }: RouteListProps) => {
    return (
        <div style={{ marginTop: "1rem", maxHeight: "150px", overflowY: "auto" }}>
            <strong>Routes ({routes.length}):</strong>
            {routes.length > 0 ? (
                <ul style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    {routes.map((route, idx) => (
                        <li key={idx}>
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "2px",
                                    backgroundColor: route.color,
                                    marginRight: "8px",
                                }}
                            />
                            {route.fromCourse} → {route.toCourse}
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.5rem" }}>
                    No routes calculated yet. Ensure courses have coordinates.
                </p>
            )}
        </div>
    );
};

