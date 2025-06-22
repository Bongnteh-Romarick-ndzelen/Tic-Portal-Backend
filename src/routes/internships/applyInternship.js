import express from 'express';
import { applyForInternship } from '../../controllers/internship/applyInternshipController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/apply/:id/apply:
 *   post:
 *     summary: Apply for an internship (protected route)
 *     tags: [Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the internship to apply for
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: ID of the student applying
 *               resumeUrl:
 *                 type: string
 *                 description: URL of the student's resume
 *     responses:
 *       201:
 *         description: Successful application submission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternshipApplication'
 *       401:
 *         description: Unauthorized - requires a valid JWT token
 *       400:
 *         description: Application failed due to validation errors or other issues
 */
// Protected route (requires valid JWT)
router.post('/:id/apply', authenticate, applyForInternship);

export default router;