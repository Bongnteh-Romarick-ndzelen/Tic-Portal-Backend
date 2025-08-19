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
    tokenVersion: { type: Number, default: 0 }
});

export default mongoose.model('User', userSchema);

