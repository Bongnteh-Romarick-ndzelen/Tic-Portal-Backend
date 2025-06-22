import InternshipApplication from '../../models/InternshipApplication.js';

// GET user's applications
const getMyApplications = async (req, res) => {
    try {
        const applications = await InternshipApplication.find({
            studentId: req.query.studentId
        }).populate('internshipId');
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export { getMyApplications };