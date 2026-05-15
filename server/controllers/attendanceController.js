const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { recognizeFaces } = require('../services/aiService');
const fs = require('fs');

/**
 * @desc    Capture attendance from an uploaded image
 * @route   POST /api/attendance/capture
 * @access  Private (Teacher/Admin)
 */
const captureAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const { classId } = req.body;
    if (!classId) {
      // Clean up the uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // 1. Send image to AI Service
    const recognizedUsns = await recognizeFaces(req.file.path);

    // 2. Fetch all students in the class/department to find who is absent
    // For simplicity, assuming all students in the DB belong to this class
    // In a real app, you'd filter by department/section using classId
    const allStudents = await Student.find({});

    const presentStudents = [];
    const absentStudents = [];

    allStudents.forEach(student => {
      if (recognizedUsns.includes(student.usn)) {
        presentStudents.push(student._id);
      } else {
        absentStudents.push(student._id);
      }
    });

    // 3. Create Attendance Record
    const attendance = new Attendance({
      classId,
      date: new Date(),
      presentStudents,
      absentStudents,
      attendanceImage: req.file.path,
      createdBy: req.user._id // Assuming authMiddleware sets req.user
    });

    const savedAttendance = await attendance.save();

    res.status(201).json({
      message: 'Attendance captured successfully',
      data: savedAttendance,
      summary: {
        total: allStudents.length,
        present: presentStudents.length,
        absent: absentStudents.length
      }
    });

  } catch (error) {
    console.error('Error capturing attendance:', error);
    // Cleanup file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  captureAttendance
};
