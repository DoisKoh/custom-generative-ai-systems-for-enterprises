# RAG Architecture: GPS-Based Hawker Centre Recommendations

## Executive Summary

This document outlines the architecture for implementing RAG (Retrieval Augmented Generation) capabilities to provide location-aware Hawker centre recommendations using an MCP (Model Context Protocol) server with stdio transport. The system captures user GPS coordinates and retrieves relevant Hawker centre data from data.gov.sg APIs to augment AI responses.

---

## Architecture Overview

We use a **Model Context Protocol (MCP) server** with **stdio transport** to provide location and Hawker centre data as contextual tools to the AI model. The stdio interface allows the MCP server to run efficiently as a child process without requiring separate network ports or HTTP servers.

### Architecture Diagram

```
┌─────────────────┐
│  Browser        │
│  Navigator API  │
│  (GPS coords)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SvelteKit Frontend             │
│  - Capture lat/long             │
│  - Send to chat API             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SvelteKit API Route            │
│  /api/chat                      │
│  - Receive coordinates          │
│  - Spawn MCP server (stdio)     │
│  - Call tools via MCP           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  MCP Server (stdio)             │
│  Node.js/TypeScript             │
│                                 │
│  Tools:                         │
│  - get_nearby_hawkers()         │
│  - check_hawker_closures()      │
│  - get_hawker_details()         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  data.gov.sg APIs               │
│  - Hawker Centres (GEOJSON)     │
│  - Hawker Closures              │
└─────────────────────────────────┘
```

---

## Data Sources

We use two official data.gov.sg APIs:

### 1. Hawker Centres (GEOJSON)

**Purpose**: Get location data (coordinates) and details of all Hawker centres

**API Endpoint**:
```
https://api-open.data.gov.sg/v1/public/api/datasets/d_4a086da0a5553be1d89383cd90d07ecd/poll-download
```

**Response Format**: GeoJSON FeatureCollection

**Key Fields**:
- `NAME` - Hawker centre name
- `ADDRESSSTREETNAME` - Street name
- `ADDRESSBLOCKHOUSENUMBER` - Block/house number
- `ADDRESSPOSTALCODE` - Postal code
- `LANDXADDRESSPOINT` - X coordinate (SVY21)
- `LANDYADDRESSPOINT` - Y coordinate (SVY21)
- `geometry.coordinates` - [longitude, latitude] in WGS84
- `DESCRIPTION` - Description of the centre
- `STATUS` - Operational status
- `NUMBER_OF_COOKED_FOOD_STALLS` - Stall count
- `PHOTOURL` - Photo URL
- `HUP_COMPLETION_DATE` - Upgrade completion date

**Update Frequency**: Last updated 16 Oct 2025

**Usage Example**:
```typescript
const response = await fetch(
  'https://api-open.data.gov.sg/v1/public/api/datasets/d_4a086da0a5553be1d89383cd90d07ecd/poll-download'
);
const data = await response.json();
const downloadUrl = data.data.url;
const geojsonResponse = await fetch(downloadUrl);
const hawkerData = await geojsonResponse.json();
```

### 2. Dates of Hawker Centres Closure

**Purpose**: Get scheduled closure dates for Hawker centres (quarterly cleaning, renovations)

**API Endpoint**:
```
https://data.gov.sg/api/action/datastore_search?resource_id=d_bda4baa634dd1cc7a6c7cad5f19e2d68
```

**Response Format**: JSON (CKAN format)

**Key Fields**:
- `name` - Hawker centre name
- `quarter` - Closure quarter (e.g., "Q1 2025")
- `closure_dates` - Date or date range
- `reason` - Reason for closure (e.g., "Quarterly Cleaning")

**Usage Example**:
```typescript
const response = await fetch(
  'https://data.gov.sg/api/action/datastore_search?resource_id=d_bda4baa634dd1cc7a6c7cad5f19e2d68&limit=1000'
);
const data = await response.json();
const closures = data.result.records;
```

**Note**: No API key required for both datasets (Open Data Licence)

---

## MCP Server Implementation

### Project Structure

```
web/
├── mcp-server/
│   ├── src/
│   │   ├── index.ts              # Main MCP server entry
│   │   ├── tools/
│   │   │   ├── nearby-hawkers.ts # Get nearby hawkers tool
│   │   │   ├── closures.ts       # Check closures tool
│   │   │   └── details.ts        # Get hawker details tool
│   │   ├── services/
│   │   │   ├── data-gov-sg.ts    # data.gov.sg API client
│   │   │   └── distance.ts       # Distance calculations
│   │   └── types.ts              # TypeScript types
│   ├── package.json
│   └── tsconfig.json
└── src/
    └── routes/api/chat/+server.ts
```

### 1. MCP Server Core

```typescript
// mcp-server/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";

import { getNearbyHawkersTool } from "./tools/nearby-hawkers.js";
import { getClosuresTool } from "./tools/closures.js";
import { getHawkerDetailsTool } from "./tools/details.js";

const server = new Server(
  {
    name: "hawker-location-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_nearby_hawkers",
        description: "Get Hawker centres near a GPS location, sorted by distance",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "User's latitude coordinate",
            },
            longitude: {
              type: "number",
              description: "User's longitude coordinate",
            },
            radius: {
              type: "number",
              description: "Search radius in meters (default: 2000)",
              default: 2000,
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 10)",
              default: 10,
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "check_hawker_closures",
        description: "Check if a Hawker centre is closed or has scheduled closures",
        inputSchema: {
          type: "object",
          properties: {
            hawkerName: {
              type: "string",
              description: "Name of the Hawker centre to check",
            },
          },
          required: ["hawkerName"],
        },
      },
      {
        name: "get_hawker_details",
        description: "Get detailed information about a specific Hawker centre",
        inputSchema: {
          type: "object",
          properties: {
            hawkerName: {
              type: "string",
              description: "Name of the Hawker centre",
            },
          },
          required: ["hawkerName"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_nearby_hawkers":
        return await getNearbyHawkersTool(args);

      case "check_hawker_closures":
        return await getClosuresTool(args);

      case "get_hawker_details":
        return await getHawkerDetailsTool(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) throw error;

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error("Hawker MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### 2. Data Service Layer

```typescript
// mcp-server/src/services/data-gov-sg.ts
export interface HawkerCentre {
  name: string;
  address: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  description?: string;
  status: string;
  stallCount: number;
  photoUrl?: string;
}

export interface HawkerClosure {
  name: string;
  quarter: string;
  closureDates: string;
  reason: string;
}

// Cache for hawker centres data (refresh every 24 hours)
let cachedHawkers: HawkerCentre[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchHawkerCentres(): Promise<HawkerCentre[]> {
  // Return cached data if still valid
  if (cachedHawkers && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedHawkers;
  }

  // Step 1: Poll download endpoint to get actual data URL
  const pollResponse = await fetch(
    'https://api-open.data.gov.sg/v1/public/api/datasets/d_4a086da0a5553be1d89383cd90d07ecd/poll-download'
  );

  if (!pollResponse.ok) {
    throw new Error(`Failed to fetch hawker data: ${pollResponse.statusText}`);
  }

  const pollData = await pollResponse.json();
  const downloadUrl = pollData.data.url;

  // Step 2: Fetch actual GeoJSON data
  const dataResponse = await fetch(downloadUrl);

  if (!dataResponse.ok) {
    throw new Error(`Failed to download hawker data: ${dataResponse.statusText}`);
  }

  const geojson = await dataResponse.json();

  // Step 3: Parse GeoJSON features
  cachedHawkers = geojson.features.map((feature: any) => ({
    name: feature.properties.NAME,
    address: `${feature.properties.ADDRESSBLOCKHOUSENUMBER} ${feature.properties.ADDRESSSTREETNAME}`,
    postalCode: feature.properties.ADDRESSPOSTALCODE,
    latitude: feature.geometry.coordinates[1], // GeoJSON is [lng, lat]
    longitude: feature.geometry.coordinates[0],
    description: feature.properties.DESCRIPTION,
    status: feature.properties.STATUS,
    stallCount: feature.properties.NUMBER_OF_COOKED_FOOD_STALLS || 0,
    photoUrl: feature.properties.PHOTOURL,
  }));

  cacheTimestamp = Date.now();

  return cachedHawkers;
}

export async function fetchHawkerClosures(): Promise<HawkerClosure[]> {
  const response = await fetch(
    'https://data.gov.sg/api/action/datastore_search?resource_id=d_bda4baa634dd1cc7a6c7cad5f19e2d68&limit=1000'
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch closures: ${response.statusText}`);
  }

  const data = await response.json();

  return data.result.records.map((record: any) => ({
    name: record.name,
    quarter: record.quarter,
    closureDates: record.closure_dates,
    reason: record.reason || 'Scheduled closure',
  }));
}
```

### 3. Distance Calculation Service

```typescript
// mcp-server/src/services/distance.ts
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
```

### 4. Tool Implementations

```typescript
// mcp-server/src/tools/nearby-hawkers.ts
import { fetchHawkerCentres } from "../services/data-gov-sg.js";
import { sortByDistance } from "../services/distance.js";

export async function getNearbyHawkersTool(args: any) {
  const { latitude, longitude, radius = 2000, limit = 10 } = args;

  // Fetch all hawker centres
  const allHawkers = await fetchHawkerCentres();

  // Calculate distances and filter by radius
  const nearby = sortByDistance(latitude, longitude, allHawkers)
    .filter((h) => h.distance <= radius)
    .slice(0, limit);

  // Format response
  const responseText = nearby.length > 0
    ? `Found ${nearby.length} Hawker centres within ${radius}m:\n\n` +
      nearby
        .map(
          (h, i) =>
            `${i + 1}. ${h.name}\n` +
            `   Address: ${h.address}\n` +
            `   Distance: ${Math.round(h.distance)}m away\n` +
            `   Stalls: ${h.stallCount} cooked food stalls\n`
        )
        .join("\n")
    : `No Hawker centres found within ${radius}m of your location.`;

  return {
    content: [
      {
        type: "text",
        text: responseText,
      },
    ],
  };
}
```

```typescript
// mcp-server/src/tools/closures.ts
import { fetchHawkerClosures } from "../services/data-gov-sg.js";

export async function getClosuresTool(args: any) {
  const { hawkerName } = args;

  const allClosures = await fetchHawkerClosures();

  // Find closures matching the hawker name (case-insensitive partial match)
  const closures = allClosures.filter((c) =>
    c.name.toLowerCase().includes(hawkerName.toLowerCase())
  );

  if (closures.length === 0) {
    return {
      content: [
        {
          type: "text",
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
      .join("\n\n");

  return {
    content: [
      {
        type: "text",
        text: responseText,
      },
    ],
  };
}
```

```typescript
// mcp-server/src/tools/details.ts
import { fetchHawkerCentres } from "../services/data-gov-sg.js";

export async function getHawkerDetailsTool(args: any) {
  const { hawkerName } = args;

  const allHawkers = await fetchHawkerCentres();

  // Find exact or close match (case-insensitive)
  const hawker = allHawkers.find(
    (h) => h.name.toLowerCase() === hawkerName.toLowerCase()
  ) || allHawkers.find(
    (h) => h.name.toLowerCase().includes(hawkerName.toLowerCase())
  );

  if (!hawker) {
    return {
      content: [
        {
          type: "text",
          text: `Could not find details for "${hawkerName}". Please check the name and try again.`,
        },
      ],
    };
  }

  const responseText =
    `Details for ${hawker.name}:\n\n` +
    `Address: ${hawker.address}, Singapore ${hawker.postalCode}\n` +
    `Status: ${hawker.status}\n` +
    `Number of Stalls: ${hawker.stallCount} cooked food stalls\n` +
    `Coordinates: ${hawker.latitude}, ${hawker.longitude}\n` +
    (hawker.description ? `\nDescription: ${hawker.description}\n` : '') +
    (hawker.photoUrl ? `\nPhoto: ${hawker.photoUrl}` : '');

  return {
    content: [
      {
        type: "text",
        text: responseText,
      },
    ],
  };
}
```

### 5. Package Configuration

```json
// mcp-server/package.json
{
  "name": "hawker-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "@turf/distance": "^7.1.0",
    "@turf/helpers": "^7.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "typescript": "^5.7.2"
  }
}
```

```json
// mcp-server/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## SvelteKit Integration

### 1. MCP Client Setup

Since Vercel AI SDK doesn't have native MCP support yet, we'll use the MCP SDK directly to spawn and communicate with the MCP server:

```typescript
// src/lib/server/mcp/client.ts
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

export class HawkerMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async connect() {
    if (this.client) return; // Already connected

    // Spawn MCP server as child process
    const serverPath = path.join(process.cwd(), 'mcp-server', 'dist', 'index.js');
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
    });

    // Create stdio transport
    this.transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin,
    });

    // Create and connect client
    this.client = new Client(
      {
        name: 'hawker-chatbot-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
  }

  async callTool(name: string, args: any) {
    if (!this.client) {
      await this.connect();
    }

    const result = await this.client!.callTool({
      name,
      arguments: args,
    });

    return result;
  }

  async listTools() {
    if (!this.client) {
      await this.connect();
    }

    return await this.client!.listTools();
  }

  async close() {
    if (this.transport) {
      await this.transport.close();
      this.client = null;
      this.transport = null;
    }
  }
}
```

### 2. Chat API Integration

```typescript
// src/routes/api/chat/+server.ts
import { streamText } from 'ai';
import { myProvider } from '$lib/server/ai/models';
import { HawkerMCPClient } from '$lib/server/mcp/client';
import type { RequestHandler } from './$types';

const mcpClient = new HawkerMCPClient();

export const POST: RequestHandler = async ({ request }) => {
  const { messages, coordinates } = await request.json();

  // Ensure MCP client is connected
  await mcpClient.connect();

  // Get tools from MCP server
  const toolsList = await mcpClient.listTools();

  // Convert MCP tools to Vercel AI SDK format
  const tools: Record<string, any> = {};

  for (const tool of toolsList.tools) {
    tools[tool.name] = {
      description: tool.description,
      parameters: tool.inputSchema,
      execute: async (params: any) => {
        const result = await mcpClient.callTool(tool.name, params);
        // Extract text from MCP response
        return result.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n');
      },
    };
  }

  // Build system prompt
  const systemPrompt = coordinates
    ? `You are a friendly Hawker centre expert in Singapore.
The user's current location is: ${coordinates.lat}, ${coordinates.lng}

When they ask about nearby hawkers or food recommendations:
1. Use the get_nearby_hawkers tool to find centres near their location
2. Check for closures using check_hawker_closures if discussing specific centres
3. Provide detailed info with get_hawker_details when users want more information
4. Be enthusiastic about Singapore's hawker culture and food heritage
5. Give personalized recommendations based on distance and user preferences`
    : `You are a friendly Hawker centre expert in Singapore.
Ask the user to share their location to get personalized recommendations.
You can still answer general questions about hawker centres in Singapore.`;

  // Stream AI response with tools
  const result = streamText({
    model: myProvider.languageModel('chat-model'),
    messages,
    system: systemPrompt,
    tools,
    maxSteps: 5, // Allow multiple tool calls
  });

  return result.toDataStreamResponse();
};
```

### 3. Frontend GPS Capture

```typescript
// src/lib/components/chat/LocationCapture.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';

  interface Coordinates {
    lat: number;
    lng: number;
  }

  let coordinates = $state<Coordinates | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(false);

  export let onLocationCaptured: (coords: Coordinates) => void;

  async function requestLocation() {
    if (!navigator.geolocation) {
      error = 'Geolocation is not supported by your browser';
      return;
    }

    loading = true;
    error = null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      onLocationCaptured(coordinates);
    } catch (err: any) {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          error = 'Location access denied. Please enable location permissions.';
          break;
        case err.POSITION_UNAVAILABLE:
          error = 'Location information unavailable.';
          break;
        case err.TIMEOUT:
          error = 'Location request timed out.';
          break;
        default:
          error = 'Failed to get your location.';
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // Auto-request on mount if not already captured
    if (!coordinates) {
      requestLocation();
    }
  });
</script>

<div class="location-capture p-4 border rounded-lg bg-muted/50">
  {#if loading}
    <div class="flex items-center gap-2">
      <div class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
      <span class="text-sm">Getting your location...</span>
    </div>
  {:else if error}
    <div class="space-y-2">
      <p class="text-sm text-destructive">{error}</p>
      <Button size="sm" on:click={requestLocation}>
        Try Again
      </Button>
    </div>
  {:else if coordinates}
    <div class="text-sm text-muted-foreground">
      📍 Location: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
    </div>
  {:else}
    <Button on:click={requestLocation}>
      Share Location for Recommendations
    </Button>
  {/if}
</div>
```

### 4. Update Chat Page

```typescript
// src/routes/(chat)/+page.svelte (additions)
<script lang="ts">
  import { useChat } from '@ai-sdk/svelte';
  import LocationCapture from '$lib/components/chat/LocationCapture.svelte';

  let coordinates = $state<{ lat: number; lng: number } | null>(null);

  const { messages, input, handleSubmit, isLoading } = useChat({
    body: { coordinates },
    onFinish: () => {
      // Optionally track when AI finishes responding
    },
  });

  function handleLocationCaptured(coords: { lat: number; lng: number }) {
    coordinates = coords;
  }
</script>

<div class="chat-container">
  <LocationCapture onLocationCaptured={handleLocationCaptured} />

  <!-- Rest of chat UI -->
</div>
```

---

## Development Setup

### 1. Install Dependencies

```bash
# Install MCP server dependencies
cd mcp-server
npm install

# Build MCP server
npm run build

# Back to main project
cd ..
npm install
```

### 2. Add MCP SDK to Main Project

```bash
npm install @modelcontextprotocol/sdk
```

### 3. Development Workflow

```bash
# Terminal 1: Watch and rebuild MCP server on changes
cd mcp-server
npm run dev

# Terminal 2: Run SvelteKit dev server
npm run dev
```

### 4. Production Build

```bash
# Build MCP server
cd mcp-server
npm run build

# Build SvelteKit app
cd ..
npm run build
```

---

## Deployment to Vercel

### Vercel Configuration

Since we're using a local MCP server via stdio (not a network server), we need to ensure the MCP server is built and available:

```json
// vercel.json
{
  "buildCommand": "cd mcp-server && npm install && npm run build && cd .. && npm run build",
  "installCommand": "npm install",
  "framework": "sveltekit"
}
```

Alternatively, add to package.json:

```json
// package.json
{
  "scripts": {
    "build": "npm run build:mcp && vite build",
    "build:mcp": "cd mcp-server && npm install && npm run build && cd .."
  }
}
```

**Note**: The stdio MCP server runs as a child process in serverless functions, which works well for Vercel's execution model.

---

## Benefits of This Architecture

### 1. Efficient Process Communication
- **stdio transport** eliminates network overhead
- Direct process communication via stdin/stdout
- No need for port allocation or HTTP servers

### 2. Serverless-Friendly
- MCP server spawns on-demand per request
- No persistent connections required
- Works perfectly with Vercel's serverless functions

### 3. Clean Separation
- Location/data logic in MCP server
- Chat logic in SvelteKit
- Easy to test each component independently

### 4. Standards-Based
- Follows Model Context Protocol specification
- MCP server can be reused with other AI applications
- Future-proof architecture

### 5. Real RAG Capabilities
- Dynamic data retrieval from data.gov.sg
- Fresh closure information
- Distance-based recommendations

---

## Testing Strategy

### 1. Test MCP Server Standalone

```typescript
// mcp-server/test/standalone.ts
import { HawkerMCPClient } from '../../src/lib/server/mcp/client';

async function test() {
  const client = new HawkerMCPClient();
  await client.connect();

  // Test get_nearby_hawkers
  console.log('Testing get_nearby_hawkers...');
  const result = await client.callTool('get_nearby_hawkers', {
    latitude: 1.3521,
    longitude: 103.8198,
    radius: 2000,
    limit: 5,
  });
  console.log(result);

  await client.close();
}

test();
```

### 2. Test Distance Calculations

```typescript
// mcp-server/test/distance.test.ts
import { calculateDistance } from '../src/services/distance';

// Marina Bay Sands to Lau Pa Sat
const distanceMBS = calculateDistance(
  1.2834, 103.8607,  // MBS
  1.2803, 103.8504   // Lau Pa Sat
);

console.log(`Distance: ${Math.round(distanceMBS)}m`); // Should be ~950m

// Chinatown to Little India
const distanceChinatown = calculateDistance(
  1.2813, 103.8446,  // Chinatown
  1.3069, 103.8519   // Little India
);

console.log(`Distance: ${Math.round(distanceChinatown)}m`); // Should be ~2850m
```

### 3. Integration Test

Test the full flow from frontend → API → MCP → data.gov.sg

---

## Performance Optimizations

### 1. Caching
- **Hawker centres data**: Cached for 24 hours (data rarely changes)
- **Closures data**: Fresh on every request (more dynamic)

### 2. Connection Pooling
Consider reusing MCP client connections:

```typescript
// Global MCP client instance
const globalMCPClient = new HawkerMCPClient();

// Reuse across requests
export const POST: RequestHandler = async ({ request }) => {
  await globalMCPClient.connect(); // Idempotent
  // ... use client
};
```

### 3. Lazy Tool Loading
Only load tools when needed by the AI model

---

## Security Considerations

### 1. Location Privacy
- Don't store user GPS coordinates
- Only send to MCP server during request
- Clear from memory after response

### 2. Input Validation
- Validate latitude/longitude ranges
- Sanitize hawker names in queries
- Rate limit tool calls

### 3. Error Handling
- Graceful degradation if data.gov.sg is down
- Fallback to cached data
- Clear error messages to users

---

## Next Steps

1. **Implement MCP Server**: Build the tools and services
2. **Integrate with Chat API**: Connect MCP client to SvelteKit
3. **Build GPS Component**: Create location capture UI
4. **Test End-to-End**: Verify full RAG flow
5. **Add Enhancements**: Photos, maps, ratings
6. **Deploy to Vercel**: Production deployment

---

## Resources

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [MCP SDK Reference](https://github.com/modelcontextprotocol/typescript-sdk)
- [data.gov.sg API Docs](https://data.gov.sg/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Turf.js Documentation](https://turfjs.org/)
- [Turf.js Distance Function](https://turfjs.org/docs/api/distance)

---

This architecture provides a production-ready foundation for demonstrating RAG capabilities using modern AI standards (MCP) while keeping the demo lightweight and efficient with stdio transport.
