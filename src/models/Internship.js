import mongoose from 'mongoose';

const InternshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    stipend: {
        type: Number,
        required: true,
        min: 0
    },
    duration: {
        type: String,
        required: true
    },

    skills: [{
        type: String,
        trim: true
    }],
    responsibilities: [{
        type: String
    }],
    qualifications: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'closed', 'archived'],
        default: 'active',
    },
    applicationDeadline: {
        type: Date,
        required: false
    }
});


export default mongoose.model('Internship', InternshipSchema);