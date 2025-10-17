import { fetchHawkerCentres } from '../services/data-gov-sg.js';
import { sortByDistance } from '../services/distance.js';

export async function getNearbyHawkersTool(args: any) {
  const { latitude, longitude, radius = 2000, limit = 10 } = args;

  console.error(`[MCP] Finding hawkers near ${latitude}, ${longitude} within ${radius}m`);

  // Fetch all hawker centres
  const allHawkers = await fetchHawkerCentres();

  // Calculate distances and filter by radius
  const nearby = sortByDistance(latitude, longitude, allHawkers)
    .filter((h) => h.distance <= radius)
    .slice(0, limit);

  console.error(`[MCP] Found ${nearby.length} nearby hawkers`);

  // Format response
  const responseText = nearby.length > 0
    ? `Found ${nearby.length} Hawker centres within ${radius}m:\n\n` +
      nearby
        .map(
          (h, i) =>
            `${i + 1}. ${h.name}\n` +
            `   Address: ${h.address}\n` +
            `   Distance: ${Math.round(h.distance)}m away\n` +
            `   Stalls: ${h.stallCount} cooked food stalls\n` +
            `   Status: ${h.status}\n`
        )
        .join('\n')
    : `No Hawker centres found within ${radius}m of your location.`;

  return {
    content: [
      {
        type: 'text',
        text: responseText,
      },
    ],
  };
}
