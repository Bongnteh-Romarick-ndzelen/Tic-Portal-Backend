// routes/users.js
import express from 'express';
import User from '../../models/User.js';
import { authenticate, isInstructor } from '../../middleware/auth.js';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser
} from '../../controllers/users/usersControllers.js';




const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/users/students:
 *   get:
 *     summary: Get all students (for instructors to enroll)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/students', authenticate, isInstructor, async (req, res) => {
    try {
        const students = await User.find({ userType: 'student' }).select('fullName email _id');
        res.status(200).json({ students });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getAllUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Email already exists
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
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
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin or self)
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin or self)
 *     tags: [Users]
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
 *         description: User deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, deleteUser);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         contact:
 *           type: string
 *         country:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             code:
 *               type: string
 *         phoneNumber:
 *           type: string
 *         userType:
 *           type: string
 *           enum: [student, instructor, employer, admin, mentor]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserInput:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - userType
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         contact:
 *           type: string
 *         country:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             code:
 *               type: string
 *         phoneNumber:
 *           type: string
 *         userType:
 *           type: string
 *           enum: [student, instructor, employer, admin, mentor]
 *         password:
 *           type: string
 */


export default router;
