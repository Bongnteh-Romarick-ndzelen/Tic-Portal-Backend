// In your course controller file
import Rating from '../../models/Ratings.js';
import Course from '../../models/Course.js';
import User from '../../models/User.js';

export const addRating = async (req, res) => {
    try {
        const { rating, review } = req.body;
        const { courseId } = req.params;
        const userId = req.user._id; // Get user ID from authenticated user

        // Check if user already rated this course
        const existingRating = await Rating.findOne({
            user: userId,
            course: courseId
        });

        if (existingRating) {
            return res.status(400).json({
                error: 'You have already rated this course'
            });
        }

        // Create new rating with all required fields
        const newRating = new Rating({
            user: userId,
            course: courseId,
            rating,
            review: review || null // Make review optional
        });

        await newRating.save();

        // Update course rating stats
        await updateCourseRating(courseId);

        res.status(201).json(newRating);
    } catch (error) {
        if (error.name === 'ValidationError') {
            // Handle specific validation errors
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ error: errors.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

const updateCourseRating = async (courseId) => {
    const ratings = await Rating.find({ course: courseId });

    if (ratings.length === 0) return;

    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    const average = total / ratings.length;

    const starDistribution = {
        1: ratings.filter(r => r.rating === 1).length,
        2: ratings.filter(r => r.rating === 2).length,
        3: ratings.filter(r => r.rating === 3).length,
        4: ratings.filter(r => r.rating === 4).length,
        5: ratings.filter(r => r.rating === 5).length
    };

    await Course.findByIdAndUpdate(courseId, {
        'ratings.averageRating': average,
        'ratings.ratingCount': ratings.length,
        'ratings.starDistribution': starDistribution
    });
};

// Get course ratings with user details
export const getCourseRatings = async (req, res) => {
    try {
        const { courseId } = req.params;
        const ratings = await Rating.find({ course: courseId })
            .populate('user', 'name avatar');

        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};