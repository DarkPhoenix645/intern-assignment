import { Request, Response, NextFunction } from 'express';
import { NotFoundError, UserError, ServerError } from '@custom-types/errorResponses';
import titles from '@constants/CONSTANTS';

const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Extract status code (default to 500 if not provided)
  const statusCode: number =
    error instanceof NotFoundError || error instanceof UserError || error instanceof ServerError
      ? parseInt(error.statusCode, 10)
      : 500;

  const errorDetails: any =
    error instanceof NotFoundError || error instanceof UserError || error instanceof ServerError
      ? error.errorDetails
      : {};

  // Log server errors (500+)
  if (statusCode >= 500) {
    console.error(
      `Error occurred while processing the request: ${req.method}: ${req.url} with body ${JSON.stringify(req.body)}`,
    );
    console.error(error.message);
    console.error(error.stack);
  }

  // Format response with meaningful error messages
  const responsePayload = {
    title: titles[statusCode] || 'Unknown error',
    name: error.name,
    error: statusCode in titles ? error.message : 'Unknown error occurred',
    ...errorDetails,
    ...(process.env.NODE_ENV === 'development' ? { stackTrace: error.stack } : {}),
  };

  // Send JSON response
  res.status(statusCode).json(responsePayload);
};

export default errorHandler;
