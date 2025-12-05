/**
 * Cornell API Controller
 * Handles proxying requests to the Cornell Class Roster API
 */

import { Request, Response } from "express";
import fetch from "node-fetch";
import { CornellClassResponse, ApiError } from "@full-stack/types";

const CORNELL_API_BASE = "https://classes.cornell.edu/api/2.0";

export const cornellController = {
    /**
     * Search for classes by query or subject
     */
    async searchClasses(req: Request, res: Response) {
        try {
            const { q, roster, subject } = req.query as { q?: string; roster: string; subject?: string };
            
            const params = new URLSearchParams();
            params.append("roster", roster);
            if (q) params.append("q", q);
            if (subject) params.append("subject", subject);
            
            const url = `${CORNELL_API_BASE}/search/classes.json?${params.toString()}`;
            const response = await fetch(url);
            const data = (await response.json()) as CornellClassResponse;
            
            res.json(data);
        } catch (error) {
            console.error("Cornell API error:", error);
            res.status(500).json({ error: "Failed to fetch from Cornell API" } as ApiError);
        }
    },

    /**
     * Get list of subjects for a roster
     */
    async getSubjects(req: Request, res: Response) {
        try {
            const { roster } = req.query as { roster: string };
            
            const url = `${CORNELL_API_BASE}/config/subjects.json?roster=${roster}`;
            const response = await fetch(url);
            const data = await response.json();
            
            res.json(data);
        } catch (error) {
            console.error("Cornell API error:", error);
            res.status(500).json({ error: "Failed to fetch subjects" } as ApiError);
        }
    },
};

