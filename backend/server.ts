/**
 * Backend Server
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

const app: Express = express();

const hostname = "0.0.0.0";
const port = 8080;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api", routes);

// Start server
app.listen(port, hostname, () => {
    console.log(`Server listening on ${hostname}:${port}`);
});
