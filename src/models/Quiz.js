import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: String, required: true },
    // You can add explanation, type of question, etc.
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [quizQuestionSchema],
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
