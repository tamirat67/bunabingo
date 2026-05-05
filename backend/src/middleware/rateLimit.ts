import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

export const depositLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many deposit requests. Try again in an hour.' },
});

export const withdrawLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many withdrawal requests. Try again in an hour.' },
});

export const joinGameLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 3,
  message: { error: 'You are joining too fast. Please wait.' },
});
