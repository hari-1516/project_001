const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  usn: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    default: 1
  },
  section: {
    type: String,
    default: 'A',
    trim: true,
    uppercase: true
  },
  embedding: {
    type: [Number],
    required: false
  },
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);
