import { Request, Response } from 'express';

import {
  createVisit,
  deleteVisit,
  getDailyVisitStats,
  listVisits,
} from '../services/visits.service';
import { Visit } from '../../../../shared/types';

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

const getStatusCode = (error: unknown): number => {
  if (error instanceof Error && 'statusCode' in error) {
    const statusCode: unknown = (error as ErrorWithStatus).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }
  }

  return 500;
};

const getMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Internal server error';
};

export const getVisits = async (req: Request, res: Response): Promise<Response> => {
  try {
    const clientId: number | undefined = typeof req.query.clientId === 'string'
      ? Number(req.query.clientId)
      : undefined;
    const from: string | undefined = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to: string | undefined = typeof req.query.to === 'string' ? req.query.to : undefined;
    const page: number = Number(req.query.page ?? 1);
    const limit: number = Number(req.query.limit ?? 10);

    const result = await listVisits(clientId, from, to, page, limit);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const createVisitController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload: Partial<Visit> = req.body as Partial<Visit>;
    const result = await createVisit(payload);

    return res.status(201).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const deleteVisitController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid visit id' });
    }

    const deleted: boolean = await deleteVisit(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const getDailyStatsController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const from: string | undefined = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to: string | undefined = typeof req.query.to === 'string' ? req.query.to : undefined;

    const result = await getDailyVisitStats(from, to);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};
