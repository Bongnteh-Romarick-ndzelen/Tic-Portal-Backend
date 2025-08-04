import express from 'express';
import {
    createModule,
    getModulesByCourse,
    getModuleById,
    updateModule,
    deleteModule,
    updateModuleTopicsOrder,
    addTopicToModule,
    updateTopic,
    deleteTopic,
    addQuizToModule,
    updateQuizInModule,
    deleteQuizFromModule,
    addSummaryToModule,
    updateSummaryInModule,
    deleteSummaryFromModule,
    getAllQuizzesInModule,
    getAllSummariesInModule
} from '../../controllers/module/moduleController.js';

import { authenticate, isInstructor } from '../../middleware/auth.js';
import upload from '../../middleware/moduleUpload.js';

const moduleUpload = upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 }
]);

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Endpoints for creating and managing course modules with topics, quizzes and summaries
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Module:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439012"
 *         title:
 *           type: string
 *           example: "Advanced JavaScript"
 *         courseId:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439011"
 *         topics:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Topic'
 *         order:
 *           type: number
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ModuleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Module created successfully"
 *         module:
 *           $ref: '#/components/schemas/Module'
 *     
 *     Topic:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439033"
 *         title:
 *           type: string
 *           example: "ES6 Features"
 *         type:
 *           type: string
 *           enum: [video, pdf, text, quiz]
 *           example: "quiz"
 *         description:
 *           type: string
 *           example: "Learn about modern JavaScript features"
 *         content:
 *           type: object
 *           properties:
 *             videoUrl:
 *               type: string
 *               example: "https://example.com/video1.mp4"
 *             pdfUrl:
 *               type: string
 *               example: "/uploads/pdf1.pdf"
 *             textContent:
 *               type: string
 *               example: "Full text content here..."
 *             quizId:
 *               type: string
 *               format: objectId
 *               example: "507f1f77bcf86cd799439044"
 *         order:
 *           type: number
 *           example: 1
 *         isPublished:
 *           type: boolean
 *           example: false
 *     
 *     TopicInput:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           example: "ES6 Features"
 *         type:
 *           type: string
 *           enum: [video, pdf, text, quiz]
 *           example: "quiz"
 *         description:
 *           type: string
 *           example: "Learn about modern JavaScript features"
 *         content:
 *           type: object
 *           properties:
 *             videoUrl:
 *               type: string
 *               example: "https://example.com/video1.mp4"
 *             pdfUrl:
 *               type: string
 *               example: "/uploads/pdf1.pdf"
 *             textContent:
 *               type: string
 *               example: "Full text content here..."
 *             questions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuizQuestionInput'
 *             passingScore:
 *               type: number
 *               example: 70
 *             timeLimit:
 *               type: number
 *               example: 30
 *     
 *     QuizQuestionInput:
 *       type: object
 *       required:
 *         - question
 *         - options
 *         - answer
 *       properties:
 *         question:
 *           type: string
 *           example: "What is 2+2?"
 *         options:
 *           type: object
 *           properties:
 *             A:
 *               type: string
 *               example: "3"
 *             B:
 *               type: string
 *               example: "4"
 *             C:
 *               type: string
 *               example: "5"
 *         answer:
 *           type: string
 *           enum: [A, B, C, D, E]
 *           example: "B"
 *         explanation:
 *           type: string
 *           example: "Basic arithmetic"
 *         questionType:
 *           type: string
 *           enum: [multiple-choice, true-false]
 *           default: "multiple-choice"
 *         points:
 *           type: number
 *           default: 1
 *           example: 1
 *     
 *     Quiz:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         title:
 *           type: string
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuizQuestionInput'
 *         moduleId:
 *           type: string
 *           format: objectId
 *     
 *     Summary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         moduleId:
 *           type: string
 *           format: objectId
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation error"
 *         error:
 *           type: string
 *           example: "Video topic requires videoUrl"
 */

/**
 * @swagger
 * /api/modules/{courseId}/modules:
 *   post:
 *     summary: Create a new module with topics (automatically creates quizzes for quiz topics)
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: ID of the course to which the module will be added
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced JavaScript"
 *               topics:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TopicInput'
 *     responses:
 *       201:
 *         description: Module and associated quizzes created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModuleResponse'
 *       400:
 *         description: Validation error (missing title, invalid topic data, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Unauthorized (user is not the course instructor)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.post('/:courseId/modules', authenticate, isInstructor, createModule);

/**
 * @swagger
 * /api/modules/course/{courseId}:
 *   get:
 *     summary: Get all modules for a specific course
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Modules list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Module'
 *       404:
 *         description: Course or modules not found
 *       500:
 *         description: Server error
 */
router.get('/course/:courseId', getModulesByCourse);

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Get module by ID with populated topics
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Module data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getModuleById);

/**
 * @swagger
 * /api/modules/{id}:
 *   put:
 *     summary: Update a module (title and topics)
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               topics:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TopicInput'
 *     responses:
 *       200:
 *         description: Module updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModuleResponse'
 *       404:
 *         description: Module not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticate, isInstructor, updateModule);

/**
 * @swagger
 * /api/modules/{id}:
 *   delete:
 *     summary: Delete a module and its topics
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Module deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, isInstructor, deleteModule);

/**
 * @swagger
 * /api/modules/{id}/topics/order:
 *   patch:
 *     summary: Update topics order within a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topicOrders:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *                 example:
 *                   "507f1f77bcf86cd799439033": 2
 *                   "507f1f77bcf86cd799439044": 1
 *     responses:
 *       200:
 *         description: Topic order updated
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/topics/order', authenticate, isInstructor, updateModuleTopicsOrder);

/**
 * @swagger
 * /api/modules/{id}/topics:
 *   post:
 *     summary: Add a new topic to a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/TopicInput'
 *     responses:
 *       201:
 *         description: Topic added successfully
 *       400:
 *         description: Invalid topic data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:id/topics', authenticate, isInstructor, moduleUpload, addTopicToModule);

/**
 * @swagger
 * /api/modules/{moduleId}/topics/{topicId}:
 *   put:
 *     summary: Update a topic
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/TopicInput'
 *     responses:
 *       200:
 *         description: Topic updated
 *       400:
 *         description: Invalid topic data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:moduleId/topics/:topicId', authenticate, isInstructor, moduleUpload, updateTopic);

/**
 * @swagger
 * /api/modules/{moduleId}/topics/{topicId}:
 *   delete:
 *     summary: Delete a topic
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Topic deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Topic not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:moduleId/topics/:topicId', authenticate, isInstructor, deleteTopic);

/**
 * @swagger
 * /api/modules/{moduleId}/quizzes:
 *   post:
 *     summary: Add a full quiz (with multiple questions) to a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
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
 *                 example: "JavaScript Basics Quiz"
 *               questions:
 *                 type: array
 *                 description: List of quiz questions
 *                 items:
 *                   $ref: '#/components/schemas/QuizQuestionInput'
 *     responses:
 *       201:
 *         description: Quiz added successfully
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
 *                   example: "Quiz added successfully"
 *                 quiz:
 *                   $ref: '#/components/schemas/Quiz'
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
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the module
 *     responses:
 *       200:
 *         description: List of quizzes in the module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quizzes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quiz'
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
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the module
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
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
 *                   $ref: '#/components/schemas/QuizQuestionInput'
 *     responses:
 *       200:
 *         description: Quiz updated successfully
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
 *                   example: "Quiz updated successfully"
 *                 quiz:
 *                   $ref: '#/components/schemas/Quiz'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.put('/:moduleId/quizzes/:quizId', authenticate, isInstructor, updateQuizInModule);

/**
 * @swagger
 * /api/modules/{moduleId}/quizzes/{quizId}:
 *   delete:
 *     summary: Delete a quiz from a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
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
 *                   example: "Quiz deleted successfully"
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
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "JavaScript Basics Summary"
 *               content:
 *                 type: string
 *                 example: "This module covers the basics of JavaScript..."
 *     responses:
 *       201:
 *         description: Summary added successfully
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
 *                   example: "Summary added successfully"
 *                 summary:
 *                   $ref: '#/components/schemas/Summary'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/:moduleId/summaries', authenticate, isInstructor, addSummaryToModule);

/**
 * @swagger
 * /api/modules/{moduleId}/summaries:
 *   get:
 *     summary: Get all summaries in a module
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the module
 *     responses:
 *       200:
 *         description: List of summaries in the module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summaries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Summary'
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
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: path
 *         name: summaryId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated JavaScript Basics Summary"
 *               content:
 *                 type: string
 *                 example: "Updated content covering JavaScript basics..."
 *     responses:
 *       200:
 *         description: Summary updated successfully
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
 *                   example: "Summary updated successfully"
 *                 summary:
 *                   $ref: '#/components/schemas/Summary'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Summary not found
 *       500:
 *         description: Internal server error
 */
router.put('/:moduleId/summaries/:summaryId', authenticate, isInstructor, updateSummaryInModule);

/**
 * @swagger
 * /api/modules/{moduleId}/summaries/{summaryId}:
 *   delete:
 *     summary: Delete a summary from a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: path
 *         name: summaryId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Summary deleted successfully
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
 *                   example: "Summary deleted successfully"
 *       404:
 *         description: Summary not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:moduleId/summaries/:summaryId', authenticate, isInstructor, deleteSummaryFromModule);

export default router;