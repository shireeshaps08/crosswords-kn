import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const secret = process.env.JWT_SECRET!;
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
