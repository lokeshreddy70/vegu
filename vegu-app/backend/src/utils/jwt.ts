import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthPayload } from '../types';

export const generateAccessToken = (payload: AuthPayload): string =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpires } as jwt.SignOptions);

export const generateRefreshToken = (payload: AuthPayload): string =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpires } as jwt.SignOptions);

export const verifyAccessToken = (token: string): AuthPayload =>
  jwt.verify(token, config.jwt.accessSecret) as AuthPayload;

export const verifyRefreshToken = (token: string): AuthPayload =>
  jwt.verify(token, config.jwt.refreshSecret) as AuthPayload;
