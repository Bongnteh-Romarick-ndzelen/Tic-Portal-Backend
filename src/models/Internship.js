import mongoose from 'mongoose';

const InternshipSchema = new mongoose.Schema({
    title: { type: String, required: true },
    domain: { type: String, required: true },
    company: { type: String, required: true },
    stipend: { type: Number, required: true },
    duration: { type: String, required: true },
    location: { type: String, required: true },
    eligibility: { type: String, required: true }
});

export default mongoose.model('Internship', InternshipSchema);