/**
 * Authentication types for the Course-Mapper backend
 */

import { Request } from "express";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Extended Request interface with authentication properties
 */
export interface AuthenticatedRequest extends Request {
    userId?: string;
    decodedToken?: DecodedIdToken;
}

