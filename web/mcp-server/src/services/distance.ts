import { point } from '@turf/helpers';
import distance from '@turf/distance';

/**
 * Calculate distance between two GPS coordinates using Turf.js
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const from = point([lon1, lat1]); // Turf uses [longitude, latitude]
  const to = point([lon2, lat2]);

  // Calculate distance in kilometers, then convert to meters
  const distanceKm = distance(from, to, { units: 'kilometers' });
  return distanceKm * 1000;
}

export interface HawkerWithDistance {
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  stallCount: number;
  photoUrl?: string;
  status: string;
  postalCode: string;
}

export function sortByDistance(
  userLat: number,
  userLon: number,
  hawkers: any[]
): HawkerWithDistance[] {
  return hawkers
    .map((hawker) => ({
      ...hawker,
      distance: calculateDistance(userLat, userLon, hawker.latitude, hawker.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);
}
