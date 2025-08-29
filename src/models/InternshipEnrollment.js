import mongoose from 'mongoose';

const InternshipEnrollmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InternshipApplication',
        required: true
    },
    internshipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true
    },

    // Internship period details
    actualStartDate: {
        type: Date,
        required: true
    },
    actualEndDate: {
        type: Date,
        required: true
    },
    workingDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    dailyStartTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid time format. Use HH:MM format'
        }
    },
    dailyEndTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid time format. Use HH:MM format'
        }
    },

    // Mentor/Supervisor assignment
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Internship configuration
    totalExpectedHours: {
        type: Number,
        required: true
    },
    weeklyExpectedHours: {
        type: Number,
        default: 40
    },

    status: {
        type: String,
        enum: ['active', 'completed', 'terminated', 'on-hold', 'suspended'],
        default: 'active'
    },

    // Important dates
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    terminatedAt: Date,

    // Completion details
    completionReason: {
        type: String,
        enum: ['successful', 'early-termination', 'mutual-agreement', 'performance-issues', 'other']
    },
    finalGrade: {
        type: String,
        enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
    },

    // Settings
    requiresDailySubmission: {
        type: Boolean,
        default: true
    },
    allowLateSubmissions: {
        type: Boolean,
        default: false
    },
    maxLateSubmissionHours: {
        type: Number,
        default: 24
    }
}, {
    timestamps: true
});

// Indexes
InternshipEnrollmentSchema.index({ studentId: 1, internshipId: 1 }, { unique: true });
InternshipEnrollmentSchema.index({ status: 1 });
InternshipEnrollmentSchema.index({ mentorId: 1 });
InternshipEnrollmentSchema.index({ actualStartDate: 1, actualEndDate: 1 });

// Pre-save middleware to calculate total expected hours
InternshipEnrollmentSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('actualStartDate') || this.isModified('actualEndDate')) {
        const startDate = new Date(this.actualStartDate);
        const endDate = new Date(this.actualEndDate);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const workingDaysCount = this.workingDays.length || 5; // Default to 5 working days
        const totalWeeks = Math.ceil(diffDays / 7);
        this.totalExpectedHours = totalWeeks * (this.weeklyExpectedHours || 40) * (workingDaysCount / 7);
    }
    next();
});

export default mongoose.model('InternshipEnrollment', InternshipEnrollmentSchema);