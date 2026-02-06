import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (parent of server/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // AniList OAuth
  anilist: {
    clientId: process.env.ANILIST_CLIENT_ID || process.env.VITE_ANILIST_CLIENT_ID || '',
    clientSecret: process.env.ANILIST_CLIENT_SECRET || '',
    redirectUri: process.env.ANILIST_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    authUrl: 'https://anilist.co/api/v2/oauth/authorize',
    tokenUrl: 'https://anilist.co/api/v2/oauth/token',
    graphqlUrl: 'https://graphql.anilist.co',
  },

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    user: process.env.DATABASE_USER || 'anime_ranker',
    password: process.env.DATABASE_PASSWORD || '',
    name: process.env.DATABASE_NAME || 'anime_ranker',
  },

  // JWT
  jwt: {
    secret: process.env.SESSION_SECRET || 'development-secret-change-me',
    expiresIn: 604800, // 7 days in seconds
  },
} as const;

// Validate required config in production
if (config.nodeEnv === 'production') {
  const required = [
    'ANILIST_CLIENT_ID',
    'ANILIST_CLIENT_SECRET',
    'DATABASE_PASSWORD',
    'SESSION_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
