import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

    textContent: { type: String }, // Optional

    summaries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Summary' }], // Array of Summary IDs
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],     // Array of Quiz IDs

    videoUrl: { type: String }, // Optional video
    pdfUrl: { type: String },   // Optional pdf

}, { timestamps: true });

const Module = mongoose.model('Module', moduleSchema);
export default Module;
