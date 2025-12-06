/**
 * Decodes a Google Maps encoded polyline string into an array of coordinates
 * Implements the polyline encoding algorithm from Google Maps
 * @param encoded - The encoded polyline string from Google Maps API
 * @returns Array of {lat, lng} coordinate objects
 */
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
    if (!encoded || typeof encoded !== 'string' || encoded.length === 0) {
        return [];
    }

    const coordinates: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let shift = 0;
        let result = 0;
        let byte: number;

        // Decode latitude
        do {
            if (index >= len) {
                // Invalid polyline - return what we have so far
                return coordinates;
            }
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;

        shift = 0;
        result = 0;

        // Decode longitude
        do {
            if (index >= len) {
                // Invalid polyline - return what we have so far
                return coordinates;
            }
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;

        coordinates.push({
            lat: lat * 1e-5,
            lng: lng * 1e-5,
        });
    }

    return coordinates;
}

