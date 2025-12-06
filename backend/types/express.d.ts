/**
 * Express type extensions for the Course-Mapper backend
 * Extends Express Request interface to include custom properties
 */

import { DecodedIdToken } from "firebase-admin/auth";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            decodedToken?: DecodedIdToken;
        }
    }
}
