/**
 * Course-Mapper Backend Server
 * 
 * Entry point for the Express server.
 * Routes and business logic are organized in separate modules.
 */

import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import fetch from "node-fetch";
import { WeatherResponse } from "@full-stack/types";
import routes from "./routes";
// Type extensions in ./types/express.d.ts are automatically included by TypeScript

const app: Express = express();

const hostname = "0.0.0.0";
const port = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Mount all API routes under /api
app.use("/api", routes);

// Legacy weather endpoint (kept for backwards compatibility)
type WeatherData = {
    latitude: number;
    longitude: number;
    timezone: string;
    timezone_abbreviation: string;
    current: {
        time: string;
        interval: number;
        precipitation: number;
    };
};

app.get("/weather", async (req, res) => {
    console.log("GET /api/weather was called");
    try {
        const response = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=40.7411&longitude=73.9897&current=precipitation&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York&forecast_days=1"
        );
        const data = (await response.json()) as WeatherData;
        const output: WeatherResponse = {
            raining: data.current.precipitation > 0.5,
        };
        res.json(output);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Start server
app.listen(port, hostname, () => {
    console.log(`Server listening on ${hostname}:${port}`);
});
