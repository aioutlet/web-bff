/**
 * Home Routes for Web BFF
 * Route definitions for service information and version endpoints
 */

import { Router, RequestHandler } from 'express';
import * as homeController from '@controllers/home.controller';

const router = Router();

// Service Information Routes
router.get('/', homeController.info as unknown as RequestHandler);
router.get('/version', homeController.version as unknown as RequestHandler);

export default router;
