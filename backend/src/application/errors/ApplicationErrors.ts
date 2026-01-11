/**
 * Custom error classes for application-level errors
 * Provides better error handling and type safety
 */

export class ApplicationError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends ApplicationError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class ValidationError extends ApplicationError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class ConflictError extends ApplicationError {
    constructor(message: string) {
        super(message, 409);
    }
}
