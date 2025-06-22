import InternshipApplication from '../../models/InternshipApplication.js';
import Internship from '../../models/Internship.js';

/**
 * @desc    Apply for an internship
 * @route   POST /api/internships/:id/apply
 * @access  Private (Student)
 */
export const applyForInternship = async (req, res) => {
    const { studentId, resumeUrl } = req.body;
    const internshipId = req.params.id;

    try {
        // Validate inputs
        if (!studentId || !resumeUrl) {
            return res.status(400).json({ message: 'Student ID and resume URL are required' });
        }

        // Check internship exists
        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        // Check for duplicate application
        const existingApplication = await InternshipApplication.findOne({
            studentId,
            internshipId
        });
        if (existingApplication) {
            return res.status(400).json({ message: 'Already applied to this internship' });
        }

        // Validate URL format
        if (!isValidUrl(resumeUrl)) {
            return res.status(400).json({ message: 'Invalid resume URL format' });
        }

        // Create application
        const application = await InternshipApplication.create({
            studentId,
            internshipId,
            resumeUrl
        });

        res.status(201).json({
            success: true,
            data: application
        });

    } catch (error) {
        console.error('Application error:', error);
        res.status(500).json({
            success: false,
            message: 'Application failed',
            error: error.message
        });
    }
};

// Helper function
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}