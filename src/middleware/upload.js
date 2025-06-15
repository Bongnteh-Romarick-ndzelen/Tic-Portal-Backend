import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create folders if they don't exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Set up storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video/');
        const uploadPath = isVideo ? 'uploads/videos' : 'uploads/docs';
        ensureDir(uploadPath); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_');
        cb(null, `${ Date.now() }_${ baseName }${ ext }`);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedDocs = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const isVideo = file.mimetype.startsWith('video/');
    const isDocument = allowedDocs.includes(file.mimetype);

    if (isVideo || isDocument) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Only videos and documents are allowed.'), false);
    }
};

// Multer instance
const upload = multer({ storage, fileFilter });

export default upload;
