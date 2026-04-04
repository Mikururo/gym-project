import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import clientsRoutes from './routes/clients.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import visitsRoutes from './routes/visits.routes';
import { verifyToken } from './middlewares/auth.middleware';
import swaggerSpec from './swagger';
import { connectWithRetry } from './db/database';

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT ?? 3002);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Проверка состояния сервиса
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Сервис работает
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok', service: 'gym-service' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/clients', verifyToken, clientsRoutes);
app.use('/subscriptions', verifyToken, subscriptionsRoutes);
app.use('/visits', verifyToken, visitsRoutes);

app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: 'Route not found' });
});

const bootstrap = async (): Promise<void> => {
  try {
    await connectWithRetry();

    app.listen(port, () => {
      console.log(`🚀 gym-service started on port ${port}`);
    });
  } catch (error: unknown) {
    console.error('Failed to start gym-service', error);
    process.exit(1);
  }
};

void bootstrap();
