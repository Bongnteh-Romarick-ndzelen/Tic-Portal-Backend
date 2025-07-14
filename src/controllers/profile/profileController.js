import Profile from '../../models/Profile.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';

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