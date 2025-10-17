import { fetchHawkerCentres } from '../services/data-gov-sg.js';

export async function getHawkerDetailsTool(args: any) {
  const { hawkerName } = args;

  console.error(`[MCP] Getting details for: ${hawkerName}`);

  const allHawkers = await fetchHawkerCentres();

  // Find exact or close match (case-insensitive)
  const hawker = allHawkers.find(
    (h) => h.name.toLowerCase() === hawkerName.toLowerCase()
  ) || allHawkers.find(
    (h) => h.name.toLowerCase().includes(hawkerName.toLowerCase())
  );

  if (!hawker) {
    console.error(`[MCP] No hawker found matching: ${hawkerName}`);
    return {
      content: [
        {
          type: 'text',
          text: `Could not find details for "${hawkerName}". Please check the name and try again.`,
        },
      ],
    };
  }

  console.error(`[MCP] Found details for: ${hawker.name}`);

  const responseText =
    `Details for ${hawker.name}:\n\n` +
    `Address: ${hawker.address}, Singapore ${hawker.postalCode}\n` +
    `Status: ${hawker.status}\n` +
    `Number of Stalls: ${hawker.stallCount} cooked food stalls\n` +
    `Coordinates: ${hawker.latitude}, ${hawker.longitude}\n` +
    (hawker.description ? `\nDescription: ${hawker.description}\n` : '') +
    (hawker.photoUrl ? `\n![${hawker.name}](${hawker.photoUrl})` : '');

  return {
    content: [
      {
        type: 'text',
        text: responseText,
      },
    ],
  };
}
