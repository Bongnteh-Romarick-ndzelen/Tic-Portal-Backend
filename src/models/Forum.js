import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const forumSchema = new mongoose.Schema({
    post: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Forum', forumSchema);
