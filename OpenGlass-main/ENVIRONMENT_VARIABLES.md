# Environment Variables Configuration

This document describes the environment variables used in the OpenGlass project.

## Required Environment Variables

### Ollama Configuration
- `EXPO_PUBLIC_OLLAMA_API_URL`: URL for Ollama chat API (default: `http://localhost:11434/api/chat`)
- `EXPO_PUBLIC_OLLAMA_GENERATE_URL`: URL for Ollama generate API (default: `http://localhost:11434/api/generate`)

## Optional Environment Variables

### Alternative AI Services
- `EXPO_PUBLIC_GROQ_API_KEY`: API key for Groq service (optional)
- `EXPO_PUBLIC_OPENAI_API_KEY`: API key for OpenAI service (optional)

## Setup Instructions

1. Create a `.env` file in the project root
2. Copy the following template and modify as needed:

```bash
# Ollama API Configuration
EXPO_PUBLIC_OLLAMA_API_URL=http://localhost:11434/api/chat
EXPO_PUBLIC_OLLAMA_GENERATE_URL=http://localhost:11434/api/generate

# Alternative AI Services (Optional)
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

## Notes

- The `EXPO_PUBLIC_` prefix is required for Expo to expose these variables to the client-side code
- If you don't set these variables, the application will use the default values defined in `sources/keys.ts`
- Make sure Ollama is running on `localhost:11434` for the default configuration to work

