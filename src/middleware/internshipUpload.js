import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure directory exists (recursive creation)
const ensureDirectoryExists = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    } catch (err) {
        throw new Error(`Failed to create directory: ${err.message}`);
    }
};

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads/internships');
        try {
            ensureDirectoryExists(uploadDir);
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`); // Unique filenames
    }
});

// File validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    allowedTypes.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('Only PDF and Word files allowed (max 5MB)'), false);
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to attach file URLs
// Middleware to attach file URLs
const attachFileUrls = (req, res, next) => {
    if (!req.files) return next();

    // Process all uploaded files
    Object.entries(req.files).forEach(([fieldName, files]) => {
        files.forEach(file => {
            // Use absolute URL for production, relative for development
            const baseUrl = process.env.NODE_ENV === 'production'
                ? `${req.protocol}://${req.get('host')}`
                : '';

            file.url = `${baseUrl}/uploads/internships/${file.filename}`;
            file.location = file.url; // Ensure compatibility with your controller
        });
    });
    next();
};

// Initialize upload directory
const initUploadDirectory = () => {
    const baseDir = path.join(process.cwd(), 'uploads');
    ensureDirectoryExists(baseDir);
    ensureDirectoryExists(path.join(baseDir, 'internships'));
    return express.static(baseDir);
};

export {
    upload,
    attachFileUrls,
    initUploadDirectory
};