import type { Request, Response, NextFunction } from 'express';
import { z, ZodError, type ZodSchema } from 'zod';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware factory for validating request body, query, and params with Zod.
 * Returns 422 with field-level error details on validation failure.
 */
export function validate(schemas: ValidateOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as unknown;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          error: 'Validation Error',
          message: 'Request data failed validation',
          details: err.flatten().fieldErrors,
        });
        return;
      }
      next(err);
    }
  };
}

export const IdParamSchema = z.object({ id: z.string().min(1) });
