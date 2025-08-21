import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact: { type: String },
    country: {
        name: { type: String, required: true },
        code: { type: String, required: true }
    },
    phoneNumber: { type: String },
    userType: { type: String, enum: ['student', 'instructor', 'employer', 'admin', 'mentor'], required: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
    // Notification preferences
    notificationPreferences: {
        email: {
            enabled: { type: Boolean, default: true },
            courseUpdates: { type: Boolean, default: true },
            newContent: { type: Boolean, default: true },
            announcements: { type: Boolean, default: true },
            security: { type: Boolean, default: true }
        },
        push: {
            enabled: { type: Boolean, default: true },
            courseUpdates: { type: Boolean, default: true },
            newContent: { type: Boolean, default: true },
            announcements: { type: Boolean, default: true }
        }
    },

    // Push notification tokens
    pushTokens: [{
        token: String,
        platform: String,
        createdAt: { type: Date, default: Date.now }
    }],

    // Email notification settings
    emailFrequency: {
        type: String,
        enum: ['immediately', 'daily', 'weekly'],
        default: 'immediately'
    },

    // Quiet hours for notifications
    quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '22:00' }, // 10 PM
        end: { type: String, default: '07:00' }    // 7 AM
    }
}, { timestamps: true });


export default mongoose.model('User', userSchema);

