import rateLimit from 'express-rate-limit';

/** Default limiter: 100 requests per 15 minutes per IP */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests, please try again later.',
    statusCode: 429,
  },
});

/** Stricter limiter for auth endpoints */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts, please try again later.',
    statusCode: 429,
  },
});

/** Limiter for AI generation endpoints (token-cost protection) */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.clubId ?? req.ip ?? 'unknown',
  message: {
    error: 'TooManyRequests',
    message: 'AI generation limit reached. Please try again in an hour.',
    statusCode: 429,
  },
});
