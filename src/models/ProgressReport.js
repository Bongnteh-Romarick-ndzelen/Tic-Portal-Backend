import mongoose from 'mongoose';

const ProgressReportSchema = new mongoose.Schema({
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

    // Report period
    reportPeriod: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        weekNumber: Number,
        monthNumber: Number,
        reportType: {
            type: String,
            enum: ['weekly', 'monthly', 'milestone', 'final'],
            default: 'weekly'
        }
    },

    // Attendance metrics
    attendanceMetrics: {
        totalWorkingDays: {
            type: Number,
            default: 0
        },
        daysPresent: {
            type: Number,
            default: 0
        },
        daysAbsent: {
            type: Number,
            default: 0
        },
        daysLate: {
            type: Number,
            default: 0
        },
        attendancePercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },

    // Work metrics
    workMetrics: {
        totalHoursWorked: {
            type: Number,
            default: 0
        },
        expectedHours: {
            type: Number,
            default: 0
        },
        averageDailyHours: {
            type: Number,
            default: 0
        },
        hoursCompletionPercentage: {
            type: Number,
            default: 0
        }
    },

    // Performance metrics
    performanceMetrics: {
        totalActivitiesCompleted: {
            type: Number,
            default: 0
        },
        averageTaskRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        onTimeSubmissions: {
            type: Number,
            default: 0
        },
        lateSubmissions: {
            type: Number,
            default: 0
        },
        submissionRate: {
            type: Number,
            default: 0
        }
    },

    // Learning progress
    learningProgress: {
        skillsLearned: [{
            skill: String,
            proficiencyGain: String
        }],
        skillsImproved: [{
            skill: String,
            improvementLevel: String
        }],
        technicalAchievements: [String],
        softSkillsDevelopment: [String]
    },

    // Goals and achievements
    goals: {
        goalsSet: [String],
        goalsAchieved: [String],
        goalsInProgress: [String],
        goalCompletionRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },

    // Challenges and improvements
    challenges: [{
        challenge: String,
        impact: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        resolved: {
            type: Boolean,
            default: false
        },
        resolution: String
    }],

    areasForImprovement: [String],
    strengthsIdentified: [String],

    // Summary and notes
    summary: {
        type: String,
        maxlength: [2000, 'Summary cannot exceed 2000 characters']
    },
    studentReflection: {
        type: String,
        maxlength: [1000, 'Student reflection cannot exceed 1000 characters']
    },
    nextPeriodPlans: {
        type: String,
        maxlength: [1000, 'Next period plans cannot exceed 1000 characters']
    },

    // Mentor evaluation
    mentorEvaluation: {
        technicalSkills: {
            type: Number,
            min: 1,
            max: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5
        },
        problemSolving: {
            type: Number,
            min: 1,
            max: 5
        },
        initiative: {
            type: Number,
            min: 1,
            max: 5
        },
        teamwork: {
            type: Number,
            min: 1,
            max: 5
        },
        punctuality: {
            type: Number,
            min: 1,
            max: 5
        },
        overallRating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: {
            type: String,
            maxlength: [1000, 'Comments cannot exceed 1000 characters']
        },
        recommendations: {
            type: String,
            maxlength: [500, 'Recommendations cannot exceed 500 characters']
        },
        evaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        evaluatedAt: {
            type: Date,
            default: Date.now
        }
    },

    // Report generation details
    generatedAt: {
        type: Date,
        default: Date.now
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isAutoGenerated: {
        type: Boolean,
        default: true
    },

    status: {
        type: String,
        enum: ['draft', 'finalized', 'sent'],
        default: 'draft'
    }
}, {
    timestamps: true
});

// Indexes
ProgressReportSchema.index({ enrollmentId: 1, 'reportPeriod.startDate': 1 });
ProgressReportSchema.index({ studentId: 1, 'reportPeriod.reportType': 1 });
ProgressReportSchema.index({ generatedAt: -1 });

export default mongoose.model('ProgressReport', ProgressReportSchema);