# Hawker Centre Finder - AI Chatbot with RAG

> A demonstration of Retrieval Augmented Generation (RAG) using location-based data from Singapore's Hawker Centres

## Overview

This is an AI-powered chatbot that helps users discover nearby Hawker centres in Singapore. It demonstrates a production-ready RAG implementation using:
- **GPS-based location retrieval** from the user's device
- **Real-time data integration** with Singapore's data.gov.sg API
- **Model Context Protocol (MCP)** servers for location and data services
- **Streaming AI responses** with OpenAI GPT-5

Built on a modern SvelteKit foundation with full TypeScript support and streaming capabilities.

## Key Features

### Core RAG Functionality
- **Location-Aware Recommendations**: Automatically detects user location via browser GPS
- **Dynamic Data Retrieval**: Fetches real-time Hawker centre data based on proximity
- **Context-Augmented Responses**: AI generates personalized recommendations using retrieved data
- **Tool Calling Integration**: Seamless integration with MCP servers for data access

### Chat Experience
- **Streaming Responses**: Real-time AI response generation with visual feedback
- **Tool Invocation Visibility**: Expandable accordions showing tool calls and results
- **Thinking Indicators**: Visual feedback during AI reasoning and data retrieval
- **Clean Stop Handling**: Graceful cancellation without error messages

### Technical Features
- **Type-Safe Throughout**: Full TypeScript coverage from frontend to backend
- **Modern Svelte 5**: Leveraging runes and the latest reactive patterns
- **Accessible Components**: Built with Bits UI and shadcn-svelte
- **Production-Ready**: Optimized for deployment on Vercel

## Tech Stack

### Frontend
- **SvelteKit 2.16** with **Svelte 5** - Modern reactive framework
- **TailwindCSS 4.1** - Utility-first styling
- **Bits UI** - Accessible component primitives
- **Lucide Svelte** - Icon library

### AI & Backend
- **Vercel AI SDK 4.2** - Streaming AI responses and tool calling
- **OpenAI GPT-5** - Latest reasoning model for conversational AI
- **Model Context Protocol** - Structured tool integration
- **data.gov.sg API** - Singapore open data for Hawker centres

## Project Structure

```
web/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── ai/              # AI model configurations and prompts
│   │   │   └── mcp/             # MCP server clients and tools
│   │   ├── components/          # Reusable Svelte components
│   │   │   ├── messages/        # Message rendering components
│   │   │   └── ui/              # UI primitives
│   │   └── utils/               # Utility functions
│   └── routes/
│       ├── (chat)/              # Chat interface routes
│       └── api/                 # API endpoints
├── .github/workflows/           # CI/CD workflows
└── static/                      # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm
- OpenAI API key
- data.gov.sg API key (optional - for higher rate limits)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/custom-generative-ai-systems-for-enterprises.git
cd custom-generative-ai-systems-for-enterprises/web
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
DATA_GOV_SG_API_KEY=your_data_gov_sg_api_key_here  # Optional
```

4. Start the development server
```bash
npm run dev
```

The app will be running at [http://localhost:5173](http://localhost:5173)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint + Prettier
- `npm run check` - Type checking with svelte-check

## How It Works

### RAG Pipeline

1. **Location Capture**: Browser Navigator API captures user's GPS coordinates
2. **Tool Invocation**: AI decides to call `getNearbyHawkers` tool with user location
3. **Data Retrieval**: MCP server queries data.gov.sg API for nearby Hawker centres
4. **Context Augmentation**: Retrieved data is injected into AI context
5. **Personalized Response**: AI generates recommendations based on actual proximity data

### MCP Integration

The app uses Model Context Protocol servers for:
- **Location Services**: GPS coordinate handling and distance calculations
- **Data Access**: Querying and filtering Hawker centre data
- **Tool Calling**: Structured function calls with validation

Example tool call:
```typescript
{
  toolName: 'getNearbyHawkers',
  args: {
    latitude: 1.2922,
    longitude: 103.7768,
    radius: 2000,
    limit: 10
  }
}
```

## Key Components

### Messages Component (`src/lib/components/messages.svelte`)
- Manages accordion state for tool results
- Handles message streaming and rendering
- Provides visual feedback during AI processing

### Preview Message (`src/lib/components/messages/preview-message.svelte`)
- Renders individual messages with parts (text, tool calls, reasoning)
- Expandable tool invocation results
- Animated transitions for smooth UX

### Chat Component (`src/lib/components/chat.svelte`)
- Main chat interface
- Location capture on mount
- Error handling for cancelled requests

### MCP Client (`src/lib/server/mcp/client.ts`)
- Manages MCP server connections
- Provides tools for AI function calling
- Handles data retrieval and formatting

## AI Configuration

### Chat Model
- **Model**: `gpt-5`
- **Features**: Extended reasoning, tool calling, streaming
- **Pricing**: $1.25/1M input, $10/1M output tokens

### System Prompt
Located in `src/lib/server/ai/prompts.ts`, the system prompt:
- Instructs the AI to be a helpful assistant for finding Hawker centres
- Guides tool usage for location-based queries
- Ensures responses are personalized and contextual

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `DATA_GOV_SG_API_KEY` (optional)
4. Deploy

Vercel automatically handles:
- Edge function deployment
- Environment variable management
- CDN and caching
- Automatic HTTPS

### Other Platforms

The app is a standard SvelteKit application and can be deployed to any Node.js hosting platform. See [SvelteKit deployment docs](https://kit.svelte.dev/docs/adapter-node) for more options.

## Development Notes

### Database-Free Design
This demo runs without a database to keep setup simple:
- No chat history persistence
- No user authentication
- Focus on RAG functionality

For a production version, add Postgres for:
- Chat history
- User accounts
- Personalization

### API Rate Limits
- data.gov.sg has rate limits (check their docs)
- OpenAI has usage-based pricing
- Consider implementing caching for frequently accessed data

## Future Enhancements

- [ ] Add map visualization of Hawker centres
- [ ] Cache Hawker centre data to reduce API calls
- [ ] Add more tools (closure info, detailed stall information)
- [ ] Implement chat history with Postgres
- [ ] Add user authentication
- [ ] Multi-language support

## License

MIT License - See LICENSE file for details

## Contributing

This is a demonstration project. Feel free to fork and adapt for your own use cases.

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Data.gov.sg](https://data.gov.sg/) - Singapore open data portal
- [OpenAI Platform](https://platform.openai.com/)
