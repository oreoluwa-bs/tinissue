export class APIError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message ?? "Something Unexpected Occured");

    this.statusCode = statusCode;
    this.status = "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequest extends APIError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}

export class Unauthorised extends APIError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends APIError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFound extends APIError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

export class MethodNotSupported extends APIError {
  constructor(message = "This Method is not supported") {
    super(405, message);
  }
}

export class TooManyRequests extends APIError {
  constructor(message = "Too many requests") {
    super(429, message);
  }
}

export class InternalServerError extends APIError {
  constructor(message = "Uh oh! Something unexpected occured.") {
    super(500, message);
  }
}
