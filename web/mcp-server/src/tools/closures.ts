import { fetchHawkerClosures } from '../services/data-gov-sg.js';

export async function getClosuresTool(args: any) {
  const { hawkerName } = args;

  console.error(`[MCP] Checking closures for: ${hawkerName}`);

  const allClosures = await fetchHawkerClosures();

  // Find closures matching the hawker name (case-insensitive partial match)
  const closures = allClosures.filter((c) =>
    c.name.toLowerCase().includes(hawkerName.toLowerCase())
  );

  console.error(`[MCP] Found ${closures.length} closure records for ${hawkerName}`);

  if (closures.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No scheduled closures found for "${hawkerName}". It should be open as per the latest data.`,
        },
      ],
    };
  }

  const responseText =
    `Closure information for "${hawkerName}":\n\n` +
    closures
      .map(
        (c) =>
          `• ${c.quarter}: ${c.closureDates}\n  Reason: ${c.reason}`
      )
      .join('\n\n');

  return {
    content: [
      {
        type: 'text',
        text: responseText,
      },
    ],
  };
}
