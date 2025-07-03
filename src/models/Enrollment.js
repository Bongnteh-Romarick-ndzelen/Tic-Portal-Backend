// models/Enrollment.js - Fixed typo
import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId, // Fixed typo: 'monagoose' -> 'mongoose'
        ref: 'Course',
        required: true
    },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    lastAccessed: { type: Date, default: Date.now },
    progress: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;