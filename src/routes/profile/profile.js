import express from 'express';
import {
    getProfile,
    updateProfile,
    uploadProfileImage
} from '../../controllers/profile/profileController.js';
import { authenticate } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../middleware/multer.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(authenticate);

// @desc    Get user profile
// @route   GET /api/profiles/:userId
router.get('/:userId', getProfile);

// @desc    Update profile
// @route   PUT /api/profiles/:userId
router.put('/:userId', updateProfile);

// @desc    Upload profile image
// @route   PATCH /api/profiles/:userId/image
router.patch(
    '/:userId/image',
    uploadMiddleware,
    uploadProfileImage,
);

export default router;