// routes/enrollment.js
import express from 'express';
import Enrollment from '../../models/Enrollment.js';
import Course from '../../models/Course.js';
import { authenticate, isInstructor } from '../../middleware/auth.js';
import { IsnotInstructor } from '../../middleware/roles.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enrollment
 *   description: Course enrollment management
 */

/**
 * @swagger
 * /api/enrollments/{courseId}:
 *   post:
 *     summary: Enroll a student in a course
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to enroll in
 *     responses:
 *       201:
 *         description: Enrollment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Enrollment successful
 *                 enrollment:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Already enrolled
 *       500:
 *         description: Server error
 */
router.post('/:courseId', authenticate, IsnotInstructor, async (req, res) => {
    try {
        const existing = await Enrollment.findOne({
            student: req.user._id,
            course: req.params.courseId,
        });

        if (existing) {
            return res.status(400).json({ message: 'Already enrolled' });
        }

        const enrollment = new Enrollment({
            student: req.user._id,
            course: req.params.courseId,
        });

        await enrollment.save();
        res.status(201).json({ message: 'Enrollment successful', enrollment });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

/**
 * @swagger
 * /api/enrollments/my-courses/enrollments:
 *   get:
 *     summary: Get enrollments for courses created by the instructor
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment stats and list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEnrolledStudents:
 *                   type: integer
 *                   description: Total number of unique students enrolled
 *                 enrollmentsPerCourse:
 *                   type: array
 *                   description: Enrollment count per course
 *                   items:
 *                     type: object
 *                     properties:
 *                       course:
 *                         type: string
 *                         description: Course title
 *                       count:
 *                         type: integer
 *                         description: Number of enrollments
 *                 enrollments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 *       500:
 *         description: Server error
 */

router.get('/my-courses/enrollments', authenticate, isInstructor, async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id });
        const courseIds = courses.map((course) => course._id);

        const enrollments = await Enrollment.find({ course: { $in: courseIds } })
            .populate('student', 'fullName email')
            .populate('course', 'title');

        // Unique student count
        const uniqueStudentIds = new Set(enrollments.map(e => e.student._id.toString()));
        const totalEnrolledStudents = uniqueStudentIds.size;

        // Enrollment count per course
        const enrollmentsPerCourseMap = {};
        enrollments.forEach(e => {
            const courseTitle = e.course.title;
            enrollmentsPerCourseMap[courseTitle] = (enrollmentsPerCourseMap[courseTitle] || 0) + 1;
        });

        const enrollmentsPerCourse = Object.entries(enrollmentsPerCourseMap).map(([course, count]) => ({
            course,
            count
        }));

        res.status(200).json({
            totalEnrolledStudents,
            enrollmentsPerCourse,
            enrollments
        });
    } catch (error) {
        console.error('Instructor enrollment fetch failed:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


/**
 * @swagger
 * /api/enrollments/manual:
 *   post:
 *     summary: Instructor enrolls selected student in a course
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - courseId
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: The student to enroll
 *               courseId:
 *                 type: string
 *                 description: The course the student should be enrolled in
 *     responses:
 *       201:
 *         description: Enrollment successful
 *       400:
 *         description: Already enrolled
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/manual', authenticate, isInstructor, async (req, res) => {
    const { studentId, courseId } = req.body;

    // Validate ObjectIDs first
    if (!mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    try {
        // Verify course ownership
        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user._id // Ensure requesting user is the instructor
        });

        if (!course) {
            return res.status(403).json({
                success: false,
                message: 'You must be the course instructor to enroll students'
            });
        }

        // Verify student exists
        const student = await User.findOne({
            _id: studentId,
            $or: [
                { role: 'student' },
                { userType: 'student' }
            ]
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student account not found'
            });
        }

        // Check for existing enrollment
        const existing = await Enrollment.findOne({
            student: studentId,
            course: courseId
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Student already enrolled',
                enrollmentId: existing._id
            });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            student: studentId,
            course: courseId,
            enrolledBy: req.user._id,
            status: 'active'
        });

        // Update course's enrollment list
        await Course.findByIdAndUpdate(
            courseId,
            { $addToSet: { studentsEnrolled: enrollment._id } }
        );

        return res.status(201).json({
            success: true,
            message: 'Enrollment successful',
            data: {
                enrollmentId: enrollment._id,
                student: student._id,
                course: course._id
            }
        });

    } catch (error) {
        console.error('Manual enrollment failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Enrollment processing failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


export default router;
