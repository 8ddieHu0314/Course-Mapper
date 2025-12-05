/**
 * Main Application Component
 * Sets up routing, providers, and error boundaries
 */

import { MantineProvider } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ErrorPage from "./pages/Error";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/Home";
import SchedulePage from "./pages/Schedule";
import MapViewPage from "./pages/MapView";
import "./index.css";

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "/schedule",
                element: <SchedulePage />,
            },
            {
                path: "/map-view",
                element: <MapViewPage />,
            },
        ],
    },
]);

export default function App() {
    return (
        <ErrorBoundary>
            <MantineProvider withGlobalStyles withNormalizeCSS>
                <RouterProvider router={router} />
            </MantineProvider>
        </ErrorBoundary>
    );
}
