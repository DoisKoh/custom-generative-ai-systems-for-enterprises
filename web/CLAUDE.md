# AI Chatbot with Hawker Centre RAG Recommendations

## Project Overview

This is a demonstration project showcasing an AI agent with Retrieval Augmented Generation (RAG) capabilities. The chatbot helps users discover nearby Hawker centres in Singapore and provides personalized recommendations based on their current GPS location.

Built on top of a production-ready SvelteKit AI chatbot template, this project demonstrates:
- **Location-aware AI**: Leveraging device GPS coordinates for context-aware recommendations
- **RAG Implementation**: Real-time retrieval of Hawker centre data based on user location
- **Full-stack Type Safety**: TypeScript throughout with modern frameworks
- **Streaming AI Responses**: Real-time chat experience with Vercel AI SDK

---

## Tech Stack

### Frontend
- **SvelteKit 2.16** with Svelte 5 - Modern reactive framework
- **TailwindCSS 4.1** - Utility-first styling
- **Bits UI** - Accessible component primitives
- **Lucide Svelte** - Icon library

### AI & Backend
- **Vercel AI SDK 4.2** - Streaming AI responses
- **OpenAI GPT-5** - Flagship reasoning model for chat
- **OpenAI GPT-5-mini** - Mid-tier model for artifacts
- **OpenAI GPT-5-nano** - Ultra-lightweight model for titles
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** (Vercel/Neon) - Primary database
- **Vercel Blob** - File storage

### Authentication
- Custom auth with bcrypt-ts
- Session management with @oslojs/crypto

---

## Project Structure

```
web/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── ai/              # AI model configurations and prompts
│   │   │   ├── auth/            # Authentication logic
│   │   │   └── db/              # Database schemas and queries
│   │   ├── components/          # Reusable Svelte components
│   │   ├── hooks/               # Custom Svelte hooks
│   │   └── utils/               # Utility functions
│   ├── routes/
│   │   ├── (auth)/              # Login/Register pages
│   │   ├── (chat)/              # Chat interface
│   │   └── api/                 # API endpoints
│   └── app.html
├── drizzle.config.ts            # Database configuration
├── svelte.config.js
└── package.json
```

---

## Key Features

### Core Chat Functionality
- Real-time streaming AI responses
- Message history and persistence
- Document generation (text, code, image, sheet)
- Upvote/downvote system
- File attachments
- Chat visibility controls (public/private)

### Hawker Centre RAG Feature (In Development)
- GPS-based location retrieval
- Nearest Hawker centre search
- Personalized food recommendations
- Integration with Singapore open data

---

## Database Schema

### Main Tables
- **User** - User accounts with authentication
- **Session** - Active user sessions
- **Chat** - Chat conversations
- **Message** - Individual chat messages with parts and attachments
- **Vote** - User votes on messages
- **Document** - Generated content (code, sheets, etc.)
- **Suggestion** - AI suggestions on documents

---

## API Endpoints

### Chat APIs
- `POST /api/chat` - Stream chat responses
- `DELETE /api/chat` - Delete chat
- `GET/POST /api/history` - Chat history management
- `POST /api/chat/visibility` - Update chat visibility

### Supporting APIs
- `POST /api/vote/[chatId]/[messageId]` - Vote on messages
- `POST /api/files/upload` - Upload attachments
- `POST /api/suggestions/[documentId]` - Get document suggestions

---

## Environment Variables

### Required
```env
OPENAI_API_KEY=           # OpenAI API key
DATA_GOV_SG_API_KEY=      # data.gov.sg API key for Hawker centre data
```

### Note
This demo runs **without a database**. Authentication and chat persistence are disabled to keep the setup simple. The Hawker centre RAG feature works entirely without needing database storage.

---

## Development

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start dev server (localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint + Prettier
- `npm run check` - Type checking

---

## AI Model Configuration

### Chat Model (OpenAI GPT-5)
- Model: `gpt-5`
- Used for general conversation and Hawker centre recommendations
- Flagship reasoning model with configurable reasoning levels
- Supports tool calling for MCP integration
- Pricing: $1.25/1M input tokens, $10/1M output tokens

### Artifact Model (OpenAI GPT-5-mini)
- Model: `gpt-5-mini`
- Used for generating code and documents
- Mid-tier option balancing cost and performance
- Pricing: $0.25/1M input tokens, $2/1M output tokens

### Title Model (OpenAI GPT-5-nano)
- Model: `gpt-5-nano`
- Used for generating chat titles
- Ultra-lightweight and cost-effective
- Pricing: $0.05/1M input tokens, $0.40/1M output tokens

---

## RAG Architecture (Hawker Centre Recommendations)

### Overview
The RAG system retrieves nearby Hawker centre information based on the user's GPS coordinates and augments the AI's responses with real location data.

### Data Flow
1. **Location Capture**: Browser Navigator API gets user's latitude/longitude
2. **Data Retrieval**: Query Hawker centre database/API with coordinates
3. **Context Augmentation**: Inject location data into AI prompt
4. **Streaming Response**: AI generates personalized recommendations

### Implementation Options

#### Option A: MCP Server (Recommended)
Use Model Context Protocol to create a dedicated server for location services:
- Clean separation of concerns
- Reusable across different AI models
- Follows emerging standards
- See detailed design below

#### Option B: Server-side API Route
Create a SvelteKit API endpoint that handles location and data retrieval:
- Simpler implementation
- Direct integration with existing routes
- No additional infrastructure

#### Option C: Client-side Tool Calling
Use Vercel AI SDK's tool calling feature:
- Browser-based location access
- Real-time data fetching
- Integrated with existing AI flow

---

## Working with This Codebase

### Adding New API Endpoints
1. Create route in `src/routes/api/[endpoint]/+server.ts`
2. Use Zod for request validation
3. Return JSON responses with proper error handling
4. Update types in `src/lib/types.ts` if needed

### Modifying AI Behavior
1. Edit system prompts in `src/lib/server/ai/prompts.ts`
2. Adjust model configs in `src/lib/server/ai/models.ts`
3. Test streaming behavior in chat interface

### Database Changes
1. Update schema in `src/lib/server/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:push` to apply changes
4. Update queries in `src/lib/server/db/queries.ts`

### Adding Components
1. Create in `src/lib/components/[category]/`
2. Follow existing patterns (Props type, default exports)
3. Use Bits UI for accessible primitives
4. Style with TailwindCSS

---

## Deployment

This project is optimized for Vercel deployment:

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel automatically handles:
- PostgreSQL database (via Neon)
- Blob storage
- Edge functions
- CDN and caching

---

## Next Steps

1. **Implement GPS Location Capture** - Browser API integration
2. **Set up Hawker Centre Data Source** - API or database
3. **Build RAG Pipeline** - Connect location to AI context
4. **Create Location UI Components** - Map view, distance display
5. **Add Caching Layer** - Reduce API calls for repeated queries

---

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Data.gov.sg](https://data.gov.sg/) - Singapore open data portal
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## License

MIT License - See LICENSE file for details

---

## Contributing

This is a demonstration project. Feel free to fork and adapt for your own use cases.
