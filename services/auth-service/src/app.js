

import express from 'express';

import cors from 'cors';

import helmet from 'helmet';

import morgan from 'morgan';

import errorMiddleware from './middleware/error.middleware.js';

import notFoundMiddleware from './middleware/notFound.middleware.js';

import healthRoutes from './routes/health.routes.js';

import authRoutes from './routes/auth.routes.js';

import userRoutes from './routes/user.routes.js';

import notificationRoutes from './routes/notification.routes.js';

const app = express();

app.use(cors());

app.use(helmet());

app.use(morgan('dev'));

app.use(express.json());

app.use('/api/v1/health', healthRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/v1/users', userRoutes);
app.use('/users', userRoutes);

app.use('/api/v1/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;