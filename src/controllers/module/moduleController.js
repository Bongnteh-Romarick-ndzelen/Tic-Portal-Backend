import mongoose from 'mongoose';

import Module from '../../models/Module.js';
import Course from '../../models/Course.js';
import Quiz from '../../models/Quiz.js';

export const createModule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { title, topics } = req.body;
        const { courseId } = req.params; // Get courseId from route params
        const userId = req.user.id;

        // Validate required fields
        if (!title) {
            throw new Error('title is required');
        }

        // Validate course exists and user is instructor
        const course = await Course.findById(courseId).session(session);
        if (!course) throw new Error('Course not found');
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to add modules to this course');
        }

        // Initialize topics array if not provided
        const moduleTopics = topics || [];
        const moduleOrder = await Module.countDocuments({ courseId }).session(session) + 1;

        // Create module first (without topics)
        const module = new Module({
            title,
            courseId,
            order: moduleOrder
        });
        await module.save({ session });

        // Process topics and create quizzes
        for (const [index, topic] of moduleTopics.entries()) {
            if (!topic.title || !topic.type || !topic.description) {
                throw new Error(`Topic at position ${index} is missing required fields`);
            }

            // Initialize topic content if not provided
            if (!topic.content) topic.content = {};

            // Handle different content types
            switch (topic.type) {
                case 'video':
                    if (!topic.content.videoUrl) {
                        throw new Error(`Video topic '${topic.title}' requires videoUrl`);
                    }
                    break;

                case 'pdf':
                    if (!topic.content.pdfUrl) {
                        throw new Error(`PDF topic '${topic.title}' requires pdfUrl`);
                    }
                    break;

                case 'text':
                    if (!topic.content.textContent) {
                        throw new Error(`Text topic '${topic.title}' requires textContent`);
                    }
                    break;

                case 'quiz':
                    // Create a new quiz for quiz topics
                    const newQuiz = new Quiz({
                        title: `${title} - ${topic.title}`,
                        description: topic.description,
                        courseId,
                        moduleId: module._id,
                        topicId: topic._id || new mongoose.Types.ObjectId(), // Generate if not provided
                        questions: topic.content.questions || [], // Initialize with empty array
                        passingScore: topic.content.passingScore || 70,
                        timeLimit: topic.content.timeLimit || 30
                    });
                    await newQuiz.save({ session });

                    // Update topic content with the created quiz ID
                    topic.content.quizId = newQuiz._id;
                    break;

                default:
                    throw new Error(`Invalid topic type '${topic.type}'`);
            }

            // Add topic to module
            module.topics.push({
                ...topic,
                order: index + 1
            });
        }

        // Save the module with all topics
        await module.save({ session });
        await session.commitTransaction();
        session.endSession();

        // Populate quiz references before returning
        const createdModule = await Module.findById(module._id)
            .populate('topics.content.quizId');

        res.status(201).json({
            success: true,
            message: 'Module and associated quizzes created successfully',
            module: createdModule
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        const statusCode = err.message.includes('Unauthorized') ? 403 :
            err.message.includes('not found') ? 404 : 400;

        res.status(statusCode).json({
            success: false,
            message: err.message || 'Failed to create module',
            error: err.message
        });
    }
};

export const getModulesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const modules = await Module.find({ courseId })
            .sort({ order: 1 });

        res.status(200).json(modules);
    } catch (err) {
        res.status(500).json({
            message: 'Failed to fetch modules',
            error: err.message
        });
    }
};

export const getModuleById = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id)
            .populate('topics.content.quizId');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        res.status(200).json(module);
    } catch (err) {
        res.status(500).json({
            message: 'Error retrieving module',
            error: err.message
        });
    }
};

export const updateModule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { title, topics } = req.body;
        const moduleId = req.params.id;
        const userId = req.user.id;

        const module = await Module.findById(moduleId).session(session);
        if (!module) throw new Error('Module not found');

        // Verify course ownership
        const course = await Course.findById(module.courseId).session(session);
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to update this module');
        }

        // Update fields
        if (title) module.title = title;

        // Full topics replacement if provided
        if (topics && Array.isArray(topics)) {
            // Validate topics
            for (const topic of topics) {
                if (!topic.title || !topic.type || !topic.description) {
                    throw new Error('Each topic requires title, type, and description');
                }
            }

            module.topics = topics;
        }

        await module.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Module updated successfully',
            module: await Module.findById(module._id).populate('topics.content.quizId')
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        const statusCode = err.message.includes('Unauthorized') ? 403 :
            err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
            message: err.message || 'Update failed',
            error: err.message
        });
    }
};

export const deleteModule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const moduleId = req.params.id;
        const userId = req.user.id;

        const module = await Module.findById(moduleId).session(session);
        if (!module) throw new Error('Module not found');

        // Verify course ownership
        const course = await Course.findById(module.courseId).session(session);
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to delete this module');
        }

        // Update orders of remaining modules
        await Module.updateMany(
            { courseId: module.courseId, order: { $gt: module.order } },
            { $inc: { order: -1 } },
            { session }
        );

        await Module.findByIdAndDelete(moduleId, { session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Module deleted successfully' });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        const statusCode = err.message.includes('Unauthorized') ? 403 :
            err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
            message: err.message || 'Deletion failed',
            error: err.message
        });
    }
};

// Additional helper controller for topic management
export const updateModuleTopicsOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { moduleId } = req.params;
        const { topicOrders } = req.body; // { topicId: newOrder }
        const userId = req.user.id;

        const module = await Module.findById(moduleId).session(session);
        if (!module) throw new Error('Module not found');

        // Verify course ownership
        const course = await Course.findById(module.courseId).session(session);
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to modify this module');
        }

        // Update topic orders
        module.topics = module.topics.map(topic => {
            if (topicOrders[topic._id.toString()] !== undefined) {
                topic.order = topicOrders[topic._id.toString()];
            }
            return topic;
        });

        await module.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Topic order updated successfully',
            module: await Module.findById(moduleId)
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            message: err.message || 'Failed to update topic order',
            error: err.message
        });
    }
};
///////////////////////Topic Management Controller///////////////////////

// Add a new topic to a module
export const addTopicToModule = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { moduleId } = req.params;
        const { title, type, description, accessType, content, duration } = req.body;
        const files = req.files;
        const userId = req.user.id;

        // Validate required fields
        if (!title || !type || !description) {
            throw new Error('Title, type, and description are required');
        }

        // Get module and verify ownership
        const module = await Module.findById(moduleId).session(session);
        if (!module) throw new Error('Module not found');

        const course = await Course.findById(module.courseId).session(session);
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to modify this module');
        }

        // Handle file uploads
        let contentData = {};
        switch (type) {
            case 'video':
                if (!files?.videoFile?.[0] && !content?.videoUrl) {
                    throw new Error('Video file or URL is required');
                }
                contentData.videoUrl = files?.videoFile?.[0]?.path || content.videoUrl;
                break;
            case 'pdf':
                if (!files?.pdfFile?.[0] && !content?.pdfUrl) {
                    throw new Error('PDF file or URL is required');
                }
                contentData.pdfUrl = files?.pdfFile?.[0]?.path || content.pdfUrl;
                break;
            case 'text':
                if (!content?.textContent) {
                    throw new Error('Text content is required');
                }
                contentData.textContent = content.textContent;
                break;
            case 'quiz':
                if (!content?.quizId) {
                    throw new Error('Quiz ID is required');
                }
                contentData.quizId = content.quizId;
                break;
            default:
                throw new Error('Invalid topic type');
        }

        // Create new topic
        const newTopic = {
            title,
            type,
            description,
            accessType: accessType || 'free',
            content: contentData,
            duration: duration || 0,
            order: module.topics.length + 1,
            isPublished: false
        };

        module.topics.push(newTopic);
        await module.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Topic added successfully',
            topic: newTopic,
            module: await Module.findById(moduleId)
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        const statusCode = err.message.includes('Unauthorized') ? 403 :
            err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
            message: err.message || 'Failed to add topic',
            error: err.message
        });
    }
};

// Update an existing topic
export const updateTopic = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { moduleId, topicId } = req.params;
        const { title, description, accessType, content, duration, isPublished } = req.body;
        const files = req.files;
        const userId = req.user.id;

        // Get module and verify ownership
        const module = await Module.findById(moduleId).session(session);
        if (!module) throw new Error('Module not found');

        const course = await Course.findById(module.courseId).session(session);
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to modify this module');
        }

        // Find the topic
        const topicIndex = module.topics.findIndex(t => t._id.toString() === topicId);
        if (topicIndex === -1) throw new Error('Topic not found');

        const topic = module.topics[topicIndex];

        // Update fields
        if (title) topic.title = title;
        if (description) topic.description = description;
        if (accessType) topic.accessType = accessType;
        if (duration !== undefined) topic.duration = duration;
        if (isPublished !== undefined) topic.isPublished = isPublished;

        // Handle content updates
        if (content || files) {
            switch (topic.type) {
                case 'video':
                    if (files?.videoFile?.[0]) {
                        topic.content.videoUrl = files.videoFile[0].path;
                    } else if (content?.videoUrl) {
                        topic.content.videoUrl = content.videoUrl;
                    }
                    break;
                case 'pdf':
                    if (files?.pdfFile?.[0]) {
                        topic.content.pdfUrl = files.pdfFile[0].path;
                    } else if (content?.pdfUrl) {
                        topic.content.pdfUrl = content.pdfUrl;
                    }
                    break;
                case 'text':
                    if (content?.textContent) {
                        topic.content.textContent = content.textContent;
                    }
                    break;
                case 'quiz':
                    if (content?.quizId) {
                        topic.content.quizId = content.quizId;
                    }
                    break;
            }
        }

        module.topics[topicIndex] = topic;
        await module.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Topic updated successfully',
            topic,
            module: await Module.findById(moduleId)
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        const statusCode = err.message.includes('Unauthorized') ? 403 :
            err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
            message: err.message || 'Failed to update topic',
            error: err.message
        });
    }
};

// Delete a topic from a module
export const deleteTopic = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { moduleId, topicId } = req.params;
        const userId = req.user.id;

        // Get module and verify ownership
        const module = await Module.findById(moduleId).session(session);
        if (!module) throw new Error('Module not found');

        const course = await Course.findById(module.courseId).session(session);
        if (course.instructor.toString() !== userId) {
            throw new Error('Unauthorized to modify this module');
        }

        // Find and remove the topic
        const topicIndex = module.topics.findIndex(t => t._id.toString() === topicId);
        if (topicIndex === -1) throw new Error('Topic not found');

        module.topics.splice(topicIndex, 1);

        // Update order of remaining topics
        module.topics.forEach((topic, index) => {
            topic.order = index + 1;
        });

        await module.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Topic deleted successfully',
            module: await Module.findById(moduleId)
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        const statusCode = err.message.includes('Unauthorized') ? 403 :
            err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
            message: err.message || 'Failed to delete topic',
            error: err.message
        });
    }
};

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