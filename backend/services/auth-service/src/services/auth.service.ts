import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { QueryResultRow } from "pg";

import { query } from "../db/database";
import {
  AuthTokens,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
} from "../../../../shared/types";

interface DbUserRow extends QueryResultRow {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  name: string;
  created_at: Date | string;
  refresh_token: string | null;
}

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

const accessSecret: string = process.env.JWT_ACCESS_SECRET ?? "";
const refreshSecret: string = process.env.JWT_REFRESH_SECRET ?? "";

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not set");
}

const throwHttpError = (message: string, statusCode: number): never => {
  const error: ErrorWithStatus = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isValidRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

const toIsoString = (value: Date | string): string => {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
};

const mapUser = (row: DbUserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  created_at: toIsoString(row.created_at),
});

const generateTokens = (payload: JwtPayload): AuthTokens => {
  const accessToken: string = jwt.sign(payload, accessSecret, {
    expiresIn: "15m",
  });

  const refreshToken: string = jwt.sign(payload, refreshSecret, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
};

const saveRefreshToken = async (
  userId: number,
  refreshToken: string,
): Promise<void> => {
  await query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
    refreshToken,
    userId,
  ]);
};

export const registerUser = async (
  payload: RegisterRequest,
): Promise<AuthTokens & { user: User }> => {
  const email: string = normalizeEmail(payload.email);
  const password: string = payload.password.trim();
  const name: string = payload.name.trim();
  const role: string = payload.role;

  if (!email || !password || !name || !role) {
    throwHttpError("Email, password, name and role are required", 400);
  }

  if (!isValidRole(role)) {
    throwHttpError("Role must be admin or trainer", 400);
  }

  const existingUser = await query<DbUserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email],
  );

  if (existingUser.rowCount && existingUser.rowCount > 0) {
    throwHttpError("User with this email already exists", 400);
  }

  const passwordHash: string = await bcrypt.hash(password, 10);

  const insertedUser = await query<DbUserRow>(
    `
      INSERT INTO users (email, password_hash, role, name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password_hash, role, name, created_at, refresh_token
    `,
    [email, passwordHash, role, name],
  );

  const userRow: DbUserRow | undefined = insertedUser.rows[0];

  if (!userRow) {
    throwHttpError("Could not create user", 500);
  }

  const tokenPayload: JwtPayload = {
    userId: userRow.id,
    email: userRow.email,
    role: userRow.role,
  };

  const tokens: AuthTokens = generateTokens(tokenPayload);
  await saveRefreshToken(userRow.id, tokens.refreshToken);

  return {
    ...tokens,
    user: mapUser(userRow),
  };
};

export const loginUser = async (
  payload: LoginRequest,
): Promise<AuthTokens & { user: User }> => {
  const email: string = normalizeEmail(payload.email);
  const password: string = payload.password.trim();

  if (!email || !password) {
    throwHttpError("Email and password are required", 400);
  }

  const result = await query<DbUserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email],
  );
  const userRow: DbUserRow | undefined = result.rows[0];

  if (!userRow) {
    throwHttpError("Invalid email or password", 401);
  }

  const passwordMatches: boolean = await bcrypt.compare(
    password,
    userRow.password_hash,
  );

  if (!passwordMatches) {
    throwHttpError("Invalid email or password", 401);
  }

  const tokenPayload: JwtPayload = {
    userId: userRow.id,
    email: userRow.email,
    role: userRow.role,
  };

  const tokens: AuthTokens = generateTokens(tokenPayload);
  await saveRefreshToken(userRow.id, tokens.refreshToken);

  return {
    ...tokens,
    user: mapUser(userRow),
  };
};

export const refreshUserTokens = async (
  refreshToken: string,
): Promise<AuthTokens> => {
  if (!refreshToken || !refreshToken.trim()) {
    throwHttpError("Refresh token is required", 400);
  }

  const trimmedToken = refreshToken.trim();
  const refreshSecretEnv = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecretEnv) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  const refreshSecret: string = refreshSecretEnv;

  const verifiedPayload: JwtPayload = (() => {
    try {
      const verifiedToken: string | jwt.JwtPayload = jwt.verify(
        trimmedToken,
        refreshSecret,
      );

      if (typeof verifiedToken === "string") {
        throw new Error("Invalid refresh token");
      }

      return verifiedToken as JwtPayload;
    } catch (error: unknown) {
      throwHttpError("Invalid refresh token", 401);
      throw new Error("Unreachable");
    }
  })();

  const result = await query<DbUserRow>(
    "SELECT * FROM users WHERE id = $1 AND refresh_token = $2",
    [verifiedPayload.userId, trimmedToken],
  );

  const user = result.rows[0];

  if (!user) {
    throwHttpError("Refresh token not found", 401);
  }

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
    tokens.refreshToken,
    user.id,
  ]);

  return tokens;
};

export const logoutUser = async (userId: number): Promise<void> => {
  const result = await query<DbUserRow>(
    "UPDATE users SET refresh_token = NULL WHERE id = $1 RETURNING id",
    [userId],
  );

  if (!result.rowCount) {
    throwHttpError("User not found", 404);
  }
};

export const getCurrentUser = async (userId: number): Promise<User> => {
  const result = await query<DbUserRow>(
    "SELECT id, email, password_hash, role, name, created_at, refresh_token FROM users WHERE id = $1",
    [userId],
  );

  const userRow: DbUserRow | undefined = result.rows[0];

  if (!userRow) {
    throwHttpError("User not found", 404);
  }

  return mapUser(userRow);
};
