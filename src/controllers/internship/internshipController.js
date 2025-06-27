import mongoose from 'mongoose';
import Internship from '../../models/Internship.js';
import InternshipApplication from '../../models/InternshipApplication.js';

// @desc    Create a new internship
// @route   POST /api/internships
// @access  Private/Admin
export const createInternship = async (req, res) => {
    const {
        title,
        company,
        domain,
        stipend,
        duration,
        location,
        description,
        startDate,
        endDate,
        skills,
        responsibilities,
        qualifications,
        status,
        applicationDeadline
    } = req.body;

    // Validation
    if (!title || !company || !domain || !stipend || !duration || !location || !description || !startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: 'All required fields must be provided',
            requiredFields: [
                'title',
                'company',
                'domain',
                'stipend',
                'duration',
                'location',
                'description',
                'startDate',
                'endDate'
            ]
        });
    }

    if (isNaN(stipend) || stipend <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Stipend must be a positive number'
        });
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
            success: false,
            message: 'End date must be after start date'
        });
    }

    try {
        const internship = await Internship.create({
            ...req.body,
            postedBy: req.user._id, // Track admin who created it
            skills: skills || [],
            responsibilities: responsibilities || [],
            qualifications: qualifications || [],
            status: status || 'active', // Default to 'active' if not provided
            applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null
        });

        res.status(201).json({
            success: true,
            data: internship
        });
    } catch (error) {
        // Handle duplicate internships
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Internship with similar details already exists'
            });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        // Handle other errors
        console.error('[Internship Creation Error]', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all internships
// @access  Public
// @route   GET /api/internships
export const getInternships = async (req, res) => {
    try {
        // Destructure query parameters
        const {
            domain,
            location,
            minStipend,
            maxStipend,
            skills,
            page = 1,
            limit = 10
        } = req.query;

        // Build filter object
        const filter = {};
        if (domain) filter.domain = domain;
        if (location) filter.location = location;
        if (skills) filter.skills = { $in: skills.split(',') };

        // Stipend range filter
        if (minStipend || maxStipend) {
            filter.stipend = {};
            if (minStipend) filter.stipend.$gte = Number(minStipend);
            if (maxStipend) filter.stipend.$lte = Number(maxStipend);
        }

        // Execute query with pagination
        const [internships, total] = await Promise.all([
            Internship.find(filter)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 }),
            Internship.countDocuments(filter)
        ]);

        res.json({
            success: true,
            count: internships.length,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            },
            data: internships
        });
    } catch (error) {
        console.error('[Get Internships Error]', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get single internship
// @route   GET /api/internships/:id
// @access  Public
export const getInternshipById = async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        res.json({
            success: true,
            data: internship
        });

    } catch (error) {
        console.error(`[Get Internship Error] ID: ${req.params.id}`, error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid internship ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update internship
// @route   PATCH /api/internships/:id
// @access  Private/Admin
export const updateInternship = async (req, res) => {
    try {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid internship ID format'
            });
        }

        // Prevent updating protected fields
        const { _id, createdAt, postedBy, ...updateData } = req.body;

        // Validate dates if provided
        if (updateData.startDate && updateData.endDate) {
            if (new Date(updateData.endDate) <= new Date(updateData.startDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }
        }

        const updatedInternship = await Internship.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
                context: 'query' // Required for proper validation
            }
        );

        if (!updatedInternship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        res.json({
            success: true,
            data: updatedInternship
        });

    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate internship data',
                error: 'An internship with similar details already exists'
            });
        }

        console.error(`[Update Internship Error] ID: ${req.params.id}`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private/Admin
export const deleteInternship = async (req, res) => {
    try {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid internship ID format'
            });
        }
        const deletedInternship = await Internship.findByIdAndDelete(req.params.id);
        if (!deletedInternship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }
        // Also delete related applications (optional)
        await InternshipApplication.deleteMany({ internshipId: req.params.id });
        res.json({
            success: true,
            message: 'Internship deleted successfully',
            data: deletedInternship
        });
    } catch (error) {
        console.error(`[Delete Internship Error] ID: ${req.params.id}`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};