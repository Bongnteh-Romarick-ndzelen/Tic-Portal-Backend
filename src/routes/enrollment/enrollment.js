// routes/enrollment.js
import express from 'express';
import Enrollment from '../../models/Enrollment.js';
import Course from '../../models/Course.js';
import { authenticate, isInstructor } from '../../middleware/auth.js';
import { notInstructor } from '../../middleware/roles.js';

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
router.post('/:courseId', authenticate, notInstructor, async (req, res) => {
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
 *               status:
 *                 type: string
 *                 enum: [active, completed, cancelled]
 *                 default: active
 *                 description: Initial enrollment status
 *     responses:
 *       201:
 *         description: Enrollment successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Bad request (already enrolled or invalid data)
 *       403:
 *         description: Forbidden (not course instructor or student doesn't exist)
 *       404:
 *         description: Course or student not found
 *       500:
 *         description: Server error
 */
router.post('/manual', authenticate, isInstructor, async (req, res) => {
    const { studentId, courseId, status = 'active' } = req.body;

    try {
        // Validate inputs
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Verify course ownership and existence
        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user._id
        }).select('_id title instructor');

        if (!course) {
            return res.status(403).json({
                message: 'You do not own this course or course not found'
            });
        }

        // Verify student exists
        const student = await User.findOne({
            _id: studentId,
            userType: 'student'
        }).select('_id fullName email');

        if (!student) {
            return res.status(404).json({
                message: 'Student not found or not a valid student account'
            });
        }

        // Check existing enrollment
        const existingEnrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({
                message: 'Student already enrolled',
                enrollment: existingEnrollment
            });
        }

        // Create new enrollment
        const enrollment = new Enrollment({
            student: studentId,
            course: courseId,
            status,
            progress: 0,
            lastAccessed: new Date()
        });

        await enrollment.save();

        // Update course's studentsEnrolled array
        await Course.findByIdAndUpdate(
            courseId,
            { $addToSet: { studentsEnrolled: enrollment._id } },
            { new: true }
        );

        // TODO: Send enrollment notification to student (via email or in-app)

        res.status(201).json({
            success: true,
            message: 'Enrollment successful',
            data: {
                enrollment,
                course: {
                    _id: course._id,
                    title: course.title
                },
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    email: student.email
                }
            }
        });

    } catch (err) {
        console.error('Manual enrollment error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error during enrollment',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});


export default router;
