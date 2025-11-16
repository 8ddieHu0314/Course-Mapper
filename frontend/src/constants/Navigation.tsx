import HomePage from "../pages/Home";
import SchedulePage from "../pages/Schedule";
import DayViewPage from "../pages/DayView";
import { Link } from "react-router-dom";

export const BACKEND_BASE_PATH = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const PATHS: {
    link: string;
    label: string;
    element?: JSX.Element;
}[] = [
    {
        link: "/",
        label: "Home",
        element: <HomePage />,
    },
    {
        link: "/schedule",
        label: "Schedule",
        element: <SchedulePage />,
    },
];

// Simple dummy header component
export function HeaderSimple({ links }: { links: { link: string; label: string }[] }) {
    return (
        <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
            {links.map((link) => (
                <Link key={link.label} to={link.link} style={{ marginRight: '1rem', textDecoration: 'none' }}>
                    {link.label}
                </Link>
            ))}
        </div>
    );
}

