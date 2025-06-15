// models/VirtualLabSession.js
import mongoose from 'mongoose';

const virtualLabSessionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionToken: { type: String, required: true },
    containerType: { type: String, enum: ['jupyter', 'vscode'], required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // auto-delete after 1hr
});

export default mongoose.model('VirtualLabSession', virtualLabSessionSchema);
