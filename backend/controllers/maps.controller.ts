/**
 * Google Maps API Controller
 * Handles geocoding and directions requests
 */

import { Request, Response } from "express";
import { Client, TravelMode } from "@googlemaps/google-maps-services-js";
import { GeocodeResponse, DirectionsResponse, ApiError } from "@full-stack/types";

const googleMapsClient = new Client({});

export const mapsController = {
    /**
     * Geocode an address to coordinates
     */
    async geocode(req: Request, res: Response) {
        try {
            const { address } = req.body;
            
            if (!process.env.GOOGLE_MAPS_API_KEY) {
                res.status(500).json({ error: "Google Maps API key not configured" } as ApiError);
                return;
            }
            
            // Add "Ithaca, NY" to help with Cornell buildings
            const fullAddress = `${address}, Ithaca, NY`;
            
            const response = await googleMapsClient.geocode({
                params: {
                    address: fullAddress,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            });
            
            if (response.data.results.length === 0) {
                res.status(404).json({ error: "Address not found" } as ApiError);
                return;
            }
            
            const result = response.data.results[0];
            const output: GeocodeResponse = {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formattedAddress: result.formatted_address,
            };
            
            res.json(output);
        } catch (error) {
            console.error("Geocoding error:", error);
            res.status(500).json({ error: "Failed to geocode address" } as ApiError);
        }
    },

    /**
     * Get walking directions between two points
     */
    async getDirections(req: Request, res: Response) {
        try {
            const { origin, destination } = req.body;
            
            if (!process.env.GOOGLE_MAPS_API_KEY) {
                res.status(500).json({ error: "Google Maps API key not configured" } as ApiError);
                return;
            }
            
            const response = await googleMapsClient.directions({
                params: {
                    origin: typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`,
                    destination: typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`,
                    mode: TravelMode.walking,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            });
            
            if (response.data.routes.length === 0) {
                res.status(404).json({ error: "No route found" } as ApiError);
                return;
            }
            
            const route = response.data.routes[0];
            const leg = route.legs[0];
            
            const output: DirectionsResponse = {
                distance: leg.distance.value,
                duration: leg.duration.value,
                polyline: route.overview_polyline.points,
                steps: leg.steps.map(step => ({
                    distance: step.distance.value,
                    duration: step.duration.value,
                    instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
                    startLocation: {
                        lat: step.start_location.lat,
                        lng: step.start_location.lng,
                    },
                    endLocation: {
                        lat: step.end_location.lat,
                        lng: step.end_location.lng,
                    },
                })),
            };
            
            res.json(output);
        } catch (error) {
            console.error("Directions error:", error);
            res.status(500).json({ error: "Failed to get directions" } as ApiError);
        }
    },
};

