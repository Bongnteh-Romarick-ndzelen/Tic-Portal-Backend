// routes/progress.js
import express from 'express';
import { updateProgress } from '../../controllers/progress/progressController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: Course progress tracking
 */

/**
 * @swagger
 * /progress/{courseId}/progress:
 *   post:
 *     summary: Update progress for a user in a course
 *     tags: [Progress]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               moduleId:
 *                 type: string
 *                 description: ID of the module completed
 *             required:
 *               - userId
 *               - moduleId
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Progress'
 *       500:
 *         description: Server error
 */

router.post('/:courseId/progress', updateProgress);

export default router;
