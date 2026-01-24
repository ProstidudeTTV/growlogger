import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is not defined in environment variables');
}

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not defined in environment variables');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY is not defined in environment variables');
}

export const config = {
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  ai: {
    apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY, // Prefer Gemini if set, fallback to OpenAI
    apiUrl: process.env.OPENAI_API_URL, // Optional: for Ollama or custom OpenAI-compatible APIs
    model: process.env.OPENAI_MODEL || (process.env.GEMINI_API_KEY ? 'gemini-flash-latest' : 'gpt-3.5-turbo'), // Model name (gemini-flash-latest for Gemini, gpt-3.5-turbo for OpenAI)
    provider: process.env.AI_PROVIDER || 'auto', // 'openai', 'gemini', 'ollama', or 'auto'
  },
  environment: process.env.NODE_ENV || 'development',
} as const;
