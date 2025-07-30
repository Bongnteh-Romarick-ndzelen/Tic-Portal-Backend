import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import { promisify } from 'util';

// Convert fs methods to promise-based
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

// Configuration - can be moved to environment variables
const config = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    UPLOAD_BASE_DIR: process.env.UPLOAD_BASE_DIR || path.join(process.cwd(), 'uploads'),
    FILE_TYPES: {
        thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
        promoVideo: ['video/mp4', 'video/webm', 'video/quicktime'],
        document: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    }
};

// Get full upload paths
const UPLOAD_PATHS = {
    thumbnails: path.join(config.UPLOAD_BASE_DIR, 'course', 'thumbnails'),
    videos: path.join(config.UPLOAD_BASE_DIR, 'course', 'videos'),
    documents: path.join(config.UPLOAD_BASE_DIR, 'course', 'documents')
};

// Enhanced directory initialization with error handling
const initializeUploadDirs = async () => {
    try {
        await Promise.all(
            Object.values(UPLOAD_PATHS).map(async (dir) => {
                if (!(await exists(dir))) {
                    await mkdir(dir, { recursive: true });
                    console.log(`Created upload directory: ${dir}`);
                }
            })
        );
    } catch (error) {
        console.error('Failed to initialize upload directories:', error);
        throw new Error('Could not initialize upload directories');
    }
};

// Initialize directories immediately (await this in your app startup)
initializeUploadDirs().catch(err => {
    console.error('Upload directory initialization failed:', err);
    process.exit(1); // Fail fast if upload directories can't be created
});

// Enhanced storage engine with better error handling
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            let uploadPath;

            switch (file.fieldname) {
                case 'thumbnail':
                    uploadPath = UPLOAD_PATHS.thumbnails;
                    break;
                case 'promoVideo':
                    uploadPath = UPLOAD_PATHS.videos;
                    break;
                case 'document':
                    uploadPath = UPLOAD_PATHS.documents;
                    break;
                default:
                    return cb(new Error(`Invalid field name: ${file.fieldname}`));
            }

            // Verify directory exists
            if (!(await exists(uploadPath))) {
                await mkdir(uploadPath, { recursive: true });
            }

            cb(null, uploadPath);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const sanitizedName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9-_]/g, '')
            .replace(/\s+/g, '_');
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
});

// Enhanced file validation with buffer checking
const fileValidator = async (req, file, cb) => {
    try {
        const allowedTypes = config.FILE_TYPES[file.fieldname];

        // 1. Basic MIME type check
        if (!allowedTypes?.includes(file.mimetype)) {
            return cb(new Error(`Invalid file type for ${file.fieldname}. Received: ${file.mimetype}`));
        }

        // 2. Optional: Verify file magic numbers
        if (process.env.NODE_ENV === 'production') {
            const buffer = await new Promise((resolve) => {
                const chunks = [];
                file.stream.on('data', (chunk) => chunks.push(chunk));
                file.stream.on('end', () => resolve(Buffer.concat(chunks)));
            });

            const fileType = await fileTypeFromBuffer(buffer);
            if (!fileType || !allowedTypes.includes(fileType.mime)) {
                return cb(new Error(`File content doesn't match extension for ${file.fieldname}`));
            }
        }

        cb(null, true);
    } catch (err) {
        cb(err);
    }
};

// Configure upload handlers with enhanced options
const createUploadMiddleware = () => {
    return multer({
        storage,
        fileFilter: fileValidator,
        limits: {
            fileSize: config.MAX_FILE_SIZE,
            files: 5
        },
        preservePath: true // Preserve full path information
    });
};

// Middleware factory for better flexibility
export const createMediaUpload = (fields) => {
    const upload = createUploadMiddleware();
    return [
        upload.fields(fields),
        async (req, res, next) => {
            try {
                // Attach cleanup to response
                res.on('finish', async () => {
                    if (req.files) {
                        await cleanupFiles(req.files);
                    }
                });
                next();
            } catch (err) {
                next(err);
            }
        }
    ];
};

// Enhanced cleanup function
export const cleanupFiles = async (files) => {
    try {
        const filePaths = [];

        // Collect all file paths
        Object.values(files).forEach((fileArray) => {
            if (Array.isArray(fileArray)) {
                fileArray.forEach((file) => {
                    if (file.path) filePaths.push(file.path);
                });
            }
        });

        // Delete files in parallel
        await Promise.all(
            filePaths.map(async (filePath) => {
                try {
                    if (await exists(filePath)) {
                        await unlink(filePath);
                    }
                } catch (err) {
                    console.error(`Failed to delete file ${filePath}:`, err);
                }
            })
        );
    } catch (err) {
        console.error('Error during file cleanup:', err);
    }
};

// Pre-configured middleware exports
export const courseMediaUpload = createMediaUpload([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'promoVideo', maxCount: 1 }
]);

export const documentUpload = createUploadMiddleware().single('document');
export const noneUpload = createUploadMiddleware().none();

// Enhanced upload middleware with error handling
export const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            error: 'Upload Error',
            message: err.message,
            code: err.code
        });
    } else if (err) {
        return res.status(500).json({
            error: 'File Processing Error',
            message: err.message
        });
    }
    next();
};

export default {
    courseMediaUpload,
    documentUpload,
    noneUpload,
    cleanupFiles,
    handleUploadErrors,
    UPLOAD_PATHS // Export for testing/debugging
};