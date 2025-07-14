import Profile from '../../models/Profile.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.js';
import { processImage } from '../../middleware/multer';
import fs from 'fs';
import path from 'path';
import asyncHandler from 'express-async-handler';

// @desc    Get user profile
// @route   GET /api/profiles/:userId
// @access  Private
export const getProfile = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    // Verify ownership or admin access
    if (req.user.id !== userId && req.user.userType !== 'admin') {
        throw new ApiError(403, 'Not authorized to access this profile');
    }

    const profile = await Profile.findOne({ user: userId })
        .populate({
            path: 'user',
            select: 'fullName email profilePicture userType'
        })
        .populate({
            path: 'coursesEnrolled.course',
            select: 'title thumbnail shortDescription instructor',
            populate: {
                path: 'instructor',
                select: 'fullName profilePicture'
            }
        })
        .populate({
            path: 'coursesCompleted.course',
            select: 'title thumbnail instructor',
            populate: {
                path: 'instructor',
                select: 'fullName'
            }
        })
        .populate({
            path: 'internshipsApplied.internship',
            select: 'title company applicationDeadline'
        });

    if (!profile) {
        throw new ApiError(404, 'Profile not found');
    }

    res.status(200).json(
        new ApiResponse(200, profile, 'Profile retrieved successfully')
    );
});


// @desc    Update profile
// @route   PUT /api/profiles/:userId
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    if (req.user.id !== userId) {
        throw new ApiError(403, 'Not authorized to update this profile');
    }

    // Filter allowed fields
    const allowedUpdates = {
        headline: req.body.headline,
        bio: req.body.bio,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        website: req.body.website,
        socialLinks: req.body.socialLinks,
        notificationPreferences: req.body.notificationPreferences
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
        if (allowedUpdates[key] === undefined) {
            delete allowedUpdates[key];
        }
    });

    const profile = await Profile.findOneAndUpdate(
        { user: userId },
        { $set: allowedUpdates },
        { new: true, runValidators: true }
    );

    if (!profile) {
        throw new ApiError(404, 'Profile not found');
    }

    res.status(200).json(
        new ApiResponse(200, profile, 'Profile updated successfully')
    );
});

// @desc    Upload profile image
// @route   PATCH /api/profiles/:userId/image
// @access  Private
export const uploadProfileImage = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Verify ownership
    if (req.user.id !== userId) {
        throw new ApiError(403, 'Not authorized to update this profile');
    }

    if (!req.file) {
        throw new ApiError(400, 'No image file provided');
    }

    let tempFilePath;
    try {
        // Process image
        const processedImage = await processImage(req.file.buffer);

        // Create temp file path
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        tempFilePath = path.join(tempDir, `profile-${Date.now()}.jpg`);

        // Save processed image to temp file
        fs.writeFileSync(tempFilePath, processedImage);

        // Upload to Cloudinary
        const result = await uploadToCloudinary(tempFilePath, 'profile_images');

        // Delete old image if exists
        const existingProfile = await Profile.findOne({ user: userId });
        if (existingProfile?.profileImage?.publicId) {
            await deleteFromCloudinary(existingProfile.profileImage.publicId)
                .catch(err => console.error('Failed to delete old image:', err));
        }

        // Update profile
        const updatedProfile = await Profile.findOneAndUpdate(
            { user: userId },
            {
                profileImage: {
                    url: result.secure_url,
                    publicId: result.public_id,
                    uploadedAt: new Date()
                }
            },
            { new: true }
        ).populate('user', 'fullName email profilePicture userType');

        res.status(200).json(
            new ApiResponse(200, updatedProfile, 'Profile image updated successfully')
        );

    } catch (error) {
        throw new ApiError(500, 'Image upload failed', error.message);
    } finally {
        // Clean up temp file if it exists
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }
        }
    }
});