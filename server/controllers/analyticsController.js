const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * @desc    Get engagement analytics (attendance by department, year, section)
 * @route   GET /api/reports/analytics/engagement
 * @access  Private
 */
const getEngagementAnalytics = async (req, res) => {
  try {
    const totalClasses = await Attendance.countDocuments();

    if (totalClasses === 0) {
      return res.json({ byDepartment: [], byYear: [], bySection: [], punctuality: {} });
    }

    const byDepartment = await Attendance.aggregate([
      { $unwind: '$presentStudents' },
      {
        $lookup: {
          from: 'students',
          localField: 'presentStudents',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.department',
          presentCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$presentCount', totalClasses] }, 100] }, 1]
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          department: '$_id',
          presentCount: 1,
          percentage: 1
        }
      }
    ]);

    const byYear = await Attendance.aggregate([
      { $unwind: '$presentStudents' },
      {
        $lookup: {
          from: 'students',
          localField: 'presentStudents',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.year',
          presentCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$presentCount', totalClasses] }, 100] }, 1]
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id',
          presentCount: 1,
          percentage: 1
        }
      }
    ]);

    const punctuality = await Attendance.aggregate([
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$date' }
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          totalClasses: { $sum: 1 },
          avgPresent: { $avg: { $size: '$presentStudents' } }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          day: '$_id',
          totalClasses: 1,
          avgPresent: { $round: ['$avgPresent', 0] }
        }
      }
    ]);

    const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const punctualityFormatted = {};
    punctuality.forEach(p => {
      punctualityFormatted[dayNames[p.day]] = {
        classes: p.totalClasses,
        avgPresent: p.avgPresent
      };
    });

    res.json({
      byDepartment,
      byYear,
      punctuality: punctualityFormatted,
      totalClasses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Predict at-risk students based on attendance trends
 * @route   GET /api/reports/analytics/predict
 * @access  Private
 */
const getAttendancePrediction = async (req, res) => {
  try {
    const totalClasses = await Attendance.countDocuments();

    if (totalClasses === 0) {
      return res.json({ predictions: [], totalClasses: 0 });
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Single aggregation to get per-student present counts
    const studentStats = await Attendance.aggregate([
      {
        $facet: {
          overall: [
            { $unwind: '$presentStudents' },
            { $group: { _id: '$presentStudents', presentCount: { $sum: 1 } } }
          ],
          recent: [
            { $match: { date: { $gte: twoWeeksAgo } } },
            { $unwind: '$presentStudents' },
            { $group: { _id: '$presentStudents', recentPresent: { $sum: 1 } } }
          ],
          recentTotal: [
            { $match: { date: { $gte: twoWeeksAgo } } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const overallMap = {};
    studentStats[0].overall.forEach(s => { overallMap[s._id.toString()] = s.presentCount; });

    const recentMap = {};
    studentStats[0].recent.forEach(s => { recentMap[s._id.toString()] = s.recentPresent; });

    const recentTotal = studentStats[0].recentTotal[0]?.count || 0;

    const students = await Student.find({}).select('name usn department year section');

    const predictions = [];

    for (const student of students) {
      const sid = student._id.toString();
      const presentCount = overallMap[sid] || 0;
      const overallPct = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

      const recentPresent = recentMap[sid] || 0;
      const recentPct = recentTotal > 0 ? (recentPresent / recentTotal) * 100 : overallPct;

      const trendPerDay = recentTotal > 0 ? (recentPct - overallPct) / recentTotal : 0;
      const predictedPct30 = Math.max(0, Math.min(100, overallPct + trendPerDay * 30));

      let risk = 'low';
      let riskMessage = 'Attendance is on track';

      if (overallPct < 50) {
        risk = 'critical';
        riskMessage = 'Critical: Below 50% attendance. Immediate action required.';
      } else if (overallPct < 65) {
        risk = 'high';
        riskMessage = 'High risk: Below 65% attendance. Intervention recommended.';
      } else if (overallPct < 75) {
        risk = 'medium';
        riskMessage = 'Medium risk: Below 75% threshold. Monitor closely.';
      } else if (recentPct < overallPct - 10) {
        risk = 'medium';
        riskMessage = 'Declining trend: Recent attendance is dropping.';
      }

      if (risk !== 'low' || recentPct < overallPct) {
        predictions.push({
          student: {
            _id: student._id,
            name: student.name,
            usn: student.usn,
            department: student.department,
            section: student.section
          },
          overallPercentage: parseFloat(overallPct.toFixed(1)),
          recentPercentage: parseFloat(recentPct.toFixed(1)),
          predictedPercentage: parseFloat(predictedPct30.toFixed(1)),
          presentCount,
          totalClasses,
          recentPresent,
          recentTotal,
          trend: trendPerDay >= 0 ? 'improving' : 'declining',
          risk,
          riskMessage
        });
      }
    }

    predictions.sort((a, b) => a.overallPercentage - b.overallPercentage);

    res.json({
      predictions,
      totalClasses,
      recentDays: 14,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEngagementAnalytics, getAttendancePrediction };
