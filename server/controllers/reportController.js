const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * @desc    Get full attendance report (all records with student details)
 * @route   GET /api/reports?page=1&limit=20
 * @access  Private
 */
const getFullReport = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Attendance.find({})
        .populate('presentStudents', 'name usn department section')
        .populate('absentStudents', 'name usn department section')
        .populate('createdBy', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments()
    ]);

    res.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
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
    const student = await Student.findOne({ usn: usn.toUpperCase() });
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

    // Last 7 days attendance trend using aggregation pipeline
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendData = await Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalPresent: { $sum: { $size: '$presentStudents' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build full 7-day trend with zeros for missing days
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = trendData.find(t => t._id === dateStr);
      const presentCount = found ? found.totalPresent : 0;
      trend.push({
        date: dateStr,
        present: presentCount,
        absent: totalStudents - presentCount < 0 ? 0 : totalStudents - presentCount
      });
    }

    // Overall attendance % using aggregation
    const overallAgg = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          totalPresent: { $sum: { $size: '$presentStudents' } },
          totalRecords: { $sum: 1 }
        }
      }
    ]);

    const totalPresent = overallAgg.length > 0 ? overallAgg[0].totalPresent : 0;
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
    const threshold = Number(req.query.threshold) || 75;

    const totalClasses = await Attendance.countDocuments();

    if (totalClasses === 0) {
      return res.json([]);
    }

    // Use aggregation pipeline instead of N+1 queries
    const lowAttendance = await Attendance.aggregate([
      { $unwind: '$absentStudents' },
      {
        $group: {
          _id: '$absentStudents',
          absentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $addFields: {
          presentCount: { $subtract: [totalClasses, '$absentCount'] },
          percentage: {
            $round: [{ $multiply: [{ $divide: [{ $subtract: [totalClasses, '$absentCount'] }, totalClasses] }, 100] }, 1]
          }
        }
      },
      { $match: { percentage: { $lt: threshold } } },
      { $sort: { percentage: 1 } },
      {
        $project: {
          _id: 0,
          student: {
            _id: '$student._id',
            name: '$student.name',
            usn: '$student.usn',
            department: '$student.department',
            section: '$student.section'
          },
          totalClasses: totalClasses,
          presentCount: 1,
          absentCount: '$absentCount',
          percentage: 1,
          risk: 'low'
        }
      }
    ]);

    res.json(lowAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get students grouped by department
 * @route   GET /api/reports/students-by-department
 * @access  Private
 */
const getStudentsByDepartment = async (req, res) => {
  try {
    const students = await Student.find({}).select('name usn department year section -_id').sort({ department: 1, name: 1 });

    const grouped = {};
    students.forEach(s => {
      if (!grouped[s.department]) {
        grouped[s.department] = [];
      }
      grouped[s.department].push({
        name: s.name,
        usn: s.usn,
        year: s.year,
        section: s.section
      });
    });

    const result = Object.keys(grouped).sort().map(dept => ({
      department: dept,
      count: grouped[dept].length,
      students: grouped[dept]
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFullReport,
  getDailyReport,
  getStudentReport,
  getSummary,
  getLowAttendanceStudents,
  getStudentsByDepartment
};
