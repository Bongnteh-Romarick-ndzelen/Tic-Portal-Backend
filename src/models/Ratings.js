import mongoose from 'mongoose';
const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating value is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5']
    },
    review: {
        type: String,
        trim: true,
        maxlength: [500, 'Review cannot be longer than 500 characters']
    }
}, { timestamps: true });
export default mongoose.model('Rating', ratingSchema);
