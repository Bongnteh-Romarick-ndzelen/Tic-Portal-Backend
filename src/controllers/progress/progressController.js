// controllers/Progress/progressController.js
import { Progress } from '../../models/Progress.js';

export const updateProgress = async (req, res) => {
    try {
        const { userId, moduleId } = req.body;
        const { courseId } = req.params;

        let progress = await Progress.findOne({ userId, courseId });

        if (!progress) {
            progress = await Progress.create({ userId, courseId, completedModules: [moduleId] });
        } else {
            if (!progress.completedModules.includes(moduleId)) {
                progress.completedModules.push(moduleId);
                progress.lastAccessed = new Date();
                await progress.save();
            }
        }

        res.status(200).json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
