// controllers/Course/courseController.js
import Course from '../../models/Course.js';
import Module from '../../models/Module.js';
import Quiz from '../../models/Quiz.js';
import Summary from '../../models/Summary.js';

export const createCourse = async (req, res) => {
    const { title, description, category } = req.body;

    try {
        const videoUrl = req.files?.video?.[0]?.filename ? `/uploads/videos/${req.files.video[0].filename}` : undefined;
        const documentPath = req.files?.document?.[0]?.filename ? `/uploads/docs/${req.files.document[0].filename}` : undefined;

        const course = new Course({
            title,
            description,
            category,
            instructor: req.user.id,
            videoUrl,
            documentPath
        });

        await course.save();
        res.status(201).json(course);
    } catch (err) {
        console.error('Create Course Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor', 'fullName email');
        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};


/**
 * @description Get complete course details with modules, quizzes, summaries, and enrolled students
 */
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'fullName email')
            .populate({
                path: 'studentsEnrolled',
                select: 'user enrolledAt status',
                populate: {
                    path: 'user',
                    select: 'fullName email profilePicture'
                }
            })
            .lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found, please make sure the courseID is correct'
            });
        }

        // Safely get module IDs (handle undefined cases)
        const moduleIds = course.modules?.map(m => m._id) || [];

        // Get all modules for this course
        const modules = await Module.find({ courseId: course._id })
            .select('title textContent videoUrl pdfUrl quizzes summaries')
            .lean();

        // Get all summaries referenced in modules
        const summaryIds = modules.flatMap(m =>
            m.summaries?.map(s => s._id) || []
        ).filter(id => id); // Remove any undefined/null

        const summaries = await Summary.find({ _id: { $in: summaryIds } })
            .select('title content')
            .lean();

        // Get all quizzes referenced in modules
        const quizIds = modules.flatMap(m =>
            m.quizzes?.map(q => q._id) || []
        ).filter(id => id); // Remove any undefined/null

        const quizzes = await Quiz.find({ _id: { $in: quizIds } })
            .select('title questions')
            .populate({
                path: 'questions',
                select: 'question options answer'
            })
            .lean();

        // Process enrolled students data
        const enrolledStudents = course.studentsEnrolled?.map(enrollment => ({
            _id: enrollment.user._id,
            fullName: enrollment.user.fullName,
            email: enrollment.user.email,
            profilePicture: enrollment.user.profilePicture,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status
        })) || [];

        // Build the response structure
        const response = {
            ...course,
            enrollmentCount: enrolledStudents.length,
            enrolledStudents, // Include full student details
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

export const updateCourse = async (req, res) => {
    const { title, description, category } = req.body;

    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized. Only the course creator can update it.' });
        }

        course.title = title || course.title;
        course.description = description || course.description;
        course.category = category || course.category;

        if (req.files?.video?.[0]) {
            course.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
        }

        if (req.files?.document?.[0]) {
            course.documentPath = `/uploads/docs/${req.files.document[0].filename}`;
        }

        await course.save();
        res.status(200).json(course);
    } catch (err) {
        console.error('Update Course Error:', err);
        res.status(500).json({ message: 'Server error' });
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
