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
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
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
  aiSummary: {
    totalFaces: { type: Number, default: 0 },
    unknownFaces: { type: Number, default: 0 },
    aiAvailable: { type: Boolean, default: false },
    liveness: {
      is_live: Boolean,
      confidence: Number,
      reason: String
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

attendanceSchema.index({ date: 1, classId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
