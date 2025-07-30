import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Personal Information
    profileImage: {
        url: String,
        publicId: String,
        uploadedAt: Date
    },
    headline: {
        type: String,
        maxlength: 120
    },
    bio: {
        type: String,
        maxlength: 500
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Prefer not to say']
    },

    // Contact Information
    website: String,
    socialLinks: {
        linkedin: String,
        twitter: String,
        github: String,
        facebook: String,
        youtube: String
    },

    // Education
    education: [{
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number,
        currentlyAttending: Boolean,
        description: String
    }],

    // Work Experience
    experience: [{
        title: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        currentlyWorking: Boolean,
        description: String,
        skillsUsed: [String]
    }],

    // Skills & Certifications
    skills: [{
        name: String,
        level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
        },
        verified: Boolean
    }],
    certifications: [{
        name: String,
        issuingOrganization: String,
        issueDate: Date,
        expirationDate: Date,
        credentialId: String,
        credentialUrl: String
    }],

    // Course Tracking (connected to your Course model)
    coursesEnrolled: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        completionStatus: {
            type: String,
            enum: ['Not Started', 'In Progress', 'Completed', 'Dropped'],
            default: 'Not Started'
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        lastAccessed: Date,
        favorite: Boolean
    }],

    coursesCompleted: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        completionDate: Date,
        certificate: {
            url: String,
            issuedDate: Date
        },
        grade: Number
    }],

    // Internship Tracking
    internshipsApplied: [{
        internship: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Internship'
        },
        applicationDate: Date,
        status: {
            type: String,
            enum: ['Applied', 'Under Review', 'Interview', 'Accepted', 'Rejected']
        }
    }],

    // Preferences
    notificationPreferences: {
        emailNotifications: Boolean,
        pushNotifications: Boolean,
        courseUpdates: Boolean,
        promotionalOffers: Boolean
    },

    // Stats
    profileViews: {
        type: Number,
        default: 0
    },
    lastProfileUpdate: Date,
    profileCompletion: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Calculate profile completion percentage
profileSchema.pre('save', function (next) {
    const fieldsToCheck = [
        'profileImage', 'headline', 'bio', 'education',
        'experience', 'skills', 'socialLinks'
    ];

    let completedFields = 0;

    fieldsToCheck.forEach(field => {
        if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : this[field])) {
            completedFields++;
        }
    });

    this.profileCompletion = Math.round((completedFields / fieldsToCheck.length) * 100);
    next();
});

// Virtual for enrolled courses count
profileSchema.virtual('enrolledCoursesCount').get(function () {
    return this.coursesEnrolled.length;
});

// Virtual for completed courses count
profileSchema.virtual('completedCoursesCount').get(function () {
    return this.coursesCompleted.length;
});

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;