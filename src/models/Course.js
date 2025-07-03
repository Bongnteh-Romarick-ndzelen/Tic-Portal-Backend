// models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: String,
    videoUrl: String,
    documentPath: String,
    thumbnail: String,
    duration: String,
    pace: String,
    price: {
        type: String,
        enum: ['Free', 'Paid'],
        default: 'Free'
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    features: [String],
    rating: {
        type: Number,
        default: 0
    },
    studentsEnrolled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment'
    }],
    modules: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        }
    ]
}, { timestamps: true });
courseSchema.index({ modules: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
