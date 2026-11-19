import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/AppError.ts';

function parse(schema: ZodType, input: unknown): unknown {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
      .join('; ');
    throw new AppError(400, 'VALIDATION_ERROR', message);
  }
  return result.data;
}

// Replaces req.body with the parsed result, or rejects with 400 VALIDATION_ERROR.
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = parse(schema, req.body);
    next();
  };
}

// Express 5's req.query is read-only, so the parsed result goes on res.locals.query.
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals.query = parse(schema, req.query);
    next();
  };
}
