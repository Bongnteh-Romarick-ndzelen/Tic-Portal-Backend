import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { launchSession } from '../../controllers/VirtualLab/labController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: VirtualLabs
 *   description: Endpoints for launching virtual lab sessions
 */

/**
 * @swagger
 * /api/virtual-lab/launch:
 *   post:
 *     summary: Launch a virtual lab session
 *     tags: [VirtualLabs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - labTitle
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID of the course the lab is tied to
 *               labTitle:
 *                 type: string
 *                 description: Title of the lab to launch
 *     responses:
 *       200:
 *         description: Virtual lab session launched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   description: Lab session details
 *       400:
 *         description: Missing or invalid input
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */

router.post('/launch', authenticate, launchSession);

export default router;

