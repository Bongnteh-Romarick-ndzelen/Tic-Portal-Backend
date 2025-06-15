// routes/users.js
import express from 'express';
import User from '../../models/User.js';
import { authenticate, isInstructor } from '../../middleware/auth.js';

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

export default router;
