import { Router } from 'express';

import {
  createClientController,
  deleteClientController,
  getClient,
  getClients,
  getClientStatsController,
  updateClientController,
} from '../controllers/clients.controller';

const router = Router();

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Получить список клиентов
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени или email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Список клиентов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedClients'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getClients);

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Получить клиента по id
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID клиента
 *     responses:
 *       200:
 *         description: Клиент с последней подпиской и количеством визитов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientDetails'
 *       400:
 *         description: Неверный id клиента
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Клиент не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getClient);

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Создать клиента
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput'
 *           example:
 *             name: Иван Иванов
 *             email: ivan@mail.ru
 *             phone: +79001234567
 *             birth_date: 1998-05-10
 *             photo_url: https://example.com/ivan.jpg
 *             notes: Новый клиент
 *     responses:
 *       201:
 *         description: Клиент создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: Ошибка валидации или email уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', createClientController);

/**
 * @swagger
 * /clients/{id}:
 *   put:
 *     summary: Обновить клиента
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID клиента
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput'
 *           example:
 *             name: Иван Иванов
 *             email: ivan_new@mail.ru
 *             phone: +79009999999
 *             birth_date: 1998-05-10
 *             photo_url: https://example.com/ivan-new.jpg
 *             notes: Обновлённая карточка клиента
 *     responses:
 *       200:
 *         description: Клиент обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: Неверный id или ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Клиент не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', updateClientController);

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Удалить клиента
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID клиента
 *     responses:
 *       200:
 *         description: Клиент удалён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Неверный id клиента
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Клиент не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', deleteClientController);

/**
 * @swagger
 * /clients/{id}/stats:
 *   get:
 *     summary: Получить статистику клиента
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID клиента
 *     responses:
 *       200:
 *         description: Статистика клиента
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientStats'
 *       400:
 *         description: Неверный id клиента
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Клиент не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/stats', getClientStatsController);

export default router;
