import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { v4 as uuidv4 } from 'uuid';
import { redis } from './db/redis';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Trust the first proxy (Nginx) so rate-limiting sees real client IPs
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '100kb' }));

// Attach a request ID to every request for distributed tracing
app.use((req, res, next) => {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
});

// Redis-backed rate limiters — counters survive restarts and work across multiple instances
const redisStore = () =>
  new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).call(...args),
  });

// General API: 200 req / 15 min
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore(),
  })
);

// Auth endpoints: 20 req / 15 min (brute-force protection)
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore(),
    message: { error: 'Too many auth attempts, please try again later.' },
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
