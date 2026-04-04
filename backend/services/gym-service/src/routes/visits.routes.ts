import { Router } from 'express';

import {
  createVisitController,
  deleteVisitController,
  getDailyStatsController,
  getVisits,
} from '../controllers/visits.controller';

const router = Router();

/**
 * @swagger
 * /visits:
 *   get:
 *     summary: Получить список посещений
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *         description: ID клиента
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата фильтра
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата фильтра
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
 *         description: Список посещений
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VisitListResponse'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getVisits);

/**
 * @swagger
 * /visits:
 *   post:
 *     summary: Создать посещение
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VisitInput'
 *           example:
 *             client_id: 1
 *             visited_at: 2026-04-02T09:30:00.000Z
 *             notes: Силовая тренировка
 *     responses:
 *       201:
 *         description: Посещение создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Visit'
 *       400:
 *         description: Нет активного абонемента или ошибка валидации
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
router.post('/', createVisitController);

/**
 * @swagger
 * /visits/{id}:
 *   delete:
 *     summary: Удалить посещение
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID посещения
 *     responses:
 *       200:
 *         description: Посещение удалено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Неверный id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Посещение не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', deleteVisitController);

/**
 * @swagger
 * /visits/stats/daily:
 *   get:
 *     summary: Получить ежедневную статистику посещений
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата диапазона
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата диапазона
 *     responses:
 *       200:
 *         description: Массив точек для графика посещений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyVisitStat'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats/daily', getDailyStatsController);

export default router;
