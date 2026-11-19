import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.ts';

const MONGO_DUPLICATE_KEY = 11000;

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === MONGO_DUPLICATE_KEY;
}

// express.json() tags malformed request bodies with this type.
function isJsonParseError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed';
}

export function notFound(req: Request) {
  throw new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`);
}

// Express 5 forwards rejected promises from async handlers here automatically.
// The 4-argument signature is what marks this as an error handler.
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  // Response already streaming: let Express close the connection.
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }

  if (isDuplicateKeyError(err)) {
    return res
      .status(409)
      .json({ error: 'DUPLICATE_TITLE', message: 'A movie with this title already exists' });
  }

  // Client mistakes that would otherwise fall through to a 500
  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors).map((e) => e.message).join('; ');
    return res.status(400).json({ error: 'VALIDATION_ERROR', message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: `Invalid value for ${err.path}` });
  }
  if (isJsonParseError(err)) {
    return res.status(400).json({ error: 'INVALID_JSON', message: 'Request body is not valid JSON' });
  }

  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
