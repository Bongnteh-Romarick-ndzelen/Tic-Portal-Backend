import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { createPost, getForums, replyToPost } from '../../controllers/forum/forumController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Forums
 *   description: Course forums and student discussions
 */

/**
 * @swagger
 * /api/forums:
 *   get:
 *     summary: Get all forum posts for a course
 *     tags: [Forums]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course
 *     responses:
 *       200:
 *         description: List of forum posts
 *       500:
 *         description: Server error
 */
router.get('/', getForums);

/**
 * @swagger
 * /api/forums:
 *   post:
 *     summary: Create a new forum post
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Validation or moderation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, createPost);

/**
 * @swagger
 * /api/forums/{id}/reply:
 *   post:
 *     summary: Add a reply to a forum post
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Forum post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply added
 *       400:
 *         description: Inappropriate content
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/:id/reply', authenticate, replyToPost);

export default router;
