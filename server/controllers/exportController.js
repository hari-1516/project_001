const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * @desc    Export attendance report as Excel (.xlsx)
 * @route   GET /api/reports/export/excel
 * @access  Private
 */
const exportExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');

    const records = await Attendance.find({})
      .populate('presentStudents', 'name usn department section')
      .populate('absentStudents', 'name usn department section')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    const rows = [['Date', 'Class ID', 'Present', 'Absent', 'Percentage', 'Marked By', 'Present Students', 'Absent Students']];

    records.forEach(r => {
      const total = r.presentStudents.length + r.absentStudents.length;
      const pct = total > 0 ? Math.round((r.presentStudents.length / total) * 100) : 0;
      rows.push([
        new Date(r.date).toISOString().split('T')[0],
        r.classId,
        r.presentStudents.length,
        r.absentStudents.length,
        `${pct}%`,
        r.createdBy?.name || 'System',
        r.presentStudents.map(s => `${s.name} (${s.usn})`).join('; '),
        r.absentStudents.map(s => `${s.name} (${s.usn})`).join('; ')
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    const colWidths = rows[0].map((_, i) => ({
      wch: Math.max(...rows.map(r => String(r[i]).length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    // Use aggregation instead of N+1 queries for student summary
    const totalClasses = await Attendance.countDocuments();

    const studentStats = await Attendance.aggregate([
      { $unwind: '$presentStudents' },
      { $group: { _id: '$presentStudents', presentCount: { $sum: 1 } } },
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
          absentCount: { $subtract: [totalClasses, '$presentCount'] },
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$presentCount', totalClasses || 1] }, 100] }, 1]
          }
        }
      },
      { $sort: { 'student.name': 1 } },
      {
        $project: {
          _id: 0,
          name: '$student.name',
          usn: '$student.usn',
          department: '$student.department',
          year: '$student.year',
          section: '$student.section',
          presentCount: 1,
          absentCount: 1,
          percentage: 1
        }
      }
    ]);

    const summaryRows = [['Name', 'USN', 'Department', 'Year', 'Section', 'Present', 'Absent', 'Attendance %', 'Status']];

    studentStats.forEach(s => {
      const status = s.percentage >= 75 ? 'OK' : s.percentage >= 60 ? 'Warning' : 'Critical';
      summaryRows.push([s.name, s.usn, s.department, s.year, s.section, s.presentCount, s.absentCount, `${s.percentage}%`, status]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws2['!cols'] = summaryRows[0].map((_, i) => ({
      wch: Math.max(...summaryRows.map(r => String(r[i]).length)) + 2
    }));
    XLSX.utils.book_append_sheet(wb, ws2, 'Student Summary');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Failed to export Excel file' });
  }
};

/**
 * @desc    Export attendance report as PDF
 * @route   GET /api/reports/export/pdf
 * @access  Private
 */
const exportPDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');

    const records = await Attendance.find({})
      .populate('presentStudents', 'name usn department section')
      .populate('absentStudents', 'name usn department section')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('VisionAttend AI — Attendance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1.5);

    const totalStudents = await Student.countDocuments();
    const totalClasses = records.length;
    const totalPresent = records.reduce((sum, r) => sum + r.presentStudents.length, 0);
    const overallPct = totalClasses > 0 && totalStudents > 0
      ? ((totalPresent / (totalClasses * totalStudents)) * 100).toFixed(1)
      : '0.0';

    doc.fontSize(12).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Students: ${totalStudents}   |   Total Classes: ${totalClasses}   |   Overall Attendance: ${overallPct}%`);
    doc.moveDown(1);

    const tableTop = doc.y;
    const colWidths = [80, 65, 55, 55, 55, 80, 120, 120];
    const headers = ['Date', 'Class ID', 'Present', 'Absent', 'Percentage', 'Marked By', 'Present Students', 'Absent Students'];

    doc.fontSize(8).font('Helvetica-Bold');
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });

    doc.moveTo(40, tableTop + 12).lineTo(760, tableTop + 12).stroke();

    doc.font('Helvetica').fontSize(7);
    let y = tableTop + 18;

    records.slice(0, 40).forEach(r => {
      if (y > 560) {
        doc.addPage();
        y = 40;
      }

      const total = r.presentStudents.length + r.absentStudents.length;
      const pct = total > 0 ? Math.round((r.presentStudents.length / total) * 100) : 0;

      const presentNames = r.presentStudents.slice(0, 3).map(s => s.name).join(', ') + (r.presentStudents.length > 3 ? '...' : '');
      const absentNames = r.absentStudents.slice(0, 3).map(s => s.name).join(', ') + (r.absentStudents.length > 3 ? '...' : '');

      const rowData = [
        new Date(r.date).toISOString().split('T')[0],
        r.classId,
        String(r.presentStudents.length),
        String(r.absentStudents.length),
        `${pct}%`,
        r.createdBy?.name || 'System',
        presentNames,
        absentNames
      ];

      x = 40;
      rowData.forEach((val, i) => {
        doc.text(val, x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      y += 14;
    });

    if (records.length > 40) {
      doc.moveDown(1);
      doc.fontSize(8).text(`... and ${records.length - 40} more records`, { align: 'center' });
    }

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to export PDF file' });
  }
};

module.exports = { exportExcel, exportPDF };
