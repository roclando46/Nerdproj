import { auth } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Validates Auth0 JWT access tokens.
 * In development without Auth0 configured, falls through (API routes are unprotected).
 */
const auth0Configured =
  env.AUTH0_DOMAIN && env.AUTH0_DOMAIN !== 'your-tenant.uk.auth0.com' && env.AUTH0_AUDIENCE;

export const requireAuth: (req: Request, res: Response, next: NextFunction) => void =
  auth0Configured
    ? auth({
        issuerBaseURL: `https://${env.AUTH0_DOMAIN}/`,
        audience: env.AUTH0_AUDIENCE,
      })
    : (_req, _res, next) => {
        next();
      };

/**
 * Extracts clubId and role from Auth0 app_metadata claims and attaches
 * them to the request for use in service layer multi-tenancy filtering.
 *
 * Auth0 Action must inject:
 *   event.authorization.access_token.setCustomClaim('clubId', event.user.app_metadata.clubId)
 *   event.authorization.access_token.setCustomClaim('role', event.user.app_metadata.role)
 */
export function extractTenancy(req: Request, _res: Response, next: NextFunction): void {
  const payload = req.auth?.payload;
  const clubId = payload?.['clubId'] as string | undefined;
  const role = payload?.['role'] as string | undefined;

  // In development without Auth0, use the seeded demo club
  if (!clubId) {
    if (env.NODE_ENV === 'development' && !auth0Configured) {
      req.clubId = 'cldevclub0000000000001'; // matches seed.ts DEV_CLUB_ID
      req.userRole = 'CLUB_ADMIN';
      next();
      return;
    }
    _res.status(403).json({
      error: 'Forbidden',
      message: 'No club association found. Contact your club administrator.',
    });
    return;
  }

  req.clubId = clubId;
  req.userRole = role ?? 'CLUB_MEMBER';
  next();
}

// Express Request augmentation is in src/types/express.d.ts
