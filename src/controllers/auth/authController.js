import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
// ===== Utility Functions =====
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, userType: user.userType, sessionID: uuidv4() },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
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
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: createUserObject(user),
            accessToken,
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
// ===== Exporting Controllers =====
export { signup, login, refreshToken, logout };
