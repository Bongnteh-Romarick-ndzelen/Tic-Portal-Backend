// routes/moduleExtras.js
import express from 'express';
import { addQuizToModule, updateQuizInModule, deleteQuizFromModule, addSummaryToModule, updateSummaryInModule, deleteSummaryFromModule, getAllQuizzesInModule, getAllSummariesInModule } from '../../controllers/module/moduleExtrasController.js';
import { authenticate, isInstructor } from '../../middleware/auth.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Module Extras
 *   description: Endpoints for quizzes and summaries in modules
 */


/**
 * @swagger
 * /api/modules/{moduleId}/quizzes:
 *   post:
 *     summary: Add a full quiz (with multiple questions) to a module
 *     tags: [Module Extras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the module
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the quiz
 *               questions:
 *                 type: array
 *                 description: List of quiz questions
 *                 items:
 *                   type: object
 *                   required:
 *                     - question
 *                     - options
 *                     - answer
 *                   properties:
 *                     question:
 *                       type: string
 *                       description: The quiz question
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Answer choices
 *                     answer:
 *                       type: string
 *                       description: Correct answer
 *     responses:
 *       201:
 *         description: Quiz added successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/:moduleId/quizzes', authenticate, isInstructor, addQuizToModule);
/**
 * @swagger
 * /api/modules/{moduleId}/quizzes:
 *   get:
 *     summary: Get all quizzes in a module
 *     tags: [Module Extras]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the module
 *     responses:
 *       200:
 *         description: List of quizzes in the module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quizzes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       question:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       correctAnswer:
 *                         type: string
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.get('/:moduleId/quizzes', getAllQuizzesInModule);


/**
 * @swagger
 * /api/modules/{moduleId}/quizzes/{quizId}:
 *   put:
 *     summary: Update a quiz in a module
 *     tags: [Module Extras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the module
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the quiz to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Quiz Title"
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       example: "What is the capital of France?"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Paris", "London", "Rome", "Berlin"]
 *                     answer:
 *                       type: string
 *                       example: "Paris"
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Quiz updated successfully"
 *                 quiz:
 *                   $ref: '#/components/schemas/Quiz'
 */

router.put('/:moduleId/quizzes/:quizId', authenticate, isInstructor, updateQuizInModule);

/**
 * @swagger
 * /api/modules/{moduleId}/quizzes/{quizId}:
 *   delete:
 *     summary: Delete a quiz from a module
 *     tags: [Module Extras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       404:
 *         description: Module or Quiz not found
 *       500:
 *         description: Internal server error
 */

router.delete('/:moduleId/quizzes/:quizId', authenticate, isInstructor, deleteQuizFromModule);

/**
 * @swagger
 * /api/modules/{moduleId}/summaries:
 *   post:
 *     summary: Add a summary to a module
 *     tags: [Module Extras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Summary added
 */
router.post('/:moduleId/summaries', authenticate, isInstructor, addSummaryToModule);

/**
 * @swagger
 * /api/modules/{moduleId}/summaries:
 *   get:
 *     summary: Get all summaries in a module
 *     tags: [Module Extras]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the module
 *     responses:
 *       200:
 *         description: List of summaries in the module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summaries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */

router.get('/:moduleId/summaries', getAllSummariesInModule);

/**
 * @swagger
 * /api/modules/{moduleId}/summaries/{summaryId}:
 *   put:
 *     summary: Update a summary in a module
 *     tags: [Module Extras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: summaryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Summary updated
 */
router.put('/:moduleId/summaries/:summaryId', authenticate, isInstructor, updateSummaryInModule);

/**
 * @swagger
 * /api/modules/{moduleId}/summaries/{summaryId}:
 *   delete:
 *     summary: Delete a summary from a module
 *     tags: [Module Extras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: summaryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary deleted
 */
router.delete('/:moduleId/summaries/:summaryId', authenticate, isInstructor, deleteSummaryFromModule);

export default router;

