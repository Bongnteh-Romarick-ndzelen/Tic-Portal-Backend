import Forum from '../../models/Forum.js';
import { Filter } from 'bad-words';

// Initialize profanity filter
const filter = new Filter();
filter.addWords('offensiveword1', 'custombadword'); // Add any custom bad words

// Helper: Validate post input
const validateForumInput = ({ post, courseId }) => {
    if (!post || !courseId) {
        return 'Post and courseId are required.';
    }
    if (filter.isProfane(post)) {
        return 'Inappropriate language detected in the post.';
    }
    return null;
};

// Helper: Check profanity in reply
const checkProfanity = (text) => {
    return filter.isProfane(text);
};

// POST /api/forums - Create new forum post
export const createPost = async (req, res) => {
    const { post, courseId } = req.body;

    const errorMsg = validateForumInput({ post, courseId });
    if (errorMsg) {
        return res.status(400).json({ message: errorMsg });
    }

    try {
        const newPost = await Forum.create({
            post,
            courseId,
            createdBy: req.user._id,
            replies: []
        });

        return res.status(201).json(newPost);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create forum post', error: error.message });
    }
};

// GET /api/forums?courseId=abc123 - Get all forum posts by course
export const getForums = async (req, res) => {
    const { courseId } = req.query;

    if (!courseId) {
        return res.status(400).json({ message: 'courseId query parameter is required.' });
    }

    try {
        const forums = await Forum.find({ courseId })
            .populate('createdBy', 'fullName')
            .populate('replies.createdBy', 'fullName');

        return res.status(200).json(forums);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve forums', error: error.message });
    }
};

// POST /api/forums/:id/reply - Add a reply to a forum post
export const replyToPost = async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Reply content is required.' });
    }

    if (checkProfanity(content)) {
        return res.status(400).json({ message: 'Inappropriate language detected in the reply.' });
    }

    try {
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Forum post not found.' });
        }

        forum.replies.push({ content, createdBy: req.user._id });
        await forum.save();

        return res.status(200).json(forum);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to add reply', error: error.message });
    }
};