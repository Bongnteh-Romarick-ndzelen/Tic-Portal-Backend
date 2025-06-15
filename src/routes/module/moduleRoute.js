import express from 'express';
import {
    createModule,
    getModulesByCourse,
    getModuleById,
    updateModule,
    deleteModule
} from '../../controllers/module/moduleController.js';

import { authenticate, isInstructor } from '../../middleware/auth.js';
import upload from '../../middleware/moduleUpload.js';

const moduleUpload = upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]);

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Endpoints for creating and managing course modules
 */

/**
 * @swagger
 * /api/modules:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
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
 *               - courseId
 *             properties:
 *               title:
 *                 type: string
 *               textContent:
 *                 type: string
 *               courseId:
 *                 type: string
 *               summaries:
 *                 type: string
 *                 description: JSON stringified array of summary objects or strings
 *                 example: '[{"title": "Intro", "content": "Summary text"}]'
 *               quizzes:
 *                 type: string
 *                 description: JSON stringified array of quiz objects
 *                 example: '[{"question": "Q?", "options": ["A","B"], "answer": "A"}]'
 *               pdf:
 *                 type: string
 *                 format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Module created successfully
 *       400:
 *         description: Validation or parsing error
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, isInstructor, moduleUpload, createModule);

/**
 * @swagger
 * /api/modules/course/{courseId}:
 *   get:
 *     summary: Get all modules for a specific course
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Modules list
 *       404:
 *         description: Course or modules not found
 *       500:
 *         description: Server error
 */
router.get('/course/:courseId', getModulesByCourse);

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Get module by ID
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module data
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getModuleById);

/**
 * @swagger
 * /api/modules/{id}:
 *   put:
 *     summary: Update a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               textContent:
 *                 type: string
 *               summaries:
 *                 type: string
 *                 description: JSON stringified array of summaries
 *               quizzes:
 *                 type: string
 *                 description: JSON stringified array of quizzes
 *               pdf:
 *                 type: string
 *                 format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Module updated
 *       404:
 *         description: Module not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticate, isInstructor, moduleUpload, updateModule);

/**
 * @swagger
 * /api/modules/{id}:
 *   delete:
 *     summary: Delete a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Module not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, isInstructor, deleteModule);

export default router;
