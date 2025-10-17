// Note: This file is now imported by bootstrap.ts
// The bootstrap.ts file handles the complete initialization sequence
import app from './app';
import config from '@config/index';
import logger from './observability/index';

// This file is kept for backward compatibility and testing
// In production, use bootstrap.ts for the full initialization sequence

export { app, config, logger };
export default app;
