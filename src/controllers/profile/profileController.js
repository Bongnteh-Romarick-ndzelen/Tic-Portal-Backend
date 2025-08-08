import Profile from '../../models/Profile.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.js';
import { processImage } from '../../middleware/multer.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import asyncHandler from 'express-async-handler';

/**
 * @desc    Create new user profile
 * @route   POST /api/profiles
 * @access  Private
 */
export const createProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id; // From auth middleware

    // Check for existing profile
    const existingProfile = await Profile.findOne({ user: userId });
    if (existingProfile) {
        throw new ApiError(400, 'Profile already exists');
    }

    // Destructure all possible fields from request body
    const {
        // Personal Information
        profileImage,
        headline,
        bio,
        dateOfBirth,
        gender,

        // Contact Information
        website,
        socialLinks,

        // Education
        education,

        // Work Experience
        experience,

        // Skills & Certifications
        skills,
        certifications,

        // Preferences
        notificationPreferences
    } = req.body;

    // Create new profile with all fields
    const profile = await Profile.create({
        user: userId,

        // Personal Information
        profileImage,
        headline,
        bio,
        dateOfBirth,
        gender,

        // Contact Information
        website,
        socialLinks,

        // Education
        education,

        // Work Experience
        experience,

        // Skills & Certifications
        skills,
        certifications,

        // Initialize empty arrays for course tracking
        coursesEnrolled: [],
        coursesCompleted: [],
        internshipsApplied: [],

        // Preferences
        notificationPreferences: notificationPreferences || {
            emailNotifications: true,
            pushNotifications: true,
            courseUpdates: true,
            promotionalOffers: false
        },

        // Initialize stats
        profileViews: 0,
        profileCompletion: 0
    });

    res.status(201).json(
        new ApiResponse(201, { profile }, 'Profile created successfully')
    );
});

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
// @desc    Upload profile image
// @route   PATCH /api/profiles/:userId/image
// @access  Private
export const uploadProfileImage = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // 1. Authorization Check
    if (req.user.id !== userId) {
        throw new ApiError(403, 'Not authorized to update this profile');
    }

    // 2. File Validation
    if (!req.file) {
        throw new ApiError(400, 'No image file provided');
    }

    try {
        // 3. Process Image with Sharp
        const processedImage = await sharp(req.file.buffer)
            .rotate() // Auto-orient based on EXIF
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({
                quality: 80,
                mozjpeg: true,
                force: true
            })
            .toBuffer();

        // 4. Upload with Cloudinary transformations
        const uploadResult = await uploadToCloudinary(processedImage, 'profile_images', {
            transformation: [
                { width: 500, height: 500, crop: 'fill', gravity: 'face' },
                { quality: 'auto:best' },
                { flags: 'force_strip.progressive' }
            ],
            format: 'jpg'
        });

        // 5. Generate optimized image URL for frontend
        const displayUrl = uploadResult.secure_url
            .replace('/upload/', '/upload/f_auto,q_auto,fl_force_strip/')
            .replace('http://', 'https://');

        // 6. Database operations...
        const existingProfile = await Profile.findOne({ user: userId });
        const oldPublicId = existingProfile?.profileImage?.publicId;

        const updatedProfile = await Profile.findOneAndUpdate(
            { user: userId },
            {
                profileImage: {
                    url: displayUrl, // Store the optimized URL
                    publicId: uploadResult.public_id,
                    uploadedAt: new Date(),
                    dimensions: {
                        width: uploadResult.width,
                        height: uploadResult.height
                    }
                }
            },
            { new: true, runValidators: true, lean: true }
        ).populate('user', 'fullName email profilePicture userType');

        if (!updatedProfile) {
            throw new ApiError(404, 'Profile not found');
        }

        // 7. Cleanup old image
        if (oldPublicId) {
            deleteFromCloudinary(oldPublicId).catch(console.error);
        }

        // 8. Return response with HTML-ready img tag
        return res.status(200).json(
            new ApiResponse(200, {
                profile: updatedProfile,
                imageInfo: {
                    url: displayUrl,
                    htmlTag: `<img src="${displayUrl}" 
                             alt="Profile image of ${updatedProfile.user.fullName}" 
                             width="${uploadResult.width}" 
                             height="${uploadResult.height}"
                             class="profile-image" 
                             loading="lazy">`,
                    dimensions: {
                        width: uploadResult.width,
                        height: uploadResult.height
                    }
                }
            }, 'Profile image updated successfully')
        );

    } catch (error) {
        console.error('Upload Error:', error);

        // Special handling for image processing errors
        if (error.message.includes('Input buffer contains unsupported image format')) {
            throw new ApiError(400, 'Invalid image format. Please upload JPEG or PNG.');
        }

        throw new ApiError(
            error.statusCode || 500,
            error.message || 'Image upload failed',
            {
                timestamp: new Date().toISOString(),
                userId
            }
        );
    }
});