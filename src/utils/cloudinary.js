import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// Enhanced Config Validation
const validateConfig = () => {
    const requiredVars = [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(
            `Missing Cloudinary configuration: ${missingVars.join(', ')}`
        );
    }

    if (process.env.NODE_ENV === 'production' && !process.env.CLOUDINARY_UPLOAD_PRESET) {
        console.warn('Warning: No upload preset specified for production');
    }
};

// Initialize with enhanced configuration
const initCloudinary = () => {
    validateConfig();

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
        api_proxy: process.env.CLOUDINARY_PROXY // Optional proxy support
    });

    // Configure default global upload parameters
    cloudinary.config({
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
        quality: 'auto:good',
        fetch_format: 'auto'
    });
};

initCloudinary();

/**
 * Enhanced file upload with retry logic
 * @param {string|Buffer} file - File path or buffer
 * @param {string} folder - Target folder
 * @param {object} options - Additional options
 * @returns {Promise<object>} Upload result
 */
export const uploadToCloudinary = async (file, folder, options = {}) => {
    const MAX_RETRIES = 2;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Handle Buffer input
            const uploadOptions = {
                folder,
                resource_type: 'auto',
                ...options
            };

            let result;
            if (Buffer.isBuffer(file)) {
                result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => error ? reject(error) : resolve(result)
                    ).end(file);
                });
            } else {
                // Verify file exists for path input
                await fs.access(file);
                result = await cloudinary.uploader.upload(file, uploadOptions);
            }

            if (!result?.secure_url) {
                throw new Error('Upload succeeded but no URL returned');
            }

            return result;
        } catch (error) {
            lastError = error;
            console.warn(`Upload attempt ${attempt} failed:`, error.message);
            if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }

    console.error('Cloudinary Upload Failed:', {
        error: lastError.message,
        folder,
        options
    });
    throw new Error(`Upload failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

/**
 * Enhanced deletion with verification
 * @param {string} publicId - Resource to delete
 * @param {object} options - Additional options
 * @returns {Promise<object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, options = {}) => {
    if (!publicId) throw new Error('No publicId provided');

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            ...options
        });

        if (result.result !== 'ok') {
            throw new Error(`Deletion failed: ${result.result}`);
        }

        return result;
    } catch (error) {
        console.error('Cloudinary Deletion Error:', {
            publicId,
            error: error.message
        });
        throw new Error(`Deletion failed: ${error.message}`);
    }
};

/**
 * Utility to extract public ID from URL
 */
export const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const matches = url.match(/\/([^/]+?)(?:\.[^./]+)?$/);
    return matches ? matches[1] : null;
};

// Connection test with exponential backoff
const testConnection = async (attempt = 1) => {
    const MAX_ATTEMPTS = 3;
    const BASE_DELAY = 1000;

    try {
        await cloudinary.api.ping();
        console.log('✅ Cloudinary connection successful');
        return true;
    } catch (err) {
        console.warn(`⚠️ Connection attempt ${attempt} failed: ${err.message}`);

        if (attempt >= MAX_ATTEMPTS) {
            console.error('❌ Cloudinary connection failed after retries');
            return false;
        }

        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        return testConnection(attempt + 1);
    }
};

// Initialize connection
testConnection().then(success => {
    if (!success) process.exitCode = 1;
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
    console.log('Closing Cloudinary connection...');
    // Add any cleanup logic here
    process.exit(0);
});