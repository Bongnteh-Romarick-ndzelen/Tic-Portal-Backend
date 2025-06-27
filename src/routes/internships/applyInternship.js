import express from 'express';
import {
    upload,
    attachFileUrls,
    initUploadDirectory
} from '../../middleware/internshipUpload.js';
import { authenticate, isStudent } from '../../middleware/auth.js';
import { applyForInternship } from '../../controllers/internship/applyInternshipController.js';

const router = express.Router();

// Initialize and serve uploads
router.use('/uploads', initUploadDirectory());

/**
 * @swagger
 * /api/internship/{id}/apply:
 *   post:
 *     summary: Submit internship application
 *     tags: [Internship Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Internship ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resumeFile
 *               - applicationLetter
 *               - school
 *               - year
 *             properties:
 *               resumeFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF or Word document (max 5MB)
 *               supportLetter:
 *                 type: string
 *                 format: binary
 *                 description: Optional recommendation letter
 *               applicationLetter:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 1000
 *               school:
 *                 type: string
 *                 maxLength: 100
 *               year:
 *                 type: string
 *                 enum: [Year one, Year two, Year three, Year four, Year five, Other]
 *               linkedinUrl:
 *                 type: string
 *                 format: uri
 *               githubUrl:
 *                 type: string
 *                 format: uri
 *               portfolioUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Application created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternshipApplication'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Internship not found
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */
router.post(
    '/:id/apply',
    authenticate,
    isStudent,
    upload.fields([
        { name: 'resumeFile', maxCount: 1 },
        { name: 'supportLetter', maxCount: 1 }
    ]),
    attachFileUrls,
    applyForInternship
);

export default router;