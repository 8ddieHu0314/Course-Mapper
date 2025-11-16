"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const app = (0, express_1.default)();
const hostname = "0.0.0.0";
const port = 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/weather", async (req, res) => {
    console.log("GET /api/weather was called");
    try {
        const response = await (0, node_fetch_1.default)("https://api.open-meteo.com/v1/forecast?latitude=40.7411&longitude=73.9897&current=precipitation&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York&forecast_days=1");
        const data = (await response.json());
        const output = {
            raining: data.current.precipitation > 0.5,
        };
        res.json(output);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
app.listen(port, hostname, () => {
    console.log("Listening");
});
