export const keys = {
    groq: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '',
    ollama: process.env.EXPO_PUBLIC_OLLAMA_API_URL ?? 'http://localhost:11434/api/chat',
    ollamaGenerate: process.env.EXPO_PUBLIC_OLLAMA_GENERATE_URL ?? 'http://localhost:11434/api/generate',
    openai: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
};