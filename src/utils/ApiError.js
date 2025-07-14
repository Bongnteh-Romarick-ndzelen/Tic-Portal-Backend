/**
 * Custom API Error class that extends JavaScript's native Error class
 * Includes status codes and operational flags
 */
class ApiError extends Error {
    /**
     * Create a new ApiError instance
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {boolean} isOperational - Is this a known operational error?
     * @param {string} stack - Error stack trace (optional)
     */
    constructor(
        statusCode,
        message,
        isOperational = true,
        stack = ''
    ) {
        super(message);

        // Set the prototype explicitly (needed for instanceof checks)
        Object.setPrototypeOf(this, new.target.prototype);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        // Capture stack trace if not provided
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

        // Prevent constructor from appearing in stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Create a 400 Bad Request error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static badRequest(message) {
        return new ApiError(400, message);
    }

    /**
     * Create a 401 Unauthorized error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }

    /**
     * Create a 403 Forbidden error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }

    /**
     * Create a 404 Not Found error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static notFound(message = 'Not found') {
        return new ApiError(404, message);
    }

    /**
     * Create a 409 Conflict error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static conflict(message) {
        return new ApiError(409, message);
    }

    /**
     * Create a 422 Unprocessable Entity error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static unprocessableEntity(message) {
        return new ApiError(422, message);
    }

    /**
     * Create a 500 Internal Server error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static internal(message = 'Internal Server Error') {
        return new ApiError(500, message);
    }

    /**
     * Convert error to JSON for API responses
     * @returns {Object} - Error response object
     */
    toJSON() {
        return {
            status: this.status,
            statusCode: this.statusCode,
            message: this.message,
            timestamp: this.timestamp,
            ...(process.env.NODE_ENV === 'development' && {
                stack: this.stack,
                isOperational: this.isOperational
            })
        };
    }
    /**
     * Creates a new API error
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {Array} errors - Array of validation errors
     * @param {string} stack - Error stack trace
     */
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Creates a 400 Bad Request error
     * @param {string} message - Error message
     * @param {Array} errors - Validation errors
     * @returns {ApiError}
     */
    static badRequest(message, errors = []) {
        return new ApiError(400, message, errors);
    }

    /**
     * Creates a 401 Unauthorized error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }

    /**
     * Creates a 403 Forbidden error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }

    /**
     * Creates a 404 Not Found error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static notFound(message = "Not Found") {
        return new ApiError(404, message);
    }

    /**
     * Creates a 500 Internal Server Error
     * @param {string} message - Error message
     * @param {string} stack - Stack trace
     * @returns {ApiError}
     */
    static internal(message = "Internal Server Error", stack = "") {
        return new ApiError(500, message, [], stack);
    }

    /**
     * Creates an error from a Mongoose validation error
     * @param {Error} error - Mongoose validation error
     * @returns {ApiError}
     */
    static fromMongooseValidation(error) {
        const errors = [];
        if (error.errors) {
            for (const field in error.errors) {
                errors.push({
                    field,
                    message: error.errors[field].message
                });
            }
        }
        return new ApiError(400, "Validation Error", errors);
    }
}

export default ApiError;