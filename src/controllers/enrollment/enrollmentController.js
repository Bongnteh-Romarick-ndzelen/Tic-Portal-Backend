import Enrollment from '../../models/Enrollment.js';
import Course from '../../models/Course.js';

export const getInstructorEnrollments = async (req, res) => {
    try {
        // Find courses created by this instructor
        const courses = await Course.find({ instructor: req.user._id });

        const courseIds = courses.map(course => course._id);

        // Find enrollments for those courses and populate student info
        const enrollments = await Enrollment.find({ course: { $in: courseIds } })
            .populate('student', 'fullName email')  // Get student name + email
            .populate('course', 'title');           // Get course title

        res.status(200).json({ enrollments });
    } catch (error) {
        console.error('Error fetching instructor enrollments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
