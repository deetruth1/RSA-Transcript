const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  terms: {
    type: [String],
    default: ["First Term", "Second Term", "Third Term"]
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Transcript || mongoose.model('Transcript', RequestSchema);
