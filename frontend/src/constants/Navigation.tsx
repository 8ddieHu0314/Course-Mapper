import HomePage from "../pages/Home";
import SchedulePage from "../pages/Schedule";
import MapViewPage from "../pages/MapView";

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
    {
        link: "/map-view",
        label: "Map View",
        element: <MapViewPage />,
    },
];

