import InternshipApplication from '../../models/InternshipApplication.js';
import Internship from '../../models/Internship.js';
import User from '../../models/User.js';

/**
 * @desc    Apply for an internship
 * @route   POST /api/internships/:id/apply
 * @access  Private (Student)
 */
export const applyForInternship = async (req, res) => {
    const {
        applicationLetter,
        school,
        year,
        linkedinUrl,
        githubUrl,
        portfolioUrl
    } = req.body;

    const internshipId = req.params.id;
    const studentId = req.user._id; // Get from authenticated user

    try {
        // Validate required fields
        if (!req.files?.resumeFile) {
            return res.status(400).json({
                success: false,
                message: 'Resume file is required'
            });
        }

        if (!applicationLetter || !school || !year) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                requiredFields: ['applicationLetter', 'school', 'year']
            });
        }

        // Check internship exists and is active
        const internship = await Internship.findOne({
            _id: internshipId,
            status: 'active',
        });
        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found or not accepting applications'
            });
        }

        // Check student exists
        const student = await User.findById(studentId);
        if (!student || student.userType !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Invalid student account'
            });
        }

        // Check for duplicate application
        const existingApplication = await InternshipApplication.findOne({
            studentId,
            internshipId
        });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this internship'
            });
        }

        // Process file uploads

        const resumeFile = {
            url: req.files.resumeFile[0].url, // Now using the middleware-generated URL
            fileName: req.files.resumeFile[0].originalname,
            fileType: req.files.resumeFile[0].mimetype,
            fileSize: req.files.resumeFile[0].size
        };

        // Process support letter if uploaded
        let supportLetter = null;
        if (req.files?.supportLetter) {
            supportLetter = {
                url: req.files.supportLetter[0].location,
                fileName: req.files.supportLetter[0].originalname,
                fileType: req.files.supportLetter[0].mimetype,
                fileSize: req.files.supportLetter[0].size
            };
        }

        // Create application
        const application = await InternshipApplication.create({
            studentId,
            internshipId,
            school,
            year,
            resumeFile,
            supportLetter,
            applicationLetter,
            linkedinUrl,
            githubUrl,
            portfolioUrl,
            status: 'Pending'
        });

        // Update internship application count
        await Internship.findByIdAndUpdate(internshipId, {
            $inc: { applicationCount: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                applicationId: application._id,
                internship: internship.title,
                company: internship.company,
                school: application.school,
                year: application.year,
                appliedAt: application.appliedAt
            }
        });

    } catch (error) {
        console.error('Application error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
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
                message: 'Duplicate application detected'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Application failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};