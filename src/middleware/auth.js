import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Middleware to authenticate users
export const authenticate = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// ✅ Middleware to check if user is an instructor
export const isInstructor = (req, res, next) => {
    if (req.user?.userType !== 'instructor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Instructor privileges required.'
        });
    }
    next();
};

// ✅ Middleware to check if user is an admin
export const isAdmin = (req, res, next) => {
    if (req.user?.userType !== 'admin') {
        return res.status(403).json({ message: 'Only admins can perform this action' });
    }
    next();
};

export const isStudent = (req, res, next) => {
    if (req.user?.userType !== 'student') {
        return res.status(403).json({ message: 'Only Students are allowed to enrolled for an Internship!' });
    }
    next();
};