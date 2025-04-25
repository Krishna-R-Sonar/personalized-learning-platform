// server/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  type: { type: String, enum: ['test', 'homework', 'learning_path', 'resource'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  resources: [{ title: String, url: String, type: { type: String, enum: ['pdf'] } }],
  quizzes: [{ question: String, options: [String], answer: String, timed: Boolean }],
  steps: [{ title: String, description: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ rollNo: String, progress: Number, score: Number, notified: { type: Boolean, default: true } }],
});

module.exports = mongoose.model('Assignment', assignmentSchema);