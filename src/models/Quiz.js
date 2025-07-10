import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        A: { type: String, required: true, trim: true },
        B: { type: String, required: true, trim: true },
        C: { type: String, trim: true },
        D: { type: String, trim: true },
        E: { type: String, trim: true }
    },
    answer: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['A', 'B', 'C', 'D', 'E'],
        validate: {
            validator: function (value) {
                // Ensure the answer exists in the provided options
                return this.options[value] !== undefined;
            },
            message: props => `Answer ${props.value} is not a valid option`
        }
    },
    explanation: {
        type: String,
        trim: true
    },
    questionType: {
        type: String,
        enum: ['multiple-choice', 'true-false'],
        default: 'multiple-choice'
    },
    points: {
        type: Number,
        default: 1,
        min: 1
    }
}, { _id: true });

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    questions: [quizQuestionSchema],
    passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
    },
    timeLimit: { // in minutes
        type: Number,
        default: 30,
        min: 1
    },
    maxAttempts: {
        type: Number,
        default: 1,
        min: 1
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, { timestamps: true });

// Indexes for better performance
quizSchema.index({ courseId: 1 });
quizSchema.index({ moduleId: 1 });
quizSchema.index({ topicId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;