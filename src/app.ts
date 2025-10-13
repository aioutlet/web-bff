import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from '@config/index';
import routes from '@routes/index';
import { correlationIdMiddleware } from '@middleware/correlation-id.middleware';
import { loggingMiddleware } from '@middleware/logging.middleware';
import { errorMiddleware } from '@middleware/error.middleware';
import { rateLimitMiddleware } from '@middleware/rate-limit.middleware';
import healthRoutes from '@routes/health.routes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Custom middleware
app.use(correlationIdMiddleware);
app.use(loggingMiddleware);
app.use(rateLimitMiddleware);

// Health check route (no /api prefix)
app.use('/health', healthRoutes);

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
