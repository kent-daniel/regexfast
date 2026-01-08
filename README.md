# RegexFast

**Generate and Test Regex with AI Agent**

AI coding agent that generates, executes, and evaluates to deliver accurate regex patterns. Automatically tested in a secure sandbox for reliable results.


## Features

- 🤖 **AI-Powered Regex Generation** - Intelligent agent generates regex patterns based on your requirements
- 🧪 **Automated Testing** - Patterns are executed and validated in a secure sandbox environment
- ⚡ **Real-Time Results** - See matches and test results instantly
- 💬 **Interactive Chat Interface** - Refine patterns through natural conversation
- 🎯 **Common Regex Snippets** - Quick access to frequently used patterns
- 🎨 **Modern UI** - Clean, responsive design built with Next.js and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm/bun

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# For full development (frontend + worker)
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Architecture

- **Frontend**: Next.js 14 with App Router, React, Tailwind CSS
- **Backend**: Cloudflare Workers with Durable Objects
- **AI**: Vercel AI SDK with agent framework
- **Sandbox**: Secure code execution environment with Daytona

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── agent-worker/     # Cloudflare Worker backend
├── hooks/           # Custom React hooks
└── lib/             # Utilities and helpers
```

## Documentation

- [Agent Backend Local Development](docs/agent-backend-local-dev.md)
- [Architecture Decision Records](ADR/)

## Deploy

The application can be deployed on:

- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend Worker**: Cloudflare Workers

See deployment documentation for platform-specific instructions.
