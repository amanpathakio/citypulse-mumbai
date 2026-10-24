/**
 * Vercel Serverless Function Entry Point Source
 * Bundled to api/index.js during build to eliminate ESM extensionless import errors on Vercel.
 */

import { createExpressApp } from './app';

const app = createExpressApp();

export default app;
