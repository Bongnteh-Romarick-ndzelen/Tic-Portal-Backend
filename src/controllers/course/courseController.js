// controllers/Course/courseController.js
import Course from '../../models/Course.js';
import Module from '../../models/Module.js';
import Enrollment from '../../models/Enrollment.js';
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
