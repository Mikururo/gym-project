import { PoolClient, QueryResultRow } from 'pg';

import pool, { query } from '../db/database';
import { Subscription, SubscriptionType } from '../../../../shared/types';

interface SubscriptionRow extends QueryResultRow {
  id: number;
  client_id: number;
  type: SubscriptionType;
  start_date: Date | string;
  end_date: Date | string;
  price: string | number;
  is_active: boolean;
  created_at: Date | string;
}

interface ClientExistsRow extends QueryResultRow {
  id: number;
}

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

const throwHttpError = (message: string, statusCode: number): never => {
  const error: ErrorWithStatus = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const toDateOnly = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
};

const toIsoString = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const mapSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  client_id: row.client_id,
  type: row.type,
  start_date: toDateOnly(row.start_date),
  end_date: toDateOnly(row.end_date),
  price: Number(row.price),
  is_active: row.is_active,
  created_at: toIsoString(row.created_at),
});

const ensureClientExists = async (clientId: number, client?: PoolClient): Promise<void> => {
  const executor = client ?? pool;
  const result = await executor.query<ClientExistsRow>('SELECT id FROM clients WHERE id = $1', [clientId]);

  if (!result.rowCount) {
    throwHttpError('Client not found', 404);
  }
};

const validateSubscriptionPayload = (
  type: string,
  startDate: string,
  endDate: string,
  price: number,
): void => {
  if (!type || !startDate || !endDate || Number.isNaN(price)) {
    throwHttpError('type, start_date, end_date and price are required', 400);
  }

  if (!Object.values(SubscriptionType).includes(type as SubscriptionType)) {
    throwHttpError('Invalid subscription type', 400);
  }

  if (new Date(startDate) > new Date(endDate)) {
    throwHttpError('end_date must be greater than or equal to start_date', 400);
  }

  if (price < 0) {
    throwHttpError('price must be greater than or equal to 0', 400);
  }
};

const calculateIsActive = (startDate: string, endDate: string): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  return startDate <= today && endDate >= today;
};

export const listSubscriptions = async (
  clientId?: number,
  isActive?: boolean,
): Promise<Subscription[]> => {
  const params: unknown[] = [];
  const whereConditions: string[] = [];

  if (typeof clientId === 'number' && !Number.isNaN(clientId)) {
    params.push(clientId);
    whereConditions.push(`client_id = $${params.length}`);
  }

  if (typeof isActive === 'boolean') {
    params.push(isActive);
    whereConditions.push(`is_active = $${params.length}`);
  }

  const whereClause: string = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const result = await query<SubscriptionRow>(
    `
      SELECT id, client_id, type, start_date, end_date, price, is_active, created_at
      FROM subscriptions
      ${whereClause}
      ORDER BY created_at DESC
    `,
    params,
  );

  return result.rows.map(mapSubscription);
};

export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  const result = await query<SubscriptionRow>(
    `
      SELECT id, client_id, type, start_date, end_date, price, is_active, created_at
      FROM subscriptions
      WHERE id = $1
    `,
    [id],
  );

  const row: SubscriptionRow | undefined = result.rows[0];

  if (!row) {
    throwHttpError('Subscription not found', 404);
  }

  return mapSubscription(row);
};

export const createSubscription = async (
  payload: Partial<Subscription>,
): Promise<Subscription> => {
  const clientId: number = Number(payload.client_id);
  const type: string = String(payload.type ?? '').trim();
  const startDate: string = String(payload.start_date ?? '').trim();
  const endDate: string = String(payload.end_date ?? '').trim();
  const price: number = Number(payload.price);

  if (!clientId || Number.isNaN(clientId)) {
    throwHttpError('client_id is required', 400);
  }

  validateSubscriptionPayload(type, startDate, endDate, price);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureClientExists(clientId, client);
    await client.query(
      'UPDATE subscriptions SET is_active = FALSE WHERE client_id = $1 AND is_active = TRUE',
      [clientId],
    );

    const isActive: boolean = calculateIsActive(startDate, endDate);

    const result = await client.query<SubscriptionRow>(
      `
        INSERT INTO subscriptions (client_id, type, start_date, end_date, price, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, client_id, type, start_date, end_date, price, is_active, created_at
      `,
      [clientId, type, startDate, endDate, price, isActive],
    );

    await client.query('COMMIT');

    return mapSubscription(result.rows[0]);
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateSubscription = async (
  id: number,
  payload: Partial<Subscription>,
): Promise<Subscription> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingSubscription = await client.query<SubscriptionRow>(
      `
        SELECT id, client_id, type, start_date, end_date, price, is_active, created_at
        FROM subscriptions
        WHERE id = $1
      `,
      [id],
    );

    const current: SubscriptionRow | undefined = existingSubscription.rows[0];

    if (!current) {
      throwHttpError('Subscription not found', 404);
    }

    const type: string = payload.type ? String(payload.type).trim() : current.type;
    const startDate: string = payload.start_date
      ? String(payload.start_date).trim()
      : toDateOnly(current.start_date);
    const endDate: string = payload.end_date
      ? String(payload.end_date).trim()
      : toDateOnly(current.end_date);
    const price: number = payload.price !== undefined ? Number(payload.price) : Number(current.price);
    const isActive: boolean = payload.is_active !== undefined
      ? Boolean(payload.is_active)
      : current.is_active;

    validateSubscriptionPayload(type, startDate, endDate, price);

    if (isActive) {
      await client.query(
        'UPDATE subscriptions SET is_active = FALSE WHERE client_id = $1 AND id <> $2',
        [current.client_id, id],
      );
    }

    const result = await client.query<SubscriptionRow>(
      `
        UPDATE subscriptions
        SET type = $1,
            start_date = $2,
            end_date = $3,
            price = $4,
            is_active = $5
        WHERE id = $6
        RETURNING id, client_id, type, start_date, end_date, price, is_active, created_at
      `,
      [type, startDate, endDate, price, isActive, id],
    );

    await client.query('COMMIT');

    return mapSubscription(result.rows[0]);
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteSubscription = async (id: number): Promise<boolean> => {
  const result = await query<SubscriptionRow>('DELETE FROM subscriptions WHERE id = $1 RETURNING id', [id]);
  return Boolean(result.rowCount && result.rowCount > 0);
};
