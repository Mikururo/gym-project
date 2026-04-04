import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.routes';
import swaggerSpec from './swagger';
import { connectWithRetry } from './db/database';

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT ?? 3001);

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
  return res.status(200).json({ status: 'ok', service: 'auth-service' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);

app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: 'Route not found' });
});

const bootstrap = async (): Promise<void> => {
  try {
    await connectWithRetry();

    app.listen(port, () => {
      console.log(`🚀 auth-service started on port ${port}`);
    });
  } catch (error: unknown) {
    console.error('Failed to start auth-service', error);
    process.exit(1);
  }
};

void bootstrap();
