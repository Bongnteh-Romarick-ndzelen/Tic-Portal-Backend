// roles.js
export const notInstructor = (req, res, next) => {
    if (req.user.userType === 'instructor') {
        return res.status(403).json({ message: 'Instructors cannot enroll in courses' });
    }
    next();
};
