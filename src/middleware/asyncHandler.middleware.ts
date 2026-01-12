/**
 * Async Handler Middleware
 * Wraps async route handlers to catch promise rejections and pass them to error middleware
 * Eliminates need for try-catch blocks in every controller
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to automatically catch errors
 * @param fn - Async route handler function
 * @returns Express middleware function
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * }));
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};

export default asyncHandler;
