import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', err);

  const statusCode = err.statusCode || 500;
  const userMessage = err.isCustom
    ? err.message
    : 'Unable to process your request at this time. Please try again later or contact SecureBank Customer Care.';

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
