// controllers/Course/courseController.js
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Course from '../../models/Course.js';
import User from '../../models/User.js';

import { cleanupFiles } from '../../middleware/upload.js';
import Module from '../../models/Module.js';
import Enrollment from '../../models/Enrollment.js';
import Quiz from '../../models/Quiz.js';
import Summary from '../../models/Summary.js';
import { parseArrayField, validateCourseOwnership } from '../../services/courseService.js';


/////////////////////Create Course Step 1/////////////////////
export const createCourseStep1 = async (req, res) => {
    try {
        // Field configuration
        const requiredFields = ['title', 'category', 'level'];
        const stringFields = ['title', 'category', 'language', 'shortDescription', 'description'];

        // Trim string fields
        stringFields.forEach(field => {
            if (req.body[field]) req.body[field] = req.body[field].trim();
        });

        // Validate required fields
        const missingFields = requiredFields.filter(field => !req.body[field]?.trim());
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                suggestion: 'Please provide all marked required fields'
            });
        }

        // Process array fields with validation
        const whatYouLearn = parseArrayField(req.body.whatYouLearn, 'whatYouLearn', {
            required: true,
            minLength: 1,
            maxLength: 20
        });

        const requirements = parseArrayField(req.body.requirements, 'requirements', {
            maxLength: 10
        });

        // Create course document
        const course = new Course({
            title: req.body.title,
            category: req.body.category,
            level: req.body.level,
            language: req.body.language || 'English',
            shortDescription: req.body.shortDescription || '',
            description: req.body.description || '',
            whatYouLearn,
            requirements,
            instructor: req.user.id,
            status: 'draft',
            stepsCompleted: [1],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await course.save();

        return res.status(201).json({
            success: true,
            courseId: course._id,
            nextStep: 2
        });

    } catch (error) {
        console.error('Course Creation Error:', error);

        const statusCode = error.message.includes('Invalid') ||
            error.name === 'ValidationError' ? 400 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
            ...(error.message.includes('array') && {
                suggestion: 'For array fields, use: ["item1","item2"] or "item1,item2"'
            })
        });
    }
};

/////////////////////Create Course Step 2/////////////////////
export const createCourseStep2 = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // Validate files
        if (!req.files?.thumbnail?.[0] || !req.files?.promoVideo?.[0]) {
            throw {
                status: 400,
                message: 'Both thumbnail and promo video are required'
            };
        }

        // Verify course ownership
        const course = await Course.findById(courseId);
        if (!course) throw { status: 404, message: 'Course not found' };
        if (course.instructor.toString() !== userId) {
            throw { status: 403, message: 'Unauthorized' };
        }

        // Generate URLs
        const thumbnail = `/media/course/thumbnails/${req.files.thumbnail[0].filename}`;
        const promoVideo = `/media/course/videos/${req.files.promoVideo[0].filename}`;

        // Update course
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { thumbnail, promoVideo, $addToSet: { stepsCompleted: 2 } },
            { new: true }
        );

        if (!updatedCourse) throw { status: 500, message: 'Update failed' };

        res.status(200).json({
            success: true,
            thumbnailUrl: thumbnail,
            promoVideoUrl: promoVideo,
            nextStep: 3
        });

    } catch (error) {
        await cleanupFiles(req.files);

        const status = error.status || 500;
        const message = error.message || 'Media upload failed';

        res.status(status).json({
            success: false,
            message,
            ...(error.suggestion && { suggestion: error.suggestion })
        });
    }
};

export const createCourseStep3 = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { courseId } = req.params;
        const { modules } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!courseId) {
            throw new Error('Course ID is required');
        }

        // Validate ownership
        const course = await Course.findById(courseId).session(session);
        if (!course) throw new Error('Course not found');
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to modify this course');
        }

        // Process modules if provided
        if (modules && Array.isArray(modules)) {
            // Delete existing modules and their related data
            const existingModules = await Module.find({ courseId }).session(session);
            const moduleIds = existingModules.map(m => m._id);

            // Delete related quizzes and summaries
            await Quiz.deleteMany({ moduleId: { $in: moduleIds } }).session(session);
            await Summary.deleteMany({ moduleId: { $in: moduleIds } }).session(session);
            await Module.deleteMany({ courseId }).session(session);

            // Process each module
            for (const moduleData of modules) {
                const { title, topics } = moduleData;

                // Create module
                const module = new Module({
                    title,
                    courseId,
                    topics: topics || [],
                    order: await Module.countDocuments({ courseId }).session(session) + 1
                });
                await module.save({ session });

                // Process quiz topics and create quizzes
                const quizTopics = topics?.filter(t => t.type === 'quiz') || [];
                for (const topic of quizTopics) {
                    const newQuiz = new Quiz({
                        title: `${title} - ${topic.title}`,
                        description: topic.description,
                        courseId,
                        moduleId: module._id,
                        topicId: topic._id || new mongoose.Types.ObjectId(),
                        questions: topic.content?.questions || [],
                        passingScore: topic.content?.passingScore || 70,
                        timeLimit: topic.content?.timeLimit || 30
                    });
                    await newQuiz.save({ session });

                    // Update topic with quiz ID
                    const topicIndex = module.topics.findIndex(t => t._id?.toString() === topic._id?.toString());
                    if (topicIndex !== -1) {
                        module.topics[topicIndex].content.quizId = newQuiz._id;
                    }
                }

                await module.save({ session });
            }
        }

        // Verify at least one module exists
        const moduleCount = await Module.countDocuments({ courseId }).session(session);
        if (moduleCount === 0) {
            throw new Error('Cannot publish course with no modules');
        }

        // Update course status
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                status: 'published',
                $set: {
                    'timestamps.publishedAt': new Date(),
                    'timestamps.updatedAt': new Date()
                }
            },
            { new: true, session }
        ).populate({
            path: 'modules',
            populate: {
                path: 'topics.content.quizId'
            }
        });

        await session.commitTransaction();
        session.endSession();

        return res.json({
            success: true,
            message: 'Course published successfully',
            course: updatedCourse
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error('Publish Course Error:', error);
        const statusCode = error.message.includes('Unauthorized') ? 403 :
            error.message.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Error publishing course',
            ...(error.errors && { errors: error.errors })
        });
    }
};

/////////////Getcourses /////////////////////
export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'fullName email')
            .populate({
                path: 'modules',
                populate: {
                    path: 'topics.content.quizId'
                }
            });
        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};


// Debug version - Add this temporarily to see what's happening
export const getCourseById = async (req, res) => {
    try {
        console.log('=== DEBUGGING COURSE ENROLLMENT ===');
        console.log('Course ID:', req.params.id);

        // Step 1: Get the raw course without population
        const rawCourse = await Course.findById(req.params.id).lean();
        console.log('Raw course studentsEnrolled:', rawCourse?.studentsEnrolled);

        // Step 2: Check if there are any enrollments for this course
        const enrollments = await Enrollment.find({ course: req.params.id })
            .populate('student', 'fullName email profilePicture')
            .lean();
        console.log('Direct enrollment query result:', enrollments);

        // Step 3: Get course with population
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'fullName email')
            .populate({
                path: 'studentsEnrolled',
                select: 'student enrolledAt status progress lastAccessed',
                populate: {
                    path: 'student',
                    select: 'fullName email profilePicture'
                }
            })
            .lean();

        console.log('Populated course studentsEnrolled:', course?.studentsEnrolled);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found, please make sure the courseID is correct'
            });
        }

        // Use the direct enrollment query result instead of the populated one
        const enrolledStudents = enrollments.map(enrollment => ({
            _id: enrollment.student._id,
            fullName: enrollment.student.fullName,
            email: enrollment.student.email,
            profilePicture: enrollment.student.profilePicture,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
            progress: enrollment.progress,
            lastAccessed: enrollment.lastAccessed
        }));

        console.log('Processed enrolled students:', enrolledStudents);

        // Get modules and other data (keeping your existing logic)
        const modules = await Module.find({ courseId: course._id })
            .select('title textContent videoUrl pdfUrl quizzes summaries')
            .lean();

        const summaryIds = modules.flatMap(m =>
            m.summaries?.map(s => s._id) || []
        ).filter(id => id);

        const summaries = await Summary.find({ _id: { $in: summaryIds } })
            .select('title content')
            .lean();

        const quizIds = modules.flatMap(m =>
            m.quizzes?.map(q => q._id) || []
        ).filter(id => id);

        const quizzes = await Quiz.find({ _id: { $in: quizIds } })
            .select('title questions')
            .populate({
                path: 'questions',
                select: 'question options answer'
            })
            .lean();

        const response = {
            ...course,
            enrollmentCount: enrolledStudents.length,
            enrolledStudents, // Using the direct query result
            modules: modules.map(module => ({
                _id: module._id,
                title: module.title,
                textContent: module.textContent,
                videoUrl: module.videoUrl,
                pdfUrl: module.pdfUrl,
                summaries: summaries.filter(s =>
                    module.summaries?.some(summaryId => summaryId.equals(s._id))
                ),
                quizzes: quizzes.filter(q =>
                    module.quizzes?.some(quizId => quizId.equals(q._id))
                ).map(quiz => ({
                    ...quiz,
                    questionCount: quiz.questions?.length || 0
                }))
            }))
        };

        console.log('Final response enrollmentCount:', response.enrollmentCount);
        console.log('=== END DEBUGGING ===');

        res.status(200).json({
            success: true,
            data: response
        });
    } catch (err) {
        console.error(`[CourseController] Error fetching course ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course details',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/////////////////////Update Course Step 1/////////////////////
export const updateCourseStep1 = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // Field configuration
        const requiredFields = ['title', 'category', 'level'];
        const stringFields = ['title', 'category', 'language', 'shortDescription', 'description'];

        // Trim string fields
        stringFields.forEach(field => {
            if (req.body[field]) req.body[field] = req.body[field].trim();
        });

        // Validate required fields
        const missingFields = requiredFields.filter(field => !req.body[field]?.trim());
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                suggestion: 'Please provide all marked required fields'
            });
        }

        // Verify course ownership
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        if (course.instructor.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this course'
            });
        }

        // Process array fields with validation
        const whatYouLearn = parseArrayField(req.body.whatYouLearn, 'whatYouLearn', {
            required: true,
            minLength: 1,
            maxLength: 20
        });

        const requirements = parseArrayField(req.body.requirements, 'requirements', {
            maxLength: 10
        });

        // Update course document
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                title: req.body.title,
                category: req.body.category,
                level: req.body.level,
                language: req.body.language || 'English',
                shortDescription: req.body.shortDescription || '',
                description: req.body.description || '',
                whatYouLearn,
                requirements,
                $addToSet: { stepsCompleted: 1 },
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Course details updated successfully',
            course: updatedCourse,
            nextStep: 2
        });

    } catch (error) {
        console.error('Course Update Error (Step 1):', error);

        const statusCode = error.message.includes('Invalid') ||
            error.name === 'ValidationError' ? 400 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
            ...(error.message.includes('array') && {
                suggestion: 'For array fields, use: ["item1","item2"] or "item1,item2"'
            })
        });
    }
};

/////////////////////Update Course Step 2/////////////////////
export const updateCourseStep2 = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // Verify course ownership
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        if (course.instructor.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this course'
            });
        }

        // Prepare update data
        const updateData = {
            $addToSet: { stepsCompleted: 2 },
            updatedAt: new Date()
        };

        // Handle thumbnail update if provided
        if (req.files?.thumbnail?.[0]) {
            const thumbnailFile = req.files.thumbnail[0];
            updateData.thumbnail = path.join('uploads', 'course', 'thumbnails', thumbnailFile.filename);

            // Delete old thumbnail if exists
            if (course.thumbnail) {
                try {
                    fs.unlinkSync(path.join(process.cwd(), 'public', course.thumbnail));
                } catch (err) {
                    console.error('Error deleting old thumbnail:', err);
                }
            }
        }

        // Handle promo video update if provided
        if (req.files?.promoVideo?.[0]) {
            const promoVideoFile = req.files.promoVideo[0];
            updateData.promoVideo = path.join('uploads', 'course', 'videos', promoVideoFile.filename);

            // Delete old promo video if exists
            if (course.promoVideo) {
                try {
                    fs.unlinkSync(path.join(process.cwd(), 'public', course.promoVideo));
                } catch (err) {
                    console.error('Error deleting old promo video:', err);
                }
            }
        }

        // Update course
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            updateData,
            { new: true, runValidators: true }
        );

        // Clean up files if update failed
        if (!updatedCourse) {
            ['thumbnail', 'promoVideo'].forEach(field => {
                const file = req.files?.[field]?.[0];
                if (file?.path) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (err) {
                        console.error('Error cleaning up', field, err);
                    }
                }
            });
            throw new Error('Course update failed');
        }

        // Prepare response
        const response = {
            success: true,
            message: 'Course media updated successfully',
            nextStep: 3
        };

        if (req.files?.thumbnail?.[0]) {
            response.thumbnailUrl = `/uploads/course/thumbnails/${req.files.thumbnail[0].filename}`;
        }
        if (req.files?.promoVideo?.[0]) {
            response.promoVideoUrl = `/uploads/course/videos/${req.files.promoVideo[0].filename}`;
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error('Step 2 Update Error:', error);

        // Clean up any uploaded files
        ['thumbnail', 'promoVideo'].forEach(field => {
            const file = req.files?.[field]?.[0];
            if (file?.path) {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error('Error cleaning up', field, err);
                }
            }
        });

        // Determine response based on error
        let status, response;
        if (error.message.includes('not found')) {
            status = 404;
            response = {
                success: false,
                message: 'Course not found',
                suggestion: 'Please check the course ID and try again'
            };
        } else if (error.message.includes('Unauthorized')) {
            status = 403;
            response = {
                success: false,
                message: 'Unauthorized to update this course'
            };
        } else {
            status = 500;
            response = {
                success: false,
                message: 'An unexpected error occurred during media update'
            };
        }

        return res.status(status).json(response);
    }
};

/////////////////////Update Course Step 3/////////////////////
export const updateCourseStep3 = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { courseId } = req.params;
        const { modules } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!courseId) {
            throw new Error('Course ID is required');
        }

        // Validate ownership
        const course = await Course.findById(courseId).session(session);
        if (!course) throw new Error('Course not found');
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to modify this course');
        }

        // Process modules if provided
        if (modules && Array.isArray(modules)) {
            // Delete existing modules and their related data
            const existingModules = await Module.find({ courseId }).session(session);
            const moduleIds = existingModules.map(m => m._id);

            // Delete related quizzes and summaries
            await Quiz.deleteMany({ moduleId: { $in: moduleIds } }).session(session);
            await Summary.deleteMany({ moduleId: { $in: moduleIds } }).session(session);
            await Module.deleteMany({ courseId }).session(session);

            // Process each module
            for (const moduleData of modules) {
                const { title, topics } = moduleData;

                // Create module
                const module = new Module({
                    title,
                    courseId,
                    topics: topics || [],
                    order: await Module.countDocuments({ courseId }).session(session) + 1
                });
                await module.save({ session });

                // Process quiz topics and create quizzes
                const quizTopics = topics?.filter(t => t.type === 'quiz') || [];
                for (const topic of quizTopics) {
                    const newQuiz = new Quiz({
                        title: `${title} - ${topic.title}`,
                        description: topic.description,
                        courseId,
                        moduleId: module._id,
                        topicId: topic._id || new mongoose.Types.ObjectId(),
                        questions: topic.content?.questions || [],
                        passingScore: topic.content?.passingScore || 70,
                        timeLimit: topic.content?.timeLimit || 30
                    });
                    await newQuiz.save({ session });

                    // Update topic with quiz ID
                    const topicIndex = module.topics.findIndex(t => t._id?.toString() === topic._id?.toString());
                    if (topicIndex !== -1) {
                        module.topics[topicIndex].content.quizId = newQuiz._id;
                    }
                }

                await module.save({ session });
            }
        }

        // Verify at least one module exists
        const moduleCount = await Module.countDocuments({ courseId }).session(session);
        if (moduleCount === 0) {
            throw new Error('Cannot update course with no modules');
        }

        // Update course status
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                status: 'published',
                $addToSet: { stepsCompleted: 3 },
                $set: {
                    'timestamps.updatedAt': new Date()
                }
            },
            { new: true, session }
        ).populate({
            path: 'modules',
            populate: {
                path: 'topics.content.quizId'
            }
        });

        await session.commitTransaction();
        session.endSession();

        return res.json({
            success: true,
            message: 'Course updated successfully',
            course: updatedCourse
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error('Update Course Error (Step 3):', error);
        const statusCode = error.message.includes('Unauthorized') ? 403 :
            error.message.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Error updating course',
            ...(error.errors && { errors: error.errors })
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized. Only the course creator can delete it.' });
        }

        await course.deleteOne();
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error('Delete Course Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

//////////////////////Get courses by a particular Instructor ID//////////////////////


export const getCoursesByInstructor = async (req, res) => {
    try {
        const { instructorId } = req.params;

        // Verify the user exists and is an instructor
        const instructor = await User.findOne({
            _id: instructorId,
            userType: 'instructor'  // Ensure userType is 'instructor'
        });

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found or user is not an instructor'
            });
        }

        // Get courses with selected fields and populated instructor data
        const courses = await Course.find({ instructor: instructorId })
            .populate({
                path: 'instructor',
                select: 'fullName email profilePicture',  // From User schema
                match: { userType: 'instructor' }        // Double-check userType
            })
            .populate({
                path: 'modules',
                select: 'title duration',
                populate: {
                    path: 'topics.content.quizId',
                    select: 'title'
                }
            })
            .select(
                'title category level thumbnail ' +
                'priceType rating studentsEnrolled createdAt'
            )
            .sort({ createdAt: -1 });

        // Filter out courses where instructor population failed (unlikely but safe)
        const validCourses = courses.filter(course => course.instructor);

        res.status(200).json({
            success: true,
            count: validCourses.length,
            instructor: {
                _id: instructor._id,
                name: instructor.fullName,
                email: instructor.email,
                profilePicture: instructor.profilePicture
            },
            courses: validCourses.map(course => ({
                _id: course._id,
                title: course.title,
                category: course.category,
                level: course.level,
                thumbnail: course.thumbnail,
                price: course.priceType === 'Free' ? 0 : course.price, // Example conditional field
                rating: course.rating,
                studentCount: course.studentsEnrolled.length,
                createdAt: course.createdAt
            }))
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

////////////////// get students and their courses enroll ///////////
export const getEnrolledCourses = async (req, res) => {
    try {
        const { studentId } = req.params;
        const requestingUserId = req.user._id;

        // 1. Verify authorization
        if (studentId !== requestingUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only view your own enrolled courses'
            });
        }

        // 2. Verify user is a student
        const user = await User.findById(studentId);
        if (!user || user.userType !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Access restricted to students only'
            });
        }

        // 3. Get enrollments (REMOVED status filter)
        const enrollments = await Enrollment.find({
            student: studentId,
            status: { $ne: 'cancelled' }
        })
            .populate({
                path: 'course',
                // Removed the problematic match filter
                select: 'title category thumbnail instructor rating studentsEnrolled',
                populate: {
                    path: 'instructor',
                    select: 'fullName profilePicture'
                }
            })
            .sort({ enrolledAt: -1 });

        // 4. Filter out null courses (if any)
        const validEnrollments = enrollments.filter(e => e.course);

        // 5. Format response
        const courses = validEnrollments.map(enrollment => ({
            _id: enrollment.course._id,
            title: enrollment.course.title,
            category: enrollment.course.category,
            thumbnail: enrollment.course.thumbnail,
            instructor: {
                name: enrollment.course.instructor.fullName,
                profilePicture: enrollment.course.instructor.profilePicture
            },
            rating: enrollment.course.rating,
            studentCount: enrollment.course.studentsEnrolled.length,
            enrollmentStatus: enrollment.status,
            progress: enrollment.progress,
            lastAccessed: enrollment.lastAccessed
        }));

        res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });

    } catch (err) {
        console.error('Error fetching enrolled courses:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch enrolled courses',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

////////////////////Get all the Quizes by the particular Instructor ////////////////////
export const getInstructorQuizzes = async (req, res) => {
    try {
        const { instructorId } = req.params;

        // 1. Verify the instructor exists
        const instructor = await User.findOne({
            _id: instructorId,
            userType: 'instructor'
        });
        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        // 2. Find all courses by this instructor
        const courses = await Course.find({ instructor: instructorId }).select('_id');
        const courseIds = courses.map(course => course._id);

        // 3. Find all quizzes for these courses
        const quizzes = await Quiz.find({ courseId: { $in: courseIds } })
            .populate({
                path: 'courseId',
                select: 'title'
            })
            .populate({
                path: 'moduleId',
                select: 'title'
            });

        res.status(200).json({
            success: true,
            count: quizzes.length,
            quizzes: quizzes.map(quiz => ({
                _id: quiz._id,
                title: quiz.title,
                description: quiz.description,
                questionCount: quiz.questions.length,
                passingScore: quiz.passingScore,
                timeLimit: quiz.timeLimit,
                course: {
                    _id: quiz.courseId._id,
                    title: quiz.courseId.title
                },
                module: {
                    _id: quiz.moduleId._id,
                    title: quiz.moduleId.title
                },
                createdAt: quiz.createdAt
            }))
        });

    } catch (err) {
        console.error('Error fetching instructor quizzes:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quizzes',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


////////////////////////////Get all the Modulles for a particular instructor //////////////

export const getInstructorModules = async (req, res) => {
    try {
        const { instructorId } = req.params;

        // 1. Verify the instructor exists
        const instructor = await User.findOne({
            _id: instructorId,
            userType: 'instructor'
        });
        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        // 2. Find all courses by this instructor
        const courses = await Course.find({ instructor: instructorId }).select('_id');
        const courseIds = courses.map(course => course._id);

        // 3. Find all modules for these courses
        const modules = await Module.find({ courseId: { $in: courseIds } })
            .populate({
                path: 'courseId',
                select: 'title'
            });

        res.status(200).json({
            success: true,
            count: modules.length,
            modules: modules.map(module => ({
                _id: module._id,
                title: module.title,
                topicCount: module.topics.length,
                course: {
                    _id: module.courseId._id,
                    title: module.courseId.title
                },
                order: module.order,
                createdAt: module.createdAt
            }))
        });

    } catch (err) {
        console.error('Error fetching instructor modules:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch modules',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

//////////////////////////// Get Modules for Enrolled Student //////////////
export const getEnrolledStudentModules = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;

        // 1. Verify authorization
        if (studentId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only view your own enrolled courses'
            });
        }

        // 2. Verify enrollment
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            status: { $ne: 'cancelled' }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course or enrollment is cancelled'
            });
        }

        // 3. Get course details
        const course = await Course.findById(courseId)
            .select('title instructor status')
            .populate('instructor', 'fullName profilePicture');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.status !== 'published') {
            return res.status(403).json({
                success: false,
                message: 'This course is not currently available'
            });
        }

        // 4. Get modules with topics (excluding sensitive data)
        const modules = await Module.find({ courseId })
            .select('title topics order')
            .sort('order')
            .lean();

        // Safely format modules with proper null checks
        const formattedModules = modules.map(module => {
            // Ensure topics exists and is an array
            const safeTopics = Array.isArray(module.topics) ? module.topics : [];

            return {
                _id: module._id,
                title: module.title,
                order: module.order,
                topicCount: safeTopics.length,
                topics: safeTopics.map(topic => ({
                    _id: topic._id || null,
                    title: topic.title || '',
                    type: topic.type || 'lesson', // default to 'lesson' if not specified
                    duration: topic.duration || 0
                }))
            };
        });

        res.status(200).json({
            success: true,
            course: {
                _id: courseId,
                title: course.title,
                instructor: {
                    _id: course.instructor?._id || null,
                    name: course.instructor?.fullName || '',
                    profilePicture: course.instructor?.profilePicture || ''
                }
            },
            modules: formattedModules,
            enrollmentProgress: enrollment.progress || 0
        });

    } catch (err) {
        console.error('Error fetching enrolled course modules:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course modules',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

//////////////////////////// Get Quizzes for Enrolled Student //////////////
export const getEnrolledStudentQuizzes = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;

        // 1. Verify authorization
        if (studentId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only view your own enrolled courses'
            });
        }

        // 2. Verify enrollment
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            status: { $ne: 'cancelled' }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course or enrollment is cancelled'
            });
        }

        // 3. Get course details
        const course = await Course.findById(courseId)
            .select('title instructor status')
            .populate('instructor', 'fullName profilePicture');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.status !== 'published') {
            return res.status(403).json({
                success: false,
                message: 'This course is not currently available'
            });
        }

        // 4. Get all modules to map quiz IDs
        const modules = await Module.find({ courseId })
            .select('title topics order')
            .lean();

        // 5. Extract all quiz topic IDs with proper null checks
        const quizTopicIds = modules.flatMap(module => {
            // Ensure topics exists and is an array
            const safeTopics = Array.isArray(module?.topics) ? module.topics : [];

            return safeTopics
                .filter(topic => topic?.type === 'quiz')
                .map(topic => topic?._id)
                .filter(id => id);
        });

        // 6. Get all quizzes for these topics
        const quizzes = await Quiz.find({
            courseId,
            topicId: { $in: quizTopicIds }
        })
            .select('title description passingScore timeLimit questions moduleId topicId')
            .lean();

        // 7. Format response with module and topic info
        const formattedQuizzes = quizzes.map(quiz => {
            const module = modules.find(m => m?._id?.equals(quiz?.moduleId));
            const topic = module?.topics?.find(t => t?._id?.equals(quiz?.topicId));

            return {
                _id: quiz?._id || null,
                title: quiz?.title || 'Untitled Quiz',
                description: quiz?.description || '',
                passingScore: quiz?.passingScore || 70,
                timeLimit: quiz?.timeLimit || 30,
                questionCount: Array.isArray(quiz?.questions) ? quiz.questions.length : 0,
                module: {
                    _id: module?._id || null,
                    title: module?.title || 'Unknown Module',
                    order: module?.order || 0
                },
                topic: {
                    _id: topic?._id || null,
                    title: topic?.title || 'Unknown Topic'
                },
                isCompleted: Array.isArray(enrollment?.completedQuizzes)
                    ? enrollment.completedQuizzes.includes(quiz?._id)
                    : false
            };
        });

        res.status(200).json({
            success: true,
            course: {
                _id: courseId,
                title: course.title,
                instructor: {
                    _id: course.instructor?._id || null,
                    name: course.instructor?.fullName || '',
                    profilePicture: course.instructor?.profilePicture || ''
                }
            },
            quizzes: formattedQuizzes,
            totalQuizzes: formattedQuizzes.length,
            completedQuizzes: Array.isArray(enrollment?.completedQuizzes)
                ? enrollment.completedQuizzes.length
                : 0
        });

    } catch (err) {
        console.error('Error fetching enrolled course quizzes:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course quizzes',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};