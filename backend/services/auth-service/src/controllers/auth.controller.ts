import { Request, Response } from 'express';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserTokens,
  registerUser,
} from '../services/auth.service';
import { LoginRequest, RegisterRequest } from '../../../../shared/types';

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

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload: RegisterRequest = req.body as RegisterRequest;
    const result = await registerUser(payload);

    return res.status(201).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload: LoginRequest = req.body as LoginRequest;
    const result = await loginUser(payload);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const refresh = async (req: Request, res: Response): Promise<Response> => {
  try {
    const refreshToken: string = String(req.body?.refreshToken ?? '');
    const result = await refreshUserTokens(refreshToken);

    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId: number | undefined = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await logoutUser(userId);

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId: number | undefined = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getCurrentUser(userId);

    return res.status(200).json(user);
  } catch (error: unknown) {
    return res.status(getStatusCode(error)).json({ error: getMessage(error) });
  }
};
