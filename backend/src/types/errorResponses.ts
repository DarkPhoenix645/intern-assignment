class NotFoundError extends Error {
  statusCode: string;
  errorDetails: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ResourceNotFoundError';
    this.statusCode = '404';
    this.errorDetails = details;

    Error.captureStackTrace(this, NotFoundError);
  }
}

class UserError extends Error {
  statusCode: string;
  errorDetails: Record<string, any>;

  constructor(message: string, code: string = '400', details: Record<string, any> = {}) {
    super(message);
    this.name = 'UserError';
    this.statusCode = code;
    this.errorDetails = details;

    Error.captureStackTrace(this, UserError);
  }
}

class ServerError extends Error {
  statusCode: string;
  errorDetails: Record<string, any> = {};

  constructor(message: string, code: string = '500', details: Record<string, any> = {}) {
    super(message);
    this.name = 'InternalServerError';
    this.statusCode = code;
    this.errorDetails = details;

    Error.captureStackTrace(this, ServerError);
  }
}

export { NotFoundError, UserError, ServerError };
