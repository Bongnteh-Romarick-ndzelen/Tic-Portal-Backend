import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to ensure directory exists
const ensureDirectoryExists = (folder) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
};

// Define allowed document types
const allowedDocs = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = '';

        if (file.mimetype.startsWith('video')) {
            folder = path.join(__dirname, '../../uploads/modules/videos/');
        } else if (allowedDocs.includes(file.mimetype)) {
            folder = path.join(__dirname, '../../uploads/modules/docs/');
        } else {
            return cb(new Error('Unsupported file type'), false);
        }

        ensureDirectoryExists(folder);
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${file.fieldname}-${Date.now()}${ext}`;
        cb(null, name);
    }
});

export default multer({ storage });