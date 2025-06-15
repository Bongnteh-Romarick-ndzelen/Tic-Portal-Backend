import mongoose from 'mongoose'; // ✅


// ====== Student Progress Model (models/Progress.js) ======
const progressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    lastAccessed: { type: Date, default: Date.now }
});

export const Progress = mongoose.model('Progress', progressSchema);