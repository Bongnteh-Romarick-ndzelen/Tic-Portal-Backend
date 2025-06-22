import mongoose from 'mongoose';

const InternshipApplicationSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    internshipId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Internship', 
        required: true 
    },
    resumeUrl: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Accepted', 'Rejected'], 
        default: 'Pending' 
    },
    appliedAt: { type: Date, default: Date.now }
});

export default mongoose.model('InternshipApplication', InternshipApplicationSchema);