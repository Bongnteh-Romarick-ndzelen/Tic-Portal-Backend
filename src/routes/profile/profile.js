import express from 'express';
import {
    getProfile,
    updateProfile,
    uploadProfileImage,
    createProfile
} from '../../controllers/profile/profileController.js';
import { authenticate } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../middleware/multer.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management endpoints
 */

/**
 * @swagger
 * /api/profile:
 *   post:
 *     summary: Create a new user profile
 *     description: Create profile for authenticated user (one profile per user)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                     format: uri
 *                     example: "https://res.cloudinary.com/demo/image/upload/profile.jpg"
 *                   publicId:
 *                     type: string
 *                     example: "profile_images/abc123"
 *               headline:
 *                 type: string
 *                 maxLength: 120
 *                 example: "Senior Software Engineer"
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Full-stack developer with 5 years experience"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum: ["Male", "Female", "Other", "Prefer not to say"]
 *                 example: "Male"
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: "https://portfolio.example.com"
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   linkedin:
 *                     type: string
 *                     format: uri
 *                     example: "https://linkedin.com/in/username"
 *                   twitter:
 *                     type: string
 *                     format: uri
 *                     example: "https://twitter.com/username"
 *                   github:
 *                     type: string
 *                     format: uri
 *                     example: "https://github.com/username"
 *                   facebook:
 *                     type: string
 *                     format: uri
 *                     example: "https://facebook.com/username"
 *                   youtube:
 *                     type: string
 *                     format: uri
 *                     example: "https://youtube.com/username"
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     institution:
 *                       type: string
 *                       example: "Massachusetts Institute of Technology"
 *                     degree:
 *                       type: string
 *                       example: "Master of Science"
 *                     fieldOfStudy:
 *                       type: string
 *                       example: "Computer Science"
 *                     startYear:
 *                       type: integer
 *                       example: 2015
 *                     endYear:
 *                       type: integer
 *                       example: 2017
 *                     currentlyAttending:
 *                       type: boolean
 *                       example: false
 *                     description:
 *                       type: string
 *                       example: "Specialized in Cybersecurity"
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Senior Security Engineer"
 *                     company:
 *                       type: string
 *                       example: "TechSecure Inc."
 *                     location:
 *                       type: string
 *                       example: "San Francisco, CA"
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       example: "2020-06-01"
 *                     endDate:
 *                       type: string
 *                       format: date
 *                       example: "2023-05-31"
 *                     currentlyWorking:
 *                       type: boolean
 *                       example: false
 *                     description:
 *                       type: string
 *                       example: "Lead security team implementing zero-trust architecture"
 *                     skillsUsed:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "Cybersecurity"
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "JavaScript"
 *                     level:
 *                       type: string
 *                       enum: ["Beginner", "Intermediate", "Advanced", "Expert"]
 *                       example: "Expert"
 *                     verified:
 *                       type: boolean
 *                       example: true
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "AWS Certified Developer"
 *                     issuingOrganization:
 *                       type: string
 *                       example: "Amazon Web Services"
 *                     issueDate:
 *                       type: string
 *                       format: date
 *                       example: "2022-05-20"
 *                     expirationDate:
 *                       type: string
 *                       format: date
 *                       example: "2025-05-20"
 *                     credentialId:
 *                       type: string
 *                       example: "AWS123456"
 *                     credentialUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://aws.amazon.com/certification"
 *               notificationPreferences:
 *                 type: object
 *                 properties:
 *                   emailNotifications:
 *                     type: boolean
 *                     example: true
 *                   pushNotifications:
 *                     type: boolean
 *                     example: false
 *                   courseUpdates:
 *                     type: boolean
 *                     example: true
 *                   promotionalOffers:
 *                     type: boolean
 *                     example: false
 *             example:
 *               headline: "Senior Software Engineer"
 *               bio: "Full-stack developer with 5 years experience"
 *               dateOfBirth: "1990-01-01"
 *               gender: "Male"
 *               website: "https://portfolio.example.com"
 *               socialLinks:
 *                 linkedin: "https://linkedin.com/in/username"
 *                 github: "https://github.com/username"
 *               education:
 *                 - institution: "University of Technology"
 *                   degree: "Bachelor of Science"
 *                   fieldOfStudy: "Computer Science"
 *                   startYear: 2015
 *                   endYear: 2019
 *               skills:
 *                 - name: "JavaScript"
 *                   level: "Expert"
 *                   verified: true
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       400:
 *         description: Bad request (profile already exists or invalid data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', createProfile);

/**
 * @swagger
 * /api/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve complete profile information including courses and internships
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         example: 65d8f8f9e8f9f9e9f8f9f8f9
 *     responses:
 *       200:
 *         description: Successful profile retrieval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:userId', getProfile);

/**
 * @swagger
 * /api/profile/{userId}:
 *   patch:
 *     summary: Update profile information
 *     description: Update profile details (bio, social links, etc.)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         example: 65d8f8f9e8f9f9e9f8f9f8f9
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:userId', updateProfile);

/**
 * @swagger
 * /api/profile/{userId}/image:
 *   patch:
 *     summary: Upload profile image
 *     description: Upload or update user profile picture (JPEG/PNG, max 5MB)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         example: 65d8f8f9e8f9f9e9f8f9f8f9
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG/PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileImageResponse'
 *       400:
 *         description: Invalid file type or no file provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File too large (>5MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error during upload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:userId/image', uploadMiddleware, uploadProfileImage);

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProfileInput:
 *       type: object
 *       properties:
 *         profileImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *             publicId:
 *               type: string
 *         headline:
 *           type: string
 *           maxLength: 120
 *         bio:
 *           type: string
 *           maxLength: 500
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: ['Male', 'Female', 'Other', 'Prefer not to say']
 *         website:
 *           type: string
 *           format: uri
 *         socialLinks:
 *           $ref: '#/components/schemas/SocialLinks'
 *         education:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Education'
 *         experience:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Experience'
 *         skills:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Skill'
 *         certifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Certification'
 *         notificationPreferences:
 *           $ref: '#/components/schemas/NotificationPreferences'
 * 
 *     UpdateProfileInput:
 *       type: object
 *       properties:
 *         profileImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *             publicId:
 *               type: string
 *         headline:
 *           type: string
 *           maxLength: 120
 *         bio:
 *           type: string
 *           maxLength: 500
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: ['Male', 'Female', 'Other', 'Prefer not to say']
 *         website:
 *           type: string
 *           format: uri
 *         socialLinks:
 *           $ref: '#/components/schemas/SocialLinks'
 *         education:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Education'
 *         experience:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Experience'
 *         skills:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Skill'
 *         certifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Certification'
 *         notificationPreferences:
 *           $ref: '#/components/schemas/NotificationPreferences'
 * 
 *     ProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Profile'
 * 
 *     ProfileImageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             imageUrl:
 *               type: string
 *               format: uri
 * 
 *     Profile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         profileImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             publicId:
 *               type: string
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *         headline:
 *           type: string
 *         bio:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *         website:
 *           type: string
 *         socialLinks:
 *           $ref: '#/components/schemas/SocialLinks'
 *         education:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Education'
 *         experience:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Experience'
 *         skills:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Skill'
 *         certifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Certification'
 *         coursesEnrolled:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseEnrollment'
 *         coursesCompleted:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CompletedCourse'
 *         internshipsApplied:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InternshipApplication'
 *         notificationPreferences:
 *           $ref: '#/components/schemas/NotificationPreferences'
 *         profileViews:
 *           type: integer
 *         lastProfileUpdate:
 *           type: string
 *           format: date-time
 *         profileCompletion:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     SocialLinks:
 *       type: object
 *       properties:
 *         linkedin:
 *           type: string
 *           format: uri
 *         twitter:
 *           type: string
 *           format: uri
 *         github:
 *           type: string
 *           format: uri
 *         facebook:
 *           type: string
 *           format: uri
 *         youtube:
 *           type: string
 *           format: uri
 * 
 *     Education:
 *       type: object
 *       properties:
 *         institution:
 *           type: string
 *         degree:
 *           type: string
 *         fieldOfStudy:
 *           type: string
 *         startYear:
 *           type: integer
 *         endYear:
 *           type: integer
 *         currentlyAttending:
 *           type: boolean
 *         description:
 *           type: string
 * 
 *     Experience:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         company:
 *           type: string
 *         location:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         currentlyWorking:
 *           type: boolean
 *         description:
 *           type: string
 *         skillsUsed:
 *           type: array
 *           items:
 *             type: string
 * 
 *     Skill:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         level:
 *           type: string
 *           enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
 *         verified:
 *           type: boolean
 * 
 *     Certification:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         issuingOrganization:
 *           type: string
 *         issueDate:
 *           type: string
 *           format: date
 *         expirationDate:
 *           type: string
 *           format: date
 *         credentialId:
 *           type: string
 *         credentialUrl:
 *           type: string
 *           format: uri
 * 
 *     CourseEnrollment:
 *       type: object
 *       properties:
 *         course:
 *           type: string
 *         enrollmentDate:
 *           type: string
 *           format: date-time
 *         completionStatus:
 *           type: string
 *           enum: ['Not Started', 'In Progress', 'Completed', 'Dropped']
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         lastAccessed:
 *           type: string
 *           format: date-time
 *         favorite:
 *           type: boolean
 * 
 *     CompletedCourse:
 *       type: object
 *       properties:
 *         course:
 *           type: string
 *         completionDate:
 *           type: string
 *           format: date-time
 *         certificate:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             issuedDate:
 *               type: string
 *               format: date-time
 *         grade:
 *           type: number
 * 
 *     InternshipApplication:
 *       type: object
 *       properties:
 *         internship:
 *           type: string
 *         applicationDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: ['Applied', 'Under Review', 'Interview', 'Accepted', 'Rejected']
 * 
 *     NotificationPreferences:
 *       type: object
 *       properties:
 *         emailNotifications:
 *           type: boolean
 *         pushNotifications:
 *           type: boolean
 *         courseUpdates:
 *           type: boolean
 *         promotionalOffers:
 *           type: boolean
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
export default router;