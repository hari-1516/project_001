const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { recognizeFaces } = require('../services/aiService');
const { createNotification } = require('../services/notificationService');
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
    const recognition = await recognizeFaces(req.file.path);
    const recognizedUsns = recognition.recognizedStudents;

    // 2. Fetch students for the requested class to find who is absent.
    // Falls back to department/section/year encoded in classId, e.g. CSE-A or CSE-3-A.
    let allStudents = [];
    const classRecord = await Class.findOne({ classId }).populate('students');

    if (classRecord?.students?.length) {
      allStudents = classRecord.students;
    } else {
      const parts = classId.split('-').map(part => part.trim()).filter(Boolean);
      const query = {};

      if (parts[0]) query.department = parts[0].toUpperCase();
      if (parts.length === 2) query.section = parts[1].toUpperCase();
      if (parts.length >= 3) {
        query.year = parseInt(parts[1], 10);
        query.section = parts[2].toUpperCase();
      }

      allStudents = Object.keys(query).length > 0
        ? await Student.find(query)
        : await Student.find({});
    }

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
      aiSummary: {
        totalFaces: recognition.totalFaces,
        unknownFaces: recognition.unknownFaces,
        aiAvailable: recognition.aiAvailable,
        liveness: recognition.liveness
      },
      createdBy: req.user._id // Assuming authMiddleware sets req.user
    });

    const savedAttendance = await attendance.save();

    if (!recognition.aiAvailable) {
      await createNotification({
        type: 'warning',
        title: 'AI service unavailable',
        message: `Attendance for ${classId} was saved without AI recognition.`,
        createdBy: req.user._id
      });
    }

    if (recognition.unknownFaces > 0) {
      await createNotification({
        type: 'warning',
        title: 'Unknown faces detected',
        message: `${recognition.unknownFaces} unknown face(s) were detected in ${classId}.`,
        createdBy: req.user._id
      });
    }

    if (recognition.liveness && recognition.liveness.is_live === false) {
      await createNotification({
        type: 'critical',
        title: 'Possible spoof attempt',
        message: recognition.liveness.reason || `Liveness check failed for ${classId}.`,
        createdBy: req.user._id
      });
    }

    res.status(201).json({
      message: 'Attendance captured successfully',
      data: savedAttendance,
      summary: {
        total: allStudents.length,
        present: presentStudents.length,
        absent: absentStudents.length,
        detectedFaces: recognition.totalFaces,
        unknownFaces: recognition.unknownFaces,
        aiAvailable: recognition.aiAvailable,
        liveness: recognition.liveness
      },
      recognizedUsns
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
