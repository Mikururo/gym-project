import { Request, Response } from 'express';

import {
  createSubscription,
  deleteSubscription,
  getSubscriptionById,
  listSubscriptions,
  updateSubscription,
} from '../services/subscriptions.service';
import { Subscription } from '../../../../shared/types';

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

export const getSubscriptions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const clientId: number | undefined = typeof req.query.clientId === 'string'
      ? Number(req.query.clientId)
      : undefined;

    let isActive: boolean | undefined;
    if (typeof req.query.isActive === 'string') {
      if (req.query.isActive === 'true') {
        isActive = true;
      } else if (req.query.isActive === 'false') {
        isActive = false;
      }
    }

    const result = await listSubscriptions(clientId, isActive);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const getSubscription = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid subscription id' });
    }

    const result = await getSubscriptionById(id);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const createSubscriptionController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const payload: Partial<Subscription> = req.body as Partial<Subscription>;
    const result = await createSubscription(payload);

    return res.status(201).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const updateSubscriptionController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid subscription id' });
    }

    const payload: Partial<Subscription> = req.body as Partial<Subscription>;
    const result = await updateSubscription(id, payload);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const deleteSubscriptionController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id: number = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid subscription id' });
    }

    const deleted: boolean = await deleteSubscription(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};
