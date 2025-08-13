import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
    },
    language: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true
    },
    whatYouLearn: [{
        type: String,
        required: true
    }],
    requirements: [{
        type: String,
        required: true
    }],
    thumbnail: {
        type: String, // URL or path to the image

    },
    promoVideo: {
        type: String, // URL for internal/external video
    },
    priceType: {
        type: String,
        enum: ['Free', 'Paid'],
        default: 'Free'
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    modules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    }],
    ratings: {
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        ratingCount: {
            type: Number,
            default: 0
        },
        // You can add breakdown by star if needed
        starDistribution: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 }
        }
    },
    // In Course model
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    studentsEnrolled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;