import express from 'express';
import { signup, login, refreshToken, logout, verifyEmail } from '../../controllers/auth/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - userType
 *               - country
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 example: "romarickndze@gmail.com"
 *               password:
 *                 type: string
 *                 example: "1997Roma"
 *               userType:
 *                 type: string
 *                 enum: [student, instructor, employer, admin, mentor]
 *               phoneNumber:
 *                 type: string
 *                 example: "+237 123 456 789"
 *               contact:
 *                 example: "+237 123 456 789"
 *               country:
 *                 type: object
 *                 required:
 *                   - name
 *                   - code
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Cameroon"
 *                   code:
 *                     type: string
 *                     example: "237"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                   type: string
 *                   example: "ndze@example.com"
 *               password:
 *                   type: string
 *                   example: "1997Roma"
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out user and invalidate refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to invalidate
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: Refresh token is required
 *       500:
 *         description: Server error
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token sent to user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid verification token
 *       500:
 *         description: Server error
 */
router.get('/verify-email', verifyEmail);

export default router;
