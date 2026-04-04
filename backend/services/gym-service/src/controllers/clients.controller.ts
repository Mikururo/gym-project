import { Request, Response } from 'express';

import {
  createClient,
  deleteClient,
  getClientById,
  getClientStats,
  listClients,
  updateClient,
} from '../services/clients.service';
import { Client } from '../../../../shared/types';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: string;
}

const getStatusCode = (error: unknown): number => {
  if (error instanceof Error && 'statusCode' in error) {
    const statusCode: unknown = (error as ErrorWithStatus).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }
  }

  if (error instanceof Error && 'code' in error) {
    const code: unknown = (error as ErrorWithStatus).code;
    if (code === '23505') {
      return 400;
    }
  }

  return 500;
};

const getMessage = (error: unknown): string => {
  if (error instanceof Error && 'code' in error && (error as ErrorWithStatus).code === '23505') {
    return 'Client with this email already exists';
  }

  return error instanceof Error ? error.message : 'Internal server error';
};

export const getClients = async (req: Request, res: Response): Promise<Response> => {
  try {
    const search: string | undefined = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page: number = Number(req.query.page ?? 1);
    const limit: number = Number(req.query.limit ?? 10);

    const result = await listClients(search, page, limit);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const getClient = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }

    const result = await getClientById(id);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const createClientController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload: Partial<Client> = req.body as Partial<Client>;
    const result = await createClient(payload);

    return res.status(201).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const updateClientController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }

    const payload: Partial<Client> = req.body as Partial<Client>;
    const result = await updateClient(id, payload);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const deleteClientController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }

    const deleted: boolean = await deleteClient(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Client not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const getClientStatsController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }

    const result = await getClientStats(id);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};
