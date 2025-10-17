import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { getNearbyHawkersTool } from './tools/nearby-hawkers.js';
import { getClosuresTool } from './tools/closures.js';
import { getHawkerDetailsTool } from './tools/details.js';

const server = new Server(
  {
    name: 'hawker-location-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('[MCP] Listing available tools');
  return {
    tools: [
      {
        name: 'get_nearby_hawkers',
        description: 'Get Hawker centres near a GPS location, sorted by distance',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: "User's latitude coordinate",
            },
            longitude: {
              type: 'number',
              description: "User's longitude coordinate",
            },
            radius: {
              type: 'number',
              description: 'Search radius in meters (default: 2000)',
              default: 2000,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
              default: 10,
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
      {
        name: 'check_hawker_closures',
        description: 'Check if a Hawker centre is closed or has scheduled closures',
        inputSchema: {
          type: 'object',
          properties: {
            hawkerName: {
              type: 'string',
              description: 'Name of the Hawker centre to check',
            },
          },
          required: ['hawkerName'],
        },
      },
      {
        name: 'get_hawker_details',
        description: 'Get detailed information about a specific Hawker centre',
        inputSchema: {
          type: 'object',
          properties: {
            hawkerName: {
              type: 'string',
              description: 'Name of the Hawker centre',
            },
          },
          required: ['hawkerName'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[MCP] Tool called: ${name}`);

  try {
    switch (name) {
      case 'get_nearby_hawkers':
        return await getNearbyHawkersTool(args);

      case 'check_hawker_closures':
        return await getClosuresTool(args);

      case 'get_hawker_details':
        return await getHawkerDetailsTool(args);

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) throw error;

    console.error(`[MCP] Tool execution failed:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('[MCP] Hawker MCP Server running on stdio');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
