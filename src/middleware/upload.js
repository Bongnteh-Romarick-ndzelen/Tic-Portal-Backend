import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

// Configuration constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const UPLOAD_DIRS = {
    thumbnails: 'uploads/course/thumbnails',
    videos: 'uploads/course/videos',
    documents: 'uploads/course/documents'
};

// Supported file types
const FILE_TYPES = {
    thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
    promoVideo: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
};

// Ensure upload directories exist
const initializeUploadDirs = () => {
    Object.values(UPLOAD_DIRS).forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Initialize directories on module load
initializeUploadDirs();

// Custom storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath;

        switch (file.fieldname) {
            case 'thumbnail':
                uploadPath = UPLOAD_DIRS.thumbnails;
                break;
            case 'promoVideo':
                uploadPath = UPLOAD_DIRS.videos;
                break;
            case 'document':
                uploadPath = UPLOAD_DIRS.documents;
                break;
            default:
                return cb(new Error('Invalid field name'), null);
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const sanitizedName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9-_]/g, '')
            .replace(/\s+/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
});

// Simplified file validation
const fileValidator = (req, file, cb) => {
    try {
        const allowedTypes = FILE_TYPES[file.fieldname];

        // Basic MIME type check
        if (!allowedTypes?.includes(file.mimetype)) {
            return cb(new Error(`Invalid file type for ${file.fieldname}`), false);
        }

        cb(null, true);
    } catch (err) {
        cb(err, false);
    }
};

// Configure upload handlers
const upload = multer({
    storage,
    fileFilter: fileValidator,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5
    }
});

// Pre-configured middleware exports
export const courseMediaUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'promoVideo', maxCount: 1 }
]);

export const documentUpload = upload.single('document');
export const noneUpload = upload.none();

// Safer cleanup middleware
export const cleanupUploads = (req, res, next) => {
    // Initialize req.files if not exists
    req.files = req.files || {};

    const cleanup = () => {
        try {
            if (req.files) {
                Object.values(req.files).forEach(files => {
                    if (Array.isArray(files)) {
                        files.forEach(file => {
                            if (file?.path && fs.existsSync(file.path)) {
                                fs.unlinkSync(file.path);
                            }
                        });
                    }
                });
            }
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    };

    // Ensure cleanup happens
    res.on('finish', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);

    next();
};

export default {
    courseMediaUpload,
    documentUpload,
    noneUpload,
    cleanupUploads
};