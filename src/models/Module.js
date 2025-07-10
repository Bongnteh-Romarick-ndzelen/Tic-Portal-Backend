import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['video', 'pdf', 'text', 'quiz'],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    accessType: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free'
    },
    // Content based on type
    content: {
        videoUrl: { type: String, trim: true },        // for video type
        pdfUrl: { type: String, trim: true },          // for pdf type
        textContent: { type: String, trim: true },     // for text type
        quizId: {                                      // for quiz type
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz'
        }
    },
    duration: { // in minutes (mainly for videos)
        type: Number,
        default: 0,
        min: 0
    },
    order: {
        type: Number,
        required: true,
        min: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    topics: [topicSchema],
    order: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const Module = mongoose.model('Module', moduleSchema);
export default Module;