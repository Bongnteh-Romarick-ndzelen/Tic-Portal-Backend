import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
// ===== Utility Functions =====
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, userType: user.userType, sessionID: uuidv4() },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

const sendVerificationEmail = async (user, token) => {
    // Nodemailer configuration - create transporter for each email to ensure env vars are loaded
    const transporter = nodemailer.createTransport({
        host: process.env.EMAILJS_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAILJS_USER,
            pass: process.env.EMAILJS_PASSWORD
        },
        tls: {
            rejectUnauthorized: false // Set to true in production for better security
        }
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}&id=${user._id}`;

    const mailOptions = {
        from: process.env.EMAILJS_FROM_EMAIL || 'noreply@ticportal.com',
        to: user.email,
        subject: 'Email Verification - TIC Portal',
        text: `Please verify your email by clicking on the link below! ${verificationLink}`,
        html: `
            <html>
                <head>
                    <style type="text/css">
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            color: #333333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f7f7f7;
                        }
                        .email-container {
                            background-color: #ffffff;
                            border-radius: 8px;
                            padding: 30px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        h2 {
                            color: #2c3e50;
                            margin-top: 0;
                            font-size: 24px;
                            border-bottom: 2px solid #f1f1f1;
                            padding-bottom: 10px;
                        }
                        p {
                            margin-bottom: 20px;
                            font-size: 16px;
                        }
                        .verification-button {
                            display: inline-block;
                            background-color: #3498db;
                            color: #ffffff !important;
                            text-decoration: none;
                            padding: 12px 25px;
                            border-radius: 5px;
                            font-weight: bold;
                            margin: 15px 0;
                            font-size: 16px;
                        }
                        .verification-button:hover {
                            background-color: #2980b9;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 14px;
                            color: #7f8c8d;
                            border-top: 1px solid #eee;
                            padding-top: 20px;
                        }
                        .logo {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .logo img {
                            max-width: 150px;
                            height: auto;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="logo">
                            
                            <img src="https://web.facebook.com/photo?fbid=706755464792601&set=a.527416472726502" alt="Tic Portal Logo">
                        </div>
                        
                        <h2>Email Verification: TicPortal</h2>
                        
                        <p>Hello ${user.fullName},</p>
                        
                        <p>Thank you for signing up for Tic Portal. Please verify your email address to complete your registration and become a verified user!</p>
                        
                        <div style="text-align: center;">
                            <a href="${verificationLink}" class="verification-button">Verify Email Address</a>
                        </div>
                        
                        <p>If the button above doesn't work, copy and paste this link into your browser:<br>
                        <small>${verificationLink}</small>
                        <small>This link expires after 24hrs</small>
                        </p>
                        
                        <div class="footer">
                            <p>If you didn't create an account with Tic Portal, please ignore this email.</p>
                            <p>© 2023 Tic Portal. All rights reserved.</p>
                        </div>
                    </div>
                </body>
            </html>
        `
    };

    try {
        console.log('Attempting to send verification email with nodemailer config:', {
            host: process.env.EMAILJS_HOST || 'smtp.gmail.com',
            port: 587,
            user: process.env.EMAILJS_USER
        });
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id, version: user.tokenVersion },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};
const createUserObject = (user) => ({
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    userType: user.userType,
});
// ===== SIGNUP CONTROLLER =====
const signup = async (req, res) => {
    const {
        fullName,
        email,
        contact,
        country,
        phoneNumber,
        userType,
        password
    } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({
            fullName,
            email,
            contact,
            country,
            phoneNumber,
            userType,
            password: hashedPassword,
        });
        await user.save();

        // Generate verification token
        const verificationToken = uuidv4();
        user.verificationToken = verificationToken;
        await user.save();

        // Send verification email
        try {
            await sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail the signup if email sending fails, just log it
        }

        res.status(201).json({
            message: 'User registered successfully. Please check your email for verification.',
            user: createUserObject(user),
        });
    } catch (error) {
        console.error('Signup failed:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};
// ===== LOGIN CONTROLLER =====
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email before logging in' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: 'Login successful',
            user: createUserObject(user),
            accessToken,
        });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
// ===== REFRESH TOKEN CONTROLLER =====
const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        if (decoded.version !== user.tokenVersion) {
            return res
                .status(401)
                .json({ message: 'Token version mismatch. Please login again.' });
        }
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Refresh token verification failed:', error);
        return res.status(403).json({
            message: 'Invalid or expired refresh token. Please login again.',
        });
    }
};
// ===== LOGOUT CONTROLLER =====
const logout = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.status(204).json({ message: 'No refresh token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
            user.tokenVersion += 1;
            await user.save();
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout failed:', error);
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.status(200).json({ message: 'Logged out successfully' });
    }
};
// ===== EMAIL VERIFICATION CONTROLLER =====
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification failed:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};

// ===== FORGOT PASSWORD CONTROLLER =====
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal whether email exists for security
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }

        // Generate password reset token (expires in 1 hour)
        const resetToken = uuidv4();
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour from now
        await user.save();

        // Send password reset email
        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user._id}`;

        const transporter = nodemailer.createTransport({
            host: process.env.EMAILJS_HOST || 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAILJS_USER,
                pass: process.env.EMAILJS_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: process.env.EMAILJS_FROM_EMAIL || 'noreply@ticportal.com',
            to: user.email,
            subject: 'Password Reset Request - TIC Portal',
            html: `
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; }
                            .button {
                                display: inline-block;
                                padding: 10px 20px;
                                background-color: #3498db;
                                color: #fff;
                                text-decoration: none;
                                border-radius: 5px;
                            }
                        </style>
                    </head>
                    <body>
                        <h2>Password Reset Request</h2>
                        <p>Hello ${user.fullName},</p>
                        <p>You requested to reset your password.Please click the button below and follow the instructions to proceed:</p>
                        <a href="${resetLink}" class="button">Reset Password</a>
                        <p>If you didn't request this, please ignore this email.</p>
                        <p>This link will expire in 1 hour.</p>
                    </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    } catch (error) {
        console.error('Password reset request failed:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

// ===== VERIFY PASSWORD RESET TOKEN CONTROLLER =====
const verifyPasswordResetToken = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Password reset token is invalid or has expired'
            });
        }

        res.status(200).json({
            message: 'Password reset token is valid',
            userId: user._id
        });
    } catch (error) {
        console.error('Password reset token verification failed:', error);
        res.status(500).json({ message: 'Server error during token verification' });
    }
};

// ===== RESET PASSWORD CONTROLLER =====
const resetPassword = async (req, res) => {
    const { token, userId, newPassword } = req.body;

    try {
        const user = await User.findOne({
            _id: userId,
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Password reset token is invalid or has expired'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // Increment token version to invalidate all existing sessions
        user.tokenVersion += 1;

        await user.save();

        res.status(200).json({
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Password reset failed:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};


export { signup, login, refreshToken, logout, verifyEmail, forgotPassword, verifyPasswordResetToken, resetPassword };

