import express from 'express';
import { authenticate, isInstructor } from '../../middleware/auth.js';
import {
    courseMediaUpload,
    noneUpload,
    cleanupFiles,
    handleUploadErrors
} from '../../middleware/upload.js';
import {
    createCourseStep1, createCourseStep2, createCourseStep3, getCourses, getCourseById, updateCourseStep1,
    updateCourseStep2, getInstructorModules, getEnrolledStudentModules,
    getEnrolledStudentQuizzes,

    updateCourseStep3, deleteCourse, getCoursesByInstructor, getEnrolledCourses, getInstructorQuizzes
} from '../../controllers/course/courseController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course creation endpoints (multi-step)
 */


// ------------------------------------------------------------------
// STEP 1: Basic Information
// ------------------------------------------------------------------
/**
 * @swagger
 * /api/courses/step1:
 *   post:
 *     summary: Create course basics (Step 1)
 *     description: |
 *       Creates the initial course structure with basic information.
 *       Required fields: title, category, level.
 *       Arrays can be sent as JSON strings or comma-separated values.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - level
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *                 example: "Advanced React 2024"
 *               category:
 *                 type: string
 *                 example: "Web Development"
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *                 example: "Advanced"
 *               language:
 *                 type: string
 *                 default: "English"
 *                 example: "English"
 *               shortDescription:
 *                 type: string
 *                 maxLength: 160
 *                 example: "Master modern React hooks and context API"
 *               description:
 *                 type: string
 *                 example: "Detailed 10-week course covering advanced React patterns..."
 *               whatYouLearn:
 *                 oneOf:
 *                   - type: string
 *                     description: Comma-separated string or JSON string
 *                     example: "Hooks,Context API,State Management"
 *                   - type: array
 *                     items:
 *                       type: string
 *                     example: ["Hooks", "Context API"]
 *               requirements:
 *                 oneOf:
 *                   - type: string
 *                     example: "JavaScript basics,ES6+ syntax"
 *                   - type: array
 *                     items:
 *                       type: string
 *                     example: ["JavaScript basics"]
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 courseId:
 *                   type: string
 *                   format: objectid
 *                   example: "65a1b2c3d4e5f6g7h8i9j0k"
 *                 nextStep:
 *                   type: integer
 *                   description: The next step to complete
 *                   example: 2
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
 *                   example: "Missing required fields: title"
 *                 suggestion:
 *                   type: string
 *                   example: "Array fields should be formatted as [\"item1\",\"item2\"]"
 *       500:
 *         description: Server error
 */
router.post('/step1',
    authenticate,
    isInstructor,
    noneUpload,
    createCourseStep1
);

////////step 2 media upload //////


/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management
 */

/**
 * @swagger
 * /api/courses/step2/{courseId}:
 *   post:
 *     summary: Upload course media (Step 2)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Course thumbnail image (JPEG/PNG)
 *               promoVideo:
 *                 type: string
 *                 format: binary
 *                 description: Promotional video (MP4/WEBM)
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 thumbnailUrl:
 *                   type: string
 *                 promoVideoUrl:
 *                   type: string
 *                 nextStep:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */
router.post('/step2/:courseId',
    authenticate,
    isInstructor,
    (req, res, next) => { req.files = {}; next(); }, // Initialize files object
    courseMediaUpload,
    handleUploadErrors,
    createCourseStep2
);

// ------------------------------------------------------------------
// STEP 3: Curriculum (Updated for Topic-Based Structure)
// ------------------------------------------------------------------
/**
 * @swagger
 * /api/courses/step3/{courseId}:
 *   post:
 *     summary: Finalize course curriculum and publish
 *     description: |
 *       Step 3 - Handles both course publishing and optional bulk module/topic management.
 *       Can be used to:
 *       - Just publish existing course (without modules in request)
 *       - Replace all modules and topics and publish (with modules array)
 *       - Automatically creates quizzes for quiz topics
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modules:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ModuleInput'
 *                 description: Array of modules (optional). If provided, will replace all existing modules and topics.
 *             example:
 *               modules:
 *                 - title: "JavaScript Fundamentals"
 *                   order: 1
 *                   topics:
 *                     - title: "Variables"
 *                       order: 1
 *                       type: "text"
 *                       description: "Learn about variables"
 *                       content:
 *                         textContent: "Variables are containers..."
 *                     - title: "Data Types Quiz"
 *                       order: 2
 *                       type: "quiz"
 *                       description: "Test your knowledge"
 *                       content:
 *                         questions:
 *                           - question: "What is 2+2?"
 *                             options:
 *                               A: "3"
 *                               B: "4"
 *                               C: "5"
 *                             answer: "B"
 *                         passingScore: 80
 *     responses:
 *       200:
 *         description: Course published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authorization error
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     ModuleInput:
 *       type: object
 *       required:
 *         - title
 *         - order
 *       properties:
 *         title:
 *           type: string
 *           example: "Advanced JavaScript"
 *         order:
 *           type: number
 *           description: "Sequence order of the module within the course"
 *           example: 1
 *         topics:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TopicInput'
 *     
 *     TopicInput:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - description
 *         - order
 *       properties:
 *         title:
 *           type: string
 *           example: "ES6 Features"
 *         order:
 *           type: number
 *           description: "Sequence order of the topic within the module"
 *           example: 1
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
 *         points:
 *           type: number
 *           default: 1
 *           example: 1
 *     
 *     CourseResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Course published successfully"
 *         course:
 *           $ref: '#/components/schemas/Course'
 *     
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         title:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, published]
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Module'
 *         timestamps:
 *           type: object
 *           properties:
 *             publishedAt:
 *               type: string
 *               format: date-time
 *     
 *     Module:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         title:
 *           type: string
 *         order:
 *           type: number
 *         topics:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Topic'
 *
 *     Topic:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         title:
 *           type: string
 *         order:
 *           type: number
 *         type:
 *           type: string
 *           enum: [video, pdf, text, quiz]
 *         content:
 *           type: object
 *           properties:
 *             quizId:
 *               type: string
 *               format: objectId
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Cannot publish course with no modules"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Topic 'Variables' requires textContent", "Module order is required", "Topic order is required"]
 */
router.post('/step3/:courseId', authenticate, isInstructor, express.json(), createCourseStep3
);



/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       500:
 *         description: Server error
 */
router.get('/', getCourses);
/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get complete course details with modules, quizzes, summaries, and enrolled students
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Course ID
 *     responses:
 *       200:
 *         description: Successfully retrieved course with all nested content and enrolled students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FullCourseWithEnrollments'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FullCourseWithEnrollments:
 *       type: object
 *       allOf:
 *         - $ref: '#/components/schemas/Course'
 *         - type: object
 *           properties:
 *             enrollmentCount:
 *               type: number
 *               description: Total number of enrolled students
 *             enrolledStudents:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EnrolledStudent'
 *             modules:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ModuleWithContent'
 * 
 *     EnrolledStudent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         profilePicture:
 *           type: string
 *           description: URL to user's profile picture
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *           description: When the user enrolled in the course
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           description: Enrollment status
 * 
 *     ModuleWithContent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         textContent:
 *           type: string
 *         videoUrl:
 *           type: string
 *         pdfUrl:
 *           type: string
 *         summaries:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Summary'
 *         quizzes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuizWithQuestions'
 * 
 *     Summary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 * 
 *     QuizWithQuestions:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         questionCount:
 *           type: number
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuizQuestion'
 * 
 *     QuizQuestion:
 *       type: object
 *       properties:
 *         question:
 *           type: string
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         answer:
 *           type: string
 */
router.get('/:id', getCourseById);


/**
 * @swagger
 * /api/courses/{courseId}/update-step-1:
 *   put:
 *     summary: Update course basic information (Step 1)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - level
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced JavaScript Concepts"
 *               category:
 *                 type: string
 *                 example: "Programming"
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: "intermediate"
 *               language:
 *                 type: string
 *                 example: "English"
 *               shortDescription:
 *                 type: string
 *                 example: "Learn advanced JS patterns"
 *               description:
 *                 type: string
 *                 example: "Detailed course about advanced JavaScript concepts"
 *               whatYouLearn:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Closures", "Prototypes", "Async Patterns"]
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Basic JavaScript knowledge", "Node.js installed"]
 *     responses:
 *       200:
 *         description: Course basic information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *                 nextStep:
 *                   type: number
 *                   description: The next step to complete (2)
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized - User is not the course instructor
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.put('/:courseId/update-step-1', authenticate, isInstructor, updateCourseStep1);

/**
 * @swagger
 * /api/courses/{courseId}/update-step-2:
 *   put:
 *     summary: Update course media (Step 2)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Course thumbnail image (JPEG/PNG)
 *               promoVideo:
 *                 type: string
 *                 format: binary
 *                 description: Promotional video (MP4/WEBM)
 *     responses:
 *       200:
 *         description: Course media updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 thumbnailUrl:
 *                   type: string
 *                   description: URL of the new thumbnail (if updated)
 *                 promoVideoUrl:
 *                   type: string
 *                   description: URL of the new promo video (if updated)
 *                 nextStep:
 *                   type: number
 *                   description: The next step to complete (3)
 *       400:
 *         description: Invalid file format or missing files
 *       403:
 *         description: Unauthorized - User is not the course instructor
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.put('/:courseId/update-step-2', authenticate, isInstructor, courseMediaUpload, updateCourseStep2);

/**
 * @swagger
 * /api/courses/{courseId}/update-step-3:
 *   put:
 *     summary: Update course modules and content (Step 3)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Module 1: Advanced Concepts"
 *                     topics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Closures"
 *                           type:
 *                             type: string
 *                             enum: [lecture, quiz, assignment]
 *                             example: "lecture"
 *                           content:
 *                             type: object
 *                             properties:
 *                               videoUrl:
 *                                 type: string
 *                               textContent:
 *                                 type: string
 *                               questions:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *     responses:
 *       200:
 *         description: Course modules updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid module data
 *       403:
 *         description: Unauthorized - User is not the course instructor
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.put('/:courseId/update-step-3', authenticate, isInstructor, updateCourseStep3);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, isInstructor, deleteCourse);

/**
 * @swagger
 * /api/courses/instructors/{instructorId}:
 *   get:
 *     summary: Get courses by a specific instructor (userType must be 'instructor')
 *     tags: [Instructor]
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         schema:
 *           type: string
 *         required: true
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved instructor's courses
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
 *                   example: 3
 *                 instructor:
 *                   $ref: '#/components/schemas/User'
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       404:
 *         description: Instructor not found or user is not an instructor
 *       500:
 *         description: Server error
 */
router.get('/instructors/:instructorId', authenticate, isInstructor, getCoursesByInstructor);

/**
 * @swagger
 * /api/courses/enrolled/{studentId}:
 *   get:
 *     tags:
 *       - Student
 *     summary: Get enrolled courses for authenticated student
 *     description: |
 *       Returns a list of courses the authenticated student is enrolled in.
 *       - Requires valid JWT token
 *       - Student can only view their own enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         description: ID of the student (must match authenticated user)
 *     responses:
 *       '200':
 *         description: Successfully retrieved enrolled courses
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
 *                   example: 3
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnrolledCourse'
 *       '400':
 *         description: Invalid student ID format
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Forbidden access
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
 *                   example: "You can only view your own enrolled courses"
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 *
 * components:
 *   schemas:
 *     EnrolledCourse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a1b2c3d4e5f6g7h8i9j0k"
 *         title:
 *           type: string
 *           example: "Advanced JavaScript"
 *         category:
 *           type: string
 *           example: "Programming"
 *         thumbnail:
 *           type: string
 *           example: "/uploads/courses/js-advanced.jpg"
 *         instructor:
 *           $ref: '#/components/schemas/InstructorInfo'
 *         rating:
 *           type: number
 *           format: float
 *           example: 4.7
 *         studentCount:
 *           type: integer
 *           example: 342
 *         enrollmentStatus:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           example: "active"
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 65
 *         lastAccessed:
 *           type: string
 *           format: date-time
 *           example: "2023-06-20T08:15:00Z"
 *
 *     InstructorInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Sarah Johnson"
 *         profilePicture:
 *           type: string
 *           example: "/uploads/profiles/sarah.jpg"
 *
 *   responses:
 *     Unauthorized:
 *       description: Missing or invalid authentication token
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Authentication required"
 *
 *     ServerError:
 *       description: Server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Failed to fetch enrolled courses"
 *               error:
 *                 type: string
 *                 example: "Database connection error"
 */

router.get('/enrolled/:studentId', authenticate, getEnrolledCourses);

/**
 * @swagger
 * /api/courses/instructors/{instructorId}/quizzes:
 *   get:
 *     tags: [Instructor]
 *     summary: Get all quizzes created by an instructor
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 quizzes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuizWithCourse'
 */
router.get('/instructors/:instructorId/quizzes', authenticate, isInstructor, getInstructorQuizzes);
/**
 * @swagger
 * /api/courses/instructors/{instructorId}/modules:
 *   get:
 *     tags: [Instructor]
 *     summary: Get all modules created by an instructor
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of modules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 modules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModuleWithCourse'
 */
router.get('/instructors/:instructorId/modules', authenticate, getInstructorModules);
/**
 * @swagger
 * /api/courses/{studentId}/enrolled/{courseId}/modules:
 *   get:
 *     summary: Get modules for a course the student is enrolled in
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the student
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: List of course modules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 course:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     instructor:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       order:
 *                         type: number
 *                       topicCount:
 *                         type: number
 *                       topics:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             type:
 *                               type: string
 *                             duration:
 *                               type: number
 *                 enrollmentProgress:
 *                   type: number
 *       403:
 *         description: Unauthorized or not enrolled
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */

router.get('/:studentId/enrolled/:courseId/modules', authenticate, getEnrolledStudentModules);

/**
 * @swagger
 * /api/courses/{studentId}/enrolled/{courseId}/quizzes:
 *   get:
 *     summary: Get quizzes for a course the student is enrolled in
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the student
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: List of course quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 course:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     instructor:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *                 quizzes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       passingScore:
 *                         type: number
 *                       timeLimit:
 *                         type: number
 *                       questionCount:
 *                         type: number
 *                       module:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           order:
 *                             type: number
 *                       topic:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                       isCompleted:
 *                         type: boolean
 *                 totalQuizzes:
 *                   type: number
 *                 completedQuizzes:
 *                   type: number
 *       403:
 *         description: Unauthorized or not enrolled
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get('/:studentId/enrolled/:courseId/quizzes', authenticate, getEnrolledStudentQuizzes);

export default router;

