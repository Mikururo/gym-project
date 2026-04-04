import path from 'path';

import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'Микросервис авторизации для системы учёта клиентов тренажерного зала',
    },
    servers: [
      {
        url: 'http://localhost:3001',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'name', 'role', 'created_at'],
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', example: 'admin@gym.ru' },
            name: { type: 'string', example: 'Администратор' },
            role: { type: 'string', enum: ['admin', 'trainer'], example: 'admin' },
            created_at: { type: 'string', format: 'date-time', example: '2026-04-02T09:00:00.000Z' },
          },
        },
        AuthTokens: {
          type: 'object',
          required: ['accessToken', 'refreshToken'],
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'role'],
          properties: {
            email: { type: 'string', example: 'trainer@gym.ru' },
            password: { type: 'string', example: 'password123' },
            name: { type: 'string', example: 'Иван Петров' },
            role: { type: 'string', enum: ['admin', 'trainer'], example: 'trainer' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@gym.ru' },
            password: { type: 'string', example: 'password123' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        AuthResponse: {
          allOf: [
            { $ref: '#/components/schemas/AuthTokens' },
            {
              type: 'object',
              required: ['user'],
              properties: {
                user: { $ref: '#/components/schemas/User' },
              },
            },
          ],
        },
        SuccessResponse: {
          type: 'object',
          required: ['success'],
          properties: {
            success: { type: 'boolean', example: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'auth-service' },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, './routes/*.{ts,js}'),
    path.join(__dirname, './index.{ts,js}'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
