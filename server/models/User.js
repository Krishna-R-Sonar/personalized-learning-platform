// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  rollNo: { type: String, unique: true, sparse: true },
  class: { type: String },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
});

module.exports = mongoose.model('User', userSchema);