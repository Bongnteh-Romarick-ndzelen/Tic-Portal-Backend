import Module from '../../models/Module.js';
import Quiz from '../../models/Quiz.js';
import mongoose from 'mongoose';

// 🔹 Add a quiz to a module
export const addQuizToModule = async (req, res) => {
    const { moduleId } = req.params;
    const { title, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Quiz title and questions are required' });
    }

    try {
        const module = await Module.findById(moduleId);
        if (!module) return res.status(404).json({ message: 'Module not found' });

        const quiz = new Quiz({ title, questions }); // 🟢 Include full questions array
        await quiz.save();

        module.quizzes.push(quiz._id);
        await module.save();

        res.status(201).json({ message: 'Quiz created and added to module', quiz });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add quiz', error: err.message });
    }
};
// 🔹 Update a quiz in a module
export const updateQuizInModule = async (req, res) => {
    const { moduleId, quizId } = req.params;
    const { title, questions } = req.body;

    try {
        // Ensure the module exists and contains the quiz reference
        const module = await Module.findById(moduleId);
        if (!module) return res.status(404).json({ message: 'Module not found' });

        if (!module.quizzes.includes(quizId)) {
            return res.status(404).json({ message: 'Quiz not associated with this module' });
        }

        // Update the Quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        if (title) quiz.title = title;
        if (questions) quiz.questions = questions;

        await quiz.save();

        res.status(200).json({ message: 'Quiz updated successfully', quiz });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update quiz', error: err.message });
    }
};
// 🔹 Delete a quiz from a module
export const deleteQuizFromModule = async (req, res) => {
    const { moduleId, quizId } = req.params;

    try {
        // 1. Find the module
        const module = await Module.findById(moduleId);
        if (!module) return res.status(404).json({ message: 'Module not found' });

        // 2. Check if the quiz exists in the module's quiz list
        const quizIndex = module.quizzes.indexOf(quizId);
        if (quizIndex === -1) {
            return res.status(404).json({ message: 'Quiz not found in this module' });
        }

        // 3. Remove the quiz ID from the module's quizzes array
        module.quizzes.splice(quizIndex, 1);
        await module.save();

        // 4. Optionally delete the quiz document itself
        await Quiz.findByIdAndDelete(quizId);

        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete quiz', error: err.message });
    }
};

// 🔹 Add a summary to a module
export const addSummaryToModule = async (req, res) => {
    const { moduleId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const module = await Module.findById(moduleId);
        if (!module) return res.status(404).json({ message: 'Module not found' });

        const newSummary = {
            _id: new mongoose.Types.ObjectId(),
            title,
            content
        };

        module.summaries.push(newSummary);
        await module.save();

        res.status(201).json({ message: 'Summary added', summary: newSummary });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add summary', error: err.message });
    }
};

// 🔹 Update a summary in a module
export const updateSummaryInModule = async (req, res) => {
    const { moduleId, summaryId } = req.params;
    const { title, content } = req.body;

    try {
        const module = await Module.findById(moduleId);
        if (!module) return res.status(404).json({ message: 'Module not found' });

        const summary = module.summaries.id(summaryId);
        if (!summary) return res.status(404).json({ message: 'Summary not found' });

        if (title) summary.title = title;
        if (content) summary.content = content;

        await module.save();
        res.status(200).json({ message: 'Summary updated', summary });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update summary', error: err.message });
    }
};

// 🔹 Delete a summary from a module
export const deleteSummaryFromModule = async (req, res) => {
    const { moduleId, summaryId } = req.params;

    try {
        const module = await Module.findById(moduleId);
        if (!module) return res.status(404).json({ message: 'Module not found' });

        const summary = module.summaries.id(summaryId);
        if (!summary) return res.status(404).json({ message: 'Summary not found' });

        summary.remove();
        await module.save();

        res.status(200).json({ message: 'Summary deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete summary', error: err.message });
    }
};

// 🔹 Get all quizzes in a module
export const getAllQuizzesInModule = async (req, res) => {
    const { moduleId } = req.params;

    try {
        const module = await Module.findById(moduleId).populate({ path: 'quizzes', model: 'Quiz' });
        if (!module) return res.status(404).json({ message: 'Module not found' });

        res.status(200).json({ quizzes: module.quizzes });
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve quizzes', error: err.message });
    }
};

// 🔹 Get all summaries in a module
export const getAllSummariesInModule = async (req, res) => {
    const { moduleId } = req.params;

    try {
        const module = await Module.findById(moduleId).populate('summaries');
        if (!module) return res.status(404).json({ message: 'Module not found' });

        res.status(200).json({ summaries: module.summaries });
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve summaries', error: err.message });
    }
};

