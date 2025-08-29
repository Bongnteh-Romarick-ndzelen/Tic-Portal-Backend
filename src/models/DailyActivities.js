import mongoose from 'mongoose';

const DailyActivitySchema = new mongoose.Schema({
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

    date: {
        type: Date,
        required: true
    },

    // Time tracking
    checkInTime: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid time format. Use HH:MM format'
        }
    },
    checkOutTime: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid time format. Use HH:MM format'
        }
    },
    totalHours: {
        type: Number,
        min: 0,
        max: 24
    },
    breakTime: {
        type: Number,
        default: 0,
        min: 0
    },

    // Daily activities
    activities: [{
        task: {
            type: String,
            required: true,
            maxlength: [200, 'Task description cannot exceed 200 characters']
        },
        description: {
            type: String,
            maxlength: [500, 'Activity description cannot exceed 500 characters']
        },
        category: {
            type: String,
            enum: ['learning', 'coding', 'research', 'meeting', 'documentation', 'testing', 'other'],
            default: 'other'
        },
        difficulty: {
            type: String,
            enum: ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'],
            required: true
        },
        timeSpent: {
            type: Number,
            required: true,
            min: 0 // in minutes
        },
        completed: {
            type: Boolean,
            default: false
        },
        completionPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    }],

    // Reflection and learning
    whatYouDid: {
        type: String,
        required: [true, 'Daily summary is required'],
        minlength: [50, 'Daily summary should be at least 50 characters'],
        maxlength: [1000, 'Daily summary should not exceed 1000 characters']
    },
    challengesFaced: {
        type: String,
        maxlength: [500, 'Challenges description cannot exceed 500 characters']
    },
    solutionsFound: {
        type: String,
        maxlength: [500, 'Solutions description cannot exceed 500 characters']
    },
    nextSteps: {
        type: String,
        maxlength: [500, 'Next steps cannot exceed 500 characters']
    },

    // Learning tracking
    skillsLearned: [{
        type: String,
        trim: true
    }],
    skillsImproved: [{
        skill: String,
        improvementLevel: {
            type: String,
            enum: ['slight', 'moderate', 'significant']
        }
    }],
    resourcesUsed: [{
        type: String,
        trim: true
    }],

    // Goals and achievements
    goalsSet: [String],
    goalsAchieved: [String],

    // Mood and satisfaction
    moodRating: {
        type: Number,
        min: 1,
        max: 5
    },
    satisfactionLevel: {
        type: Number,
        min: 1,
        max: 5
    },

    // Submission details
    status: {
        type: String,
        enum: ['draft', 'submitted', 'reviewed', 'approved', 'needs-revision'],
        default: 'draft'
    },
    isLateSubmission: {
        type: Boolean,
        default: false
    },
    submittedAt: Date,

    // Mentor feedback
    mentorFeedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        technicalRating: {
            type: Number,
            min: 1,
            max: 5
        },
        effortRating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: {
            type: String,
            maxlength: [1000, 'Feedback cannot exceed 1000 characters']
        },
        suggestions: {
            type: String,
            maxlength: [500, 'Suggestions cannot exceed 500 characters']
        },
        reviewedAt: Date,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    // File attachments
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
DailyActivitySchema.index({ enrollmentId: 1, date: 1 }, { unique: true });
DailyActivitySchema.index({ studentId: 1, date: -1 });
DailyActivitySchema.index({ status: 1 });
DailyActivitySchema.index({ submittedAt: -1 });

// Pre-save middleware to calculate total hours
DailyActivitySchema.pre('save', function (next) {
    if (this.checkInTime && this.checkOutTime) {
        const checkIn = new Date(`1970-01-01T${this.checkInTime}:00`);
        const checkOut = new Date(`1970-01-01T${this.checkOutTime}:00`);

        if (checkOut > checkIn) {
            const diffMs = checkOut - checkIn;
            const diffHours = diffMs / (1000 * 60 * 60);
            this.totalHours = Math.round((diffHours - (this.breakTime || 0) / 60) * 100) / 100;
        }
    }
    next();
});

export default mongoose.model('DailyActivity', DailyActivitySchema);