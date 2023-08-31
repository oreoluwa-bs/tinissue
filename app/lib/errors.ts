type ErrorMeta = { [key: string]: any };
export class APIError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public meta: ErrorMeta = {};

  constructor(statusCode: number, message: string, meta = {}) {
    super(message ?? "Something Unexpected Occured");

    this.statusCode = statusCode;
    this.status = "error";
    this.isOperational = true;
    this.meta = meta;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequest extends APIError {
  constructor(message = "Bad request", meta?: ErrorMeta) {
    super(400, message, meta);
  }
}

export class Unauthorised extends APIError {
  constructor(
    message = "You don't have permission to access this.",
    meta?: ErrorMeta,
  ) {
    super(401, message, meta);
  }
}

export class ForbiddenError extends APIError {
  constructor(message = "Forbidden", meta?: ErrorMeta) {
    super(403, message, meta);
  }
}

export class NotFound extends APIError {
  constructor(message = "Not Found", meta?: ErrorMeta) {
    super(404, message, meta);
  }
}

export class MethodNotSupported extends APIError {
  constructor(message = "This Method is not supported", meta?: ErrorMeta) {
    super(405, message, meta);
  }
}

export class TooManyRequests extends APIError {
  constructor(message = "Too many requests", meta?: ErrorMeta) {
    super(429, message, meta);
  }
}

export class InternalServerError extends APIError {
  constructor(
    message = "Uh oh! Something unexpected occured.",
    meta?: ErrorMeta,
  ) {
    super(500, message, meta);
  }
}
