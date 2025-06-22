import express from 'express';
const router = express.Router();
import { getMyApplications } from '../../controllers/internship/myApplicationController.js';

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get user's internship applications
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         required: true
 *         description: ID of the student to retrieve applications for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InternshipApplication'
 *       500:
 *         description: Server error
 */
// GET user's applications
router.get('/my-applications', getMyApplications);

export default router;