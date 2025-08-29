import mongoose from 'mongoose';

const InternshipMilestoneSchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InternshipEnrollment',
        required: true
    },
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

    title: {
        type: String,
        required: true,
        maxlength: [100, 'Milestone title cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Milestone description cannot exceed 500 characters']
    },

    // Timeline
    targetDate: {
        type: Date,
        required: true
    },
    completedDate: Date,

    // Status and progress
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'overdue', 'cancelled'],
        default: 'pending'
    },
    completionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    // Deliverables
    deliverables: [{
        title: String,
        description: String,
        completed: {
            type: Boolean,
            default: false
        },
        dueDate: Date,
        completedDate: Date
    }],

    // Skills and learning objectives
    skillsToLearn: [String],
    learningObjectives: [String],

    // Evaluation
    evaluation: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String,
        evaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        evaluatedAt: Date
    },

    // Creation details
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    }
}, {
    timestamps: true
});

// Indexes
InternshipMilestoneSchema.index({ enrollmentId: 1, targetDate: 1 });
InternshipMilestoneSchema.index({ status: 1 });
InternshipMilestoneSchema.index({ targetDate: 1 });

export default mongoose.model('InternshipMilestone', InternshipMilestoneSchema);