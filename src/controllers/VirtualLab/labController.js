import VirtualLabSession from '../../models/VirtualLabSession.js';
import crypto from 'crypto';

export const launchSession = async (req, res) => {
    const { containerType } = req.body;

    try {
        const sessionToken = crypto.randomBytes(16).toString('hex');

        const session = new VirtualLabSession({
            student: req.user._id,
            sessionToken,
            containerType
        });

        await session.save();
        res.status(201).json({ message: 'Session launched', session });
    } catch (err) {
        res.status(500).json({ message: 'Failed to launch session', error: err.message });
    }
};
