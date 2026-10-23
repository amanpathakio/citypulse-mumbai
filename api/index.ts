/**
 * Vercel Serverless Function Entry Point
 * Routes all /api/* requests to the Express application.
 */

import { createExpressApp } from '../src/server/app';

const app = createExpressApp();

export default app;
