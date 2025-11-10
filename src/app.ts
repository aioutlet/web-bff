import express, { Application } from 'express';
import cors from 'cors';
import config from '@/core/config';
import routes from '@routes/index';
import { traceContextMiddleware } from '@middleware/traceContext.middleware';
import { errorMiddleware } from '@middleware/error.middleware';
import operationalRoutes from '@routes/operational.routes';

const app: Application = express();

// Trust proxy for accurate IP address extraction
app.set('trust proxy', true);

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    exposedHeaders: ['traceparent'],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(traceContextMiddleware as any); // W3C Trace Context

// Operational routes (no /api prefix)
app.use('/', operationalRoutes);

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
app.use(errorMiddleware as any);

export default app;
