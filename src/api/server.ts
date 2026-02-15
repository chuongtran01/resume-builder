#!/usr/bin/env node
/**
 * REST API server for resume builder
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@utils/logger';
import { registerRoutes } from '@api/routes';

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'resume-builder',
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Resume Builder API',
      version: process.env.npm_package_version || '1.0.0',
      endpoints: {
        health: '/health',
        generate: '/api/generateResume',
        validate: '/api/validate',
        enhance: '/api/enhanceResume',
      },
    });
  });

  // Register API routes
  registerRoutes(app);

  // Error handling middleware (must be last)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`API Error: ${err.message}`);
    if (logger.isVerbose()) {
      logger.error(`Stack trace: ${err.stack}`);
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  return app;
}

/**
 * Start the server
 */
export function startServer(port?: number): void {
  const app = createApp();
  const serverPort = port || parseInt(process.env.PORT || '3000', 10);

  app.listen(serverPort, () => {
    logger.info(`🚀 Resume Builder API server started`);
    logger.info(`   Port: ${serverPort}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   Health check: http://localhost:${serverPort}/health`);
  });
}

/**
 * Default export for programmatic use
 */
export default createApp;

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
