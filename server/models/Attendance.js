const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  presentStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  absentStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  attendanceImage: {
    type: String // Path or URL to the uploaded classroom image
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
