// roles.js
export const IsnotInstructor = (req, res, next) => {
    if (req.user.userType === 'instructor') {
        return res.status(403).json({ message: 'Instructors cannot enroll in courses' });
    }
    next();
};
