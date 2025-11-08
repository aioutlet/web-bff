/**
 * Operational Routes for Web BFF
 * Route definitions only - all logic is in operational.controller.ts
 * These endpoints are used by monitoring systems, load balancers, and DevOps tools
 */

import { Router } from 'express';
import * as operationalController from '@controllers/operational.controller';

const router = Router();

// Operational/Health Check Routes
router.get('/', operationalController.health);
router.get('/ready', operationalController.readiness);
router.get('/live', operationalController.liveness);

export default router;
