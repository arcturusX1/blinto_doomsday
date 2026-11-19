import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/AppError.ts';

// Replaces req.body with the parsed result, or rejects with 400 VALIDATION_ERROR.
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
        .join('; ');
      throw new AppError(400, 'VALIDATION_ERROR', message);
    }
    req.body = result.data;
    next();
  };
}
