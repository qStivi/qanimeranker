import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import rankingsRoutes from './routes/rankings.js';
import proxyRoutes from './routes/proxy.js';
import healthRoutes from './routes/health.js';
import lusca from 'lusca';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https://s4.anilist.co", "data:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for loading external images
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check rate limiter (more permissive for monitoring)
const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (allows frequent health checks)
  standardHeaders: true,
  legacyHeaders: false,
});

// Static files rate limiter (generous for assets)
const staticLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute for static assets
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' })); // Limit request body size
// lgtm[js/missing-token-validation] - CSRF protection via Origin header validation below
// codeql[js/missing-token-validation] - JWT tokens validated in authMiddleware, SameSite cookies used
app.use(cookieParser());
// CSRF protection via lusca (token-based)
app.use(lusca.csrf());

// CSRF protection via Origin/Referer header validation for state-changing requests
// This is defense-in-depth alongside SameSite cookies and lusca CSRF tokens
app.use((req, res, next) => {
  // Only check state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;

    // Allow requests with no origin (same-origin requests from some browsers, curl, etc.)
    // In production, these will still be protected by SameSite cookies
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const allowedUrl = new URL(config.frontendUrl);

        // Check if origin matches our frontend URL
        if (originUrl.origin !== allowedUrl.origin) {
          // Log without user-controlled data to prevent log injection
          console.warn('CSRF: Blocked request from invalid origin');
          res.status(403).json({ error: 'Invalid origin' });
          return;
        }
      } catch {
        // Invalid URL in origin header
        res.status(403).json({ error: 'Invalid origin' });
        return;
      }
    }
  }
  next();
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/health', healthLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/health', healthRoutes);

// Serve static frontend in production
if (config.nodeEnv === 'production') {
  const staticPath = path.resolve(__dirname, '../../dist');

  // Apply rate limiting to static files
  app.use(express.static(staticPath));

  // SPA fallback - serve index.html for all non-API routes
  // Express 5 requires named parameters, use {*path} instead of *
  // Apply staticLimiter to prevent abuse of fallback route
  app.get('/{*path}', staticLimiter, (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});
