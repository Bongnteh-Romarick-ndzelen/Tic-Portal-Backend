import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    // Add more fields if needed
}, { timestamps: true });

const Summary = mongoose.model('Summary', summarySchema);
export default Summary;
