// src/services/courseService.js
import Course from '../models/Course.js';

/**
 * Parses array fields from different formats
 * @param {string|array} field - The field value to parse
 * @param {string} fieldName - The name of the field (for error messages)
 * @returns {array} - The parsed array
 * @throws {Error} - If the field is invalid
 */
export const parseArrayField = (value, fieldName, options = {}) => {
    const { required = false, minLength = 0, maxLength = 100 } = options;

    // Handle empty values
    if (!value) {
        if (required) throw new Error(`${fieldName} is required`);
        return [];
    }

    // Parse the value
    let parsed;
    try {
        if (typeof value === 'string') {
            parsed = value.trim().startsWith('[')
                ? JSON.parse(value)
                : value.split(',').map(i => i.trim());
        } else if (Array.isArray(value)) {
            parsed = value;
        } else {
            throw new Error(`must be an array or comma-separated string`);
        }
    } catch (error) {
        throw new Error(`Invalid ${fieldName}: ${error.message}`);
    }

    // Validate array
    if (!Array.isArray(parsed)) {
        throw new Error(`${fieldName} must be an array`);
    }

    // Clean and validate items
    const cleaned = parsed
        .map(item => String(item).trim())  // Convert to string and trim
        .filter(item => item.length > 0); // Remove empty strings

    if (required && cleaned.length === 0) {
        throw new Error(`${fieldName} cannot be empty`);
    }
    if (cleaned.length < minLength) {
        throw new Error(`${fieldName} requires at least ${minLength} items`);
    }
    if (cleaned.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum of ${maxLength} items`);
    }

    return cleaned;
};

/**
 * Validates if a user owns a course
 * @param {string} courseId - The course ID
 * @param {string} userId - The user ID
 * @returns {Promise<Course>} - The course if found and owned
 * @throws {Error} - If course not found or unauthorized
 */
export const validateCourseOwnership = async (courseId, userId) => {
    if (!courseId || !userId) {
        throw new Error('Missing course ID or user ID');
    }

    const course = await Course.findOne({
        _id: courseId,
        instructor: userId
    }).select('+instructor'); // Ensure instructor field is returned

    if (!course) {
        throw new Error('Course not found or unauthorized access');
    }
    return course;
};

/**
 * Additional useful course service functions
 */
export const courseService = {
    /**
     * Creates a new course draft
     */
    async createDraft(courseData, instructorId) {
        const course = new Course({
            ...courseData,
            instructor: instructorId,
            status: 'draft'
        });
        return await course.save();
    },

    /**
     * Validates required course fields
     */
    validateRequiredFields(data, requiredFields) {
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }
};