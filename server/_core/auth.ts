import * as db from "../db";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a session for a user
 */
export async function createUserSession(
  user: User,
  req: Request,
  res: Response
): Promise<void> {
  // Use email as openId if openId is not set (for email/password auth)
  // Format: email_<email> for consistency
  const openId = user.openId || (user.email ? `email_${user.email}` : `user_${user.id}`);
  const name = user.name || user.email || "User";

  // Ensure user has openId in database
  if (!user.openId && user.email) {
    await db.upsertUser({
      openId: `email_${user.email}`,
      email: user.email,
      name: user.name || null,
    });
  }

  // Create session token
  // Use a default appId if ENV.appId is not set (for email/password auth)
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
    appId: undefined, // Will use default from sdk
  });

  // Set cookie
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });
}

/**
 * Register a new user with email and password
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Usuário já existe com este email");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const openId = `email_${email}`; // Generate openId from email
  await db.createUserWithPassword({
    openId,
    email,
    passwordHash,
    name: name || null,
    loginMethod: "email",
  });

  // Get created user
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new Error("Erro ao criar usuário");
  }

  return user;
}

/**
 * Login user with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  // Get user by email
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new Error("Email ou senha incorretos");
  }

  // Check if user has password (email/password auth)
  if (!user.passwordHash) {
    throw new Error("Este usuário não possui senha. Use OAuth para fazer login.");
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Email ou senha incorretos");
  }

  // Update last signed in
  await db.upsertUser({
    openId: user.openId || `email_${email}`,
    lastSignedIn: new Date(),
  });

  return user;
}

