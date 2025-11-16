import { MantineProvider } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./pages/Error";
import RootLayout from "./layouts/RootLayout";
import { PATHS } from "./constants/Navigation";
import SchedulePage from "./pages/Schedule";
import DayViewPage from "./pages/DayView";
import "./index.css";

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorPage />,
        children: [
            ...PATHS.map((item) => ({
                path: item.link,
                element: item.element,
            })),
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
