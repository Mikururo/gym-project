import { QueryResultRow } from 'pg';

import { query } from '../db/database';
import {
  Client,
  ClientStats,
  PaginatedResponse,
  Subscription,
  SubscriptionType,
} from '../../../../shared/types';

interface ClientRow extends QueryResultRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: Date | string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: Date | string;
}

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

interface CountRow extends QueryResultRow {
  count: string;
}

interface VisitCountRow extends QueryResultRow {
  count: string;
}

interface ClientDetails extends Client {
  lastSubscription: Subscription | null;
  totalVisits: number;
}

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

const throwHttpError = (message: string, statusCode: number): never => {
  const error: ErrorWithStatus = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const toDateOnly = (value: Date | string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
};

const toIsoString = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const mapClient = (row: ClientRow): Client => ({
  id: row.id,
  name: row.name,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  birth_date: toDateOnly(row.birth_date),
  photo_url: row.photo_url ?? undefined,
  notes: row.notes ?? undefined,
  created_at: toIsoString(row.created_at),
});

const mapSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  client_id: row.client_id,
  type: row.type,
  start_date: toDateOnly(row.start_date) ?? '',
  end_date: toDateOnly(row.end_date) ?? '',
  price: Number(row.price),
  is_active: row.is_active,
  created_at: toIsoString(row.created_at),
});

const parsePositiveInteger = (value: number, fallback: number): number => {
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

export const listClients = async (
  search: string | undefined,
  page: number,
  limit: number,
): Promise<PaginatedResponse<Client>> => {
  const safePage: number = parsePositiveInteger(page, 1);
  const safeLimit: number = parsePositiveInteger(limit, 10);
  const offset: number = (safePage - 1) * safeLimit;
  const trimmedSearch: string = search?.trim() ?? '';

  const params: unknown[] = [];
  const whereConditions: string[] = [];

  if (trimmedSearch) {
    params.push(`%${trimmedSearch}%`);
    whereConditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }

  const whereClause: string = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query<CountRow>(
    `SELECT COUNT(*)::text AS count FROM clients ${whereClause}`,
    params,
  );

  params.push(safeLimit);
  params.push(offset);

  const dataResult = await query<ClientRow>(
    `
      SELECT id, name, email, phone, birth_date, photo_url, notes, created_at
      FROM clients
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params,
  );

  return {
    data: dataResult.rows.map(mapClient),
    total: Number(countResult.rows[0]?.count ?? 0),
    page: safePage,
    limit: safeLimit,
  };
};

export const getClientById = async (id: number): Promise<ClientDetails> => {
  const clientResult = await query<ClientRow>(
    'SELECT id, name, email, phone, birth_date, photo_url, notes, created_at FROM clients WHERE id = $1',
    [id],
  );

  const clientRow: ClientRow | undefined = clientResult.rows[0];

  if (!clientRow) {
    throwHttpError('Client not found', 404);
  }

  const subscriptionResult = await query<SubscriptionRow>(
    `
      SELECT id, client_id, type, start_date, end_date, price, is_active, created_at
      FROM subscriptions
      WHERE client_id = $1
      ORDER BY start_date DESC, created_at DESC
      LIMIT 1
    `,
    [id],
  );

  const visitCountResult = await query<VisitCountRow>(
    'SELECT COUNT(*)::text AS count FROM visits WHERE client_id = $1',
    [id],
  );

  return {
    ...mapClient(clientRow),
    lastSubscription: subscriptionResult.rows[0] ? mapSubscription(subscriptionResult.rows[0]) : null,
    totalVisits: Number(visitCountResult.rows[0]?.count ?? 0),
  };
};

export const createClient = async (
  payload: Partial<Client>,
): Promise<Client> => {
  const name: string = String(payload.name ?? '').trim();
  const email: string | null = payload.email ? String(payload.email).trim().toLowerCase() : null;
  const phone: string | null = payload.phone ? String(payload.phone).trim() : null;
  const birthDate: string | null = payload.birth_date ? String(payload.birth_date).trim() : null;
  const photoUrl: string | null = payload.photo_url ? String(payload.photo_url).trim() : null;
  const notes: string | null = payload.notes ? String(payload.notes).trim() : null;

  if (!name) {
    throwHttpError('Client name is required', 400);
  }

  const result = await query<ClientRow>(
    `
      INSERT INTO clients (name, email, phone, birth_date, photo_url, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, birth_date, photo_url, notes, created_at
    `,
    [name, email, phone, birthDate, photoUrl, notes],
  );

  return mapClient(result.rows[0]);
};

export const updateClient = async (
  id: number,
  payload: Partial<Client>,
): Promise<Client> => {
  const existingClient = await query<ClientRow>(
    'SELECT id, name, email, phone, birth_date, photo_url, notes, created_at FROM clients WHERE id = $1',
    [id],
  );

  const currentClient: ClientRow | undefined = existingClient.rows[0];

  if (!currentClient) {
    throwHttpError('Client not found', 404);
  }

  const name: string = payload.name ? String(payload.name).trim() : currentClient.name;
  const email: string | null = payload.email !== undefined
    ? (payload.email ? String(payload.email).trim().toLowerCase() : null)
    : currentClient.email;
  const phone: string | null = payload.phone !== undefined
    ? (payload.phone ? String(payload.phone).trim() : null)
    : currentClient.phone;
  const birthDate: string | null = payload.birth_date !== undefined
    ? (payload.birth_date ? String(payload.birth_date).trim() : null)
    : (toDateOnly(currentClient.birth_date) ?? null);
  const photoUrl: string | null = payload.photo_url !== undefined
    ? (payload.photo_url ? String(payload.photo_url).trim() : null)
    : currentClient.photo_url;
  const notes: string | null = payload.notes !== undefined
    ? (payload.notes ? String(payload.notes).trim() : null)
    : currentClient.notes;

  if (!name) {
    throwHttpError('Client name is required', 400);
  }

  const result = await query<ClientRow>(
    `
      UPDATE clients
      SET name = $1, email = $2, phone = $3, birth_date = $4, photo_url = $5, notes = $6
      WHERE id = $7
      RETURNING id, name, email, phone, birth_date, photo_url, notes, created_at
    `,
    [name, email, phone, birthDate, photoUrl, notes, id],
  );

  return mapClient(result.rows[0]);
};

export const deleteClient = async (id: number): Promise<boolean> => {
  const result = await query<ClientRow>('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
  return Boolean(result.rowCount && result.rowCount > 0);
};

export const getClientStats = async (id: number): Promise<ClientStats> => {
  const clientExists = await query<ClientRow>('SELECT id, name, email, phone, birth_date, photo_url, notes, created_at FROM clients WHERE id = $1', [id]);

  if (!clientExists.rowCount) {
    throwHttpError('Client not found', 404);
  }

  const totalVisitsResult = await query<CountRow>(
    'SELECT COUNT(*)::text AS count FROM visits WHERE client_id = $1',
    [id],
  );

  const visitsThisMonthResult = await query<CountRow>(
    `
      SELECT COUNT(*)::text AS count
      FROM visits
      WHERE client_id = $1
        AND visited_at >= date_trunc('month', CURRENT_DATE)::timestamp
        AND visited_at < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::timestamp
    `,
    [id],
  );

  const activeSubscriptionResult = await query<SubscriptionRow>(
    `
      SELECT id, client_id, type, start_date, end_date, price, is_active, created_at
      FROM subscriptions
      WHERE client_id = $1
        AND is_active = TRUE
        AND CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY end_date DESC
      LIMIT 1
    `,
    [id],
  );

  const activeSubscription: Subscription | null = activeSubscriptionResult.rows[0]
    ? mapSubscription(activeSubscriptionResult.rows[0])
    : null;

  let daysUntilExpiry: number | null = null;

  if (activeSubscription) {
    const endDate = new Date(activeSubscription.end_date);
    const today = new Date();
    const diffMs: number = endDate.getTime() - today.getTime();
    daysUntilExpiry = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
  }

  return {
    totalVisits: Number(totalVisitsResult.rows[0]?.count ?? 0),
    visitsThisMonth: Number(visitsThisMonthResult.rows[0]?.count ?? 0),
    activeSubscription,
    daysUntilExpiry,
  };
};
