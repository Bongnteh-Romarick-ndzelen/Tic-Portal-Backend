import express from 'express';
import { createInternship, getInternships, getInternshipById, updateInternship, deleteInternship } from '../../controllers/internship/internshipController.js';
import { authenticate, isAdmin } from '../../middleware/auth.js';
const router = express.Router();


/**
 * @swagger
 * /api/internships:
 *   post:
 *     summary: Create a new internship listing (Admin only)
 *     tags: [Internships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Internship'
 *     responses:
 *       201:
 *         description: Internship created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Internship'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Title is required", "Stipend must be positive number"]
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (requires admin privileges)
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, isAdmin, createInternship);
/**
 * @swagger
 * /api/internships:
 *   get:
 *     summary: Get all internships
 *     tags: [Internships]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *         description: Filter by domain (e.g., "Web Development")
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (e.g., "Remote")
 *     responses:
 *       200:
 *         description: List of internships
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Internship'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.get('/', getInternships);
/**
 * @swagger
 * /api/internships/{id}:
 *   get:
 *     summary: Get a single internship by ID
 *     tags: [Internships]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ID of the internship
 *     responses:
 *       200:
 *         description: Internship data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Internship'
 *       404:
 *         description: Internship not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internship not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.get('/:id', getInternshipById);
/**
 * @swagger
 * /api/internships/{id}:
 *   patch:
 *     summary: Update an internship (Admin only)
 *     tags: [Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ID of the internship to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Internship Title"
 *               company:
 *                 type: string
 *                 example: "Updated Company Name"
 *               domain:
 *                 type: string
 *                 example: "Updated Domain"
 *               stipend:
 *                 type: number
 *                 example: 30000
 *               duration:
 *                 type: string
 *                 example: "Updated Duration"
 *               location:
 *                 type: string
 *                 example: "Updated Location"
 *     responses:
 *       200:
 *         description: Internship updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Internship'
 *       400:
 *         description: Bad request (validation/invalid data)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Title is required", "Stipend must be positive"]
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Internship not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authenticate, isAdmin, updateInternship);
/**
 * @swagger
 * /api/internships/{id}:
 *   delete:
 *     summary: Delete an internship (Admin only)
 *     tags: [Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ID of the internship to delete
 *     responses:
 *       200:
 *         description: Internship deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Internship deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Internship'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid internship ID format"
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Internship not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, isAdmin, deleteInternship);

export default router;