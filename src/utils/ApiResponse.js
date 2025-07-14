class ApiResponse {
    /**
     * Creates a standardized API response
     * @param {number} statusCode - HTTP status code
     * @param {any} data - Response data
     * @param {string} message - Success message
     * @param {Object} metadata - Additional metadata
     */
    constructor(statusCode, data, message = "Success", metadata = {}) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
        this.metadata = metadata;
    }

    /**
     * Sends the response to the client
     * @param {Response} res - Express response object
     * @returns {Response}
     */
    send(res) {
        return res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            data: this.data,
            ...this.metadata
        });
    }

    /**
     * Creates a 200 OK response
     * @param {any} data - Response data
     * @param {string} message - Success message
     * @param {Object} metadata - Additional metadata
     * @returns {ApiResponse}
     */
    static success(data = null, message = "Success", metadata = {}) {
        return new ApiResponse(200, data, message, metadata);
    }

    /**
     * Creates a 201 Created response
     * @param {any} data - Response data
     * @param {string} message - Success message
     * @returns {ApiResponse}
     */
    static created(data = null, message = "Resource created successfully") {
        return new ApiResponse(201, data, message);
    }

    /**
     * Creates a 204 No Content response
     * @param {string} message - Success message
     * @returns {ApiResponse}
     */
    static noContent(message = "No content") {
        return new ApiResponse(204, null, message);
    }

    /**
     * Creates a paginated response
     * @param {any} data - Response data
     * @param {Object} pagination - Pagination details
     * @param {string} message - Success message
     * @returns {ApiResponse}
     */
    static paginated(data, pagination, message = "Success") {
        return new ApiResponse(200, data, message, { pagination });
    }
}

export default ApiResponse;