const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    surname: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    otherName: { type: String, trim: true },
    studentId: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    school: { type: String, required: true },
    term: { type: String, required: true },
    session: { type: String, required: true },
    
    results: [
        {
            id: { type: String },
            subject: { type: String, required: true },
            grade: { type: String, required: true }
        }
    ],
    CreatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('profile', profileSchema);