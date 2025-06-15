// controllers/Course/courseController.js
import Course from '../../models/Course.js';

export const createCourse = async (req, res) => {
    const { title, description, category } = req.body;

    try {
        const videoUrl = req.files?.video?.[0]?.filename ? `/uploads/videos/${ req.files.video[0].filename }` : undefined;
        const documentPath = req.files?.document?.[0]?.filename ? `/uploads/docs/${ req.files.document[0].filename }` : undefined;

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

export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'fullName email');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.status(200).json(course);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
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
            course.videoUrl = `/uploads/videos/${ req.files.video[0].filename }`;
        }

        if (req.files?.document?.[0]) {
            course.documentPath = `/uploads/docs/${ req.files.document[0].filename }`;
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
