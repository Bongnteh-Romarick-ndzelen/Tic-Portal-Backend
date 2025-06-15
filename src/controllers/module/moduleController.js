import Module from '../../models/Module.js';
import Course from '../../models/Course.js';
import Summary from '../../models/Summary.js';
import Quiz from '../../models/Quiz.js';

export const createModule = async (req, res) => {
    try {
        const {
            title,
            textContent,
            courseId,
        } = req.body;

        let { summaries, quizzes } = req.body;

        // Safely parse JSON if sent as string (e.g. from Swagger)
        try {
            if (typeof summaries === 'string') summaries = JSON.parse(summaries);
            if (typeof quizzes === 'string') quizzes = JSON.parse(quizzes);
        } catch (parseError) {
            return res.status(400).json({ message: 'Invalid JSON format in summaries or quizzes' });
        }

        const userId = req.user.id;

        if (!courseId || !title) {
            return res.status(400).json({ message: 'courseId and title are required' });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to add modules to this course' });
        }

        const module = new Module({ title, textContent, courseId });
        await module.save();

        if (summaries && Array.isArray(summaries)) {
            const summaryDocs = await Summary.insertMany(
                summaries.map((s, i) =>
                    typeof s === 'string'
                        ? { title: `Summary ${ i + 1 }`, content: s, moduleId: module._id }
                        : { ...s, moduleId: module._id }
                )
            );
            module.summaries = summaryDocs.map(s => s._id);
        }

        if (quizzes && Array.isArray(quizzes)) {
            const quizDocs = await Quiz.insertMany(
                quizzes.map(q => ({ ...q, moduleId: module._id }))
            );
            module.quizzes = quizDocs.map(q => q._id);
        }

        await module.save();

        res.status(201).json({ message: 'Module created successfully', module });

    } catch (err) {
        res.status(500).json({ message: 'Failed to create module', error: err.message });
    }
};

export const getModulesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const modules = await Module.find({ courseId });
        res.status(200).json(modules);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch modules', error: err.message });
    }
};

export const getModuleById = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id)
            .populate('summaries')
            .populate('quizzes');

        if (!module) return res.status(404).json({ message: 'Module not found' });

        res.status(200).json(module);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving module', error: err.message });
    }
};

export const updateModule = async (req, res) => {
    try {
        const { title, textContent } = req.body;
        let { summaries, quizzes } = req.body;
        const moduleId = req.params.id;

        try {
            if (typeof summaries === 'string') summaries = JSON.parse(summaries);
            if (typeof quizzes === 'string') quizzes = JSON.parse(quizzes);
        } catch (parseError) {
            return res.status(400).json({ message: 'Invalid JSON format in summaries or quizzes' });
        }

        const module = await Module.findById(moduleId);
        if (!module) return res.status(404).json({ message: 'Module not found' });

        if (title) module.title = title;
        if (textContent) module.textContent = textContent;

        if (summaries && Array.isArray(summaries)) {
            await Summary.deleteMany({ moduleId });
            const summaryDocs = await Summary.insertMany(
                summaries.map((s, i) =>
                    typeof s === 'string'
                        ? { title: `Summary ${ i + 1 }`, content: s, moduleId }
                        : { ...s, moduleId }
                )
            );
            module.summaries = summaryDocs.map(s => s._id);
        }

        if (quizzes && Array.isArray(quizzes)) {
            await Quiz.deleteMany({ moduleId });
            const quizDocs = await Quiz.insertMany(
                quizzes.map(q => ({ ...q, moduleId }))
            );
            module.quizzes = quizDocs.map(q => q._id);
        }

        await module.save();

        res.status(200).json({ message: 'Module updated', module });

    } catch (err) {
        res.status(500).json({ message: 'Update failed', error: err.message });
    }
};

export const deleteModule = async (req, res) => {
    try {
        const moduleId = req.params.id;
        await Summary.deleteMany({ moduleId });
        await Quiz.deleteMany({ moduleId });

        const deleted = await Module.findByIdAndDelete(moduleId);
        if (!deleted) return res.status(404).json({ message: 'Module not found' });

        res.status(200).json({ message: 'Module and its content deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Deletion failed', error: err.message });
    }
};
