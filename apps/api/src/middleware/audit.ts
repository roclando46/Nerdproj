import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@dcs/database';
import type { AuditAction } from '@dcs/database';

interface AuditOptions {
  action: AuditAction;
  entityType: string;
  /** Function to derive the entityId from the request (e.g. from params or body) */
  getEntityId: (req: Request) => string | undefined;
}

/**
 * Middleware factory that writes an immutable audit log entry after a successful response.
 * Apply to sensitive routes: DBS record writes, compliance exports, etc.
 *
 * Usage:
 *   router.post('/dbs', requireAuth, extractTenancy, auditLog({ action: 'CREATE', entityType: 'DBSRecord', getEntityId: ... }), controller)
 */
export function auditLog(options: AuditOptions) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      // Only audit successful mutations (2xx responses)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = options.getEntityId(_req) ?? 'unknown';
        const userId = _req.auth?.payload?.sub as string | undefined;

        // Fire-and-forget — don't block the response
        prisma.auditLog
          .create({
            data: {
              clubId: _req.clubId,
              userId: userId ?? null,
              action: options.action,
              entityType: options.entityType,
              entityId,
              ipAddress: _req.ip,
              userAgent: _req.get('user-agent'),
            },
          })
          .catch((err: unknown) => {
            console.error('Failed to write audit log:', err);
          });
      }

      return originalJson(body);
    };

    next();
  };
}
