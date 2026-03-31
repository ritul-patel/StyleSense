import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const guestIdCheck = (req: Request, res: Response, next: NextFunction) => {
  const guestId = req.headers['x-guest-id'];

  if (!guestId) {
    return next(new AppError('Missing x-guest-id header', 400));
  }

  // Reject array of headers if the client incorrectly sends multiple
  if (Array.isArray(guestId) || typeof guestId !== 'string') {
    return next(new AppError('Multiple x-guest-id headers provided or format invalid', 400));
  }

  // Force strict v4 UUID format for generated guest sessions (security/reliability)
  if (!UUID_V4_REGEX.test(guestId)) {
    return next(new AppError('Invalid x-guest-id format, must be a UUID v4', 400));
  }

  next();
};
