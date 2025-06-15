import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Middleware to authenticate users
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ✅ Middleware to check if user is an instructor
export const isInstructor = (req, res, next) => {
    if (req.user?.userType !== 'instructor') {
        return res.status(403).json({ message: 'Only instructors can perform this action' });
    }
    next();
};
