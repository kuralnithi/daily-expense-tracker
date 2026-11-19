import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Runs validation chains and returns 422 with errors if any fail.
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validation chains
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.type === 'field' ? e.path : e.type,
        message: e.msg,
      })),
    });
  };
}

/**
 * Middleware to extract userId from X-User-Id header.
 * Falls back to default user UUID if not provided.
 */
export function extractUserId(req: Request, _res: Response, next: NextFunction): void {
  const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
  req.userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  next();
}
