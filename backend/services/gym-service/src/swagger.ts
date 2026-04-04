import path from 'path';

import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gym Service API',
      version: '1.0.0',
      description: 'Микросервис основной бизнес-логики для тренажерного зала',
    },
    servers: [
      {
        url: 'http://localhost:3002',
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
        Client: {
          type: 'object',
          required: ['id', 'name', 'created_at'],
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Иван Иванов' },
            email: { type: 'string', nullable: true, example: 'ivan@mail.ru' },
            phone: { type: 'string', nullable: true, example: '+79001234567' },
            birth_date: { type: 'string', format: 'date', nullable: true, example: '1998-05-10' },
            photo_url: { type: 'string', nullable: true, example: 'https://example.com/photo.jpg' },
            notes: { type: 'string', nullable: true, example: 'Предпочитает вечерние тренировки' },
            created_at: { type: 'string', format: 'date-time', example: '2026-04-02T09:00:00.000Z' },
          },
        },
        ClientInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Иван Иванов' },
            email: { type: 'string', example: 'ivan@mail.ru' },
            phone: { type: 'string', example: '+79001234567' },
            birth_date: { type: 'string', format: 'date', example: '1998-05-10' },
            photo_url: { type: 'string', example: 'https://example.com/photo.jpg' },
            notes: { type: 'string', example: 'Клиент занимается по программе набора массы' },
          },
        },
        Subscription: {
          type: 'object',
          required: ['id', 'client_id', 'type', 'start_date', 'end_date', 'price', 'is_active', 'created_at'],
          properties: {
            id: { type: 'integer', example: 1 },
            client_id: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['single', 'monthly', 'quarterly', 'annual'], example: 'monthly' },
            start_date: { type: 'string', format: 'date', example: '2026-04-01' },
            end_date: { type: 'string', format: 'date', example: '2026-04-30' },
            price: { type: 'number', example: 3500 },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time', example: '2026-04-02T09:00:00.000Z' },
          },
        },
        SubscriptionInput: {
          type: 'object',
          required: ['client_id', 'type', 'start_date', 'end_date', 'price'],
          properties: {
            client_id: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['single', 'monthly', 'quarterly', 'annual'], example: 'monthly' },
            start_date: { type: 'string', format: 'date', example: '2026-04-01' },
            end_date: { type: 'string', format: 'date', example: '2026-04-30' },
            price: { type: 'number', example: 3500 }
          },
        },
        SubscriptionUpdateInput: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['single', 'monthly', 'quarterly', 'annual'], example: 'quarterly' },
            start_date: { type: 'string', format: 'date', example: '2026-04-01' },
            end_date: { type: 'string', format: 'date', example: '2026-06-30' },
            price: { type: 'number', example: 9000 },
            is_active: { type: 'boolean', example: true },
          },
        },
        Visit: {
          type: 'object',
          required: ['id', 'client_id', 'visited_at'],
          properties: {
            id: { type: 'integer', example: 1 },
            client_id: { type: 'integer', example: 1 },
            visited_at: { type: 'string', format: 'date-time', example: '2026-04-02T09:30:00.000Z' },
            notes: { type: 'string', nullable: true, example: 'Силовая тренировка' },
          },
        },
        VisitInput: {
          type: 'object',
          required: ['client_id'],
          properties: {
            client_id: { type: 'integer', example: 1 },
            visited_at: { type: 'string', format: 'date-time', example: '2026-04-02T09:30:00.000Z' },
            notes: { type: 'string', example: 'Кардио + растяжка' },
          },
        },
        ClientDetails: {
          allOf: [
            { $ref: '#/components/schemas/Client' },
            {
              type: 'object',
              properties: {
                lastSubscription: {
                  oneOf: [
                    { $ref: '#/components/schemas/Subscription' },
                    { type: 'null' }
                  ]
                },
                totalVisits: { type: 'integer', example: 12 }
              }
            }
          ]
        },
        ClientStats: {
          type: 'object',
          properties: {
            totalVisits: { type: 'integer', example: 20 },
            visitsThisMonth: { type: 'integer', example: 6 },
            activeSubscription: {
              oneOf: [
                { $ref: '#/components/schemas/Subscription' },
                { type: 'null' }
              ]
            },
            daysUntilExpiry: {
              oneOf: [
                { type: 'integer', example: 18 },
                { type: 'null' }
              ]
            }
          }
        },
        PaginatedClients: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Client' }
            },
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 }
          }
        },
        VisitListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Visit' }
            },
            total: { type: 'integer', example: 18 }
          }
        },
        DailyVisitStat: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date', example: '2026-04-01' },
            count: { type: 'integer', example: 7 }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Client not found' }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'gym-service' }
          }
        }
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
