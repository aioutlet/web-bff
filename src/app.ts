import express, { Application } from 'express';
import cors from 'cors';
import config from '@/core/config';
import routes from '@routes/index';
import { correlationIdMiddleware } from '@middleware/correlation-id.middleware';
import { errorMiddleware } from '@middleware/error.middleware';
import healthRoutes from '@routes/health.routes';

const app: Application = express();

// Trust proxy for accurate IP address extraction
app.set('trust proxy', true);

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    exposedHeaders: ['x-correlation-id', 'X-Correlation-ID'],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(correlationIdMiddleware);

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
