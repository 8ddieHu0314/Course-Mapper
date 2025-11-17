import { MantineProvider } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./pages/Error";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/Home";
import SchedulePage from "./pages/Schedule";
import DayViewPage from "./pages/DayView";
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
                path: "/schedule/:day",
                element: <DayViewPage />,
            },
        ],
    },
]);

export default function App() {
    return (
        <MantineProvider withGlobalStyles withNormalizeCSS>
            <RouterProvider router={router} />
        </MantineProvider>
    );
}
