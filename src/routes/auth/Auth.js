import express from 'express';
import { signup, login, refreshToken, logout, verifyEmail, verifyPasswordResetToken, resetPassword, forgotPassword } from '../../controllers/auth/authController.js';

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
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: If the email exists, a password reset link has been sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "If an account with that email exists, a password reset link has been sent"
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-token:
 *   get:
 *     summary: Verify password reset token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset token is valid"
 *                 userId:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get('/verify-reset-token', verifyPasswordResetToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - userId
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: The password reset token
 *               userId:
 *                 type: string
 *                 description: The user's ID
 *                 example: "507f1f77bcf86cd799439011"
 *               newPassword:
 *                 type: string
 *                 description: The new password
 *                 example: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password has been reset successfully"
 *       400:
 *         description: Invalid token or expired token
 *       500:
 *         description: Server error
 */
router.post('/reset-password', resetPassword);

export default router;
