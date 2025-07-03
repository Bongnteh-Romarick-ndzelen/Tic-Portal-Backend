import User from '../../models/User.js';
import bcrypt from 'bcryptjs';

// Helper function for admin check
const isAdmin = (user) => user?.userType === 'admin';

// @desc    Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new user (Admin only)
export const createUser = async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({ ...req.body, password: hashedPassword });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                userType: user.userType
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user (Admin or self)
export const updateUser = async (req, res) => {
    try {
        const isSelfUpdate = req.params.id === req.user._id.toString();

        if (!isSelfUpdate && !isAdmin(req.user)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const updates = { ...req.body };

        // Only admins can change userType
        if (updates.userType && !isAdmin(req.user)) {
            return res.status(403).json({ success: false, message: 'Cannot change user role' });
        }

        // Handle password update
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete user (Admin or self)
export const deleteUser = async (req, res) => {
    try {
        const isSelfDelete = req.params.id === req.user._id.toString();

        if (!isSelfDelete && !isAdmin(req.user)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single user (Admin only)
export const getUser = async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};