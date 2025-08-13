import express from 'express';
import { addRating, getCourseRatings } from '../../controllers/ratings/ratingsController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/ratings/{courseId}/ratings:
 *   post:
 *     tags: [Ratings]
 *     summary: Add a rating to a course
 *     description: Authenticated users can rate a course (1-5 stars) and optionally add a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Star rating (1-5)
 *                 example: 4
 *               review:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional review text
 *                 example: "Great course with excellent content!"
 *             required:
 *               - rating
 *     responses:
 *       201:
 *         description: Rating successfully added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Bad request (already rated, invalid rating value, etc.)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.post('/:courseId/ratings', authenticate, addRating);

/**
 * @swagger
 * /api/ratings/{courseId}/ratings:
 *   get:
 *     tags: [Ratings]
 *     summary: Get all ratings for a course
 *     description: Retrieve all ratings and reviews for a specific course
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to get ratings for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of ratings per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, highest, lowest]
 *           default: newest
 *         description: Sort order for ratings
 *     responses:
 *       200:
 *         description: List of course ratings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RatingWithUser'
 *                 total:
 *                   type: integer
 *                   description: Total number of ratings
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 pages:
 *                   type: integer
 *                   description: Total number of pages
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get('/:courseId/ratings', getCourseRatings);

/**
 * @swagger
 * components:
 *   schemas:
 *     Rating:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Rating ID
 *         user:
 *           type: string
 *           description: ID of the user who created the rating
 *         course:
 *           type: string
 *           description: ID of the rated course
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         review:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     RatingWithUser:
 *       allOf:
 *         - $ref: '#/components/schemas/Rating'
 *         - type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                   description: URL to user's avatar image
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;