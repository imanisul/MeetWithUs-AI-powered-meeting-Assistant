import 'express-async-errors';

import cors from 'cors';

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';



import errorMiddleware from './middleware/error.middleware.js';
import notFoundMiddleware from './middleware/notFound.middleware.js';

import healthRoutes from './routes/health.routes.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/v1/health', healthRoutes);

// Microservices routing map
const SERVICES = {
  auth: process.env.AUTH_SERVICE || 'http://localhost:8002',
  meeting: process.env.MEETING_SERVICE || 'http://localhost:8003',
  ai: process.env.AI_SERVICE || 'http://localhost:8005',
  document: process.env.DOCUMENT_SERVICE || process.env.AI_SERVICE || 'http://localhost:8005',
};

// Mount proxy middleware (support both /api/v1/* and short paths from frontend)
app.use(createProxyMiddleware({ pathFilter: ['/api/v1/auth', '/auth'], target: SERVICES.auth, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: ['/api/v1/meetings', '/meetings'], target: SERVICES.meeting, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: ['/api/v1/ai', '/ai'], target: SERVICES.ai, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: ['/api/v1/documents', '/documents'], target: SERVICES.document, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: ['/api/v1/users', '/users'], target: SERVICES.auth, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: ['/api/v1/notifications', '/notifications'], target: SERVICES.auth, changeOrigin: true }));

// Body parser for routes defined after this
app.use(express.json());

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;