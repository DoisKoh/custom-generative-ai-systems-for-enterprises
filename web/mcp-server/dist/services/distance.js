import { point } from '@turf/helpers';
import distance from '@turf/distance';
/**
 * Calculate distance between two GPS coordinates using Turf.js
 * @returns Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const from = point([lon1, lat1]); // Turf uses [longitude, latitude]
    const to = point([lon2, lat2]);
    // Calculate distance in kilometers, then convert to meters
    const distanceKm = distance(from, to, { units: 'kilometers' });
    return distanceKm * 1000;
}
export function sortByDistance(userLat, userLon, hawkers) {
    return hawkers
        .map((hawker) => ({
        ...hawker,
        distance: calculateDistance(userLat, userLon, hawker.latitude, hawker.longitude),
    }))
        .sort((a, b) => a.distance - b.distance);
}
