# Custom Generative AI Systems for Enterprises

> A collection of production-ready AI applications demonstrating RAG, tool calling, and modern AI architectures

## Overview

This repository showcases practical implementations of enterprise-grade AI systems, focusing on real-world use cases and production-ready architectures. Each project demonstrates specific AI patterns and best practices suitable for enterprise deployment.

## Projects

### 1. Hawker Centre Finder (`/web`)

An AI-powered chatbot demonstrating **Retrieval Augmented Generation (RAG)** with location-based data from Singapore's Hawker Centres.

**Key Features:**
- GPS-based location retrieval
- Real-time data integration with data.gov.sg API
- Model Context Protocol (MCP) for tool integration
- Streaming AI responses with OpenAI GPT-5
- Production-ready SvelteKit architecture

**Tech Stack:**
- SvelteKit 2.16 + Svelte 5
- Vercel AI SDK 4.2
- OpenAI GPT-5
- Model Context Protocol
- TailwindCSS 4.1

**Use Cases:**
- Location-aware recommendations
- Real-time data integration
- Tool calling and function execution
- Contextual AI responses

[View Project Documentation →](./web/README.md)

## Key Concepts Demonstrated

### Retrieval Augmented Generation (RAG)
RAG combines the power of large language models with dynamic data retrieval to provide accurate, contextual responses based on real-time information.

**Implementation:**
1. User provides query with location context
2. AI determines need for external data
3. MCP tools fetch relevant information
4. Retrieved data augments AI context
5. AI generates personalized response

### Model Context Protocol (MCP)
MCP standardizes how AI systems interact with external tools and data sources, enabling:
- Structured function calling
- Type-safe tool interfaces
- Modular tool integration
- Reusable server implementations

### Streaming AI Responses
Provides real-time feedback to users as the AI generates responses:
- Progressive content delivery
- Tool invocation visibility
- Reasoning process transparency
- Enhanced user experience

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm
- OpenAI API key
- (Optional) data.gov.sg API key for higher rate limits

### Quick Start

1. Clone the repository
```bash
git clone https://github.com/doiskoh/custom-generative-ai-systems-for-enterprises.git
cd custom-generative-ai-systems-for-enterprises
```

2. Navigate to a project
```bash
cd web
```

3. Install dependencies
```bash
npm install
```

4. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Start development server
```bash
npm run dev
```

## Architecture Patterns

### Frontend
- **Framework**: SvelteKit with TypeScript
- **Styling**: TailwindCSS + shadcn-svelte
- **State Management**: Svelte 5 runes ($state, $derived, $props)
- **AI Integration**: Vercel AI SDK for streaming

### Backend
- **API Routes**: SvelteKit server endpoints
- **AI Models**: OpenAI GPT-5 (configurable)
- **Tool Integration**: Model Context Protocol servers
- **Data Sources**: REST APIs, databases, external services

### Deployment
- **Platform**: Vercel (recommended)
- **CI/CD**: GitHub Actions
- **Environment**: Edge functions
- **Database**: Optional (Postgres, Neon, etc.)

## Best Practices

### Type Safety
- Full TypeScript coverage
- Zod for runtime validation
- Type-safe AI SDK integration

### Error Handling
- Graceful degradation
- User-friendly error messages
- Proper cancellation handling

### Performance
- Streaming responses
- Efficient data fetching
- Client-side state optimization

### Security
- API key management
- Rate limiting
- Input validation
- Secure environment variables

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run type checking
npm run check

# Run linting
npm run lint

# Start dev server
npm run dev

# Build for production
npm run build
```

### CI/CD
GitHub Actions workflows handle:
- Type checking
- Linting
- Building
- Testing (when tests are added)

## Project Structure

```
custom-generative-ai-systems-for-enterprises/
├── web/                      # Hawker Centre Finder demo
│   ├── src/
│   │   ├── lib/
│   │   │   ├── server/      # Server-side code
│   │   │   └── components/  # Svelte components
│   │   └── routes/          # SvelteKit routes
│   ├── .github/workflows/   # CI/CD
│   └── README.md            # Project documentation
└── README.md                # This file
```

## Future Projects

Planned demonstrations:
- Document Q&A with vector embeddings
- Multi-agent systems for complex workflows
- Fine-tuned models for domain-specific tasks
- Real-time collaborative AI tools
- Integration with enterprise data systems

## Contributing

This repository is maintained as a demonstration of AI capabilities for enterprise use cases. Contributions are welcome for:
- Bug fixes
- Documentation improvements
- New project ideas
- Architecture enhancements

Please open an issue first to discuss significant changes.

## Resources

### Documentation
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [SvelteKit](https://kit.svelte.dev/)
- [OpenAI Platform](https://platform.openai.com/)

### Learning
- [RAG Fundamentals](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [AI SDK Tutorials](https://sdk.vercel.ai/docs/getting-started)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/$state)

## License

MIT License - See LICENSE file for details

## Contact

For questions or discussions about enterprise AI implementations, please open an issue or reach out through GitHub.

---

**Built with ❤️ for demonstrating production-ready AI systems**
