import express from 'express';
import { authenticate, isAdmin, isInstructor } from '../../middleware/auth.js';
import upload from '../../middleware/upload.js';
import { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } from '../../controllers/course/courseController.js';

const router = express.Router();
const cpUpload = upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'document', maxCount: 1 }
]);

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */


/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               video:
 *                 type: string
 *                 format: binary
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created
 *       500:
 *         description: Server error
 */

router.post('/', authenticate, isInstructor, cpUpload, createCourse);


/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       500:
 *         description: Server error
 */
router.get('/', getCourses);
/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get complete course details with modules, quizzes, summaries, and enrolled students
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Course ID
 *     responses:
 *       200:
 *         description: Successfully retrieved course with all nested content and enrolled students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FullCourseWithEnrollments'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FullCourseWithEnrollments:
 *       type: object
 *       allOf:
 *         - $ref: '#/components/schemas/Course'
 *         - type: object
 *           properties:
 *             enrollmentCount:
 *               type: number
 *               description: Total number of enrolled students
 *             enrolledStudents:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EnrolledStudent'
 *             modules:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ModuleWithContent'
 * 
 *     EnrolledStudent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         profilePicture:
 *           type: string
 *           description: URL to user's profile picture
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *           description: When the user enrolled in the course
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           description: Enrollment status
 * 
 *     ModuleWithContent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         textContent:
 *           type: string
 *         videoUrl:
 *           type: string
 *         pdfUrl:
 *           type: string
 *         summaries:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Summary'
 *         quizzes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuizWithQuestions'
 * 
 *     Summary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 * 
 *     QuizWithQuestions:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         questionCount:
 *           type: number
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuizQuestion'
 * 
 *     QuizQuestion:
 *       type: object
 *       properties:
 *         question:
 *           type: string
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         answer:
 *           type: string
 */
router.get('/:id', getCourseById);


/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               video:
 *                 type: string
 *                 format: binary
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Course updated
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, isInstructor, cpUpload, updateCourse);


/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, isInstructor, deleteCourse);

export default router;

