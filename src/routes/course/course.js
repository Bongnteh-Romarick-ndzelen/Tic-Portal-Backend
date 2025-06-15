import express from 'express';
import { authenticate, isInstructor } from '../../middleware/auth.js';
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
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
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

