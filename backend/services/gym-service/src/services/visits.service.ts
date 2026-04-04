import { QueryResultRow } from 'pg';

import { query } from '../db/database';
import { Visit } from '../../../../shared/types';

interface VisitRow extends QueryResultRow {
  id: number;
  client_id: number;
  visited_at: Date | string;
  notes: string | null;
}

interface CountRow extends QueryResultRow {
  count: string;
}

interface DailyStatsRow extends QueryResultRow {
  date: string;
  count: string;
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

const toIsoString = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const mapVisit = (row: VisitRow): Visit => ({
  id: row.id,
  client_id: row.client_id,
  visited_at: toIsoString(row.visited_at),
  notes: row.notes ?? undefined,
});

const parsePositiveInteger = (value: number, fallback: number): number => {
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

export const listVisits = async (
  clientId?: number,
  from?: string,
  to?: string,
  page?: number,
  limit?: number,
): Promise<{ data: Visit[]; total: number }> => {
  const safePage: number = parsePositiveInteger(page ?? 1, 1);
  const safeLimit: number = parsePositiveInteger(limit ?? 10, 10);
  const offset: number = (safePage - 1) * safeLimit;

  const params: unknown[] = [];
  const whereConditions: string[] = [];

  if (typeof clientId === 'number' && !Number.isNaN(clientId)) {
    params.push(clientId);
    whereConditions.push(`client_id = $${params.length}`);
  }

  if (from) {
    params.push(from);
    whereConditions.push(`visited_at >= $${params.length}::timestamp`);
  }

  if (to) {
    params.push(`${to} 23:59:59`);
    whereConditions.push(`visited_at <= $${params.length}::timestamp`);
  }

  const whereClause: string = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query<CountRow>(
    `SELECT COUNT(*)::text AS count FROM visits ${whereClause}`,
    params,
  );

  params.push(safeLimit);
  params.push(offset);

  const result = await query<VisitRow>(
    `
      SELECT id, client_id, visited_at, notes
      FROM visits
      ${whereClause}
      ORDER BY visited_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params,
  );

  return {
    data: result.rows.map(mapVisit),
    total: Number(countResult.rows[0]?.count ?? 0),
  };
};

export const createVisit = async (
  payload: Partial<Visit>,
): Promise<Visit> => {
  const clientId: number = Number(payload.client_id);
  const visitedAt: string | null = payload.visited_at ? String(payload.visited_at).trim() : null;
  const notes: string | null = payload.notes ? String(payload.notes).trim() : null;

  if (!clientId || Number.isNaN(clientId)) {
    throwHttpError('client_id is required', 400);
  }

  const clientExists = await query<ClientExistsRow>('SELECT id FROM clients WHERE id = $1', [clientId]);

  if (!clientExists.rowCount) {
    throwHttpError('Client not found', 404);
  }

  const activeSubscription = await query<CountRow>(
    `
      SELECT COUNT(*)::text AS count
      FROM subscriptions
      WHERE client_id = $1
        AND is_active = TRUE
        AND CURRENT_DATE BETWEEN start_date AND end_date
    `,
    [clientId],
  );

  if (Number(activeSubscription.rows[0]?.count ?? 0) === 0) {
    throwHttpError('No active subscription', 400);
  }

  const result = await query<VisitRow>(
    `
      INSERT INTO visits (client_id, visited_at, notes)
      VALUES ($1, COALESCE($2::timestamp, NOW()), $3)
      RETURNING id, client_id, visited_at, notes
    `,
    [clientId, visitedAt, notes],
  );

  return mapVisit(result.rows[0]);
};

export const deleteVisit = async (id: number): Promise<boolean> => {
  const result = await query<VisitRow>('DELETE FROM visits WHERE id = $1 RETURNING id', [id]);
  return Boolean(result.rowCount && result.rowCount > 0);
};

export const getDailyVisitStats = async (
  from?: string,
  to?: string,
): Promise<Array<{ date: string; count: number }>> => {
  const fromDate: string = from?.trim() || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const toDate: string = to?.trim() || new Date().toISOString().slice(0, 10);

  const result = await query<DailyStatsRow>(
    `
      WITH days AS (
        SELECT generate_series($1::date, $2::date, INTERVAL '1 day')::date AS day
      )
      SELECT
        TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
        COUNT(visits.id)::text AS count
      FROM days
      LEFT JOIN visits
        ON DATE(visits.visited_at) = days.day
      GROUP BY days.day
      ORDER BY days.day ASC
    `,
    [fromDate, toDate],
  );

  return result.rows.map((row: DailyStatsRow) => ({
    date: row.date,
    count: Number(row.count),
  }));
};
