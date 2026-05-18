const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * @desc    Get full attendance report (all records with student details)
 * @route   GET /api/reports
 * @access  Private
 */
const getFullReport = async (req, res) => {
  try {
    const records = await Attendance.find({})
      .populate('presentStudents', 'name usn department section')
      .populate('absentStudents', 'name usn department section')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get daily attendance report
 * @route   GET /api/reports/daily?date=YYYY-MM-DD
 * @access  Private
 */
const getDailyReport = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const records = await Attendance.find({ date: { $gte: start, $lte: end } })
      .populate('presentStudents', 'name usn department section')
      .populate('absentStudents', 'name usn department section')
      .populate('createdBy', 'name');

    const totalStudents = await Student.countDocuments();

    res.json({
      date: dateStr,
      totalStudents,
      records
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get student-wise attendance summary
 * @route   GET /api/reports/student/:usn
 * @access  Private
 */
const getStudentReport = async (req, res) => {
  try {
    const { usn } = req.params;
    const student = await Student.findOne({ usn });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const totalClasses = await Attendance.countDocuments();
    const presentCount = await Attendance.countDocuments({ presentStudents: student._id });
    const absentCount = totalClasses - presentCount;
    const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

    res.json({
      student,
      totalClasses,
      presentCount,
      absentCount,
      percentage: parseFloat(percentage)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get summary analytics (for dashboard charts)
 * @route   GET /api/reports/summary
 * @access  Private
 */
const getSummary = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalClasses = await Attendance.countDocuments();

    // Last 7 days attendance trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);

      const records = await Attendance.find({ date: { $gte: start, $lte: end } });
      const presentCount = records.reduce((sum, r) => sum + r.presentStudents.length, 0);

      trend.push({
        date: d.toISOString().split('T')[0],
        present: presentCount,
        absent: totalStudents - presentCount < 0 ? 0 : totalStudents - presentCount
      });
    }

    // Overall attendance %
    const allRecords = await Attendance.find({});
    const totalPresent = allRecords.reduce((sum, r) => sum + r.presentStudents.length, 0);
    const overallPercentage = totalClasses > 0
      ? ((totalPresent / (totalClasses * totalStudents || 1)) * 100).toFixed(1)
      : 0;

    res.json({
      totalStudents,
      totalClasses,
      overallPercentage: parseFloat(overallPercentage),
      trend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowAttendanceStudents = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold || 75);
    const students = await Student.find({}).select('-embedding').sort({ name: 1 });
    const totalClasses = await Attendance.countDocuments();

    if (totalClasses === 0) {
      return res.json([]);
    }

    const rows = await Promise.all(students.map(async (student) => {
      const presentCount = await Attendance.countDocuments({ presentStudents: student._id });
      const percentage = Number(((presentCount / totalClasses) * 100).toFixed(1));

      return {
        student,
        totalClasses,
        presentCount,
        absentCount: totalClasses - presentCount,
        percentage,
        risk: percentage < threshold ? 'low' : 'ok'
      };
    }));

    res.json(rows.filter(row => row.percentage < threshold));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFullReport,
  getDailyReport,
  getStudentReport,
  getSummary,
  getLowAttendanceStudents
};
