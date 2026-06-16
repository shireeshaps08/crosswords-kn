import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { signToken } from '../utils/jwt';

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, created_at`,
      [username.trim(), email.toLowerCase().trim(), hash]
    );
    const user = rows[0];
    const token = signToken({ sub: user.id, username: user.username, role: user.role });
    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    throw err;
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    `SELECT id, username, email, password_hash, role FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = signToken({ sub: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
}

export function guestToken(_req: Request, res: Response) {
  // Issues a short-lived opaque guest token stored client-side
  const token = uuidv4().replace(/-/g, '');
  res.json({ guest_token: token });
}

export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
