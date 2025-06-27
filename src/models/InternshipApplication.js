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
    // Student Information
    school: {
        type: String,
        required: [true, 'School name is required'],
        maxlength: [100, 'School name cannot exceed 100 characters']
    },
    year: {
        type: String,
        required: [true, 'Academic level or year is required'],
        enum: {
            values: ['Year one', 'Year two', 'Year three', 'Year four', 'Year five', 'Other'],
            message: 'Invalid academic level'
        }
    },

    // Application Documents
    resumeFile: {
        url: {
            type: String,
            required: true,
        },
        fileName: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    supportLetter: {
        url: {
            type: String,
            validate: {
                validator: v => !v || /\.(pdf|docx?)$/i.test(v),
                message: 'Support letter must be PDF or Word document'
            }
        },
        fileName: String,
        fileType: String,
        fileSize: Number
    },

    // Application Content
    applicationLetter: {
        type: String,
        required: [true, 'Application letter is required'],
        minlength: [50, 'Application letter should be at least 50 characters'],
        maxlength: [1000, 'Application letter should not exceed 1000 characters']
    },

    // Application Metadata
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Shortlisted', 'Interviewing', 'Accepted', 'Rejected'],
        default: 'Pending',
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    feedback: {
        type: String,
        maxlength: [500, 'Feedback cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Indexes
InternshipApplicationSchema.index(
    { studentId: 1, internshipId: 1 },
    { unique: true, message: 'You have already applied to this internship' }
);

// Compound indexes for common queries
InternshipApplicationSchema.index({ internshipId: 1, status: 1 });
InternshipApplicationSchema.index({ school: 1 });
InternshipApplicationSchema.index({ year: 1 });

export default mongoose.model('InternshipApplication', InternshipApplicationSchema);